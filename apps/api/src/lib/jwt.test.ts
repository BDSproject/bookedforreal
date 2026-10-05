import { describe, expect, it } from "vitest";

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

const user = { id: "u1", email: "owner@salon.fr", role: "OWNER" as const };

describe("jwt", () => {
  it("round-trips an access token", () => {
    const payload = verifyAccessToken(signAccessToken(user));

    expect(payload.sub).toBe("u1");
    expect(payload.email).toBe("owner@salon.fr");
    expect(payload.role).toBe("OWNER");
    expect(payload.type).toBe("access");
  });

  it("round-trips a refresh token", () => {
    const payload = verifyRefreshToken(signRefreshToken("u1"));

    expect(payload.sub).toBe("u1");
    expect(payload.type).toBe("refresh");
  });

  it("rejects a refresh token as an access token", () => {
    const refresh = signRefreshToken("u1");
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(user);
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });
});
