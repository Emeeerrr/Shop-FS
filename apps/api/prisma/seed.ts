import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sku = 'SKU-COFFEE-001';

  const product = await prisma.product.upsert({
    where: { sku },
    update: {},
    create: {
      sku,
      name: 'Kit Café Market',
      description: 'Café premium de la montaña a tu puerta.',
      priceCents: 49000,
      currency: 'COP',
      stock: { create: { unitsAvailable: 20 } },
    },
    include: { stock: true },
  });

  console.log('Seeded product:', product);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
