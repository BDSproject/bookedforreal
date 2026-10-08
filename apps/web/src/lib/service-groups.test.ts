import { describe, expect, it } from "vitest";

import type { Service } from "./api-types";
import { groupServices } from "./service-groups";

/** Builds a service with just the fields the grouping cares about. */
function service(id: string, categoryId: string | null, order = 0): Service {
  return {
    id,
    nameFr: id,
    nameEn: id,
    durationMin: 30,
    priceCents: 2500,
    bufferMin: 0,
    categoryId,
    category: categoryId ? { id: categoryId, name: categoryId, order } : null,
  };
}

describe("groupServices", () => {
  it("puts every service of one category in the same section", () => {
    const groups = groupServices([service("a", "cuts"), service("b", "cuts")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.services.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("orders sections by their own order", () => {
    const groups = groupServices([service("a", "beard", 2), service("b", "cuts", 1)]);
    expect(groups.map((group) => group.category?.id)).toEqual(["cuts", "beard"]);
  });

  it("keeps the uncategorised services in a final section", () => {
    const groups = groupServices([service("a", null), service("b", "cuts", 1)]);
    expect(groups.map((group) => group.category?.id ?? null)).toEqual(["cuts", null]);
    expect(groups[1]?.services.map((item) => item.id)).toEqual(["a"]);
  });

  it("returns nothing for an empty price list", () => {
    expect(groupServices([])).toEqual([]);
  });

  it("does not invent a section when every service is uncategorised", () => {
    const groups = groupServices([service("a", null), service("b", null)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.category).toBeNull();
  });
});
