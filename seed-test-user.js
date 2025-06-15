// Script to create a test user for login
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'ahmad' },
          { email: 'ahmad@example.com' }
        ]
      }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser);
      
      // Update user status to ACTIVE
      if (existingUser.status !== 'ACTIVE') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { status: 'ACTIVE' }
        });
        console.log('User status updated to ACTIVE');
      }
      
      // Update password
      const hashedPassword = await hash('password123', 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      });
      console.log('User password updated');
      
      return;
    }

    // Create a new user
    const hashedPassword = await hash('password123', 10);
    const newUser = await prisma.user.create({
      data: {
        name: 'Ahmad Ali',
        email: 'ahmad@example.com',
        username: 'ahmad',
        password: hashedPassword,
        userType: 'STUDENT',
        status: 'ACTIVE'
      }
    });

    console.log('New user created:', newUser);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
