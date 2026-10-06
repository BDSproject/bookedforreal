import { afterEach, describe, expect, it, vi } from "vitest";

import { ChannelNotConfiguredError, sendViaChannel, sendWithFallback } from "./providers";

const WHATSAPP = { contentSid: "HXtest", variables: { "1": "Salon" } };

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;
  delete process.env.TWILIO_WHATSAPP_NUMBER;
});

/** Configures both Twilio channels. */
function configureTwilio(): void {
  process.env.TWILIO_ACCOUNT_SID = "AC_test";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_PHONE_NUMBER = "+33123456789";
  process.env.TWILIO_WHATSAPP_NUMBER = "+14155238886";
}

describe("notification providers", () => {
  it("refuses a channel that has no credentials", async () => {
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
