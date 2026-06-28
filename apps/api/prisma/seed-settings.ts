/** One-off: seed estate settings + a couple of staff accounts. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.estateSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      villaBaseRate: 8500,
      taxRate: 0.16,
      serviceChargeRate: 0.16,
    },
  });

  const staff = [
    { name: 'Rodrigo Mendez', email: 'rodrigo@villatimtavio.com', role: 'ESTATE_MANAGER' as const },
    { name: 'Lucia Fernandez', email: 'lucia@villatimtavio.com', role: 'READ_ONLY' as const },
  ];
  for (const s of staff) {
    await prisma.staffAccount.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
  }

  console.log('Seeded estate settings + staff accounts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
