import { PrismaClient, SystemStatus } from '@prisma/client';

export const activityTypesSeedData = [
  {
    id: 'reading',
    name: 'Reading Activity',
    description: 'Text-based reading materials with optional checkpoints',
    purpose: 'LEARNING',
    capabilities: {
      isGradable: false,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'video',
    name: 'Video Activity',
    description: 'Share video content with optional interactions',
    purpose: 'LEARNING',
    capabilities: {
      isGradable: false,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'h5p',
    name: 'H5P Activity',
    description: 'Create interactive H5P content for learners',
    purpose: 'LEARNING',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'book',
    name: 'Book Activity',
    description: 'Interactive book with reading sections and embedded activity checkpoints',
    purpose: 'LEARNING',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'multiple-choice',
    name: 'Multiple Choice Quiz',
    description: 'Create a quiz with multiple choice questions where only one answer is correct for each question',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'multiple-response',
    name: 'Multiple Response Quiz',
    description: 'Create a question with multiple options where students select all correct answers',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'true-false',
    name: 'True/False Quiz',
    description: 'Create a quiz with multiple statements that students must identify as true or false',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'fill-in-the-blanks',
    name: 'Fill in the Blanks Quiz',
    description: 'Create a quiz with multiple text passages containing blanks that students must complete',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'drag-the-words',
    name: 'Drag the Words',
    description: 'Create an activity where students drag words to fill in blanks in a text',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'matching',
    name: 'Matching Activity',
    description: 'Create a matching activity where students match items from two columns',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
    },
    status: SystemStatus.ACTIVE,
  },
  {
    id: 'quiz',
    name: 'Interactive Quiz',
    description: 'Create interactive quizzes with various question types including multiple choice, matching, drag-and-drop, hotspot, and more',
    purpose: 'ASSESSMENT',
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      questionTypes: [
        'multiple-choice', 'multiple-answer', 'short-answer', 'true-false',
        'fill-in-the-blanks', 'matching', 'sequence', 'hotspot',
        'drag-and-drop', 'drag-the-words', 'drop-down', 'numeric',
        'likert-scale', 'essay'
      ]
    },
    status: SystemStatus.ACTIVE,
  },
];

export async function seedActivityTypes(prisma: PrismaClient) {
  console.log('Seeding activity types...');

  try {
    // Check if we have an Activity model
    const activityModel = prisma.activity;

    if (activityModel) {
      // Store activity types in the database
      // This is a placeholder - in a real implementation, you would:
      // 1. Check if there's a table for activity types
      // 2. If it exists, upsert the activity types

      // For now, we'll just log that we would seed these
      console.log(`Would seed ${activityTypesSeedData.length} activity types`);
    } else {
      console.log('Activity model not found. Skipping activity type seeding.');
    }

    // Return the activity types for reference in other seed files
    return activityTypesSeedData;
  } catch (error) {
    console.error('Error seeding activity types:', error);
    // If there's an error, just return the data
    console.log(`Returning ${activityTypesSeedData.length} activity types without storing`);
    return activityTypesSeedData;
  }
}
