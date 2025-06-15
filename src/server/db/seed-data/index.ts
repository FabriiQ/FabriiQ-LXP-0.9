import { PrismaClient } from '@prisma/client';
import { seedInstitutions } from './institutions';
import { seedCampuses } from './campuses';
import { seedActivityTypes } from './activity-types';
import { seedFeeManagement } from './fee-management';
import { seedEnrollmentDocuments } from './enrollment-documents';
import { seedAcademicCycles } from './academic-cycles';
import { seedPrograms, seedCourses } from './programs';
import { seedUsers } from './users';
import { seedClasses } from './classes';
import { seedStudentEnrollments } from './student-enrollments';
import { seedSubjects } from './subjects';
import { seedStudents } from './students';
import { seedSubjectTopics } from './subject-topics';
import { seedActivities } from './activities';
import { seedActivitiesByType } from './activities-seed';
import { seedBulkStudents } from './bulk-students-seed';

const prisma = new PrismaClient();

/**
 * Main seed function that orchestrates the seeding process
 */
export async function seedNewData() {
  console.log('Starting new database seeding...');

  try {
    // Step 1: Seed institutions
    const institutions = await seedInstitutions(prisma);
    console.log('Institutions seeded successfully');

    // Step 2: Seed campuses
    const campuses = await seedCampuses(prisma, institutions);
    console.log('Campuses seeded successfully');

    // Step 3: Seed activity types
    const activityTypes = await seedActivityTypes(prisma);
    console.log('Activity types seeded successfully');

    // Step 4: Seed academic cycles
    const academicCyclesResult = await seedAcademicCycles(prisma, institutions);
    const academicCycles = academicCyclesResult.cycles || [];
    console.log('Academic cycles seeded successfully');

    // Step 5: Seed programs
    const programsResult = await seedPrograms(prisma, institutions, campuses, academicCycles);
    const programs = programsResult.programs || [];
    console.log('Programs seeded successfully');

    // Step 6: Seed program-campus associations
    const programCampuses = programsResult.programCampuses || [];
    console.log('Program-campus associations seeded successfully');

    // Step 7: Seed courses
    const courses = await seedCourses(prisma, programs);
    console.log('Courses seeded successfully');

    // Step 8: Seed subjects
    const subjects = await seedSubjects(prisma, courses);
    console.log('Subjects seeded successfully');

    // Step 9: Seed users
    const users = await seedUsers(prisma, institutions, campuses);
    console.log('Users seeded successfully');

    // Step 10: Seed classes
    const classes = await seedClasses(prisma, programCampuses, []);
    console.log('Classes seeded successfully');

    // Step 11: Seed students
    const students = await seedStudents(prisma, classes, campuses);
    console.log('Students seeded successfully');

    // Step 12: Seed student enrollments
    const studentEnrollments = await seedStudentEnrollments(prisma, classes, []);
    console.log('Student enrollments seeded successfully');

    // Step 10: Seed fee management data
    await seedFeeManagement(prisma, institutions, programCampuses, academicCycles[0] ? [academicCycles[0]] : [], [], studentEnrollments);
    console.log('Fee management data seeded successfully');

    // Step 11: Seed enrollment documents
    await seedEnrollmentDocuments(prisma, studentEnrollments, []);
    console.log('Enrollment documents seeded successfully');

    // Step 12: Seed subject topics
    await seedSubjectTopics(prisma, subjects);
    console.log('Subject topics seeded successfully');

    // Step 13: Seed activities
    await seedActivities(prisma, subjects, classes, students);
    console.log('Activities seeded successfully');

    // Step 14: Seed activities by type
    await seedActivitiesByType(prisma, subjects, classes);
    console.log('Activities by type seeded successfully');

    // Step 15: Seed bulk students (500 per class)
    await seedBulkStudents(prisma, 500);
    console.log('Bulk students seeded successfully');

    console.log('New database seeding completed successfully!');
    return {
      institutions,
      campuses,
      activityTypes,
      academicCycles,
      programs,
      programCampuses,
      users,
      classes,
      studentEnrollments
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedNewData()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during seeding:', error);
      process.exit(1);
    });
}
