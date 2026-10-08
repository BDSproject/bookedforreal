import { describe, expect, it } from "vitest";

import {
  availabilityQuerySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment";

const validPayload = {
  staffId: "staff_1",
  serviceId: "svc_1",
  firstName: "Jane",
  lastName: "Doe",
  phone: "+33612345678",
  email: "jane@example.com",
  startAt: "2026-01-05T09:00:00.000Z",
};

describe("createAppointmentSchema", () => {
  it("accepts a valid payload", () => {
    expect(createAppointmentSchema.safeParse(validPayload).success).toBe(true);
  });

  it("defaults the source to WEB", () => {
    expect(createAppointmentSchema.parse(validPayload).source).toBe("WEB");
  });

  it("rejects an invalid email", () => {
    const result = createAppointmentSchema.safeParse({ ...validPayload, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing startAt", () => {
    expect(createAppointmentSchema.safeParse({ ...validPayload, startAt: undefined }).success).toBe(
      false,
    );
  });
});

describe("updateAppointmentStatusSchema", () => {
  it("accepts a valid status", () => {
    expect(updateAppointmentStatusSchema.safeParse({ status: "CONFIRMED" }).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(updateAppointmentStatusSchema.safeParse({ status: "BOGUS" }).success).toBe(false);
  });
});

describe("availabilityQuerySchema", () => {
  it("accepts a valid date", () => {
    expect(availabilityQuerySchema.safeParse({ date: "2026-01-05" }).success).toBe(true);
  });

  it("rejects a malformed date", () => {
    expect(availabilityQuerySchema.safeParse({ date: "05/01/2026" }).success).toBe(false);
  });
});
