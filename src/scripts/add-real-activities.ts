import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to generate a unique ID
function generateId() {
  return uuidv4();
}

async function addRealActivities() {
  console.log('Starting to add real activities...');

  try {
    // Get first class
    const firstClass = await prisma.class.findFirst();
    if (!firstClass) {
      console.error('No classes found in the database');
      return;
    }
    console.log(`Using class: ${firstClass.name} (${firstClass.id})`);

    // Get first subject
    const firstSubject = await prisma.subject.findFirst();
    if (!firstSubject) {
      console.error('No subjects found in the database');
      return;
    }
    console.log(`Using subject: ${firstSubject.name} (${firstSubject.id})`);

    // Get first topic
    const firstTopic = await prisma.subjectTopic.findFirst({
      where: { subjectId: firstSubject.id }
    });
    if (!firstTopic) {
      console.error('No topics found for the subject');
      return;
    }
    console.log(`Using topic: ${firstTopic.name} (${firstTopic.id})`);

    // 1. Multiple Choice Activity
    const multipleChoiceActivity = await prisma.activity.create({
      data: {
        title: 'Solar System Multiple Choice Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.MULTIPLE_CHOICE,
        status: SystemStatus.ACTIVE,
        subjectId: firstSubject.id,
        topicId: firstTopic.id,
        classId: firstClass.id,
        content: {
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
              points: 2
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
        },
        isGradable: true
      }
    });
    console.log(`Created Multiple Choice Activity: ${multipleChoiceActivity.id}`);

    // 2. True/False Activity
    const trueFalseActivity = await prisma.activity.create({
      data: {
        title: 'Science True/False Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.TRUE_FALSE,
        status: SystemStatus.ACTIVE,
        subjectId: firstSubject.id,
        topicId: firstTopic.id,
        classId: firstClass.id,
        content: {
          activityType: 'true-false',
          instructions: 'Determine whether each statement about Science is true or false.',
          questions: [
            {
              id: generateId(),
              text: "The Earth revolves around the Sun.",
              isTrue: true,
              explanation: "The Earth orbits the Sun in an elliptical path, completing one revolution in approximately 365.25 days.",
              points: 1
            },
            {
              id: generateId(),
              text: "Humans have 8 fingers in total.",
              isTrue: false,
              explanation: "Humans typically have 8 fingers and 2 thumbs, for a total of 10 digits on both hands.",
              points: 1
            },
            {
              id: generateId(),
              text: "Water boils at 100 degrees Celsius at sea level.",
              isTrue: true,
              explanation: "At standard atmospheric pressure (sea level), water boils at 100 degrees Celsius (212 degrees Fahrenheit).",
              points: 1
            }
          ],
          shuffleQuestions: true,
          showFeedbackImmediately: true,
          showCorrectAnswers: true,
          passingPercentage: 60,
          attemptsAllowed: 1
        },
        isGradable: true
      }
    });
    console.log(`Created True/False Activity: ${trueFalseActivity.id}`);

    // 3. Multiple Response Activity
    const multipleResponseActivity = await prisma.activity.create({
      data: {
        title: 'Food and Nutrition Multiple Response Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.MULTIPLE_RESPONSE,
        status: SystemStatus.ACTIVE,
        subjectId: firstSubject.id,
        topicId: firstTopic.id,
        classId: firstClass.id,
        content: {
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
        },
        isGradable: true
      }
    });
    console.log(`Created Multiple Response Activity: ${multipleResponseActivity.id}`);

    // 4. Fill in the Blanks Activity
    const fillInTheBlanksActivity = await prisma.activity.create({
      data: {
        title: 'Geography Fill in the Blanks Quiz',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.FILL_IN_THE_BLANKS,
        status: SystemStatus.ACTIVE,
        subjectId: firstSubject.id,
        topicId: firstTopic.id,
        classId: firstClass.id,
        content: {
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
              points: 2
            }
          ],
          caseSensitive: false,
          partialCredit: true,
          showFeedbackImmediately: true,
          showCorrectAnswers: true,
          passingPercentage: 60,
          attemptsAllowed: 1
        },
        isGradable: true
      }
    });
    console.log(`Created Fill in the Blanks Activity: ${fillInTheBlanksActivity.id}`);

    // 5. Video Activity
    const videoActivity = await prisma.activity.create({
      data: {
        title: 'Solar System Video Activity',
        purpose: ActivityPurpose.LEARNING,
        learningType: LearningActivityType.VIDEO,
        status: SystemStatus.ACTIVE,
        subjectId: firstSubject.id,
        topicId: firstTopic.id,
        classId: firstClass.id,
        content: {
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
        },
        isGradable: false
      }
    });
    console.log(`Created Video Activity: ${videoActivity.id}`);

    // Count total activities
    const totalActivities = await prisma.activity.count();
    console.log(`Total activities in database: ${totalActivities}`);

    console.log('Real activities added successfully!');
  } catch (error) {
    console.error('Error adding real activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addRealActivities()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
