import { describe, expect, it } from "vitest";

import { createBookingSchema } from "./booking";

const validPayload = {
  serviceId: "svc_1",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  startsAt: "2025-01-01T10:00:00Z",
};

describe("createBookingSchema", () => {
  it("accepts a valid payload", () => {
    expect(createBookingSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      customerEmail: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing service id", () => {
    const { serviceId: _serviceId, ...rest } = validPayload;
    expect(createBookingSchema.safeParse(rest).success).toBe(false);
  });
});
