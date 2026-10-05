import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AvailabilityResponse, Salon } from "@/lib/types";

/** Lists salons, optionally filtered by city. */
export function useSalons(city?: string) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : "";
  return useQuery({
    queryKey: ["salons", city],
    queryFn: () => apiFetch<Salon[]>(`/public/salons${qs}`),
  });
}

/** Fetches a single salon by slug (services + staff included). */
export function useSalon(slug: string) {
  return useQuery({
    queryKey: ["salon", slug],
    queryFn: () => apiFetch<Salon>(`/public/salons/${slug}`),
  });
}

/** Fetches free slots for a service + staff on a given date. */
export function useAvailability(slug: string, date: string, serviceId?: string, staffId?: string) {
  const params = [`date=${encodeURIComponent(date)}`];
  if (serviceId) params.push(`serviceId=${encodeURIComponent(serviceId)}`);
  if (staffId) params.push(`staffId=${encodeURIComponent(staffId)}`);

  return useQuery({
    queryKey: ["availability", slug, date, serviceId, staffId],
    queryFn: () => apiFetch<AvailabilityResponse>(`/public/salons/${slug}/availability?${params.join("&")}`),
    enabled: Boolean(serviceId && date),
  });
}
