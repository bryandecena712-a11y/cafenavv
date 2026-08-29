import { PrismaClient } from './app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  await prisma.users.updateMany({
    where: { email: 'admin@admin.com' },
    data: { role: 'ADMIN' }
  });
  console.log('Admin role set.');
}

main().finally(() => prisma.$disconnect());
