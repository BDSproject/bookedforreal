import { describe, expect, it } from "vitest";

import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("converts a French local number to E.164", () => {
    expect(normalizePhone("06 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("06.12.34.56.78")).toBe("+33612345678");
    expect(normalizePhone("06-12-34-56-78")).toBe("+33612345678");
    expect(normalizePhone("(06) 12 34 56 78")).toBe("+33612345678");
  });

  it("accepts a number typed without the trunk zero", () => {
    expect(normalizePhone("612345678")).toBe("+33612345678");
  });

  it("keeps an international number as is", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("+32 470 12 34 56")).toBe("+32470123456");
  });

  it("normalises the 00 dialling prefix", () => {
    expect(normalizePhone("0033612345678")).toBe("+33612345678");
  });

  it("normalises a country code typed without the plus", () => {
    expect(normalizePhone("33612345678")).toBe("+33612345678");
  });

  it("rejects values that are not dialable", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("pas un numero")).toBeNull();
    expect(normalizePhone("0612")).toBeNull();
    expect(normalizePhone("06 12 34 56 78 90 12")).toBeNull();
  });

  it("honours an explicit default country code", () => {
    expect(normalizePhone("0470123456", "32")).toBe("+32470123456");
  });
});
