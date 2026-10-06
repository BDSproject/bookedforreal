/** Shared API response types (mirrors the Fastify API). */

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
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE" | "NO_SHOW";
  client: Client | null;
  staff: Staff | null;
  service: Service | null;
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  description: string | null;
  services?: Service[];
  staff?: Staff[];
  /** False once the salon's trial ended without a subscription (public booking closed). */
  bookingEnabled?: boolean;
}

export interface DashboardStats {
  today: string;
  appointmentsToday: number;
  upcoming: number;
  clients: number;
  services: number;
  staff: number;
}
