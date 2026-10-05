/** Notification channel providers (Brevo / Twilio / Meta WhatsApp / Expo push). */

export type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export interface SendParams {
  channel: Channel;
  to: string;
  message: string;
  subject?: string;
}

/** Sends via a channel; no-ops when the provider is not configured (dev). */
export async function sendViaChannel(params: SendParams): Promise<void> {
  switch (params.channel) {
    case "EMAIL":
      await sendEmail(params.to, params.subject ?? "Bookedforreal", params.message);
      break;
    case "SMS":
      await sendSms(params.to, params.message);
      break;
    case "WHATSAPP":
      await sendWhatsapp(params.to, params.message);
      break;
    case "PUSH":
      await sendPush(params.to, params.message);
      break;
  }
}

/** Tries each channel in order (fallback: WhatsApp → SMS → Email). Returns the used channel. */
export async function sendWithFallback(to: string, message: string, channels: Channel[]): Promise<Channel> {
  let lastError: unknown = new Error("No channel");
  for (const channel of channels) {
    try {
      await sendViaChannel({ channel, to, message });
      return channel;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All channels failed");
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL ?? "noreply@bookedforreal.com" },
      to: [{ email: to }],
      subject,
      htmlContent: body,
    }),
  });
}

async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return;
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

async function sendWhatsapp(to: string, body: string): Promise<void> {
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!token) return;
  await fetch("https://graph.facebook.com/v19.0/me/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, text: { body } }),
  });
}

async function sendPush(to: string, body: string): Promise<void> {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, title: "Bookedforreal", body }),
  });
}
