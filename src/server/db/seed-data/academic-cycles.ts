import { PrismaClient, SystemStatus, TermType, TermPeriod } from '@prisma/client';

export const academicCyclesSeedData = [
  {
    name: 'Academic Year 2024-2025',
    code: 'AY-2024-2025',
    institutionCode: 'SIS',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2025-06-30'),
    status: SystemStatus.ACTIVE,
    type: 'ANNUAL',
    duration: 11, // 11 months
  },
];

export const termsSeedData = [
  {
    name: 'Fall Term 2024',
    code: 'FALL-2024',
    academicCycleCode: 'AY-2024-2025',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-12-20'),
    status: SystemStatus.ACTIVE,
    termType: 'SEMESTER' as TermType,
    termPeriod: 'FALL' as TermPeriod,
  },
  {
    name: 'Spring Term 2025',
    code: 'SPRING-2025',
    academicCycleCode: 'AY-2024-2025',
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-06-30'),
    status: SystemStatus.ACTIVE,
    termType: 'SEMESTER' as TermType,
    termPeriod: 'SPRING' as TermPeriod,
  },
];

export async function seedAcademicCycles(prisma: PrismaClient, institutions: any[]) {
  console.log('Seeding academic cycles...');

  const createdCycles = [];
  const createdTerms = [];

  // Find admin user to use as creator
  let adminUser = await prisma.user.findFirst({
    where: {
      userType: 'ADMINISTRATOR',
      status: SystemStatus.ACTIVE,
    },
  });

  if (!adminUser) {
    console.warn('No admin user found. Creating a default admin user for academic cycles.');

    // Find the institution
    const institution = institutions[0];
    if (!institution) {
      console.warn('No institution found. Cannot create admin user.');
      return { cycles: [], terms: [] };
    }

    // Create a default admin user
    adminUser = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: `admin.${Date.now()}@example.com`,
        username: `admin_${Date.now()}`,
        userType: 'ADMINISTRATOR',
        accessScope: 'SYSTEM',
        status: SystemStatus.ACTIVE,
        password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
        institution: { connect: { id: institution.id } },
      },
    });

    console.log('Created default admin user for academic cycles');
  }

  // Create academic cycles
  for (const cycle of academicCyclesSeedData) {
    const { institutionCode, ...cycleData } = cycle;

    // Find the institution by code
    const institution = institutions.find(i => i.code === institutionCode);

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping academic cycle ${cycle.code}`);
      continue;
    }

    const createdCycle = await prisma.academicCycle.upsert({
      where: { code: cycle.code },
      update: {
        ...cycleData,
        updatedBy: adminUser.id,
      },
      create: {
        name: cycleData.name,
        code: cycleData.code,
        description: `Academic cycle for ${cycleData.name}`,
        startDate: cycleData.startDate,
        endDate: cycleData.endDate,
        type: cycleData.type,
        duration: cycleData.duration,
        status: cycleData.status,
        institution: { connect: { id: institution.id } },
        creator: { connect: { id: adminUser.id } },
      },
    });

    createdCycles.push(createdCycle);
  }

  // Create terms
  for (const term of termsSeedData) {
    const { academicCycleCode, termType, termPeriod, ...termData } = term;

    // Find the academic cycle by code
    const academicCycle = createdCycles.find(c => c.code === academicCycleCode);

    if (!academicCycle) {
      console.warn(`Academic cycle with code ${academicCycleCode} not found. Skipping term ${term.code}`);
      continue;
    }

    // Find a course to associate with this term
    const course = await prisma.course.findFirst({
      where: {
        status: SystemStatus.ACTIVE,
      },
    });

    if (!course) {
      console.warn('No course found. Skipping term creation.');
      continue;
    }

    const createdTerm = await prisma.term.upsert({
      where: { code: term.code },
      update: {
        ...termData,
        termType,
        termPeriod,
      },
      create: {
        ...termData,
        termType,
        termPeriod,
        academicCycle: { connect: { id: academicCycle.id } },
        course: { connect: { id: course.id } },
      },
    });

    createdTerms.push(createdTerm);
  }

  console.log(`Seeded ${createdCycles.length} academic cycles and ${createdTerms.length} terms`);
  return { cycles: createdCycles, terms: createdTerms };
}
