/**
 * Script to create question banks for existing subjects
 *
 * This script finds all subjects that don't have associated question banks
 * and creates a question bank for each one.
 *
 * Usage:
 * npx ts-node scripts/create-question-banks-for-subjects.ts
 */

import { PrismaClient, SystemStatus, UserType } from '@prisma/client';
import { QuestionBankService } from '../src/features/question-bank/services/question-bank.service';
import { CreateQuestionBankInput } from '../src/features/question-bank/models/types';

// Initialize Prisma client
const prisma = new PrismaClient();
const questionBankService = new QuestionBankService(prisma);

async function createQuestionBanksForSubjects() {
  console.log('Starting to create question banks for existing subjects...');

  try {
    // Find a system admin user to use as the creator
    const adminUser = await prisma.user.findFirst({
      where: {
        userType: UserType.SYSTEM_ADMIN,
      },
    });

    if (!adminUser) {
      console.error('No system admin user found. Cannot proceed without a valid user ID.');
      return;
    }

    const SYSTEM_USER_ID = adminUser.id;
    console.log(`Using system admin user ID: ${SYSTEM_USER_ID}`);
    // Get all active subjects with their courses
    const subjects = await prisma.subject.findMany({
      where: {
        status: SystemStatus.ACTIVE,
      },
      include: {
        course: true,
      },
    });

    console.log(`Found ${subjects.length} active subjects.`);

    // Counter for tracking progress
    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Process each subject
    for (const subject of subjects) {
      try {
        // Check if this subject already has questions in a question bank
        const existingQuestions = await prisma.question.findFirst({
          where: {
            subjectId: subject.id,
            status: SystemStatus.ACTIVE,
          },
          include: {
            questionBank: true,
          },
        });

        if (existingQuestions) {
          console.log(`Subject "${subject.name}" already has questions in question bank "${existingQuestions.questionBank.name}". Skipping.`);
          skipped++;
          continue;
        }

        // Get institution ID from the course's campus offerings
        const courseCampus = await prisma.courseCampus.findFirst({
          where: {
            courseId: subject.courseId,
            status: SystemStatus.ACTIVE,
          },
          include: {
            campus: true
          },
        });

        if (!courseCampus?.campus?.institutionId) {
          console.log(`Could not find institution ID for subject "${subject.name}". Skipping.`);
          skipped++;
          continue;
        }

        // Create a descriptive name for the question bank
        const questionBankName = `${subject.course.name} - ${subject.name} Question Bank`;

        // Create the question bank
        const questionBankInput: CreateQuestionBankInput = {
          name: questionBankName,
          description: `Question bank for ${subject.name} in ${subject.course.name}`,
          institutionId: courseCampus.campus.institutionId,
        };

        const questionBank = await questionBankService.createQuestionBank(
          questionBankInput,
          SYSTEM_USER_ID
        );

        console.log(`Created question bank "${questionBankName}" for subject "${subject.name}".`);
        created++;
      } catch (error) {
        console.error(`Error processing subject "${subject.name}":`, error);
        errors++;
      }
    }

    // Print summary
    console.log('\nSummary:');
    console.log(`Total subjects: ${subjects.length}`);
    console.log(`Question banks created: ${created}`);
    console.log(`Subjects skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Error fetching subjects:', error);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

// Run the script
createQuestionBanksForSubjects()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
