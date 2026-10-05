/** Shared API response types (mirrors the Fastify API). */
export type SalonType = "HAIR_SALON" | "BARBER_SHOP";

export interface Service {
  id: string;
  nameFr: string;
  nameEn: string;
  durationMin: number;
  priceCents: number;
  bufferMin: number;
}

export interface Staff {
  id: string;
  name: string;
  photoUrl: string | null;
  order?: number;
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  type: SalonType;
  city: string | null;
  district: string | null;
  description: string | null;
  logoUrl: string | null;
  address?: string | null;
  postalCode?: string | null;
  services?: Service[];
  staff?: Staff[];
}

export interface Slot {
  time: string;
  startAt: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  slots: Record<string, Slot[]>;
}
