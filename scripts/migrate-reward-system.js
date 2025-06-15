/**
 * Script to run the Prisma migration for adding reward system
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

console.log(`${colors.blue}Starting Prisma migration for reward system...${colors.reset}`);

try {
  // Generate Prisma client
  console.log(`${colors.yellow}Generating Prisma client...${colors.reset}`);
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run the migration
  console.log(`${colors.yellow}Running migration...${colors.reset}`);
  execSync('npx prisma migrate dev --name add_reward_system', { stdio: 'inherit' });
  
  console.log(`${colors.green}Migration completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error during migration:${colors.reset}`, error.message);
  process.exit(1);
}
