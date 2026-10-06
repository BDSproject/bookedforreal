import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const result = registerSchema.safeParse({
      email: "owner@salon.fr",
      password: "StrongPass123!",
      salonName: "Barber Shop",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      email: "owner@salon.fr",
      password: "short",
      salonName: "Barber Shop",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "StrongPass123!",
      salonName: "Barber Shop",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects a missing email", () => {
    expect(loginSchema.safeParse({ password: "StrongPass123!" }).success).toBe(false);
  });

  it("accepts a valid payload", () => {
    expect(
      loginSchema.safeParse({ email: "owner@salon.fr", password: "StrongPass123!" }).success,
    ).toBe(true);
  });
});
