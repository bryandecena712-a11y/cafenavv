import { prisma } from './app/lib/prisma';

async function main() {
  const result = await prisma.cafes.updateMany({
    where: {
      status: null
    },
    data: {
      status: 'APPROVED'
    }
  });
  console.log(`Updated ${result.count} cafes to APPROVED`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
