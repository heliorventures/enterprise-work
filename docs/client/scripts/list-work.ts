import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.workItem.findMany({
    take: 8,
    select: { id: true, title: true, status: true },
    orderBy: { updatedAt: 'desc' },
  });
  for (const row of rows) {
    console.log(`${row.id}\t${row.status}\t${row.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
