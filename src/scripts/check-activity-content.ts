const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

async function checkActivityContent() {
  try {
    // Get a specific activity to check
    const activityId = 'cm9o6536w00brk9l3mfv0wzkk'; // The matching activity you mentioned
    const activity = await prismaClient.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      console.log(`Activity with ID ${activityId} not found`);
      return;
    }

    // Log the activity content
    console.log('Activity content:');
    console.log(JSON.stringify(activity.content, null, 2));

    // Check if activityType exists in the content
    const content = activity.content as any;
    if (content && content.activityType) {
      console.log(`\nActivity type: ${content.activityType}`);
    } else {
      console.log('\nNo activityType found in content');
    }

    // Now let's try to update it directly with a specific activityType
    const updatedContent = { ...content, activityType: 'matching' };
    
    // Update the activity with the new content
    const updatedActivity = await prismaClient.activity.update({
      where: { id: activityId },
      data: { content: updatedContent }
    });

    console.log('\nActivity updated successfully');
    console.log('Updated content:');
    console.log(JSON.stringify(updatedActivity.content, null, 2));

  } catch (error) {
    console.error('Error checking activity content:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the function
checkActivityContent()
  .then(() => console.log('Check completed'))
  .catch((error) => console.error('Check failed:', error));
