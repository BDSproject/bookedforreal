import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Weekday schedule: Monday (1) to Saturday (6), 09:00–18:00, 12:00–13:00 break. */
const WEEKDAYS = [1, 2, 3, 4, 5, 6];

/**
 * Demo salons are never locked by the paywall — they exist so the booking flow
 * can be exercised. Real salons get a 7-day trial at registration.
 */
const DEMO_TRIAL_END = new Date("2099-12-31T23:59:59.000Z");

/** Demo salons used to exercise the booking flow (one per city). */
const DEMO_SALONS = [
  {
    slug: "paris-marais",
    name: "Barber Shop Marais",
    type: "BARBER_SHOP",
    district: "Le Marais",
    city: "Paris",
    postalCode: "75004",
    ownerEmail: "owner-paris@demo.local",
    staff: [
      { id: "paris-staff-1", name: "Alex Martin" },
      { id: "paris-staff-2", name: "Sam Dubois" },
    ],
    services: [
      { id: "paris-haircut", nameFr: "Coupe", nameEn: "Haircut", durationMin: 30, priceCents: 2500, bufferMin: 5 },
      { id: "paris-beard", nameFr: "Barbe", nameEn: "Beard trim", durationMin: 20, priceCents: 1800, bufferMin: 5 },
      { id: "paris-color", nameFr: "Coloration", nameEn: "Coloring", durationMin: 60, priceCents: 6000, bufferMin: 10 },
    ],
  },
  {
    slug: "lyon-brotteaux",
    name: "Studio Coiffure Brotteaux",
    type: "HAIR_SALON",
    district: "Brotteaux",
    city: "Lyon",
    postalCode: "69006",
    ownerEmail: "owner-lyon@demo.local",
    staff: [{ id: "lyon-staff-1", name: "Camille Bernard" }],
    services: [
      { id: "lyon-haircut", nameFr: "Coupe femme", nameEn: "Women's cut", durationMin: 45, priceCents: 3800, bufferMin: 5 },
      { id: "lyon-brushing", nameFr: "Brushing", nameEn: "Blow-dry", durationMin: 30, priceCents: 3000, bufferMin: 5 },
    ],
  },
  {
    slug: "marseille-vieux-port",
    name: "Barber du Vieux-Port",
    type: "BARBER_SHOP",
    district: "Vieux-Port",
    city: "Marseille",
    postalCode: "13002",
    ownerEmail: "owner-marseille@demo.local",
    staff: [{ id: "marseille-staff-1", name: "Karim Haddad" }],
    services: [
      { id: "marseille-haircut", nameFr: "Coupe + barbe", nameEn: "Cut + beard", durationMin: 40, priceCents: 3200, bufferMin: 5 },
      { id: "marseille-shave", nameFr: "Rasage traditionnel", nameEn: "Traditional shave", durationMin: 25, priceCents: 2200, bufferMin: 5 },
    ],
  },
];

/** Seeds three demo salons (Paris, Lyon, Marseille) with owners, staff, services and availability. Idempotent. */
async function main() {
  for (const salon of DEMO_SALONS) {
    const owner = await prisma.user.upsert({
      where: { email: salon.ownerEmail },
      update: { role: "OWNER" },
      create: {
        email: salon.ownerEmail,
        // Placeholder — never store plaintext passwords in production.
        passwordHash: "NOT_FOR_PRODUCTION",
        role: "OWNER",
        locale: "fr",
      },
    });

    const createdSalon = await prisma.salon.upsert({
      where: { slug: salon.slug },
      update: {
        name: salon.name,
        type: salon.type,
        district: salon.district,
        trialEndsAt: DEMO_TRIAL_END,
      },
      create: {
        slug: salon.slug,
        ownerId: owner.id,
        name: salon.name,
        type: salon.type,
        district: salon.district,
        description: `${salon.name} — demo salon in ${salon.city}.`,
        city: salon.city,
        postalCode: salon.postalCode,
        country: "FR",
        timezone: "Europe/Paris",
        plan: "STARTER",
        trialEndsAt: DEMO_TRIAL_END,
      },
    });

    for (const [index, staff] of salon.staff.entries()) {
      await prisma.staff.upsert({
        where: { id: staff.id },
        update: { name: staff.name },
        create: { id: staff.id, salonId: createdSalon.id, name: staff.name, order: index },
      });

      for (const weekday of WEEKDAYS) {
        await prisma.availability.upsert({
          where: { id: `${staff.id}-${weekday}` },
          update: { startTime: "09:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
          create: {
            id: `${staff.id}-${weekday}`,
            salonId: createdSalon.id,
            staffId: staff.id,
            weekday,
            startTime: "09:00",
            endTime: "18:00",
            breakStart: "12:00",
            breakEnd: "13:00",
          },
        });
      }
    }

    for (const service of salon.services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          nameFr: service.nameFr,
          nameEn: service.nameEn,
          durationMin: service.durationMin,
          priceCents: service.priceCents,
          bufferMin: service.bufferMin,
        },
        create: { ...service, salonId: createdSalon.id },
      });
    }

    console.log(`Seeded ${createdSalon.slug} (${createdSalon.city})`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
