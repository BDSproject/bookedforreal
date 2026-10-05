import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds a demo salon with a stylist and two services.
 * Idempotent: uses upserts with deterministic ids so it can be re-run safely.
 */
async function main() {
  const salon = await prisma.salon.upsert({
    where: { slug: "demo-salon" },
    update: { name: "Demo Barber Shop" },
    create: {
      slug: "demo-salon",
      name: "Demo Barber Shop",
      description: "The sample salon used to demo the booking flow.",
      city: "Paris",
      postalCode: "75001",
      country: "FR",
      timezone: "Europe/Paris",
    },
  });

  await prisma.stylist.upsert({
    where: { id: "demo-stylist" },
    update: { name: "Alex Martin" },
    create: {
      id: "demo-stylist",
      salonId: salon.id,
      name: "Alex Martin",
      bio: "Barber since 2015.",
    },
  });

  const services = [
    { id: "demo-haircut", name: "Haircut", durationMinutes: 30, priceCents: 2500 },
    { id: "demo-beard", name: "Beard trim", durationMinutes: 20, priceCents: 1800 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      },
      create: { ...service, salonId: salon.id },
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
