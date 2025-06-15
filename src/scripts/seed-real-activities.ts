import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType } from '@prisma/client';

/**
 * Script to seed real activities with comprehensive test data
 * This script creates activities with real content for testing all scenarios
 */

const prisma = new PrismaClient();

// Helper function to generate a unique ID for activities
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Multiple Choice Activity Content
const solarSystemMultipleChoiceContent = {
  activityType: 'multiple-choice',
  instructions: 'Read each question carefully and select the best answer about the Solar System.',
  questions: [
    {
      id: generateId(),
      text: "Which planet is known as the Red Planet?",
      options: [
        { id: generateId(), text: "Venus", isCorrect: false, feedback: "Incorrect. Venus is known for its thick atmosphere of carbon dioxide." },
        { id: generateId(), text: "Mars", isCorrect: true, feedback: "Correct! Mars appears red due to iron oxide on its surface." },
        { id: generateId(), text: "Jupiter", isCorrect: false, feedback: "Incorrect. Jupiter is the largest planet in our solar system." },
        { id: generateId(), text: "Saturn", isCorrect: false, feedback: "Incorrect. Saturn is known for its prominent ring system." }
      ],
      explanation: "Mars is called the Red Planet because iron minerals in its soil oxidize, or rust, causing the soil and atmosphere to look red.",
      points: 2,
      media: {
        type: 'image',
        url: 'https://images.nasa.gov/details/PIA00407',
        alt: 'Image of Mars',
        caption: 'Mars, the Red Planet'
      }
    },
    {
      id: generateId(),
      text: "Which is the largest planet in our solar system?",
      options: [
        { id: generateId(), text: "Earth", isCorrect: false, feedback: "Incorrect. Earth is the fifth largest planet." },
        { id: generateId(), text: "Saturn", isCorrect: false, feedback: "Incorrect. Saturn is the second largest planet." },
        { id: generateId(), text: "Jupiter", isCorrect: true, feedback: "Correct! Jupiter is the largest planet in our solar system." },
        { id: generateId(), text: "Neptune", isCorrect: false, feedback: "Incorrect. Neptune is the fourth largest planet." }
      ],
      explanation: "Jupiter is the largest planet in our solar system, with a mass more than 300 times that of Earth.",
      points: 2
    }
  ],
  shuffleQuestions: false,
  shuffleOptions: true,
  showFeedbackImmediately: true,
  showCorrectAnswers: true,
  passingPercentage: 60,
  attemptsAllowed: 1
};

// True/False Activity Content
const scienceTrueFalseContent = {
  activityType: 'true-false',
  instructions: 'Determine whether each statement about Science is true or false.',
  questions: [
    {
      id: generateId(),
      text: "The Earth revolves around the Sun.",
      isTrue: true,
      explanation: "The Earth orbits the Sun in an elliptical path, completing one revolution in approximately 365.25 days.",
      points: 1,
      hint: "Think about the basic structure of our solar system."
    },
    {
      id: generateId(),
      text: "Humans have 8 fingers in total.",
      isTrue: false,
      explanation: "Humans typically have 8 fingers and 2 thumbs, for a total of 10 digits on both hands.",
      points: 1,
      hint: "Count the digits on your hands."
    },
    {
      id: generateId(),
      text: "Water boils at 100 degrees Celsius at sea level.",
      isTrue: true,
      explanation: "At standard atmospheric pressure (sea level), water boils at 100 degrees Celsius (212 degrees Fahrenheit).",
      points: 1,
      media: {
        type: 'image',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Boiling_water_in_pot.jpg/640px-Boiling_water_in_pot.jpg',
        alt: 'Boiling water',
        caption: 'Water boiling at 100°C'
      }
    }
  ],
  shuffleQuestions: true,
  showFeedbackImmediately: true,
  showCorrectAnswers: true,
  passingPercentage: 60,
  attemptsAllowed: 1
};

