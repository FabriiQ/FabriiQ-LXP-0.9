import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting simple database seeding...');

  try {
    // Create a test institution
    const institution = await prisma.institution.upsert({
      where: { code: 'SIS' },
      update: {},
      create: {
        name: 'Sunshine International School',
        code: 'SIS',
        status: 'ACTIVE',
      },
    });

    console.log('Created institution:', institution);
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
