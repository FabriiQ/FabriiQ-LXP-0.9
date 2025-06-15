// Debug script to check student login issues
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Try to find the user by username
    console.log("Searching for user with username 'Ahmad@example.com'...");
    const userByUsername = await prisma.user.findFirst({
      where: { 
        username: 'Ahmad@example.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        primaryCampusId: true,
        studentProfile: true
      }
    });
    
    console.log("User by username:", userByUsername ? JSON.stringify(userByUsername, null, 2) : "Not found");
    
    // Try to find by email as well
    console.log("\nSearching for user with email 'Ahmad@example.com'...");
    const userByEmail = await prisma.user.findFirst({
      where: { 
        email: 'Ahmad@example.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        primaryCampusId: true,
        studentProfile: true
      }
    });
    
    console.log("User by email:", userByEmail ? JSON.stringify(userByEmail, null, 2) : "Not found");
    
    // Check if there's any student with name containing Ahmad
    console.log("\nSearching for users with name containing 'Ahmad'...");
    const usersByName = await prisma.user.findMany({
      where: {
        name: {
          contains: 'Ahmad',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        primaryCampusId: true,
        studentProfile: true
      }
    });
    
    console.log("Users by name:", usersByName.length > 0 ? JSON.stringify(usersByName, null, 2) : "None found");
    
    // Check all CAMPUS_STUDENT users
    console.log("\nListing all CAMPUS_STUDENT users...");
    const allStudents = await prisma.user.findMany({
      where: {
        userType: 'CAMPUS_STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        primaryCampusId: true,
        studentProfile: true
      },
      take: 5 // Limit to 5 results
    });
    
    console.log("CAMPUS_STUDENT users:", allStudents.length > 0 ? JSON.stringify(allStudents, null, 2) : "None found");
    
    // Check if there are any users with a different student type
    console.log("\nChecking for users with 'STUDENT' userType (not CAMPUS_STUDENT)...");
    const nonCampusStudents = await prisma.user.findMany({
      where: {
        userType: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        primaryCampusId: true,
        studentProfile: true
      }
    });
    
    console.log("STUDENT users:", nonCampusStudents.length > 0 ? JSON.stringify(nonCampusStudents, null, 2) : "None found");
    
    // Check the user with ID from the dashboard
    if (process.argv.length > 2) {
      const userId = process.argv[2];
      console.log(`\nLooking up user with ID: ${userId}`);
      const userById = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          userType: true,
          primaryCampusId: true,
          studentProfile: true
        }
      });
      
      console.log("User by ID:", userById ? JSON.stringify(userById, null, 2) : "Not found");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
