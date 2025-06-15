const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateActivityTypes() {
  console.log('Updating activity types in the database...');

  try {
    // Get all activities
    const activities = await prisma.activity.findMany();
    console.log(`Found ${activities.length} activities to update`);

    // Update each activity based on its content structure
    for (const activity of activities) {
      let activityType = 'unknown';
      const content = activity.content as any;

      // Determine activity type based on content structure
      if (content) {
        if (content.questions && Array.isArray(content.questions) && content.questions.length > 0) {
          // Check if it's a multiple-choice activity
          if (content.questions[0].options) {
            activityType = 'multiple-choice';
          }
          // Check if it's a true-false activity
          else if (content.questions[0].answer === true || content.questions[0].answer === false) {
            activityType = 'true-false';
          }
          // Check if it's a fill-in-the-blanks activity
          else if (content.questions[0].blanks || content.questions[0].text?.includes('___')) {
            activityType = 'fill-in-the-blanks';
          }
        }
        // Check if it's a matching activity
        else if (content.pairs && Array.isArray(content.pairs)) {
          activityType = 'matching';
        }
        // Check if it's a drag-and-drop activity
        else if (content.items && content.targets) {
          activityType = 'drag-and-drop';
        }
        // Check if it's a sequence activity
        else if (content.sequences && Array.isArray(content.sequences)) {
          activityType = 'sequence';
        }
        // Check if it's a document activity
        else if (content.document) {
          activityType = 'document';
        }
        // Check if it's a project activity
        else if (content.requirements && Array.isArray(content.requirements)) {
          activityType = 'project';
        }
        // Check if it's a drag-the-words activity
        else if (content.questions && content.questions[0]?.textWithBlanks) {
          activityType = 'drag-the-words';
        }
      }

      // Update the activity with the determined type
      const updatedContent = { ...content, activityType };
      await prisma.activity.update({
        where: { id: activity.id },
        data: { content: updatedContent },
      });

      console.log(`Updated activity ${activity.id} with type: ${activityType}`);
    }

    console.log('All activities updated successfully!');
  } catch (error) {
    console.error('Error updating activity types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateActivityTypes()
  .then(() => console.log('Update completed'))
  .catch((error) => console.error('Update failed:', error));
