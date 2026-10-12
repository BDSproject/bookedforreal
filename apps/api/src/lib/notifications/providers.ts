/**
 * Notification channel providers.
 *
 * Email is deliberately not supported: appointment messages go out on WhatsApp
 * (roughly half the price of an SMS in France) and fall back to SMS when
 * WhatsApp is not configured or rejected by the provider.
 *
 * Two providers are supported and both carry SMS *and* WhatsApp, so the
 * fallback chain stays in one place:
 *   - `twilio` — default
 *   - `telnyx` — WhatsApp at Meta's rate with no markup, cheaper SMS for France
 *
 * Pick one with `NOTIFY_PROVIDER`; when it is unset we infer it from the keys
 * (Telnyx when `TELNYX_API_KEY` exists, Twilio otherwise).
 */

export type Channel = "SMS" | "WHATSAPP";
export type NotifyProvider = "twilio" | "telnyx";

/** Thrown when a channel is missing its credentials or template. */
export class ChannelNotConfiguredError extends Error {}

/**
 * Provider-neutral WhatsApp template.
 *
 * WhatsApp refuses business-initiated messages that are not an approved
 * template. Twilio identifies one by its Content SID (`HX…`), Telnyx/Meta by
 * its name plus language. `values` holds the ordered values for `{{1}}`,
 * `{{2}}`… so each provider can shape them its own way.
 */
export interface WhatsappTemplate {
  /** Twilio Content template SID. */
  contentSid?: string;
  /** Telnyx/Meta template name. */
  name?: string;
  /** Telnyx/Meta language code, e.g. `fr`. */
  language?: string;
  /** Ordered values injected into `{{1}}`, `{{2}}`… (empty for the test). */
  values: string[];
}

export interface SendParams {
  channel: Channel;
  /** Recipient in E.164, e.g. `+33612345678`. */
  to: string;
  /** Plain-text body; used for SMS. */
  message: string;
  whatsapp?: WhatsappTemplate;
}

/** The provider to use, from `NOTIFY_PROVIDER` or inferred from the keys. */
export function activeProvider(): NotifyProvider {
  const configured = process.env.NOTIFY_PROVIDER?.trim().toLowerCase();
  if (configured === "twilio" || configured === "telnyx") {
    return configured;
  }
  return process.env.TELNYX_API_KEY ? "telnyx" : "twilio";
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

// ---------------------------------------------------------------------------
// Channel dispatch
// ---------------------------------------------------------------------------

async function sendSms(to: string, message: string): Promise<void> {
  if (activeProvider() === "telnyx") {
    await telnyxSms(to, message);
    return;
  }
  await twilioSms(to, message);
}

async function sendWhatsapp(to: string, template: WhatsappTemplate): Promise<void> {
  if (activeProvider() === "telnyx") {
    await telnyxWhatsapp(to, template);
    return;
  }
  await twilioWhatsapp(to, template);
}

// ---------------------------------------------------------------------------
// Twilio
// ---------------------------------------------------------------------------

async function twilioSms(to: string, message: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TWILIO_PHONE_NUMBER is missing");
  }
  await twilioSend(from, to, { Body: message });
}

async function twilioWhatsapp(to: string, template: WhatsappTemplate): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TWILIO_WHATSAPP_NUMBER is missing");
  }
  if (!template.contentSid) {
    throw new ChannelNotConfiguredError("TWILIO_CONTENT_* is missing");
  }

  // Twilio reads the placeholders as a {"1": value, "2": value} map.
  const variables: Record<string, string> = {};
  template.values.forEach((value, index) => {
    variables[String(index + 1)] = value;
  });

  await twilioSend(`whatsapp:${from}`, `whatsapp:${to}`, {
    ContentSid: template.contentSid,
    ContentVariables: JSON.stringify(variables),
  });
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

// ---------------------------------------------------------------------------
// Telnyx
// ---------------------------------------------------------------------------

async function telnyxSms(to: string, message: string): Promise<void> {
  const from = process.env.TELNYX_PHONE_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TELNYX_PHONE_NUMBER is missing");
  }
  await telnyxSend("/v2/messages", { from, to, text: message });
}

async function telnyxWhatsapp(to: string, template: WhatsappTemplate): Promise<void> {
  const from = process.env.TELNYX_WHATSAPP_NUMBER;
  if (!from) {
    throw new ChannelNotConfiguredError("TELNYX_WHATSAPP_NUMBER is missing");
  }
  if (!template.name) {
    throw new ChannelNotConfiguredError("TELNYX_TEMPLATE_* is missing");
  }

  await telnyxSend("/v2/messages/whatsapp", {
    from,
    to,
    whatsapp_message: {
      type: "template",
      template: {
        name: template.name,
        language: {
          policy: "deterministic",
          code: template.language ?? process.env.TELNYX_TEMPLATE_LANGUAGE ?? "fr",
        },
        ...(template.values.length > 0
          ? {
              components: [
                {
                  type: "body",
                  parameters: template.values.map((value) => ({ type: "text", text: value })),
                },
              ],
            }
          : {}),
      },
    },
  });
}

/** Posts a JSON payload through the Telnyx v2 API. */
async function telnyxSend(path: string, payload: Record<string, unknown>): Promise<void> {
  const key = process.env.TELNYX_API_KEY;
  if (!key) {
    throw new ChannelNotConfiguredError("TELNYX_API_KEY is missing");
  }

  const response = await fetch(`https://api.telnyx.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Telnyx ${response.status}: ${await response.text()}`);
  }
}
