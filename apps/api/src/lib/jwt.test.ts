import jwt from "jsonwebtoken";
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

  it("rejects a token with the wrong type (access vs refresh)", () => {
    const accessAsRefresh = jwt.sign({ sub: "u1", type: "access" }, process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret");
    const refreshAsAccess = jwt.sign({ sub: "u1", type: "refresh" }, process.env.JWT_ACCESS_SECRET ?? "test-access-secret");

    expect(() => verifyRefreshToken(accessAsRefresh)).toThrow();
    expect(() => verifyAccessToken(refreshAsAccess)).toThrow();
  });

  it("falls back to dev secrets when env vars are absent", () => {
    const prevAccess = process.env.JWT_ACCESS_SECRET;
    const prevRefresh = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    try {
      const token = signAccessToken(user);
      expect(verifyAccessToken(token).sub).toBe("u1");
      expect(verifyRefreshToken(signRefreshToken("u1")).sub).toBe("u1");
    } finally {
      process.env.JWT_ACCESS_SECRET = prevAccess;
      process.env.JWT_REFRESH_SECRET = prevRefresh;
    }
  });
});
