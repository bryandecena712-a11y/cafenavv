const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findFirst();
  const cafe = await prisma.cafes.findFirst();
  
  if (!user || !cafe) {
    console.log('No user or cafe found');
    return;
  }
  
  const res = await fetch('http://localhost:3000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cafeId: cafe.id,
      userId: user.id,
      rating: 5,
      content: 'This is a test review from a script!'
    })
  });
  
  const data = await res.json();
  console.log('Status:', res.status, 'Data:', data);
}

main().catch(console.error);
