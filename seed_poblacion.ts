import { PrismaClient } from './app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: 'file:cafenav.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const cafes = [
    {
      name: "Grind. Coffee",
      location: "219 JP Rizal St., Poblacion VI, Calamba City",
      description: "A popular local spot right beside Bahay ni Rizal.",
      image_url: "/images/grind.webp"
    },
    {
      name: "Usual Coffee",
      location: "127 JP Rizal St., Calamba",
      description: "Highly recommended specialty coffee shop in the bayan area.",
      image_url: "/images/brewco.jpg"
    },
    {
      name: "250 Cafe",
      location: "Poblacion (Near Old Market)",
      description: "A cozy spot near the lumang palengke in the town proper.",
      image_url: "/images/home-bg.jpg"
    },
    {
      name: "Bo's Coffee",
      location: "National Highway, Bagong Kalsada",
      description: "Philippine-sourced coffee with a convenient drive-thru service.",
      image_url: "/images/brewco.jpg"
    }
  ];

  for (const cafe of cafes) {
    await prisma.cafes.upsert({
      where: { name: cafe.name },
      update: cafe,
      create: cafe,
    });
    console.log(`Upserted cafe: ${cafe.name}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
