// Script to list all users in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Listing all users in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        userType: true,
        status: true,
        primaryCampusId: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(user);
    });
    
    // Count users by type
    const userTypes = {};
    users.forEach(user => {
      if (!userTypes[user.userType]) {
        userTypes[user.userType] = 0;
      }
      userTypes[user.userType]++;
    });
    
    console.log('\nUser counts by type:');
    Object.entries(userTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    // Count users by status
    const userStatuses = {};
    users.forEach(user => {
      if (!userStatuses[user.status]) {
        userStatuses[user.status] = 0;
      }
      userStatuses[user.status]++;
    });
    
    console.log('\nUser counts by status:');
    Object.entries(userStatuses).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
