import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType } from '@prisma/client';
import { solarSystemBookActivity } from '../../features/activties/seed/book-solar-system';

const prisma = new PrismaClient();

// Helper function to generate a unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Script to add real activities with comprehensive test data
 */
async function main() {
  const classId = 'cm9mvj67p005gz6rnedsh6jxn'; // The class ID provided by the user

  console.log(`Checking activities for class ID: ${classId}`);

  try {
    // First, verify the class exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classObj) {
      console.error(`Class with ID ${classId} not found.`);
      return;
    }

    console.log(`Found class: ${classObj.name || classObj.code}`);

    // Count activities for this class
    const activitiesCount = await prisma.activity.count({
      where: { classId }
    });

    console.log(`Total activities for this class: ${activitiesCount}`);

    // If there are already activities, we'll use one to get the subject ID
    if (activitiesCount > 0) {
      const existingActivity = await prisma.activity.findFirst({
        where: { classId },
        select: { subjectId: true, topicId: true }
      });

      if (existingActivity) {
        console.log(`Found existing activity with subject ID: ${existingActivity.subjectId}`);
        console.log(`Found existing activity with topic ID: ${existingActivity.topicId}`);

        // 1. Multiple Choice Activity - Solar System
        await prisma.activity.create({
          data: {
            title: 'Solar System Multiple Choice Quiz',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.MULTIPLE_CHOICE,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
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
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 1: Solar System Multiple Choice Quiz`);

        // 2. True/False Activity - Science Facts
        await prisma.activity.create({
          data: {
            title: 'Science True/False Quiz',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.TRUE_FALSE,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
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
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 2: Science True/False Quiz`);

        // 3. Multiple Response Activity - Food and Nutrition
        await prisma.activity.create({
          data: {
            title: 'Food and Nutrition Multiple Response Quiz',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.MULTIPLE_RESPONSE,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
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
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 3: Food and Nutrition Multiple Response Quiz`);

        // 4. Fill in the Blanks Activity - Geography
        await prisma.activity.create({
          data: {
            title: 'Geography Fill in the Blanks Quiz',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.FILL_IN_THE_BLANKS,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
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
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 4: Geography Fill in the Blanks Quiz`);

        // 5. Video Activity - Solar System
        await prisma.activity.create({
          data: {
            title: 'Solar System Video Activity',
            purpose: ActivityPurpose.LEARNING,
            learningType: LearningActivityType.VIDEO,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
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
            isGradable: false,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 5: Solar System Video Activity`);

        // 6. Matching Activity - Countries and Capitals
        await prisma.activity.create({
          data: {
            title: 'Countries and Capitals Matching Activity',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.MATCHING,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'matching',
              instructions: 'Match each country with its capital city.',
              questions: [
                {
                  id: generateId(),
                  title: "Match Countries with Capitals",
                  pairs: [
                    {
                      id: generateId(),
                      left: "United States",
                      right: "Washington D.C.",
                      feedback: "Washington D.C. is the capital of the United States."
                    },
                    {
                      id: generateId(),
                      left: "Japan",
                      right: "Tokyo",
                      feedback: "Tokyo is the capital of Japan."
                    },
                    {
                      id: generateId(),
                      left: "France",
                      right: "Paris",
                      feedback: "Paris is the capital of France."
                    },
                    {
                      id: generateId(),
                      left: "Australia",
                      right: "Canberra",
                      feedback: "Canberra is the capital of Australia, not Sydney."
                    }
                  ],
                  explanation: "Capitals are the cities where a country's government is located.",
                  points: 4
                }
              ],
              shufflePairs: true,
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 6: Countries and Capitals Matching Activity`);

        // 7. Drag and Drop Activity - Animal Classification
        await prisma.activity.create({
          data: {
            title: 'Animal Classification Drag and Drop Activity',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.DRAG_AND_DROP,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'drag-and-drop',
              instructions: 'Drag each animal to its correct classification zone.',
              questions: [
                {
                  id: generateId(),
                  title: "Classify Animals",
                  items: [
                    {
                      id: "i1",
                      text: "Lion",
                      correctZoneId: "z1",
                      feedback: "Lions are mammals."
                    },
                    {
                      id: "i2",
                      text: "Eagle",
                      correctZoneId: "z2",
                      feedback: "Eagles are birds."
                    },
                    {
                      id: "i3",
                      text: "Dolphin",
                      correctZoneId: "z1",
                      feedback: "Dolphins are mammals."
                    },
                    {
                      id: "i4",
                      text: "Penguin",
                      correctZoneId: "z2",
                      feedback: "Penguins are birds."
                    }
                  ],
                  zones: [
                    {
                      id: "z1",
                      text: "Mammals",
                      description: "Warm-blooded animals that have hair/fur and feed milk to their young"
                    },
                    {
                      id: "z2",
                      text: "Birds",
                      description: "Warm-blooded animals with feathers, wings, and lay eggs"
                    }
                  ],
                  explanation: "Animals are classified based on their physical characteristics and behaviors.",
                  points: 4
                }
              ],
              shuffleItems: true,
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              snapToGrid: true,
              showItemsInColumn: true,
              allowMultipleItemsPerZone: true
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 7: Animal Classification Drag and Drop Activity`);

        // 8. Numeric Activity - Math Problems
        await prisma.activity.create({
          data: {
            title: 'Math Problems Numeric Activity',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.NUMERIC,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'numeric',
              instructions: 'Solve each math problem and enter the numeric answer.',
              questions: [
                {
                  id: generateId(),
                  text: "What is 7 × 8?",
                  correctAnswer: 56,
                  tolerance: 0,
                  unit: "",
                  explanation: "7 × 8 = 56",
                  points: 1
                },
                {
                  id: generateId(),
                  text: "What is the approximate value of π (pi) to 2 decimal places?",
                  correctAnswer: 3.14,
                  tolerance: 0.01,
                  unit: "",
                  explanation: "The value of π is approximately 3.14159..., which rounds to 3.14 to 2 decimal places.",
                  points: 1
                },
                {
                  id: generateId(),
                  text: "If a rectangle has a length of 12 cm and a width of 5 cm, what is its area in square centimeters?",
                  correctAnswer: 60,
                  tolerance: 0,
                  unit: "cm²",
                  explanation: "Area of a rectangle = length × width = 12 cm × 5 cm = 60 cm²",
                  points: 2
                }
              ],
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 8: Math Problems Numeric Activity`);

        // 9. Multiple Choice with Media
        await prisma.activity.create({
          data: {
            title: 'Solar System Multiple Choice with Images',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.MULTIPLE_CHOICE,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'multiple-choice',
              instructions: 'Look at the images and select the correct answer for each question.',
              questions: [
                {
                  id: generateId(),
                  text: "Which planet is shown in this image?",
                  options: [
                    { id: generateId(), text: "Venus", isCorrect: false, feedback: "Incorrect. This is not Venus." },
                    { id: generateId(), text: "Mars", isCorrect: true, feedback: "Correct! This is Mars, the Red Planet." },
                    { id: generateId(), text: "Jupiter", isCorrect: false, feedback: "Incorrect. Jupiter has a prominent Great Red Spot." },
                    { id: generateId(), text: "Saturn", isCorrect: false, feedback: "Incorrect. Saturn has distinctive rings." }
                  ],
                  explanation: "The image shows Mars, recognizable by its reddish appearance.",
                  points: 2,
                  media: {
                    type: 'image',
                    url: 'https://science.nasa.gov/wp-content/uploads/2023/05/PIA24546-1.jpg',
                    alt: 'Image of Mars',
                    caption: 'Mars, the Red Planet'
                  }
                },
                {
                  id: generateId(),
                  text: "What celestial body is shown in this image?",
                  options: [
                    { id: generateId(), text: "The Moon", isCorrect: false, feedback: "Incorrect. The Moon doesn't have rings." },
                    { id: generateId(), text: "Jupiter", isCorrect: false, feedback: "Incorrect. Jupiter has different colored bands but not prominent rings." },
                    { id: generateId(), text: "Saturn", isCorrect: true, feedback: "Correct! Saturn is known for its distinctive ring system." },
                    { id: generateId(), text: "Uranus", isCorrect: false, feedback: "Incorrect. Uranus has rings, but they're not as prominent as those shown." }
                  ],
                  explanation: "The image shows Saturn, which is famous for its beautiful and extensive ring system.",
                  points: 2,
                  media: {
                    type: 'image',
                    url: 'https://science.nasa.gov/wp-content/uploads/2023/05/PIA01364.jpg',
                    alt: 'Image of Saturn',
                    caption: 'Saturn and its ring system'
                  }
                }
              ],
              shuffleQuestions: false,
              shuffleOptions: true,
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 9: Solar System Multiple Choice with Images`);

        // 10. Matching with Media
        await prisma.activity.create({
          data: {
            title: 'Animal Images Matching Activity',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.MATCHING,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'matching',
              instructions: 'Match each animal name with its correct image.',
              questions: [
                {
                  id: generateId(),
                  title: "Match Animals with Their Images",
                  pairs: [
                    {
                      id: generateId(),
                      left: "Lion",
                      right: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/440px-Lion_waiting_in_Namibia.jpg",
                      rightIsMedia: true,
                      feedback: "The lion is a large cat of the genus Panthera."
                    },
                    {
                      id: generateId(),
                      left: "Eagle",
                      right: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/About_to_Launch_%2826075320352%29.jpg/440px-About_to_Launch_%2826075320352%29.jpg",
                      rightIsMedia: true,
                      feedback: "Eagles are large birds of prey with powerful vision."
                    },
                    {
                      id: generateId(),
                      left: "Dolphin",
                      right: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tursiops_truncatus_01.jpg/440px-Tursiops_truncatus_01.jpg",
                      rightIsMedia: true,
                      feedback: "Dolphins are marine mammals known for their intelligence."
                    }
                  ],
                  explanation: "Matching animals with their images helps in visual recognition and classification.",
                  points: 3
                }
              ],
              shufflePairs: true,
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 10: Animal Images Matching Activity`);

        // 11. Drag the Words Activity
        await prisma.activity.create({
          data: {
            title: 'Solar System Drag the Words Activity',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.DRAG_THE_WORDS,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'drag-the-words',
              instructions: 'Drag the words to their correct positions in the sentences.',
              questions: [
                {
                  id: generateId(),
                  text: "Complete the sentence about our solar system:",
                  sentence: "The *Sun* is at the center of our solar system, and *Earth* is the third planet from the Sun. *Mars* is known as the Red Planet.",
                  explanation: "The Sun is at the center of our solar system, Earth is the third planet, and Mars is known as the Red Planet due to its reddish appearance.",
                  points: 3
                },
                {
                  id: generateId(),
                  text: "Complete the sentence about planets:",
                  sentence: "*Jupiter* is the largest planet in our solar system, while *Mercury* is the smallest. *Saturn* is famous for its rings.",
                  explanation: "Jupiter is the largest planet, Mercury is the smallest, and Saturn is known for its prominent ring system.",
                  points: 3
                }
              ],
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 11: Solar System Drag the Words Activity`);

        // 12. Flash Cards Activity
        await prisma.activity.create({
          data: {
            title: 'Solar System Flash Cards',
            purpose: ActivityPurpose.LEARNING,
            learningType: LearningActivityType.FLASH_CARDS,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'flash-cards',
              instructions: 'Review these flash cards about the solar system. Click on each card to see the answer.',
              cards: [
                {
                  id: generateId(),
                  front: "What is the closest planet to the Sun?",
                  back: "Mercury is the closest planet to the Sun.",
                  hint: "It's the smallest planet in our solar system."
                },
                {
                  id: generateId(),
                  front: "Which planet is known as the Red Planet?",
                  back: "Mars is known as the Red Planet due to the iron oxide (rust) on its surface.",
                  hint: "Its name comes from the Roman god of war."
                },
                {
                  id: generateId(),
                  front: "Which planet has the Great Red Spot?",
                  back: "Jupiter has the Great Red Spot, which is a giant storm that has been raging for hundreds of years.",
                  hint: "It's the largest planet in our solar system."
                },
                {
                  id: generateId(),
                  front: "Which planet has the most prominent ring system?",
                  back: "Saturn has the most prominent and visible ring system in our solar system.",
                  hint: "It's the sixth planet from the Sun."
                },
                {
                  id: generateId(),
                  front: "What is the name of Earth's natural satellite?",
                  back: "The Moon is Earth's only natural satellite.",
                  hint: "It's the fifth largest satellite in the solar system."
                }
              ],
              shuffleCards: true,
              showHints: true,
              enableTextToSpeech: false,
              autoFlip: false,
              flipDuration: 1000
            },
            isGradable: false,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 12: Solar System Flash Cards`);

        // 13. Reading Activity
        await prisma.activity.create({
          data: {
            title: 'Introduction to the Solar System',
            purpose: ActivityPurpose.LEARNING,
            learningType: LearningActivityType.READING,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'reading',
              instructions: 'Read the following text about the Solar System and answer the questions.',
              sections: [
                {
                  id: generateId(),
                  title: "Our Solar System",
                  content: "Our solar system consists of the Sun, eight planets, dwarf planets, moons, asteroids, comets, and other celestial bodies. The Sun is at the center, and all other objects orbit around it due to its gravitational pull.\n\nThe eight planets in order from the Sun are: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. The first four are known as terrestrial (rocky) planets, while the latter four are gas giants.",
                  checkpoints: [
                    {
                      id: generateId(),
                      question: "How many planets are in our solar system?",
                      options: [
                        { id: generateId(), text: '7', isCorrect: false },
                        { id: generateId(), text: '8', isCorrect: true },
                        { id: generateId(), text: '9', isCorrect: false },
                        { id: generateId(), text: '10', isCorrect: false }
                      ]
                    }
                  ]
                },
                {
                  id: generateId(),
                  title: "The Inner Planets",
                  content: "The inner planets (Mercury, Venus, Earth, and Mars) are relatively small and composed primarily of rock and metal. They have few or no moons and no ring systems.\n\nEarth is the only planet known to support life, thanks to its atmosphere, water, and suitable temperature range. Mars, often called the Red Planet due to iron oxide on its surface, is the most explored planet besides Earth and has shown evidence of water in the past.",
                  checkpoints: [
                    {
                      id: generateId(),
                      question: "Which inner planet is known to support life?",
                      options: [
                        { id: generateId(), text: 'Mercury', isCorrect: false },
                        { id: generateId(), text: 'Venus', isCorrect: false },
                        { id: generateId(), text: 'Earth', isCorrect: true },
                        { id: generateId(), text: 'Mars', isCorrect: false }
                      ]
                    }
                  ]
                }
              ],
              showTableOfContents: true,
              enableTextToSpeech: true,
              enableHighlighting: true,
              enableNotes: true,
              readingTimeEstimate: 10,
              showProgressBar: true,
              fontSizeAdjustable: true
            },
            isGradable: false,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 13: Introduction to the Solar System Reading`);

        // 14. Mixed Question Types Quiz
        await prisma.activity.create({
          data: {
            title: 'Solar System Mixed Quiz',
            purpose: ActivityPurpose.ASSESSMENT,
            learningType: LearningActivityType.QUIZ,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              activityType: 'quiz',
              instructions: 'Answer the following questions about the Solar System. This quiz contains multiple types of questions.',
              questions: [
                {
                  id: generateId(),
                  type: 'multiple-choice',
                  text: "Which planet is known as the Red Planet?",
                  options: [
                    { id: generateId(), text: "Venus", isCorrect: false },
                    { id: generateId(), text: "Mars", isCorrect: true },
                    { id: generateId(), text: "Jupiter", isCorrect: false },
                    { id: generateId(), text: "Saturn", isCorrect: false }
                  ],
                  explanation: "Mars is called the Red Planet because of the iron oxide (rust) on its surface.",
                  points: 2
                },
                {
                  id: generateId(),
                  type: 'true-false',
                  text: "Jupiter is the largest planet in our solar system.",
                  isTrue: true,
                  explanation: "Jupiter is indeed the largest planet in our solar system, with a mass more than 300 times that of Earth.",
                  points: 1
                },
                {
                  id: generateId(),
                  type: 'fill-in-the-blanks',
                  text: "Complete the sentence about planets:",
                  textWithBlanks: "The closest planet to the Sun is [blank1] and the farthest planet is [blank2].",
                  blanks: [
                    {
                      id: 'blank1',
                      correctAnswers: ['Mercury', 'mercury'],
                      caseSensitive: false,
                      feedback: 'Mercury is the closest planet to the Sun.'
                    },
                    {
                      id: 'blank2',
                      correctAnswers: ['Neptune', 'neptune'],
                      caseSensitive: false,
                      feedback: 'Neptune is the farthest planet from the Sun since Pluto was reclassified as a dwarf planet.'
                    }
                  ],
                  explanation: "Mercury is the closest planet to the Sun, and Neptune is the farthest (since Pluto was reclassified as a dwarf planet in 2006).",
                  points: 2
                }
              ],
              shuffleQuestions: true,
              showFeedbackImmediately: true,
              showCorrectAnswers: true,
              passingPercentage: 60,
              attemptsAllowed: 1
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 14: Solar System Mixed Quiz`);

        // 15. Book Activity - Solar System
        const bookContent = JSON.parse(JSON.stringify(solarSystemBookActivity));
        await prisma.activity.create({
          data: {
            title: solarSystemBookActivity.title,
            purpose: ActivityPurpose.LEARNING,
            learningType: LearningActivityType.BOOK,
            status: SystemStatus.ACTIVE,
            subjectId: existingActivity.subjectId,
            topicId: existingActivity.topicId,
            classId,
            content: {
              ...bookContent,
              activityType: 'book' // Ensure activityType is set correctly
            },
            isGradable: true,
            maxScore: 100,
            passingScore: 60
          }
        });
        console.log(`Created activity 15: ${solarSystemBookActivity.title}`);

        console.log('Successfully created 15 new activities with real content');
      } else {
        console.error('Could not find existing activity details');
      }
    } else {
      console.error('No existing activities found for this class. Cannot determine subject and topic IDs.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during script execution:', error);
    process.exit(1);
  });
