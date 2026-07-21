import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password with scrypt and a random salt.
 * The salt is stored alongside the derived key as `salt:hash` (both hex).
 */
export const hashPassword = async (plain: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};

/** Verifies a plaintext password against a `salt:hash` produced by hashPassword. */
export const verifyPassword = async (
  plain: string,
  stored: string,
): Promise<boolean> => {
  const [salt, key] = stored.split(':');
  if (!salt || !key) {
    return false;
  }
  const keyBuffer = Buffer.from(key, 'hex');
  const derived = (await scryptAsync(plain, salt, keyBuffer.length)) as Buffer;
  return (
    keyBuffer.length === derived.length && timingSafeEqual(keyBuffer, derived)
  );
};
