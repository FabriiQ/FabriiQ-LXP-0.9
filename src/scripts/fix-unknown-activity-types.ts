const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

async function fixUnknownActivityTypes() {
  console.log('Fixing unknown activity types in the database...');

  try {
    // Get all activities with activityType "unknown"
    const activities = await prismaClient.activity.findMany({
      where: {
        content: {
          path: ['activityType'],
          equals: 'unknown'
        }
      }
    });

    console.log(`Found ${activities.length} activities with unknown type to fix`);

    // Update each activity based on its content structure
    for (const activity of activities) {
      let activityType = 'unknown';
      const content = activity.content as any;

      // Determine activity type based on content structure
      if (content) {
        // Check if it's a drag-the-words activity
        if (content.questions && content.questions[0]?.textWithBlanks) {
          activityType = 'drag-the-words';
        }
        // Check if it's a multiple-choice activity
        else if (content.questions && Array.isArray(content.questions) && content.questions.length > 0 && content.questions[0].options) {
          activityType = 'multiple-choice';
        }
        // Check if it's a true-false activity
        else if (content.questions && Array.isArray(content.questions) && content.questions.length > 0 && 
                (content.questions[0].answer === true || content.questions[0].answer === false)) {
          activityType = 'true-false';
        }
        // Check if it's a fill-in-the-blanks activity
        else if (content.questions && Array.isArray(content.questions) && content.questions.length > 0 && 
                (content.questions[0].blanks || content.questions[0].text?.includes('___'))) {
          activityType = 'fill-in-the-blanks';
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
      }

      // Update the activity with the determined type
      const updatedContent = { ...content, activityType };
      await prismaClient.activity.update({
        where: { id: activity.id },
        data: { content: updatedContent },
      });

      console.log(`Updated activity ${activity.id} from "unknown" to "${activityType}"`);
    }

    console.log('All unknown activity types fixed successfully!');
  } catch (error) {
    console.error('Error fixing unknown activity types:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the update function
fixUnknownActivityTypes()
  .then(() => console.log('Fix completed'))
  .catch((error) => console.error('Fix failed:', error));
