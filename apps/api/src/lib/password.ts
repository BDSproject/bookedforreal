import { hash, verify } from "@node-rs/argon2";

/**
 * Hashes a plaintext password with Argon2id (memory-hard, recommended).
 * Argon2id is the default algorithm in @node-rs/argon2.
 * Never store or log plaintext passwords.
 */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** Verifies a plaintext password against an Argon2id hash. */
export function verifyPassword(hashed: string, password: string): Promise<boolean> {
  return verify(hashed, password);
}
