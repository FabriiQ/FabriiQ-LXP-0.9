/**
 * Script to run the Prisma migration for adding lesson plan relations
 */
const { execSync } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

console.log(`${colors.blue}Starting Prisma migration for lesson plan relations...${colors.reset}`);

try {
  // Generate Prisma client
  console.log(`${colors.yellow}Generating Prisma client...${colors.reset}`);
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run the migration
  console.log(`${colors.yellow}Running migration...${colors.reset}`);
  execSync('npx prisma migrate dev --name add_lesson_plan_relations', { stdio: 'inherit' });
  
  console.log(`${colors.green}Migration completed successfully!${colors.reset}`);
  console.log(`${colors.blue}The following changes were made:${colors.reset}`);
  console.log(`${colors.yellow}1. Added lessonPlanId field to Activity model${colors.reset}`);
  console.log(`${colors.yellow}2. Added lessonPlanId field to Assessment model${colors.reset}`);
  console.log(`${colors.yellow}3. Added activities and assessments relations to LessonPlan model${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Error during migration:${colors.reset}`, error.message);
  process.exit(1);
}
