import { PrismaClient } from '@prisma/client';
import { seedNewData } from '../src/server/db/seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Use the comprehensive seeding function from index.ts
    await seedNewData();

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