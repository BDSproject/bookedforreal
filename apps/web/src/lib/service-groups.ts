import type { Service, ServiceCategory } from "./api-types";

/** One section of the price list. `category` is null for the ungrouped services. */
export interface ServiceGroup {
  category: ServiceCategory | null;
  services: Service[];
}

/**
 * Groups a price list into sections.
 *
 * Categories are ordered by their own `order` then by name, and the services
 * without a category always come last: a service created before categories
 * existed must still be reachable.
 */
export function groupServices(services: Service[]): ServiceGroup[] {
  const grouped = new Map<string, ServiceGroup>();
  const ungrouped: Service[] = [];

  for (const service of services) {
    const category = service.category;
    if (!category) {
      ungrouped.push(service);
      continue;
    }

    const existing = grouped.get(category.id);
    if (existing) {
      existing.services.push(service);
    } else {
      grouped.set(category.id, { category, services: [service] });
    }
  }

  const groups = [...grouped.values()].sort((a, b) => {
    const left = a.category!;
    const right = b.category!;
    return left.order - right.order || left.name.localeCompare(right.name, "fr");
  });

  if (ungrouped.length > 0) {
    groups.push({ category: null, services: ungrouped });
  }

  return groups;
}