// Multiple Response Activity Content
const foodMultipleResponseContent = {
  activityType: 'multiple-response',
  instructions: 'Select ALL correct answers for each question about Food and Nutrition.',
  questions: [
    {
      id: generateId(),
      text: "Which of the following are fruits?",
      options: [
        { id: generateId(), text: "Apple", isCorrect: true, feedback: "Correct! Apples are fruits." },
        { id: generateId(), text: "Carrot", isCorrect: false, feedback: "Incorrect. Carrots are vegetables." },
        { id: generateId(), text: "Banana", isCorrect: true, feedback: "Correct! Bananas are fruits." },
        { id: generateId(), text: "Broccoli", isCorrect: false, feedback: "Incorrect. Broccoli is a vegetable." }
      ],
      explanation: "Fruits typically contain seeds and develop from the flower of a plant.",
      points: 2
    },
    {
      id: generateId(),
      text: "Which of the following are vegetables?",
      options: [
        { id: generateId(), text: "Tomato", isCorrect: false, feedback: "Incorrect. Tomatoes are technically fruits, though often used as vegetables in cooking." },
        { id: generateId(), text: "Spinach", isCorrect: true, feedback: "Correct! Spinach is a leafy green vegetable." },
        { id: generateId(), text: "Celery", isCorrect: true, feedback: "Correct! Celery is a vegetable." },
        { id: generateId(), text: "Strawberry", isCorrect: false, feedback: "Incorrect. Strawberries are fruits." }
      ],
      explanation: "Vegetables are parts of plants that are consumed by humans as food as part of a meal.",
      points: 2
    }
  ],
  shuffleQuestions: false,
  shuffleOptions: true,
  showFeedbackImmediately: true,
  showCorrectAnswers: true,
  passingPercentage: 60,
  attemptsAllowed: 1,
  requireAllCorrect: true,
  allowPartialCredit: true
};

// Fill in the Blanks Activity Content
const geographyFillInTheBlanksContent = {
  activityType: 'fill-in-the-blanks',
  instructions: 'Fill in the blanks with the correct answers about Geography.',
  questions: [
    {
      id: generateId(),
      text: "Complete the sentence with the correct capital cities:",
      textWithBlanks: "The capital of France is [blank1] and the capital of Italy is [blank2].",
      blanks: [
        {
          id: 'blank1',
          correctAnswers: ['Paris', 'paris'],
          caseSensitive: false,
          feedback: 'Paris is the capital city of France.'
        },
        {
          id: 'blank2',
          correctAnswers: ['Rome', 'roma', 'rome'],
          caseSensitive: false,
          feedback: 'Rome is the capital city of Italy.'
        }
      ],
      explanation: "Paris is the capital of France, and Rome is the capital of Italy.",
      points: 2,
      partialCredit: true
    },
    {
      id: generateId(),
      text: "Complete the sentence about continents:",
      textWithBlanks: "The largest continent by land area is [blank1] and the smallest continent is [blank2].",
      blanks: [
        {
          id: 'blank1',
          correctAnswers: ['Asia', 'asia'],
          caseSensitive: false,
          feedback: 'Asia is the largest continent by land area.'
        },
        {
          id: 'blank2',
          correctAnswers: ['Australia', 'australia', 'Oceania', 'oceania'],
          caseSensitive: false,
          feedback: 'Australia (or Oceania) is the smallest continent.'
        }
      ],
      explanation: "Asia is the largest continent by land area, and Australia is the smallest continent.",
      points: 2,
      partialCredit: true
    }
  ],
  caseSensitive: false,
  partialCredit: true,
  showFeedbackImmediately: true,
  showCorrectAnswers: true,
  passingPercentage: 60,
  attemptsAllowed: 1
};

// Video Activity Content
const solarSystemVideoContent = {
  activityType: 'video',
  instructions: 'Watch the following video about the Solar System and answer the questions.',
  videoUrl: 'https://www.youtube.com/embed/libKVRa01L8', // Solar System video
  videoTitle: 'Solar System 101 | National Geographic',
  videoDescription: 'How many planets are in the solar system? How did it form in the Milky Way galaxy? Learn facts about the solar system\'s genesis, plus its planets, moons, and asteroids.',
  duration: 248, // 4:08 minutes
  checkpoints: [
    {
      id: generateId(),
      timeInSeconds: 60,
      question: "What is at the center of our solar system?",
      options: [
        { id: generateId(), text: 'Earth', isCorrect: false },
        { id: generateId(), text: 'The Sun', isCorrect: true },
        { id: generateId(), text: 'Jupiter', isCorrect: false },
        { id: generateId(), text: 'The Moon', isCorrect: false }
      ]
    },
    {
      id: generateId(),
      timeInSeconds: 120,
      question: "How many planets are in our solar system?",
      options: [
        { id: generateId(), text: '7', isCorrect: false },
        { id: generateId(), text: '8', isCorrect: true },
        { id: generateId(), text: '9', isCorrect: false },
        { id: generateId(), text: '10', isCorrect: false }
      ]
    }
  ],
  showTranscript: true,
  enableCaptions: true,
  allowPlaybackSpeedControl: true,
  showProgressBar: true
};

