import { PrismaClient, SystemStatus } from '@prisma/client';

export const campusesSeedData = [
  {
    name: 'Sunshine Boys Campus',
    code: 'SIS-BOYS',
    institutionCode: 'SIS',
    status: SystemStatus.ACTIVE,
    address: {
      street: '123 Education Street',
      city: 'Education City',
      state: 'Education State',
      country: 'Education Country',
      postalCode: '12345',
    },
    contact: {
      email: 'boys@sunshine.edu',
      phone: '+1-555-123-4567',
    },
  },
  {
    name: 'Sunshine Girls Campus',
    code: 'SIS-GIRLS',
    institutionCode: 'SIS',
    status: SystemStatus.ACTIVE,
    address: {
      street: '456 Learning Avenue',
      city: 'Education City',
      state: 'Education State',
      country: 'Education Country',
      postalCode: '12345',
    },
    contact: {
      email: 'girls@sunshine.edu',
      phone: '+1-555-765-4321',
    },
  },
];

export async function seedCampuses(prisma: PrismaClient, institutions: any[]) {
  console.log('Seeding campuses...');

  const createdCampuses = [];

  for (const campus of campusesSeedData) {
    const { institutionCode, ...campusData } = campus;
    
    // Find the institution by code
    const institution = institutions.find(i => i.code === institutionCode);

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping campus ${campus.code}`);
      continue;
    }

    const createdCampus = await prisma.campus.upsert({
      where: { code: campus.code },
      update: {
        ...campusData,
        institutionId: institution.id,
      },
      create: {
        ...campusData,
        institutionId: institution.id,
      },
    });

    createdCampuses.push(createdCampus);
  }

  console.log(`Seeded ${createdCampuses.length} campuses`);
  return createdCampuses;
}
