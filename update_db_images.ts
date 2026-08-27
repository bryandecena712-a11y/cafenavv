import { PrismaClient } from './app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: 'file:cafenav.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const cafes = [
    { name: 'Grind. Coffee', file: 'grind-gmap.jpg' },
    { name: 'Usual Coffee', file: 'usual-gmap.jpg' },
    { name: '250 Cafe', file: '250cafe-gmap.jpg' },
    { name: "Bo's Coffee", file: 'bos-gmap.jpg' }
  ];

  for (const cafe of cafes) {
    await prisma.cafes.update({
      where: { name: cafe.name },
      data: { image_url: `/images/${cafe.file}` }
    });
    console.log(`Updated DB for ${cafe.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

