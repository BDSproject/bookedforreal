import { describe, expect, it } from "vitest";

import { createAppointmentSchema } from "./appointment";

const validPayload = {
  staffId: "staff_1",
  serviceId: "svc_1",
  client: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+33612345678",
    consentRgpd: true,
  },
  startAt: "2025-01-01T10:00:00Z",
};

describe("createAppointmentSchema", () => {
  it("accepts a valid payload", () => {
    expect(createAppointmentSchema.safeParse(validPayload).success).toBe(true);
  });

  it("defaults the source to WEB", () => {
    const result = createAppointmentSchema.parse(validPayload);
    expect(result.source).toBe("WEB");
  });

  it("rejects an invalid client email", () => {
    const result = createAppointmentSchema.safeParse({
      ...validPayload,
      client: { ...validPayload.client, email: "not-an-email" },
    });

    expect(result.success).toBe(false);
  });
});
