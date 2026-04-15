import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(key?: string): Buffer {
  const raw = key ?? process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'Encryption key must be provided or set via ENCRYPTION_KEY environment variable'
    );
  }
  const buf = Buffer.from(raw, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be exactly ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }
  return buf;
}

export function encryptData(plaintext: string, key?: string): string {
  const keyBuf = getKey(key);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptData(encrypted: string, key?: string): string {
  const keyBuf = getKey(key);
  const parts = encrypted.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format — expected iv:authTag:ciphertext');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
