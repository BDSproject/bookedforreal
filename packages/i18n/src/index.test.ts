import { describe, expect, it } from "vitest";

import { en, fr, locales } from "./index";

describe("i18n catalogs", () => {
  it("exposes the supported locales", () => {
    expect(locales).toEqual(["en", "fr"]);
  });

  it("keeps the en and fr catalogs key-synchronized", () => {
    expect(Object.keys(en)).toEqual(Object.keys(fr));
    expect(Object.keys(en.home)).toEqual(Object.keys(fr.home));
    expect(Object.keys(en.home.steps)).toEqual(Object.keys(fr.home.steps));
  });
});
