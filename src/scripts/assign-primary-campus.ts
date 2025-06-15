const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script to assign primary campuses to users who don't have one
 * This is useful for existing users who need a primary campus
 */
async function assignPrimaryCampuses() {
  try {
    console.log('Starting primary campus assignment...');

    // Find all users without a primary campus who have active campus access
    const usersWithoutPrimaryCampus = await prisma.user.findMany({
      where: {
        primaryCampusId: null,
        activeCampuses: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        userType: true,
        activeCampuses: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            campusId: true,
            status: true
          }
        }
      }
    });

    console.log(`Found ${usersWithoutPrimaryCampus.length} users without a primary campus`);

    // Assign primary campus to each user
    for (const user of usersWithoutPrimaryCampus) {
      if (user.activeCampuses.length > 0) {
        const primaryCampusId = user.activeCampuses[0].campusId;
        
        await prisma.user.update({
          where: { id: user.id },
          data: { primaryCampusId }
        });
        
        console.log(`Assigned primary campus ${primaryCampusId} to user ${user.id} (${user.name})`);
      } else {
        console.log(`User ${user.id} (${user.name}) has no active campuses to assign`);
      }
    }

    console.log('Primary campus assignment completed successfully');
  } catch (error) {
    console.error('Error assigning primary campuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
assignPrimaryCampuses()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 