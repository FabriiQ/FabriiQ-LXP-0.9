// CommonJS version of the run-migration script
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const readline = require('readline');

// This script runs the necessary migrations to update the database schema
// and populate ActivityGrade records for existing activities

async function runMigration() {
  console.log('Starting database migration...');
  
  // Create a new Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Run the Prisma migration to update the schema
    console.log('Step 1: Running Prisma migration...');
    console.log('Please run the following command in your terminal:');
    console.log('npx prisma migrate dev --name add_commitment_to_activity_grade');
    console.log('After the migration completes, press Enter to continue...');
    
    // Wait for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      rl.question('Press Enter to continue...', () => {
        rl.close();
        resolve();
      });
    });
    
    // Step 2: Run the activity grades migration script
    console.log('Step 2: Running activity grades migration...');
    console.log('Running the migration script now...');
    
    // Run the migration script directly
    try {
      // Run the CommonJS version of the migration script
      require('./migrate-activity-grades-cjs.js');
      console.log('Migration script completed successfully!');
    } catch (error) {
      console.error('Error running migration script:', error);
      throw error;
    }
    
    console.log('Migration completed successfully!');
    console.log('The following changes have been made:');
    console.log('1. Added commitment fields to ActivityGrade model');
    console.log('2. Added relation between ActivityGrade and CommitmentContract');
    console.log('3. Added UNATTEMPTED and COMPLETED status to SubmissionStatus enum');
    console.log('4. Created ActivityGrade records for all existing activities');
    
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the new commitment functionality');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .catch(e => {
    console.error('Unhandled error during migration:', e);
    process.exit(1);
  });
