/**
 * Notification channel providers.
 *
 * Email is deliberately not supported: appointment messages go out on WhatsApp
 * (roughly half the price of an SMS in France) and fall back to SMS when
 * WhatsApp is not configured or rejected by Twilio.
 *
 * Both channels go through Twilio, so there is a single set of credentials and a
 * single fallback chain.
 */

export type Channel = "SMS" | "WHATSAPP";

/** Thrown when a channel is missing its credentials or template. */
export class ChannelNotConfiguredError extends Error {}

/**
 * WhatsApp refuses business-initiated messages that are not an approved template,
 * so every automated message needs a Twilio Content template and its variables.
 */
export interface WhatsappTemplate {
  /** Twilio Content template SID (`HX…`). */
  contentSid: string;
  /** Values injected into the `{{1}}`, `{{2}}` … placeholders. */
  variables: Record<string, string>;
}

export interface SendParams {
  channel: Channel;
  /** Recipient in E.164, e.g. `+33612345678`. */
  to: string;
  /** Plain-text body; used for SMS. */
  message: string;
  whatsapp?: WhatsappTemplate;
}

/** Sends on a single channel. Throws when the channel is unavailable. */
export async function sendViaChannel(params: SendParams): Promise<void> {
  switch (params.channel) {
    case "SMS":
      await sendSms(params.to, params.message);
      break;
    case "WHATSAPP":
      if (!params.whatsapp) {
        throw new ChannelNotConfiguredError("No WhatsApp template configured");
      }
      await sendWhatsapp(params.to, params.whatsapp);
      break;
  }
}

/**
 * Tries each channel in order and returns the one that worked.
 * The first channel of the chain must be the cheapest one (WhatsApp, then SMS).
 */
export async function sendWithFallback(
  params: Omit<SendParams, "channel"> & { channels: Channel[] },
): Promise<Channel> {
  let lastError: unknown = new Error("No channel available");

  for (const channel of params.channels) {
    try {
      await sendViaChannel({ ...params, channel });
      return channel;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All channels failed");
}

/** Posts a message through the Twilio Messages API. */
async function twilioSend(from: string, to: string, body: Record<string, string>): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new ChannelNotConfiguredError("Twilio credentials are missing");
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, ...body }).toString(),
  });

  // Without this check a rejected message looked like a silent success and burnt
  // a credit for nothing.
  if (!response.ok) {
    throw new Error(`Twilio ${response.status}: ${await response.text()}`);
  }
}

async function sendSms(to: string, message: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TWILIO_PHONE_NUMBER is missing");
  }
  await twilioSend(from, to, { Body: message });
}

async function sendWhatsapp(to: string, template: WhatsappTemplate): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TWILIO_WHATSAPP_NUMBER is missing");
  }

  await twilioSend(`whatsapp:${from}`, `whatsapp:${to}`, {
    ContentSid: template.contentSid,
    ContentVariables: JSON.stringify(template.variables),
  });
}
