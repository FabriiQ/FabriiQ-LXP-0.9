import { PrismaClient, UserType, AccessScope, GradingType, GradingScale, SystemStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { institutionsSeedData } from "./seed-data/institutions";
import { campusesSeedData } from "./seed-data/campuses";
import { academicCyclesSeedData } from "./seed-data/academic-cycles";
import { usersSeedData, DEFAULT_USER_PASSWORD, TEST_INSTITUTION_CODE, TEST_CAMPUS_CODE } from "./seed-data/users";
import { programsSeedData } from "./seed-data/programs";
import { seedCourses } from "./seed-data/courses";
import { seedHolidays } from "./seed-data/holidays";
import { seedPermissions } from "./seed-data/permissions";
import { seedCampus } from "./seed-data/campus-seed";
import { seedSubjects } from "./seed-data/subjects";
import { seedNewData } from "./new-seed-data";

const prisma = new PrismaClient();

/**
 * Main seed function that combines all seed data
 */
async function main() {
  console.log("Starting database seeding...");

  // ===== PART 1: Seed institutions and campuses from seed data =====
  console.log("Seeding institutions...");
  for (const institution of institutionsSeedData) {
    await prisma.institution.upsert({
      where: { code: institution.code },
      update: institution,
      create: institution,
    });
  }
  console.log(`Seeded ${institutionsSeedData.length} institutions`);

  // Create a test institution if it doesn't exist in seed data
  const testInstitution = await prisma.institution.upsert({
    where: { code: TEST_INSTITUTION_CODE },
    update: {
      name: 'Test Institution',
      status: 'ACTIVE',
    },
    create: {
      name: 'Test Institution',
      code: TEST_INSTITUTION_CODE,
      status: 'ACTIVE',
    },
  });

  // Seed campuses
  console.log("Seeding campuses...");
  for (const campus of campusesSeedData) {
    const { institutionCode, ...campusData } = campus;

    // Find the institution by code
    const institution = await prisma.institution.findUnique({
      where: { code: institutionCode },
    });

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping campus ${campus.code}`);
      continue;
    }

    await prisma.campus.upsert({
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
  }
  console.log(`Seeded ${campusesSeedData.length} campuses`);

  // Create a test campus
  const testCampus = await prisma.campus.upsert({
    where: { code: TEST_CAMPUS_CODE },
    update: {
      name: 'Main Campus',
      status: 'ACTIVE',
      institutionId: testInstitution.id,
      address: {
        street: '123 Campus St',
        city: 'Campus City',
        state: 'Campus State',
        country: 'Campus Country',
        postalCode: '12345',
      },
      contact: {
        phone: '1234567890',
        email: 'campus@institution.com',
      },
    },
    create: {
      institutionId: testInstitution.id,
      name: 'Main Campus',
      code: TEST_CAMPUS_CODE,
      status: 'ACTIVE',
      address: {
        street: '123 Campus St',
        city: 'Campus City',
        state: 'Campus State',
        country: 'Campus Country',
        postalCode: '12345',
      },
      contact: {
        phone: '1234567890',
        email: 'campus@institution.com',
      },
    },
  });

  // Add campus-seed
  console.log("Seeding additional campus data...");
  await seedCampus(prisma);

  // ===== PART 2: Seed users =====
  console.log("Seeding users...");
  const hashedPassword = await hash(DEFAULT_USER_PASSWORD, 12);

  // Create admin users for each institution
  const institutionAdmins = [];
  for (const institution of institutionsSeedData) {
    const institutionObj = await prisma.institution.findUnique({
      where: { code: institution.code },
    });

    if (!institutionObj) continue;

    const adminEmail = `admin@${institution.code.toLowerCase()}.edu`;
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: `${institution.name} Admin`,
        username: `admin_${institution.code.toLowerCase()}`,
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.MULTI_CAMPUS,
        status: 'ACTIVE',
      },
      create: {
        email: adminEmail,
        name: `${institution.name} Admin`,
        username: `admin_${institution.code.toLowerCase()}`,
        userType: UserType.ADMINISTRATOR,
        accessScope: AccessScope.MULTI_CAMPUS,
        password: hashedPassword,
        status: 'ACTIVE',
        institutionId: institutionObj.id,
      },
    });

    institutionAdmins.push(adminUser);
  }

  // Seed regular users
  for (const userData of usersSeedData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        username: userData.username,
        userType: userData.userType,
        accessScope: userData.accessScope,
        status: userData.status,
      },
      create: {
        email: userData.email,
        name: userData.name,
        username: userData.username,
        userType: userData.userType,
        accessScope: userData.accessScope,
        password: hashedPassword,
        status: userData.status,
        institutionId: testInstitution.id,
      },
    });

    // Create campus access for users with SINGLE_CAMPUS access scope
    if (userData.accessScope === 'SINGLE_CAMPUS') {
      await prisma.userCampusAccess.upsert({
        where: {
          userId_campusId: {
            userId: user.id,
            campusId: testCampus.id,
          },
        },
        update: {
          status: 'ACTIVE',
          roleType: userData.userType,
        },
        create: {
          userId: user.id,
          campusId: testCampus.id,
          status: 'ACTIVE',
          roleType: userData.userType,
        },
      });
    }
  }
  console.log(`Seeded ${usersSeedData.length + institutionAdmins.length} users`);

  // ===== PART 3: Seed academic cycles =====
  console.log("Seeding academic cycles...");
  for (const cycle of academicCyclesSeedData) {
    const { institutionCode, ...cycleData } = cycle;

    // Find the institution by code
    const institution = await prisma.institution.findUnique({
      where: { code: institutionCode },
    });

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping academic cycle ${cycle.code}`);
      continue;
    }

    // Find the admin user for this institution
    const adminUser = await prisma.user.findFirst({
      where: {
        institutionId: institution.id,
        userType: UserType.ADMINISTRATOR,
      },
    });

    // If no admin user found, use any user of the institution
    const creator = adminUser || await prisma.user.findFirst({
      where: {
        institutionId: institution.id,
      },
    });

    if (!creator) {
      console.warn(`No user found for institution ${institutionCode}. Skipping academic cycle ${cycle.code}`);
      continue;
    }

    await prisma.academicCycle.upsert({
      where: { code: cycle.code },
      update: {
        ...cycleData,
        institutionId: institution.id,
        updatedBy: creator.id,
      },
      create: {
        ...cycleData,
        institutionId: institution.id,
        createdBy: creator.id,
        updatedBy: creator.id,
      },
    });
  }
  console.log(`Seeded ${academicCyclesSeedData.length} academic cycles`);

  // ===== PART 4: Seed programs =====
  console.log("Seeding programs...");
  for (const program of programsSeedData) {
    const { institutionCode, ...programData } = program;

    // Find the institution by code
    const institution = await prisma.institution.findUnique({
      where: { code: institutionCode },
    });

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping program ${program.code}`);
      continue;
    }

    await prisma.program.upsert({
      where: { code: program.code },
      update: {
        ...programData,
        institutionId: institution.id,
      },
      create: {
        ...programData,
        institutionId: institution.id,
      },
    });
  }
  console.log(`Seeded ${programsSeedData.length} programs`);

  // ===== PART 5: Seed assessment templates =====
  console.log("Seeding assessment templates...");
  // Import assessment templates seed data
  const { assessmentTemplatesSeedData } = await import('./seed-data/assessment-templates');

  // First, create a default grading scale to use for templates
  // Make sure we have at least one admin user to use as creator
  if (institutionAdmins.length === 0) {
    console.warn("No institution admins found. Creating a system admin user for grading scale creation.");

    // Find or create a default institution for the system admin
    const defaultInstitution = await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE },
    }) || testInstitution;

    if (!defaultInstitution) {
      throw new Error("No active institution found for system admin creation");
    }

    const systemAdmin = await prisma.user.upsert({
      where: { email: "system@admin.com" },
      update: {
        name: "System Admin",
        username: "system_admin",
        userType: UserType.SYSTEM_ADMIN,
        accessScope: AccessScope.SYSTEM,
        status: SystemStatus.ACTIVE,
        institutionId: defaultInstitution.id,
      },
      create: {
        email: "system@admin.com",
        name: "System Admin",
        username: "system_admin",
        userType: UserType.SYSTEM_ADMIN,
        accessScope: AccessScope.SYSTEM,
        password: hashedPassword,
        status: SystemStatus.ACTIVE,
        institutionId: defaultInstitution.id,
      },
    });
    institutionAdmins.push(systemAdmin);
  }

  const defaultGradingScale = await prisma.gradingScaleModel.upsert({
    where: { id: 'DEFAULT-SCALE' },
    update: {
      name: 'Default Grading Scale',
      type: GradingType.MANUAL,
      scale: GradingScale.LETTER_GRADE,
      minScore: 0,
      maxScore: 100,
      ranges: {
        A: { min: 90, max: 100, gpa: 4.0 },
        B: { min: 80, max: 89, gpa: 3.0 },
        C: { min: 70, max: 79, gpa: 2.0 },
        D: { min: 60, max: 69, gpa: 1.0 },
        F: { min: 0, max: 59, gpa: 0.0 },
      },
      status: SystemStatus.ACTIVE,
      createdById: institutionAdmins[0].id,
    },
    create: {
      id: 'DEFAULT-SCALE',
      name: 'Default Grading Scale',
      type: GradingType.MANUAL,
      scale: GradingScale.LETTER_GRADE,
      minScore: 0,
      maxScore: 100,
      ranges: {
        A: { min: 90, max: 100, gpa: 4.0 },
        B: { min: 80, max: 89, gpa: 3.0 },
        C: { min: 70, max: 79, gpa: 2.0 },
        D: { min: 60, max: 69, gpa: 1.0 },
        F: { min: 0, max: 59, gpa: 0.0 },
      },
      status: SystemStatus.ACTIVE,
      createdById: institutionAdmins[0].id,
    },
  });

  for (const template of assessmentTemplatesSeedData) {
    const { institutionCode, ...templateData } = template;

    // Find the institution by code
    const institution = await prisma.institution.findUnique({
      where: { code: institutionCode },
    });

    if (!institution) {
      console.warn(`Institution with code ${institutionCode} not found. Skipping assessment template ${template.code}`);
      continue;
    }

    await prisma.assessmentTemplate.upsert({
      where: { code: template.code },
      update: {
        ...templateData,
        institutionId: institution.id,
        gradingScaleId: defaultGradingScale.id,
      },
      create: {
        ...templateData,
        institutionId: institution.id,
        gradingScaleId: defaultGradingScale.id,
      },
    });
  }
  console.log(`Seeded ${assessmentTemplatesSeedData.length} assessment templates`);

  // ===== PART 7: Seed courses =====
  await seedCourses(prisma);

  // ===== PART 8: Seed subjects =====
  await seedSubjects(prisma);

  // ===== PART 9: Seed holidays =====
  await seedHolidays(prisma);

  // ===== PART 10: Seed permissions =====
  await seedPermissions(prisma);

  console.log("Database seeding completed successfully!");
}

// Choose which seed function to run
const useNewSeedData = true;

if (useNewSeedData) {
  seedNewData()
    .catch((e) => {
      console.error("Error during new database seeding:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else {
  main()
    .catch((e) => {
      console.error("Error during database seeding:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}