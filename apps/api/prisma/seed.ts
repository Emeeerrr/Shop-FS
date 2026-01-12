import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      sku: 'CAFE-001',
      name: 'Café de Origen Antioquia',
      description: 'Molido artesanal',
      priceCents: 100000,
      stock: 100,
    },
    {
      sku: 'CAFE-002',
      name: 'Café Especial Premium',
      description: 'Grano entero',
      priceCents: 350000,
      stock: 100,
    },
    {
      sku: 'CAFE-003',
      name: 'Café Orgánico',
      description: 'Tostión media',
      priceCents: 15000,
      stock: 99,
    },
    {
      sku: 'CAFE-004',
      name: 'Café Supremo',
      description: 'Tostión oscura',
      priceCents: 980000,
      stock: 97,
    },
    {
      sku: 'CAFE-005',
      name: 'Café Sierra Nevada',
      description: 'Altura premium',
      priceCents: 180000,
      stock: 95,
    },
    {
      sku: 'CAFE-006',
      name: 'Café Descafeinado',
      description: 'Proceso natural',
      priceCents: 120000,
      stock: 90,
    },
    {
      sku: 'CAFE-007',
      name: 'Café Bourbon',
      description: 'Perfil dulce',
      priceCents: 220000,
      stock: 88,
    },
    {
      sku: 'CAFE-008',
      name: 'Café Honey Process',
      description: 'Notas frutales',
      priceCents: 260000,
      stock: 85,
    },
    {
      sku: 'CAFE-009',
      name: 'Café Geisha',
      description: 'Edición especial',
      priceCents: 520000,
      stock: 50,
    },
    {
      sku: 'CAFE-010',
      name: 'Café Espresso Blend',
      description: 'Ideal para espresso',
      priceCents: 140000,
      stock: 110,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        currency: 'COP',
        // imageUrl entra por default en el schema 👌
        stock: {
          create: { unitsAvailable: p.stock },
        },
      },
    });
  }

  console.log('✅ Products seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
