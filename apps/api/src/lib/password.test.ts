import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password (Argon2id)", () => {
  it("hashes and verifies a password", async () => {
    const hashed = await hashPassword("SuperSecret123!");
    expect(hashed).not.toBe("SuperSecret123!");
    await expect(verifyPassword(hashed, "SuperSecret123!")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hashed = await hashPassword("SuperSecret123!");
    await expect(verifyPassword(hashed, "wrong")).resolves.toBe(false);
  });
});
