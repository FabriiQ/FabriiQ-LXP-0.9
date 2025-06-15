import { PrismaClient } from '@prisma/client';
import { seedMultipleChoiceQuestions } from '../src/features/question-bank/utils/seed-data';

/**
 * Seed Question Bank Script
 * 
 * This script seeds the question bank with sample data for testing and demonstration.
 * 
 * Usage:
 * 1. Make sure you have the required environment variables set
 * 2. Run with: npx ts-node scripts/seed-question-bank.ts
 */

async function main() {
  console.log('Starting question bank seeding...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get or create a test institution
    let institution = await prisma.institution.findFirst({
      where: { name: 'Test Institution' },
    });
    
    if (!institution) {
      console.log('Creating test institution...');
      institution = await prisma.institution.create({
        data: {
          name: 'Test Institution',
          code: 'TEST',
          status: 'ACTIVE',
        },
      });
    }
    
    // Get or create a test user
    let user = await prisma.user.findFirst({
      where: { email: 'admin@test.com' },
    });
    
    if (!user) {
      console.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          name: 'Test Admin',
          email: 'admin@test.com',
          username: 'testadmin',
          userType: 'ADMIN',
          status: 'ACTIVE',
          institutionId: institution.id,
        },
      });
    }
    
    // Get or create a test subject
    let subject = await prisma.subject.findFirst({
      where: { name: 'General Knowledge' },
    });
    
    if (!subject) {
      console.log('Creating test subject...');
      subject = await prisma.subject.create({
        data: {
          name: 'General Knowledge',
          code: 'GK',
          status: 'ACTIVE',
          institutionId: institution.id,
          createdById: user.id,
        },
      });
    }
    
    // Get or create a test course
    let course = await prisma.course.findFirst({
      where: { name: 'Basic Knowledge' },
    });
    
    if (!course) {
      console.log('Creating test course...');
      course = await prisma.course.create({
        data: {
          name: 'Basic Knowledge',
          code: 'BK',
          status: 'ACTIVE',
          institutionId: institution.id,
          createdById: user.id,
        },
      });
    }
    
    // Seed multiple choice questions
    console.log('Seeding multiple choice questions...');
    const result = await seedMultipleChoiceQuestions(
      prisma,
      institution.id,
      subject.id,
      course.id,
      user.id
    );
    
    console.log(`Successfully seeded ${result.questionCount} questions in question bank ${result.questionBankId}`);
    
  } catch (error) {
    console.error('Error seeding question bank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Question bank seeding completed!'))
  .catch((error) => {
    console.error('Error in seed script:', error);
    process.exit(1);
  });
