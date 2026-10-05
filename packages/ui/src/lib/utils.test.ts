import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps non-conflicting classes", () => {
    expect(cn("px-2", "text-red-500")).toBe("px-2 text-red-500");
  });

  it("resolves Tailwind conflicts (last one wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("px-2", undefined, false, "py-1")).toBe("px-2 py-1");
  });
});
