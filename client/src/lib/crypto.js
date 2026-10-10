/**
 * WebCrypto Client-Side Encryption & Masking Module
 * Uses PBKDF2-SHA256 (310,000 iterations) + AES-GCM 256-bit encryption
 */

const PBKDF2_ITERATIONS = 310000;

// Utility to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Utility to convert hex string to Uint8Array
function hexToUint8Array(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

// Utility to convert Uint8Array to hex string
function uint8ArrayToHex(arr) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive AES-GCM 256-bit key from password using PBKDF2-SHA256 (310,000 iterations)
 */
async function deriveKey(password, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltUint8,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a sensitive text value client-side
 */
export async function encryptValue(plainText, password, saltHex = null) {
  if (!plainText) return null;
  const enc = new TextEncoder();

  // Generate random salt if not provided
  const salt = saltHex ? hexToUint8Array(saltHex) : window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plainText)
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt: uint8ArrayToHex(salt)
  };
}

/**
 * Decrypt a sensitive ciphertext client-side using password
 */
export async function decryptValue(ciphertextBase64, ivBase64, saltHex, password) {
  try {
    const salt = hexToUint8Array(saltHex);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const key = await deriveKey(password, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Incorrect password or corrupted ciphertext');
  }
}

/**
 * Mask sensitive values for safe display
 * Aadhaar: ********9012
 * Phone: ********34
 * Bank Account: ********9012
 */
export function maskSensitiveValue(value, fieldType = 'aadhaar') {
  if (!value) return '';
  const str = value.toString().trim();
  if (str.length <= 4) return '****';

  const last4 = str.slice(-4);
  const last2 = str.slice(-2);

  if (fieldType === 'phone') {
    return '********' + last2;
  }
  if (fieldType === 'pinCode') {
    return '****' + last2;
  }
  // Default (Aadhaar / Bank / IFSC)
  const maskedLength = Math.max(4, str.length - 4);
  return '*'.repeat(maskedLength) + last4;
}

/**
 * Generate a 6-digit random recovery code
 */
export function generateRecoveryCode() {
  const randomBytes = new Uint8Array(3);
  window.crypto.getRandomValues(randomBytes);
  const num = ((randomBytes[0] << 16) | (randomBytes[1] << 8) | randomBytes[2]) % 900000 + 100000;
  return num.toString();
}
