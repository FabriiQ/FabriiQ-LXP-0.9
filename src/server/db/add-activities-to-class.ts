import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to add activities directly to a specific class
 */
async function main() {
  const classId = 'cm9mvj67p005gz6rnedsh6jxn'; // The class ID provided by the user
  const activitiesToAdd = 20; // Number of activities to add

  console.log(`Adding ${activitiesToAdd} activities to class ID: ${classId}`);

  try {
    // First, verify the class exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            campus: true,
            programCampus: {
              include: {
                program: true
              }
            }
          }
        }
      }
    });

    if (!classObj) {
      console.error(`Class with ID ${classId} not found.`);
      return;
    }

    console.log(`Found class: ${classObj.name || classObj.code}`);

    // Get subject ID from the class
    const subjectId = await getSubjectIdForClass(classId);
    if (!subjectId) {
      console.error('Could not find subject ID for this class.');
      return;
    }

    console.log(`Found subject ID: ${subjectId}`);

    // Get topics for this subject
    const topics = await prisma.subjectTopic.findMany({
      where: {
        subjectId,
        nodeType: {
          not: 'CHAPTER' // Skip chapter topics
        }
      }
    });

    if (topics.length === 0) {
      console.error('No topics found for this subject.');
      return;
    }

    console.log(`Found ${topics.length} topics for this subject.`);

    // Activity types to create
    const activityTypes = [
      LearningActivityType.MULTIPLE_CHOICE,
      LearningActivityType.TRUE_FALSE,
      LearningActivityType.MULTIPLE_RESPONSE,
      LearningActivityType.FILL_IN_THE_BLANKS,
      LearningActivityType.MATCHING
    ];

    // Create activities
    let createdCount = 0;
    for (let i = 0; i < activitiesToAdd; i++) {
      // Pick a random topic and activity type
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      try {
        // Create activity
        const activity = await prisma.activity.create({
          data: {
            title: `${activityType} Activity - ${topic.title} (${new Date().toISOString().slice(0, 10)})`,
            purpose: ActivityPurpose.LEARNING,
            learningType: activityType,
            status: SystemStatus.ACTIVE,
            subjectId,
            topicId: topic.id,
            classId,
            content: generateActivityContent(activityType, topic.title),
            isGradable: activityType === LearningActivityType.MULTIPLE_CHOICE ||
              activityType === LearningActivityType.TRUE_FALSE ||
              activityType === LearningActivityType.MULTIPLE_RESPONSE ||
              activityType === LearningActivityType.FILL_IN_THE_BLANKS ||
              activityType === LearningActivityType.MATCHING,
            maxScore: 100,
            passingScore: 60
          }
        });

        createdCount++;
        console.log(`Created activity: ${activity.title}`);
      } catch (error) {
        console.error(`Error creating activity:`, error);
      }
    }

    console.log(`Successfully created ${createdCount} activities for class ID: ${classId}`);
  } catch (error) {
    console.error('Error adding activities to class:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get subject ID for a class
async function getSubjectIdForClass(classId: string): Promise<string | null> {
  try {
    // Try to get from activities first (most reliable)
    const activity = await prisma.activity.findFirst({
      where: { classId },
      select: { subjectId: true }
    });

    if (activity?.subjectId) {
      return activity.subjectId;
    }

    // If not found, try to get from course campus
    const classWithCourseCampus = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            course: {
              include: {
                subjects: {
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (classWithCourseCampus?.courseCampus?.course?.subjects?.[0]?.id) {
      return classWithCourseCampus.courseCampus.course.subjects[0].id;
    }

    // If still not found, get the first subject
    const subject = await prisma.subject.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    return subject?.id || null;
  } catch (error) {
    console.error('Error getting subject ID for class:', error);
    return null;
  }
}

// Helper function to generate activity content
function generateActivityContent(activityType: LearningActivityType, topicTitle: string): any {
  // Generate a random ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  switch (activityType) {
    case LearningActivityType.MULTIPLE_CHOICE:
      return {
        activityType: 'multiple-choice',
        instructions: `Read each question carefully and select the best answer about ${topicTitle}.`,
        questions: [
          {
            id: generateId(),
            text: `Question 1 about ${topicTitle}`,
            options: [
              { id: generateId(), text: 'Option A', isCorrect: false },
              { id: generateId(), text: 'Option B', isCorrect: true },
              { id: generateId(), text: 'Option C', isCorrect: false },
              { id: generateId(), text: 'Option D', isCorrect: false }
            ],
            explanation: `Explanation for question 1 about ${topicTitle}`,
            points: 2
          },
          {
            id: generateId(),
            text: `Question 2 about ${topicTitle}`,
            options: [
              { id: generateId(), text: 'Option A', isCorrect: false },
              { id: generateId(), text: 'Option B', isCorrect: false },
              { id: generateId(), text: 'Option C', isCorrect: true },
              { id: generateId(), text: 'Option D', isCorrect: false }
            ],
            explanation: `Explanation for question 2 about ${topicTitle}`,
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

    case LearningActivityType.TRUE_FALSE:
      return {
        activityType: 'true-false',
        instructions: `Determine whether each statement about ${topicTitle} is true or false.`,
        questions: [
          {
            id: generateId(),
            text: `Statement 1 about ${topicTitle}`,
            isTrue: true,
            explanation: `Explanation for statement 1 about ${topicTitle}`,
            points: 1
          },
          {
            id: generateId(),
            text: `Statement 2 about ${topicTitle}`,
            isTrue: false,
            explanation: `Explanation for statement 2 about ${topicTitle}`,
            points: 1
          }
        ],
        shuffleQuestions: false,
        showFeedbackImmediately: true,
        showCorrectAnswers: true,
        passingPercentage: 60,
        attemptsAllowed: 1
      };

    case LearningActivityType.MULTIPLE_RESPONSE:
      return {
        activityType: 'multiple-response',
        instructions: `Select ALL correct answers for each question about ${topicTitle}.`,
        questions: [
          {
            id: generateId(),
            text: `Question 1 about ${topicTitle}`,
            options: [
              { id: generateId(), text: 'Option A', isCorrect: true },
              { id: generateId(), text: 'Option B', isCorrect: false },
              { id: generateId(), text: 'Option C', isCorrect: true },
              { id: generateId(), text: 'Option D', isCorrect: false }
            ],
            explanation: `Explanation for question 1 about ${topicTitle}`,
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

    case LearningActivityType.FILL_IN_THE_BLANKS:
      return {
        activityType: 'fill-in-the-blanks',
        instructions: `Fill in the blanks with the correct answers about ${topicTitle}.`,
        questions: [
          {
            id: generateId(),
            text: `Complete the following sentence about ${topicTitle}:`,
            textWithBlanks: `The [blank1] is an important concept in ${topicTitle} because it helps us understand [blank2].`,
            blanks: [
              {
                id: 'blank1',
                correctAnswers: ['answer1', 'answer one'],
                feedback: 'This is the first key concept.'
              },
              {
                id: 'blank2',
                correctAnswers: ['answer2', 'answer two'],
                feedback: 'This is the second key concept.'
              }
            ],
            explanation: `Explanation for fill-in-the-blanks question about ${topicTitle}`,
            points: 2
          }
        ],
        caseSensitive: false,
        partialCredit: true,
        showFeedbackImmediately: true,
        showCorrectAnswers: true,
        passingPercentage: 60,
        attemptsAllowed: 1
      };

    case LearningActivityType.MATCHING:
      return {
        activityType: 'matching',
        instructions: `Match each item on the left with its corresponding item on the right about ${topicTitle}.`,
        questions: [
          {
            id: generateId(),
            text: `Match the following items related to ${topicTitle}:`,
            pairs: [
              {
                id: generateId(),
                left: `Term 1 for ${topicTitle}`,
                right: `Definition 1 for ${topicTitle}`
              },
              {
                id: generateId(),
                left: `Term 2 for ${topicTitle}`,
                right: `Definition 2 for ${topicTitle}`
              },
              {
                id: generateId(),
                left: `Term 3 for ${topicTitle}`,
                right: `Definition 3 for ${topicTitle}`
              }
            ],
            explanation: `Explanation for matching question about ${topicTitle}`,
            points: 3
          }
        ],
        shufflePairs: true,
        showFeedbackImmediately: true,
        showCorrectAnswers: true,
        passingPercentage: 60,
        attemptsAllowed: 1
      };

    default:
      return {
        activityType: 'multiple-choice',
        instructions: `Default activity about ${topicTitle}.`,
        questions: [
          {
            id: generateId(),
            text: `Question about ${topicTitle}`,
            options: [
              { id: generateId(), text: 'Option A', isCorrect: false },
              { id: generateId(), text: 'Option B', isCorrect: true },
              { id: generateId(), text: 'Option C', isCorrect: false },
              { id: generateId(), text: 'Option D', isCorrect: false }
            ],
            explanation: `Explanation for question about ${topicTitle}`,
            points: 2
          }
        ]
      };
  }
}

// Run the script
main()
  .then(() => {
    console.log('Activities added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during activity creation:', error);
    process.exit(1);
  });
