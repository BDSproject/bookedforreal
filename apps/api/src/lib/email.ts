/**
 * Minimal transactional email (Brevo), used ONLY for the email-verification
 * step. Appointment reminders stay on WhatsApp/SMS — this email exists so a
 * client cannot book with a fake address: the link confirms the inbox is real.
 */

export interface VerificationEmail {
  to: string;
  name: string;
  verifyUrl: string;
}

/** Sends the "confirm your email" message. No-ops when Brevo is not configured. */
export async function sendVerificationEmail(params: VerificationEmail): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    return;
  }

  const sender = process.env.BREVO_SENDER_EMAIL ?? "noreply@bookedforreal.com";
  const html = [
    `<p>Bonjour ${escapeHtml(params.name)},</p>`,
    `<p>Merci pour votre réservation. Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>`,
    `<p><a href="${escapeHtml(params.verifyUrl)}">Confirmer mon email</a></p>`,
    `<p>À bientôt,<br/>Bookedforreal</p>`,
  ].join("");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: sender },
      to: [{ email: params.to }],
      subject: "Confirmez votre email — Bookedforreal",
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo ${response.status}: ${await response.text()}`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
