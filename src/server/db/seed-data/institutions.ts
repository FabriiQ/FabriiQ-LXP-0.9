import { PrismaClient, SystemStatus } from '@prisma/client';

export const institutionsSeedData = [
  {
    name: 'Sunshine International School',
    code: 'SIS',
    status: SystemStatus.ACTIVE,
  },
];

export async function seedInstitutions(prisma: PrismaClient) {
  console.log('Seeding institutions...');

  for (const institution of institutionsSeedData) {
    await prisma.institution.upsert({
      where: { code: institution.code },
      update: institution,
      create: institution,
    });
  }

  console.log(`Seeded ${institutionsSeedData.length} institutions`);
  
  // Return the created institutions for reference in other seed files
  return await prisma.institution.findMany({
    where: {
      code: {
        in: institutionsSeedData.map(i => i.code)
      }
    }
  });
}
