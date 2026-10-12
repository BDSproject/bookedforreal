import { afterEach, describe, expect, it, vi } from "vitest";

import {
  activeProvider,
  ChannelNotConfiguredError,
  sendViaChannel,
  sendWithFallback,
} from "./providers";

const WHATSAPP = { contentSid: "HXtest", name: "rdv_confirmation", values: ["Salon"] };

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;
  delete process.env.TWILIO_WHATSAPP_NUMBER;
  delete process.env.TELNYX_API_KEY;
  delete process.env.TELNYX_PHONE_NUMBER;
  delete process.env.TELNYX_WHATSAPP_NUMBER;
  delete process.env.TELNYX_TEMPLATE_LANGUAGE;
  delete process.env.NOTIFY_PROVIDER;
});

/** Configures both Twilio channels and pins the provider. */
function configureTwilio(): void {
  process.env.NOTIFY_PROVIDER = "twilio";
  process.env.TWILIO_ACCOUNT_SID = "AC_test";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_PHONE_NUMBER = "+33123456789";
  process.env.TWILIO_WHATSAPP_NUMBER = "+14155238886";
}

/** Configures both Telnyx channels and pins the provider. */
function configureTelnyx(): void {
  process.env.NOTIFY_PROVIDER = "telnyx";
  process.env.TELNYX_API_KEY = "KEY_test";
  process.env.TELNYX_PHONE_NUMBER = "+33123456789";
  process.env.TELNYX_WHATSAPP_NUMBER = "+33123456789";
}

describe("provider selection", () => {
  it("honours NOTIFY_PROVIDER", () => {
    process.env.NOTIFY_PROVIDER = "telnyx";
    expect(activeProvider()).toBe("telnyx");
    process.env.NOTIFY_PROVIDER = "twilio";
    expect(activeProvider()).toBe("twilio");
  });

  it("infers Telnyx from its API key when nothing is set", () => {
    process.env.TELNYX_API_KEY = "KEY_test";
    expect(activeProvider()).toBe("telnyx");
  });

  it("defaults to Twilio", () => {
    delete process.env.NOTIFY_PROVIDER;
    delete process.env.TELNYX_API_KEY;
    expect(activeProvider()).toBe("twilio");
  });
});

describe("Twilio", () => {
  it("refuses a channel that has no credentials", async () => {
    process.env.NOTIFY_PROVIDER = "twilio";
    await expect(
      sendViaChannel({ channel: "SMS", to: "+33612345678", message: "Hi" }),
    ).rejects.toThrow(ChannelNotConfiguredError);
  });

  it("refuses WhatsApp without an approved template", async () => {
    configureTwilio();
    await expect(
      sendViaChannel({ channel: "WHATSAPP", to: "+33612345678", message: "Hi" }),
    ).rejects.toThrow(ChannelNotConfiguredError);
  });

  it("uses WhatsApp first when everything is configured", async () => {
    configureTwilio();
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const channel = await sendWithFallback({
      to: "+33612345678",
      message: "Bonjour",
      whatsapp: WHATSAPP,
      channels: ["WHATSAPP", "SMS"],
    });

    expect(channel).toBe("WHATSAPP");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("From=whatsapp%3A%2B14155238886");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("ContentSid=HXtest");
  });

  it("falls back to SMS when Twilio rejects the WhatsApp message", async () => {
    configureTwilio();
    const fetchMock = vi
      .fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 201 }))
      .mockResolvedValueOnce(new Response("template not approved", { status: 400 }))
      .mockResolvedValueOnce(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const channel = await sendWithFallback({
      to: "+33612345678",
      message: "Bonjour",
      whatsapp: WHATSAPP,
      channels: ["WHATSAPP", "SMS"],
    });

    expect(channel).toBe("SMS");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain("Body=Bonjour");
  });

  it("reports a Twilio failure instead of pretending it worked", async () => {
    configureTwilio();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_url: string, _init?: RequestInit) =>
          new Response("invalid number", { status: 400 }),
      ),
    );

    await expect(
      sendWithFallback({ to: "+33612345678", message: "Bonjour", channels: ["SMS"] }),
    ).rejects.toThrow(/Twilio 400/);
  });
});

describe("Telnyx", () => {
  it("sends an SMS through the Telnyx v2 messages endpoint", async () => {
    configureTelnyx();
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendViaChannel({ channel: "SMS", to: "+33612345678", message: "Bonjour" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.telnyx.com/v2/messages");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer KEY_test" });
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "+33123456789",
      to: "+33612345678",
      text: "Bonjour",
    });
  });

  it("sends a WhatsApp template on the dedicated endpoint", async () => {
    configureTelnyx();
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendViaChannel({
      channel: "WHATSAPP",
      to: "+33612345678",
      message: "Bonjour",
      whatsapp: WHATSAPP,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.telnyx.com/v2/messages/whatsapp");
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "+33123456789",
      to: "+33612345678",
      whatsapp_message: {
        type: "template",
        template: {
          name: "rdv_confirmation",
          language: { policy: "deterministic", code: "fr" },
          components: [{ type: "body", parameters: [{ type: "text", text: "Salon" }] }],
        },
      },
    });
  });

  it("omits the body component for a template with no variable", async () => {
    configureTelnyx();
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendViaChannel({
      channel: "WHATSAPP",
      to: "+33612345678",
      message: "Test",
      whatsapp: { name: "rdv_test", values: [] },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.whatsapp_message.template).not.toHaveProperty("components");
  });

  it("falls back to SMS when Telnyx rejects the WhatsApp message", async () => {
    configureTelnyx();
    const fetchMock = vi
      .fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("template pending", { status: 400 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const channel = await sendWithFallback({
      to: "+33612345678",
      message: "Bonjour",
      whatsapp: WHATSAPP,
      channels: ["WHATSAPP", "SMS"],
    });

    expect(channel).toBe("SMS");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a Telnyx failure instead of pretending it worked", async () => {
    configureTelnyx();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_url: string, _init?: RequestInit) => new Response("forbidden", { status: 403 }),
      ),
    );

    await expect(
      sendWithFallback({ to: "+33612345678", message: "Bonjour", channels: ["SMS"] }),
    ).rejects.toThrow(/Telnyx 403/);
  });
});
