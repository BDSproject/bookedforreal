/** Shared API response types (mirrors the Fastify API). */

/** A section of the price list ("Coupes", "Colorations"…). */
export interface ServiceCategory {
  id: string;
  name: string;
  order: number;
  /** Present on the dashboard list only. */
  _count?: { services: number };
}

export interface Service {
  id: string;
  nameFr: string;
  nameEn: string;
  durationMin: number;
  priceCents: number;
  bufferMin: number;
  /** Soft delete: a removed service stays in the history with `active: false`. */
  active?: boolean;
  categoryId?: string | null;
  category?: ServiceCategory | null;
  /** Staff who can perform it. Empty means the whole team. */
  staff?: { id: string; name: string }[];
}

export interface Staff {
  id: string;
  name: string;
  photoUrl: string | null;
  active: boolean;
}

/** One recurring weekly opening window for a staff member. */
export interface Availability {
  id: string;
  staffId: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  startTime: string;
  endTime: string;
  /** Optional lunch break, subtracted from the bookable slots. */
  breakStart: string | null;
  breakEnd: string | null;
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

/** A manually blocked slot on the calendar (holiday, personal appointment…). */
export interface TimeBlock {
  id: string;
  staffId: string;
  startAt: string;
  endAt: string;
  label: string | null;
  staff?: { id: string; name: string };
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  description: string | null;
  /** Salon number in E.164 — receives the new-booking alerts. */
  phone?: string | null;
  services?: Service[];
  staff?: Staff[];
  /** False once the salon's trial ended without a subscription (public booking closed). */
  bookingEnabled?: boolean;
}

/** WhatsApp/SMS messages left on the plan for the current month. */
export interface MessagingQuota {
  remaining: number;
  quota: number;
  /** False on the pay-as-you-go plan, where only SMS is available. */
  whatsapp?: boolean;
}

export interface DashboardStats {
  today: string;
  appointmentsToday: number;
  upcoming: number;
  clients: number;
  services: number;
  staff: number;
}

/** What one hairdresser did over a period. */
export interface StaffStats {
  staffId: string;
  name: string;
  /** Appointments in the period, cancellations excluded. */
  bookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcoming: number;
  revenueCents: number;
}

export interface StaffStatsReport {
  from: string;
  to: string;
  staff: StaffStats[];
  totals: { bookings: number; completed: number; revenueCents: number };
}
