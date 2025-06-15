/**
 * Development Authentication Helper
 * 
 * This script helps to set up authentication for development mode.
 * It creates a cookie to bypass authentication or sets environment variables.
 * 
 * Usage:
 * 1. Run the script with: node scripts/dev-auth.js
 * 2. Follow the prompts to set up development authentication
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔐 Development Authentication Helper 🔐\n');
  console.log('This script helps you set up authentication for development mode.\n');

  const choice = await promptChoice(
    'What would you like to do?',
    [
      'Create a development session cookie',
      'Set up environment variables for authentication',
      'List active sessions',
      'Exit'
    ]
  );

  switch (choice) {
    case 0:
      await createDevSessionCookie();
      break;
    case 1:
      await setupEnvironmentVariables();
      break;
    case 2:
      await listActiveSessions();
      break;
    case 3:
      console.log('Exiting...');
      break;
  }

  rl.close();
}

async function promptChoice(question, options) {
  console.log(question);
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });

  return new Promise((resolve) => {
    rl.question('Enter your choice (number): ', (answer) => {
      const choice = parseInt(answer) - 1;
      if (choice >= 0 && choice < options.length) {
        resolve(choice);
      } else {
        console.log('Invalid choice, please try again.');
        resolve(promptChoice(question, options));
      }
    });
  });
}

async function listActiveSessions() {
  console.log('\n🔍 Listing active sessions...\n');

  try {
    const sessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (sessions.length === 0) {
      console.log('No active sessions found.');
      return;
    }

    console.log('Recent active sessions:');
    sessions.forEach((session, index) => {
      console.log(`\n[${index + 1}] Session ID: ${session.id}`);
      console.log(`User: ${session.user.name} (${session.user.email})`);
      console.log(`User Type: ${session.user.userType}`);
      console.log(`Expires: ${new Date(session.expires).toLocaleString()}`);
    });

    const sessionChoice = await promptChoice(
      '\nWhich session would you like to use for development?',
      [...sessions.map((s, i) => `Session ${i + 1}: ${s.user.name}`), 'None']
    );

    if (sessionChoice < sessions.length) {
      const selectedSession = sessions[sessionChoice];
      await updateEnvWithSession(selectedSession.id);
      console.log(`\n✅ Environment variable set for ${selectedSession.user.name}'s session.`);
    } else {
      console.log('\nNo session selected.');
    }
  } catch (error) {
    console.error('Error listing sessions:', error);
  }
}

async function createDevSessionCookie() {
  console.log('\n🍪 Creating development session cookie...\n');
  
  console.log('This will create a script that you can run in your browser console');
  console.log('to set a cookie that bypasses authentication checks.\n');
  
  const cookieScript = `
// Run this in your browser console when on localhost:3000
document.cookie = "dev_bypass_auth=true; path=/; max-age=3600";
console.log("Development auth bypass cookie set!");
  `.trim();
  
  console.log('Copy and paste this into your browser console:');
  console.log('\n```');
  console.log(cookieScript);
  console.log('```\n');
  
  console.log('⚠️ Warning: This bypasses authentication but does NOT provide a user context.');
  console.log('You may still see errors if your code relies on user information.');
}

async function setupEnvironmentVariables() {
  console.log('\n🔧 Setting up environment variables...\n');
  
  console.log('This will update your .env.local file with DEV_SESSION_ID.\n');
  
  // Check if user wants to manually enter a session ID
  const choice = await promptChoice(
    'How would you like to set up DEV_SESSION_ID?',
    [
      'List active sessions to choose from',
      'Enter a session ID manually',
      'Go back'
    ]
  );
  
  switch (choice) {
    case 0:
      await listActiveSessions();
      break;
    case 1:
      await manuallyEnterSessionId();
      break;
    case 2:
      await main();
      break;
  }
}

async function manuallyEnterSessionId() {
  return new Promise((resolve) => {
    rl.question('Enter the session ID: ', async (sessionId) => {
      if (!sessionId.trim()) {
        console.log('Session ID cannot be empty. Please try again.');
        resolve(await manuallyEnterSessionId());
        return;
      }
      
      await updateEnvWithSession(sessionId.trim());
      console.log(`\n✅ Environment variable DEV_SESSION_ID set to: ${sessionId.trim()}`);
      resolve();
    });
  });
}

async function updateEnvWithSession(sessionId) {
  // Read existing .env.local or create a new one
  let envContent = '';
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  } catch (error) {
    console.log('Creating new .env.local file');
  }
  
  // Update or add DEV_SESSION_ID
  if (envContent.includes('DEV_SESSION_ID=')) {
    // Replace existing value
    envContent = envContent.replace(
      /DEV_SESSION_ID=.*/,
      `DEV_SESSION_ID="${sessionId}"`
    );
  } else {
    // Add new value
    envContent += `\nDEV_SESSION_ID="${sessionId}"\n`;
  }
  
  // Write to .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('Updated .env.local with DEV_SESSION_ID');
  console.log('You will need to restart your Next.js development server for changes to take effect.');
}

async function cleanupSessions() {
  console.log('\n🧹 Cleaning up multiple sessions...\n');
  
  try {
    // Keep only the most recent session per user
    const result = await prisma.$transaction([
      prisma.session.groupBy({
        by: ['userId'],
        _max: {
          createdAt: true
        }
      }),
      prisma.session.deleteMany({
        where: {
          NOT: {
            id: {
              in: (await prisma.session.findMany({
                orderBy: { createdAt: 'desc' },
                distinct: ['userId'],
                select: { id: true }
              })).map(s => s.id)
            }
          }
        }
      })
    ]);
    
    console.log(`Cleaned up ${result[1].count} old sessions`);
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
