import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.join(__dirname, 'data', 'personal-details.key');
const detailTypes = new Set(['aadhaar', 'bank', 'ifsc', 'mobile', 'email', 'other']);

let encryptionKeyPromise;

async function getEncryptionKey() {
  if (!encryptionKeyPromise) {
    encryptionKeyPromise = (async () => {
      if (process.env.PERSONAL_DETAILS_ENCRYPTION_KEY) {
        const key = Buffer.from(process.env.PERSONAL_DETAILS_ENCRYPTION_KEY, 'hex');
        if (key.length !== 32 || !/^[\da-f]{64}$/i.test(process.env.PERSONAL_DETAILS_ENCRYPTION_KEY)) {
          throw new Error('PERSONAL_DETAILS_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters.');
        }
        return key;
      }

      await fs.mkdir(path.dirname(keyPath), { recursive: true });
      try {
        const handle = await fs.open(keyPath, 'wx', 0o600);
        const key = crypto.randomBytes(32);
        try {
          await handle.writeFile(key);
        } finally {
          await handle.close();
        }
        return key;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const key = await fs.readFile(keyPath);
        if (key.length !== 32) {
          throw new Error('The server-side personal details encryption key is invalid.');
        }
        return key;
      }
    })().catch((error) => {
      encryptionKeyPromise = undefined;
      throw error;
    });
  }
  return encryptionKeyPromise;
}

export async function encryptPersonalDetail(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', await getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([ciphertext, authTag]).toString('base64'),
    iv: iv.toString('base64')
  };
}

export async function decryptPersonalDetail(ciphertext, iv) {
  const payload = Buffer.from(ciphertext, 'base64');
  if (payload.length <= 16) throw new Error('Encrypted personal detail is invalid.');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    await getEncryptionKey(),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(payload.subarray(payload.length - 16));
  return Buffer.concat([
    decipher.update(payload.subarray(0, payload.length - 16)),
    decipher.final()
  ]).toString('utf8');
}

export function validatePersonalDetail(type, value, label = '') {
  if (!detailTypes.has(type)) {
    return { valid: false, error: 'Choose a supported personal detail type.' };
  }
  if (typeof value !== 'string' || !value.trim() || value.length > 1000) {
    return { valid: false, error: 'Enter a value of 1 to 1000 characters.' };
  }
  if (typeof label !== 'string' || label.length > 80) {
    return { valid: false, error: 'Labels must be 80 characters or fewer.' };
  }

  const trimmed = value.trim();
  const digits = trimmed.replace(/[\s-]/g, '');
  if (type === 'aadhaar' && !/^\d{12}$/.test(digits)) {
    return { valid: false, error: 'Enter a valid 12-digit Aadhaar number.' };
  }
  if (type === 'bank' && !/^\d{9,18}$/.test(digits)) {
    return { valid: false, error: 'Enter a valid 9 to 18 digit bank account number.' };
  }
  if (type === 'ifsc' && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(trimmed)) {
    return { valid: false, error: 'Enter a valid IFSC code.' };
  }
  if (type === 'mobile' && !/^[6-9]\d{9}$/.test(digits)) {
    return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'Enter a valid email address.' };
  }

  return { valid: true, value: trimmed, normalizedValue: type === 'ifsc' ? trimmed.toUpperCase() : digitsFor(type, trimmed, digits) };
}

function digitsFor(type, value, digits) {
  return ['aadhaar', 'bank', 'mobile'].includes(type) ? digits : value;
}

export function maskPersonalDetail(type, value) {
  if (type === 'email') {
    const separator = value.lastIndexOf('@');
    if (separator < 1) return '••••';
    return `${value[0]}****${value.slice(separator)}`;
  }

  if (type === 'other') return 'XXXX';

  if (type === 'aadhaar') {
    const digits = value.replace(/\D/g, '');
    return `XXXX XXXX ${digits.slice(-4)}`;
  }

  if (type === 'ifsc') {
    return `XXXX${value.slice(4)}`;
  }

  const visibleValue = ['bank', 'mobile'].includes(type) ? value.replace(/\D/g, '') : value;
  const visibleLength = Math.min(4, visibleValue.length);
  return `${'X'.repeat(Math.max(4, visibleValue.length - visibleLength))}${visibleValue.slice(-visibleLength)}`;
}
