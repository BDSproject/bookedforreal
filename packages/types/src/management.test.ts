import { describe, expect, it } from "vitest";

import {
  createAvailabilitySchema,
  createServiceSchema,
  createStaffSchema,
  updateAvailabilitySchema,
  updateSalonSchema,
} from "./management";

const WINDOW = {
  staffId: "staff-1",
  weekday: 1,
  startTime: "09:00",
  endTime: "18:00",
};

describe("createAvailabilitySchema", () => {
  it("accepts a plain opening window", () => {
    expect(createAvailabilitySchema.safeParse(WINDOW).success).toBe(true);
  });

  it("accepts a lunch break", () => {
    const result = createAvailabilitySchema.safeParse({
      ...WINDOW,
      breakStart: "12:30",
      breakEnd: "14:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a null break so a saved break can be cleared", () => {
    const result = createAvailabilitySchema.safeParse({
      ...WINDOW,
      breakStart: null,
      breakEnd: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    expect(createAvailabilitySchema.safeParse({ ...WINDOW, endTime: "08:00" }).success).toBe(false);
  });

  it("rejects a weekday outside 0-6", () => {
    expect(createAvailabilitySchema.safeParse({ ...WINDOW, weekday: 7 }).success).toBe(false);
  });

  it("rejects a time that is not HH:mm", () => {
    expect(createAvailabilitySchema.safeParse({ ...WINDOW, startTime: "9h" }).success).toBe(false);
  });
});

describe("updateAvailabilitySchema", () => {
  it("accepts a partial update", () => {
    expect(updateAvailabilitySchema.safeParse({ startTime: "10:00" }).success).toBe(true);
  });

  it("lets a break be emptied with null", () => {
    expect(updateAvailabilitySchema.safeParse({ breakStart: null }).success).toBe(true);
  });
});

describe("other management schemas", () => {
  it("requires the essentials on a service", () => {
    expect(
      createServiceSchema.safeParse({ nameFr: "Coupe", nameEn: "Haircut", durationMin: 30 })
        .success,
    ).toBe(true);
    expect(createServiceSchema.safeParse({ nameFr: "Coupe", durationMin: 0 }).success).toBe(false);
  });

  it("requires a name on a staff member", () => {
    expect(createStaffSchema.safeParse({ name: "Léa" }).success).toBe(true);
    expect(createStaffSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts the salon phone number the alerts are sent to", () => {
    expect(updateSalonSchema.safeParse({ phone: "06 12 34 56 78" }).success).toBe(true);
  });
});
