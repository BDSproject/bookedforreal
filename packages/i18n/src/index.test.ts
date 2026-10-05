import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import fr from "../messages/fr.json";

import { locales } from "./index";

describe("i18n", () => {
  it("exposes the supported locales", () => {
    expect(locales).toEqual(["en", "fr"]);
  });

  it("keeps the en and fr catalogs key-synchronized", () => {
    expect(Object.keys(en)).toEqual(Object.keys(fr));
    expect(Object.keys(en.common)).toEqual(Object.keys(fr.common));
    expect(Object.keys(en.auth)).toEqual(Object.keys(fr.auth));
    expect(Object.keys(en.booking)).toEqual(Object.keys(fr.booking));
    expect(Object.keys(en.dashboard)).toEqual(Object.keys(fr.dashboard));
    expect(Object.keys(en.errors)).toEqual(Object.keys(fr.errors));
    expect(Object.keys(en.emails)).toEqual(Object.keys(fr.emails));
  });
});
