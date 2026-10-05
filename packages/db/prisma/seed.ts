import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Seeds a demo owner, salon, staff, services and weekly availability (idempotent). */
async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.local" },
    update: { role: "OWNER" },
    create: {
      email: "owner@demo.local",
      // Placeholder — never store plaintext passwords in production.
      passwordHash: "NOT_FOR_PRODUCTION",
      role: "OWNER",
      locale: "fr",
    },
  });

  const salon = await prisma.salon.upsert({
    where: { slug: "demo-salon" },
    update: { name: "Demo Barber Shop" },
    create: {
      slug: "demo-salon",
      ownerId: owner.id,
      name: "Demo Barber Shop",
      description: "The sample salon used to demo the booking flow.",
      city: "Paris",
      postalCode: "75001",
      country: "FR",
      timezone: "Europe/Paris",
      plan: "STARTER",
    },
  });

  const staff = await prisma.staff.upsert({
    where: { id: "demo-staff" },
    update: { name: "Alex Martin" },
    create: {
      id: "demo-staff",
      salonId: salon.id,
      name: "Alex Martin",
      order: 0,
    },
  });

  const services = [
    { id: "demo-haircut", nameFr: "Coupe", nameEn: "Haircut", durationMin: 30, priceCents: 2500, bufferMin: 5 },
    { id: "demo-beard", nameFr: "Barbe", nameEn: "Beard trim", durationMin: 20, priceCents: 1800, bufferMin: 5 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        nameFr: service.nameFr,
        nameEn: service.nameEn,
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        bufferMin: service.bufferMin,
      },
      create: { ...service, salonId: salon.id },
    });
  }

  // Monday (1) to Saturday (6), 09:00–18:00 with a 12:00–13:00 break.
  for (let weekday = 1; weekday <= 6; weekday++) {
    await prisma.availability.upsert({
      where: { id: `demo-avail-${weekday}` },
      update: { startTime: "09:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
      create: {
        id: `demo-avail-${weekday}`,
        salonId: salon.id,
        staffId: staff.id,
        weekday,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "12:00",
        breakEnd: "13:00",
      },
    });
  }

  console.log(`Seeded demo salon: ${salon.slug}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
