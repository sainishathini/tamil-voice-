import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getPersistentServerSecret(environmentName, filename) {
  const configuredSecret = process.env[environmentName];
  if (configuredSecret) {
    if (configuredSecret.length < 32) {
      throw new Error(`${environmentName} must contain at least 32 characters.`);
    }
    return configuredSecret;
  }

  const secretPath = path.join(__dirname, 'data', filename);
  await fs.mkdir(path.dirname(secretPath), { recursive: true });
  try {
    const handle = await fs.open(secretPath, 'wx', 0o600);
    const secret = crypto.randomBytes(48).toString('base64url');
    try {
      await handle.writeFile(secret, { encoding: 'utf8' });
    } finally {
      await handle.close();
    }
    return secret;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const secret = await fs.readFile(secretPath, 'utf8');
    if (secret.length < 32) throw new Error(`The server-side ${environmentName} secret is invalid.`);
    return secret;
  }
}
