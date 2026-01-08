import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const VERSION = 'v1';

function readKeyFromEnv(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'GOOGLE_TOKEN_ENCRYPTION_KEY não definido. Configure para armazenar refresh tokens com segurança.',
    );
  }

  // Accept base64 (recommended) or hex.
  const isLikelyBase64 = /[^0-9a-f]/i.test(raw);
  const buf = Buffer.from(raw, isLikelyBase64 ? 'base64' : 'hex');
  if (buf.length !== 32) {
    throw new Error(
      `GOOGLE_TOKEN_ENCRYPTION_KEY inválido: esperado 32 bytes, recebido ${buf.length}.`,
    );
  }
  return buf;
}

export function encryptSecret(plain: string): string {
  const key = readKeyFromEnv();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export function decryptSecret(payload: string): string {
  const key = readKeyFromEnv();
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Payload criptografado inválido (formato).');
  }

  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const ciphertext = Buffer.from(parts[3], 'base64');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}
