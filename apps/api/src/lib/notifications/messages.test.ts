import { afterEach, describe, expect, it } from "vitest";

import { buildMessage, buildWhatsappTemplate, formatAppointmentWhen } from "./messages";

const VARS = {
  salonName: "Studio Marais",
  service: "Coupe",
  clientName: "Camille",
  date: "jeu. 12 juin",
  time: "14:30",
};

afterEach(() => {
  delete process.env.TWILIO_CONTENT_CONFIRMATION;
  delete process.env.TWILIO_CONTENT_REMINDER;
  delete process.env.TWILIO_CONTENT_OWNER_ALERT;
  delete process.env.TWILIO_CONTENT_TEST;
  delete process.env.TELNYX_TEMPLATE_CONFIRMATION;
  delete process.env.TELNYX_TEMPLATE_TEST;
});

describe("appointment messages", () => {
  it("renders French bodies by default", () => {
    expect(buildMessage("CONFIRMATION", "fr", VARS)).toBe(
      "RDV confirmé chez Studio Marais le jeu. 12 juin à 14:30. À bientôt !",
    );
    expect(buildMessage("REMINDER", "fr", VARS)).toContain("Rappel");
    expect(buildMessage("OWNER_ALERT", "fr", VARS)).toContain("Camille");
  });

  it("renders English bodies for an English locale", () => {
    expect(buildMessage("CONFIRMATION", "en", VARS)).toContain(
      "Booking confirmed at Studio Marais",
    );
  });

  it("falls back to French for an unknown locale", () => {
    expect(buildMessage("TEST", "de", VARS)).toBe(buildMessage("TEST", "fr", VARS));
  });

  it("keeps the SMS body inside a single 160-character segment", () => {
    const longest = Math.max(
      ...(["CONFIRMATION", "REMINDER", "OWNER_ALERT"] as const).map(
        (kind) => buildMessage(kind, "fr", VARS).length,
      ),
    );
    expect(longest).toBeLessThanOrEqual(160);
  });

  it("returns no WhatsApp template until the operator creates one", () => {
    expect(buildWhatsappTemplate("CONFIRMATION", VARS)).toBeUndefined();
  });

  it("maps the appointment values onto the Twilio placeholders", () => {
    process.env.TWILIO_CONTENT_CONFIRMATION = "HXconfirmation";
    expect(buildWhatsappTemplate("CONFIRMATION", VARS)).toEqual({
      contentSid: "HXconfirmation",
      values: ["Studio Marais", "jeu. 12 juin", "14:30", "Coupe", "Camille"],
    });
  });

  it("carries the Telnyx template name when only that one is configured", () => {
    process.env.TELNYX_TEMPLATE_CONFIRMATION = "rdv_confirmation";
    expect(buildWhatsappTemplate("CONFIRMATION", VARS)).toEqual({
      name: "rdv_confirmation",
      values: ["Studio Marais", "jeu. 12 juin", "14:30", "Coupe", "Camille"],
    });
  });

  it("sends the test template without variables", () => {
    process.env.TWILIO_CONTENT_TEST = "HXtest";
    expect(buildWhatsappTemplate("TEST", VARS)).toEqual({ contentSid: "HXtest", values: [] });
  });

  it("renders the day and time in the salon timezone", () => {
    const when = formatAppointmentWhen(new Date("2026-06-12T12:30:00.000Z"), "Europe/Paris", "fr");
    expect(when.time).toBe("14:30");
    expect(when.date).toContain("12");
  });

  it("falls back to Paris when the salon timezone is unknown", () => {
    const when = formatAppointmentWhen(new Date("2026-06-12T12:30:00.000Z"), "Mars/Olympus", "fr");
    expect(when.time).toBe("14:30");
  });
});
