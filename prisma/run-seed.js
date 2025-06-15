const { execSync } = require('child_process');

try {
  console.log('Running seed script...');
  execSync('ts-node --project prisma/tsconfig.json prisma/seed.ts', { stdio: 'inherit' });
  console.log('Seed completed successfully!');
} catch (error) {
  console.error('Error running seed:', error);
  process.exit(1);
}
