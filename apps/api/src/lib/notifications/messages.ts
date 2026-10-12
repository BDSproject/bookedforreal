/**
 * Appointment message templates for WhatsApp and SMS.
 *
 * Bodies are kept short on purpose: an SMS is billed per 160-character segment,
 * and a short WhatsApp template costs the same as a long one.
 *
 * They live here rather than in `@bookedforreal/i18n` because they are rendered
 * server-side by the worker, per recipient locale, not by the web app.
 */

import type { WhatsappTemplate } from "./providers";

export type MessageLocale = "fr" | "en";

/** The messages the product sends. `TEST` is triggered from the dashboard. */
export type AppointmentMessageKind = "CONFIRMATION" | "REMINDER" | "OWNER_ALERT" | "TEST";

export interface AppointmentMessageVars {
  salonName: string;
  service: string;
  clientName: string;
  /** Human-readable day, already rendered in the salon timezone. */
  date: string;
  /** `HH:MM`, already rendered in the salon timezone. */
  time: string;
}

type Builder = (vars: AppointmentMessageVars) => string;

const BUILDERS: Record<MessageLocale, Record<AppointmentMessageKind, Builder>> = {
  fr: {
    CONFIRMATION: ({ salonName, date, time }) =>
      `RDV confirmé chez ${salonName} le ${date} à ${time}. À bientôt !`,
    REMINDER: ({ salonName, date, time }) =>
      `Rappel : RDV chez ${salonName} le ${date} à ${time}. À demain !`,
    OWNER_ALERT: ({ clientName, date, time, service }) =>
      `Nouveau RDV : ${clientName}, ${date} à ${time} (${service}).`,
    TEST: () => `Bookedforreal : vos rappels WhatsApp et SMS fonctionnent`,
  },
  en: {
    CONFIRMATION: ({ salonName, date, time }) =>
      `Booking confirmed at ${salonName} on ${date} at ${time}. See you soon!`,
    REMINDER: ({ salonName, date, time }) =>
      `Reminder: booking at ${salonName} on ${date} at ${time}. See you tomorrow!`,
    OWNER_ALERT: ({ clientName, date, time, service }) =>
      `New booking: ${clientName}, ${date} at ${time} (${service}).`,
    TEST: () => `Bookedforreal: your WhatsApp and SMS reminders are working`,
  },
};

/** Plain-text body used for SMS (and as the WhatsApp fallback body). */
export function buildMessage(
  kind: AppointmentMessageKind,
  locale: string,
  vars: AppointmentMessageVars,
): string {
  return BUILDERS[toLocale(locale)][kind](vars);
}

/** Twilio Content template SID per message kind, from the environment. */
const TWILIO_CONTENT_ENV: Record<AppointmentMessageKind, string> = {
  CONFIRMATION: "TWILIO_CONTENT_CONFIRMATION",
  REMINDER: "TWILIO_CONTENT_REMINDER",
  OWNER_ALERT: "TWILIO_CONTENT_OWNER_ALERT",
  TEST: "TWILIO_CONTENT_TEST",
};

/** Telnyx/Meta template name per message kind, from the environment. */
const TELNYX_TEMPLATE_ENV: Record<AppointmentMessageKind, string> = {
  CONFIRMATION: "TELNYX_TEMPLATE_CONFIRMATION",
  REMINDER: "TELNYX_TEMPLATE_REMINDER",
  OWNER_ALERT: "TELNYX_TEMPLATE_OWNER_ALERT",
  TEST: "TELNYX_TEMPLATE_TEST",
};

/**
 * WhatsApp template for a message kind, or `undefined` when nothing is
 * configured for either provider — in which case the chain falls back to SMS.
 *
 * The same four templates exist in both worlds; only their identifier differs
 * (a Twilio Content SID `HX…` or a Telnyx/Meta template name). Whichever the
 * active provider needs is the one it reads.
 *
 * The appointment templates must use this placeholder order:
 * `{{1}}` salon, `{{2}}` date, `{{3}}` time, `{{4}}` service, `{{5}}` client.
 * The test template takes no variable.
 */
export function buildWhatsappTemplate(
  kind: AppointmentMessageKind,
  vars: AppointmentMessageVars,
): WhatsappTemplate | undefined {
  const contentSid = process.env[TWILIO_CONTENT_ENV[kind]];
  const name = process.env[TELNYX_TEMPLATE_ENV[kind]];
  if (!contentSid && !name) {
    return undefined;
  }

  const values =
    kind === "TEST" ? [] : [vars.salonName, vars.date, vars.time, vars.service, vars.clientName];

  return {
    ...(contentSid ? { contentSid } : {}),
    ...(name ? { name } : {}),
    values,
  };
}

/** Renders the appointment start as a short day and a `HH:MM` time. */
export function formatAppointmentWhen(
  startAt: Date,
  timezone: string,
  locale: string,
): { date: string; time: string } {
  const tag = toLocale(locale) === "fr" ? "fr-FR" : "en-GB";
  const zone = safeTimezone(timezone);

  const date = new Intl.DateTimeFormat(tag, {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(startAt);

  const time = new Intl.DateTimeFormat(tag, {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startAt);

  return { date, time };
}

function toLocale(locale: string): MessageLocale {
  return locale === "en" ? "en" : "fr";
}

/** Falls back to Paris when a salon stored an unknown timezone. */
function safeTimezone(timezone: string): string {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: timezone });
    return timezone;
  } catch {
    return "Europe/Paris";
  }
}
