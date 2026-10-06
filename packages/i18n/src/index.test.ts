import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import fr from "../messages/fr.json";

import { locales } from "./index";

/** Recursively collects all leaf key paths (e.g. "home.hero.title"). */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("i18n", () => {
  it("exposes the supported locales", () => {
    expect(locales).toEqual(["en", "fr"]);
  });

  it("keeps every FR/EN key synchronized (deep)", () => {
    expect(collectKeys(en).sort()).toEqual(collectKeys(fr).sort());
  });

  it("exposes the required namespaces", () => {
    for (const ns of [
      "common",
      "home",
      "auth",
      "booking",
      "dashboard",
      "seo",
      "errors",
      "emails",
    ]) {
      expect(Object.keys(en)).toContain(ns);
      expect(Object.keys(fr)).toContain(ns);
    }
  });
});