// Main function to seed activities
async function seedRealActivities() {
  console.log('Starting to seed real activities...');

  try {
    // Find subjects
    console.log('Finding subjects...');
    const subjects = await prisma.subject.findMany({
      take: 3
    });
    console.log(`Found ${subjects.length} subjects:`, subjects.map(s => s.name));

    if (subjects.length === 0) {
      console.error('No subjects found. Please run the subject seed first.');
      return;
    }

    // Find classes
    console.log('Finding classes...');
    const classes = await prisma.class.findMany({
      take: 2
    });
    console.log(`Found ${classes.length} classes:`, classes.map(c => c.name));

    if (classes.length === 0) {
      console.error('No classes found. Please run the class seed first.');
      return;
    }

    // Find topics
    console.log('Finding topics...');
    let topics = await prisma.subjectTopic.findMany({
      where: {
        subjectId: subjects[0].id
      },
      take: 5
    });

    // If no topics found for the first subject, try to find topics for any subject
    if (topics.length === 0) {
      console.log('No topics found for the first subject. Trying to find topics for any subject...');
      topics = await prisma.subjectTopic.findMany({
        take: 5
      });
    }

    console.log(`Found ${topics.length} topics:`, topics.map(t => t.name));

    if (topics.length === 0) {
      console.error('No topics found. Please run the topic seed first.');
      return;
    }

    // Ensure we have enough topics, or reuse existing ones
    while (topics.length < 5) {
      topics.push(topics[0]);
    }

    // Create Multiple Choice Activity
    console.log('Creating Multiple Choice Activity...');
    const multipleChoiceActivity = await prisma.activity.create({
      data: {
        title: 'Solar System Multiple Choice Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.MULTIPLE_CHOICE,
        status: SystemStatus.ACTIVE,
        subjectId: subjects[0].id,
        topicId: topics[0].id,
        classId: classes[0].id,
        content: solarSystemMultipleChoiceContent,
        isGradable: true
      }
    });
    console.log('Created Multiple Choice Activity with ID:', multipleChoiceActivity.id);

    // Create True/False Activity
    console.log('Creating True/False Activity...');
    const trueFalseActivity = await prisma.activity.create({
      data: {
        title: 'Science True/False Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.TRUE_FALSE,
        status: SystemStatus.ACTIVE,
        subjectId: subjects[0].id,
        topicId: topics[1 % topics.length].id,
        classId: classes[0].id,
        content: scienceTrueFalseContent,
        isGradable: true
      }
    });
    console.log('Created True/False Activity with ID:', trueFalseActivity.id);

    // Create Multiple Response Activity
    console.log('Creating Multiple Response Activity...');
    const multipleResponseActivity = await prisma.activity.create({
      data: {
        title: 'Food and Nutrition Multiple Response Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.MULTIPLE_RESPONSE,
        status: SystemStatus.ACTIVE,
        subjectId: subjects.length > 1 ? subjects[1].id : subjects[0].id,
        topicId: topics[2 % topics.length].id,
        classId: classes[0].id,
        content: foodMultipleResponseContent,
        isGradable: true
      }
    });
    console.log('Created Multiple Response Activity with ID:', multipleResponseActivity.id);

    // Create Fill in the Blanks Activity
    console.log('Creating Fill in the Blanks Activity...');
    const fillInTheBlanksActivity = await prisma.activity.create({
      data: {
        title: 'Geography Fill in the Blanks Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.FILL_IN_THE_BLANKS,
        status: SystemStatus.ACTIVE,
        subjectId: subjects.length > 1 ? subjects[1].id : subjects[0].id,
        topicId: topics[3 % topics.length].id,
        classId: classes[0].id,
        content: geographyFillInTheBlanksContent,
        isGradable: true
      }
    });
    console.log('Created Fill in the Blanks Activity with ID:', fillInTheBlanksActivity.id);

    // Create Video Activity
    console.log('Creating Video Activity...');
    const videoActivity = await prisma.activity.create({
      data: {
        title: 'Solar System Video Activity',
        purpose: ActivityPurpose.LEARNING,
        learningType: LearningActivityType.VIDEO,
        status: SystemStatus.ACTIVE,
        subjectId: subjects.length > 2 ? subjects[2].id : subjects[0].id,
        topicId: topics[4 % topics.length].id,
        classId: classes[0].id,
        content: solarSystemVideoContent,
        isGradable: false
      }
    });
    console.log('Created Video Activity with ID:', videoActivity.id);

    // Count total activities
    const totalActivities = await prisma.activity.count();
    console.log(`Total activities in database: ${totalActivities}`);

    console.log('Real activities seeded successfully!');
  } catch (error) {
    console.error('Error seeding real activities:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRealActivities()
  .then(() => {
    console.log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
