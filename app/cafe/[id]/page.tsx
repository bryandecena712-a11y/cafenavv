import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import CafeDetailsClient from './CafeDetailsClient';

export default async function CafePage({ params }: { params: { id: string } }) {
  const cafeId = parseInt(params.id);
  
  if (isNaN(cafeId)) {
    notFound();
  }

  const cafe = await prisma.cafes.findUnique({
    where: { id: cafeId },
  });

  if (!cafe) {
    notFound();
  }

  return <CafeDetailsClient cafe={cafe} />;
}
