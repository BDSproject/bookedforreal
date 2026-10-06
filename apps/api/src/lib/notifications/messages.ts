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
const CONTENT_ENV: Record<AppointmentMessageKind, string> = {
  CONFIRMATION: "TWILIO_CONTENT_CONFIRMATION",
  REMINDER: "TWILIO_CONTENT_REMINDER",
  OWNER_ALERT: "TWILIO_CONTENT_OWNER_ALERT",
  TEST: "TWILIO_CONTENT_TEST",
};

/**
 * WhatsApp template for a message kind, or `undefined` when the operator has not
 * created it yet — in which case the chain silently falls back to SMS.
 *
 * The appointment templates must be created in this placeholder order in Twilio:
 * `{{1}}` salon, `{{2}}` date, `{{3}}` time, `{{4}}` service, `{{5}}` client.
 * The test template takes no variable.
 */
export function buildWhatsappTemplate(
  kind: AppointmentMessageKind,
  vars: AppointmentMessageVars,
): WhatsappTemplate | undefined {
  const contentSid = process.env[CONTENT_ENV[kind]];
  if (!contentSid) {
    return undefined;
  }

  const variables: Record<string, string> =
    kind === "TEST"
      ? {}
      : {
          "1": vars.salonName,
          "2": vars.date,
          "3": vars.time,
          "4": vars.service,
          "5": vars.clientName,
        };

  return { contentSid, variables };
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
