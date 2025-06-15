import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType, AssessmentType } from '@prisma/client';

/**
 * Seed file for generating activities
 *
 * This file creates 5 activities for each topic and activity type,
 * using real subject topics from the existing seed data.
 */

// Helper function to generate a unique ID for activities
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Helper function to generate multiple choice activity content
function generateMultipleChoiceContent(topicTitle: string, index: number) {
  // Create different content based on topic and index
  let questions = [];

  if (topicTitle.toLowerCase().includes('solar system')) {
    questions = [
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
      },
      {
        id: generateId(),
        text: "What is the closest planet to the Sun?",
        options: [
          { id: generateId(), text: "Venus", isCorrect: false, feedback: "Incorrect. Venus is the second closest planet to the Sun." },
          { id: generateId(), text: "Earth", isCorrect: false, feedback: "Incorrect. Earth is the third closest planet to the Sun." },
          { id: generateId(), text: "Mars", isCorrect: false, feedback: "Incorrect. Mars is the fourth closest planet to the Sun." },
          { id: generateId(), text: "Mercury", isCorrect: true, feedback: "Correct! Mercury is the closest planet to the Sun." }
        ],
        explanation: "Mercury is the closest planet to the Sun, orbiting at an average distance of about 36 million miles (58 million kilometers).",
        points: 2
      }
    ];
  } else if (topicTitle.toLowerCase().includes('math') || topicTitle.toLowerCase().includes('number')) {
    questions = [
      {
        id: generateId(),
        text: "What is the result of 7 × 8?",
        options: [
          { id: generateId(), text: "54", isCorrect: false, feedback: "Incorrect. 7 × 8 is not 54." },
          { id: generateId(), text: "56", isCorrect: true, feedback: "Correct! 7 × 8 = 56" },
          { id: generateId(), text: "64", isCorrect: false, feedback: "Incorrect. 8 × 8 = 64, but this question asks for 7 × 8." },
          { id: generateId(), text: "48", isCorrect: false, feedback: "Incorrect. 6 × 8 = 48, but this question asks for 7 × 8." }
        ],
        explanation: "To multiply 7 × 8, you can think of it as 7 groups of 8 or 8 groups of 7, which equals 56.",
        points: 2
      },
      {
        id: generateId(),
        text: "Which of these is a prime number?",
        options: [
          { id: generateId(), text: "15", isCorrect: false, feedback: "Incorrect. 15 = 3 × 5, so it's not prime." },
          { id: generateId(), text: "21", isCorrect: false, feedback: "Incorrect. 21 = 3 × 7, so it's not prime." },
          { id: generateId(), text: "23", isCorrect: true, feedback: "Correct! 23 is a prime number as it's only divisible by 1 and itself." },
          { id: generateId(), text: "27", isCorrect: false, feedback: "Incorrect. 27 = 3 × 9 = 3 × 3 × 3, so it's not prime." }
        ],
        explanation: "A prime number is a natural number greater than 1 that is not a product of two smaller natural numbers. 23 is only divisible by 1 and 23.",
        points: 2
      }
    ];
  } else {
    // Default questions for any other topic
    questions = [
      {
        id: generateId(),
        text: `What is the main concept of ${topicTitle}?`,
        options: [
          { id: generateId(), text: `The history of ${topicTitle}`, isCorrect: false, feedback: `Incorrect. While history is important, it's not the main concept.` },
          { id: generateId(), text: `The fundamental principles of ${topicTitle}`, isCorrect: true, feedback: `Correct! Understanding the fundamental principles is essential.` },
          { id: generateId(), text: `The applications of ${topicTitle}`, isCorrect: false, feedback: `Incorrect. Applications are important but build on the main concepts.` },
          { id: generateId(), text: `The future developments in ${topicTitle}`, isCorrect: false, feedback: `Incorrect. Future developments are speculative.` }
        ],
        explanation: `The fundamental principles form the foundation of understanding ${topicTitle}.`,
        points: 2
      },
      {
        id: generateId(),
        text: `Which of these is NOT typically associated with ${topicTitle}?`,
        options: [
          { id: generateId(), text: `Key aspect 1 of ${topicTitle}`, isCorrect: false, feedback: `Incorrect. This is a key aspect of ${topicTitle}.` },
          { id: generateId(), text: `Key aspect 2 of ${topicTitle}`, isCorrect: false, feedback: `Incorrect. This is a key aspect of ${topicTitle}.` },
          { id: generateId(), text: `Unrelated concept to ${topicTitle}`, isCorrect: true, feedback: `Correct! This concept is not related to ${topicTitle}.` },
          { id: generateId(), text: `Key aspect 3 of ${topicTitle}`, isCorrect: false, feedback: `Incorrect. This is a key aspect of ${topicTitle}.` }
        ],
        explanation: `It's important to distinguish between concepts that are related to ${topicTitle} and those that are not.`,
        points: 2
      }
    ];
  }

  return {
    activityType: 'multiple-choice',
    instructions: `Read each question carefully and select the best answer about ${topicTitle}.`,
    questions: questions,
    shuffleQuestions: false,
    shuffleOptions: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate true/false activity content
function generateTrueFalseContent(topicTitle: string, index: number) {
  // Create different content based on topic and index
  let questions = [];

  if (topicTitle.toLowerCase().includes('science')) {
    questions = [
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
      },
      {
        id: generateId(),
        text: "The human body has 206 bones.",
        isTrue: true,
        explanation: "The adult human skeleton typically consists of 206 bones.",
        points: 1
      }
    ];
  } else if (topicTitle.toLowerCase().includes('history')) {
    questions = [
      {
        id: generateId(),
        text: "The Declaration of Independence was signed in 1776.",
        isTrue: true,
        explanation: "The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.",
        points: 1
      },
      {
        id: generateId(),
        text: "World War II ended in 1950.",
        isTrue: false,
        explanation: "World War II ended in 1945, not 1950. The Korean War began in 1950.",
        points: 1
      },
      {
        id: generateId(),
        text: "Ancient Egyptians built the Great Wall of China.",
        isTrue: false,
        explanation: "The Great Wall of China was built by various Chinese dynasties, not by Ancient Egyptians.",
        points: 1
      }
    ];
  } else {
    // Default questions for any other topic
    questions = [
      {
        id: generateId(),
        text: `${topicTitle} is an important subject in modern education.`,
        isTrue: true,
        explanation: `${topicTitle} provides valuable knowledge and skills for students.`,
        points: 1
      },
      {
        id: generateId(),
        text: `${topicTitle} was first studied in the 21st century.`,
        isTrue: false,
        explanation: `${topicTitle} has been studied for many years, well before the 21st century.`,
        points: 1
      },
      {
        id: generateId(),
        text: `Understanding ${topicTitle} requires critical thinking skills.`,
        isTrue: true,
        explanation: `Like many subjects, ${topicTitle} requires students to think critically and analyze information.`,
        points: 1
      },
      {
        id: generateId(),
        text: `${topicTitle} has no practical applications in the real world.`,
        isTrue: false,
        explanation: `${topicTitle} has many practical applications and is relevant to real-world situations.`,
        points: 1
      }
    ];
  }

  return {
    activityType: 'true-false',
    instructions: `Determine whether each statement about ${topicTitle} is true or false.`,
    questions: questions,
    shuffleQuestions: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate multiple response activity content
function generateMultipleResponseContent(topicTitle: string, index: number) {
  // Create different content based on topic and index
  let questions = [];

  if (topicTitle.toLowerCase().includes('food') || topicTitle.toLowerCase().includes('nutrition')) {
    questions = [
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
    ];
  } else if (topicTitle.toLowerCase().includes('animal') || topicTitle.toLowerCase().includes('biology')) {
    questions = [
      {
        id: generateId(),
        text: "Which of the following animals are mammals?",
        options: [
          { id: generateId(), text: "Dolphin", isCorrect: true, feedback: "Correct! Dolphins are marine mammals." },
          { id: generateId(), text: "Eagle", isCorrect: false, feedback: "Incorrect. Eagles are birds." },
          { id: generateId(), text: "Bat", isCorrect: true, feedback: "Correct! Bats are the only mammals capable of true flight." },
          { id: generateId(), text: "Crocodile", isCorrect: false, feedback: "Incorrect. Crocodiles are reptiles." }
        ],
        explanation: "Mammals are vertebrate animals characterized by the presence of mammary glands, hair or fur, and three middle ear bones.",
        points: 2
      }
    ];
  } else {
    // Default questions for any other topic
    questions = [
      {
        id: generateId(),
        text: `Which of the following are related to ${topicTitle}?`,
        options: [
          { id: generateId(), text: `Key concept 1 of ${topicTitle}`, isCorrect: true, feedback: `Correct! This is a key concept of ${topicTitle}.` },
          { id: generateId(), text: `Unrelated concept 1`, isCorrect: false, feedback: `Incorrect. This concept is not related to ${topicTitle}.` },
          { id: generateId(), text: `Key concept 2 of ${topicTitle}`, isCorrect: true, feedback: `Correct! This is a key concept of ${topicTitle}.` },
          { id: generateId(), text: `Unrelated concept 2`, isCorrect: false, feedback: `Incorrect. This concept is not related to ${topicTitle}.` }
        ],
        explanation: `It's important to identify concepts that are related to ${topicTitle}.`,
        points: 2
      },
      {
        id: generateId(),
        text: `Which of the following are benefits of studying ${topicTitle}?`,
        options: [
          { id: generateId(), text: `Improved critical thinking`, isCorrect: true, feedback: `Correct! Studying ${topicTitle} can improve critical thinking skills.` },
          { id: generateId(), text: `Better problem-solving abilities`, isCorrect: true, feedback: `Correct! Studying ${topicTitle} can enhance problem-solving abilities.` },
          { id: generateId(), text: `Guaranteed high salary`, isCorrect: false, feedback: `Incorrect. While education is valuable, no subject guarantees a high salary.` },
          { id: generateId(), text: `Perfect memory`, isCorrect: false, feedback: `Incorrect. Studying ${topicTitle} doesn't guarantee perfect memory.` }
        ],
        explanation: `Studying ${topicTitle} offers many benefits, particularly in developing thinking and problem-solving skills.`,
        points: 2
      }
    ];
  }

  return {
    activityType: 'multiple-response',
    instructions: `Select ALL correct answers for each question about ${topicTitle}.`,
    questions: questions,
    shuffleQuestions: false,
    shuffleOptions: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1,
    requireAllCorrect: true,
    allowPartialCredit: true
  };
}

// Helper function to generate fill in the blanks activity content
function generateFillInTheBlanksContent(topicTitle: string, index: number) {
  // Create different content based on topic and index
  let questions = [];

  if (topicTitle.toLowerCase().includes('geography')) {
    questions = [
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
    ];
  } else if (topicTitle.toLowerCase().includes('grammar') || topicTitle.toLowerCase().includes('english')) {
    questions = [
      {
        id: generateId(),
        text: "Complete the sentence with the correct parts of speech:",
        textWithBlanks: "A [blank1] is used to describe a noun, while a [blank2] is used to describe a verb, adjective, or another adverb.",
        blanks: [
          {
            id: 'blank1',
            correctAnswers: ['adjective', 'Adjective'],
            caseSensitive: false,
            feedback: 'An adjective is used to describe a noun.'
          },
          {
            id: 'blank2',
            correctAnswers: ['adverb', 'Adverb'],
            caseSensitive: false,
            feedback: 'An adverb is used to describe a verb, adjective, or another adverb.'
          }
        ],
        explanation: "Adjectives modify nouns, while adverbs modify verbs, adjectives, or other adverbs.",
        points: 2,
        partialCredit: true
      }
    ];
  } else {
    // Default questions for any other topic
    questions = [
      {
        id: generateId(),
        text: `Complete the following sentence about ${topicTitle}:`,
        textWithBlanks: `The most important concept in ${topicTitle} is [blank1] because it helps us understand [blank2].`,
        blanks: [
          {
            id: 'blank1',
            correctAnswers: ['foundation', 'basics', 'fundamentals', 'principles'],
            caseSensitive: false,
            feedback: 'The foundation or fundamentals are essential to understanding any subject.'
          },
          {
            id: 'blank2',
            correctAnswers: ['applications', 'advanced concepts', 'complex ideas', 'practical uses'],
            caseSensitive: false,
            feedback: 'Understanding the basics helps with more advanced applications.'
          }
        ],
        explanation: `Understanding the fundamentals of ${topicTitle} is essential for mastering more complex concepts.`,
        points: 2,
        partialCredit: true
      }
    ];
  }

  return {
    activityType: 'fill-in-the-blanks',
    instructions: `Fill in the blanks with the correct answers about ${topicTitle}.`,
    questions: questions,
    caseSensitive: false,
    partialCredit: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate matching activity content
function generateMatchingContent(topicTitle: string, index: number) {
  return {
    activityType: 'matching',
    instructions: `Match each item on the left with its corresponding item on the right about ${topicTitle}.`,
    questions: [
      {
        id: generateId(),
        text: `Match the following items related to ${topicTitle} (Activity ${index}):`,
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
          },
          {
            id: generateId(),
            left: `Term 4 for ${topicTitle}`,
            right: `Definition 4 for ${topicTitle}`
          }
        ],
        explanation: `Explanation for matching question about ${topicTitle}`,
        points: 4
      }
    ],
    shufflePairs: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate drag and drop activity content
function generateDragAndDropContent(topicTitle: string, index: number) {
  return {
    activityType: 'drag-and-drop',
    instructions: `Drag each item to its correct drop zone related to ${topicTitle}.`,
    questions: [
      {
        id: generateId(),
        text: `Organize the following items related to ${topicTitle} (Activity ${index}):`,
        items: [
          { id: generateId(), text: `Item 1 for ${topicTitle}` },
          { id: generateId(), text: `Item 2 for ${topicTitle}` },
          { id: generateId(), text: `Item 3 for ${topicTitle}` },
          { id: generateId(), text: `Item 4 for ${topicTitle}` }
        ],
        zones: [
          { id: generateId(), text: `Zone 1 for ${topicTitle}`, correctItemIds: [0] },
          { id: generateId(), text: `Zone 2 for ${topicTitle}`, correctItemIds: [1] },
          { id: generateId(), text: `Zone 3 for ${topicTitle}`, correctItemIds: [2] },
          { id: generateId(), text: `Zone 4 for ${topicTitle}`, correctItemIds: [3] }
        ],
        explanation: `Explanation for drag and drop question about ${topicTitle}`,
        points: 4
      }
    ],
    shuffleItems: true,
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate drag the words activity content
function generateDragTheWordsContent(topicTitle: string, index: number) {
  return {
    activityType: 'drag-the-words',
    instructions: `Drag the words to their correct positions in the sentences about ${topicTitle}.`,
    questions: [
      {
        id: generateId(),
        text: `Complete the following sentence about ${topicTitle} (Activity ${index}):`,
        sentence: `The *concept* is an important *part* of ${topicTitle} because it helps us *understand* the subject better.`,
        explanation: `Explanation for drag the words question about ${topicTitle}`,
        points: 3
      },
      {
        id: generateId(),
        text: `Complete the following sentence about ${topicTitle} (Activity ${index}):`,
        sentence: `When studying ${topicTitle}, we learn that *theory* and *practice* are both *essential* components.`,
        explanation: `Explanation for drag the words question about ${topicTitle}`,
        points: 3
      }
    ],
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate flash cards activity content
function generateFlashCardsContent(topicTitle: string, index: number) {
  return {
    activityType: 'flash-cards',
    instructions: `Review these flash cards about ${topicTitle}. Click on each card to see the answer.`,
    cards: [
      {
        id: generateId(),
        front: `Question 1 about ${topicTitle} (Activity ${index})`,
        back: `Answer 1 about ${topicTitle}`,
        hint: `Hint for question 1 about ${topicTitle}`
      },
      {
        id: generateId(),
        front: `Question 2 about ${topicTitle} (Activity ${index})`,
        back: `Answer 2 about ${topicTitle}`,
        hint: `Hint for question 2 about ${topicTitle}`
      },
      {
        id: generateId(),
        front: `Question 3 about ${topicTitle} (Activity ${index})`,
        back: `Answer 3 about ${topicTitle}`,
        hint: `Hint for question 3 about ${topicTitle}`
      },
      {
        id: generateId(),
        front: `Question 4 about ${topicTitle} (Activity ${index})`,
        back: `Answer 4 about ${topicTitle}`,
        hint: `Hint for question 4 about ${topicTitle}`
      },
      {
        id: generateId(),
        front: `Question 5 about ${topicTitle} (Activity ${index})`,
        back: `Answer 5 about ${topicTitle}`,
        hint: `Hint for question 5 about ${topicTitle}`
      }
    ],
    shuffleCards: true,
    showHints: true,
    enableTextToSpeech: false,
    autoFlip: false,
    flipDuration: 1000
  };
}

// Helper function to generate numeric activity content
function generateNumericContent(topicTitle: string, index: number) {
  return {
    activityType: 'numeric',
    instructions: `Solve each problem and enter the numeric answer about ${topicTitle}.`,
    questions: [
      {
        id: generateId(),
        text: `Problem 1 about ${topicTitle} (Activity ${index})`,
        correctAnswer: 42,
        tolerance: 0,
        unit: 'units',
        explanation: `Explanation for problem 1 about ${topicTitle}`,
        points: 2
      },
      {
        id: generateId(),
        text: `Problem 2 about ${topicTitle} (Activity ${index})`,
        correctAnswer: 3.14,
        tolerance: 0.01,
        unit: 'units',
        explanation: `Explanation for problem 2 about ${topicTitle}`,
        points: 2
      },
      {
        id: generateId(),
        text: `Problem 3 about ${topicTitle} (Activity ${index})`,
        correctAnswer: 100,
        tolerance: 0,
        unit: 'units',
        explanation: `Explanation for problem 3 about ${topicTitle}`,
        points: 2
      }
    ],
    showFeedbackImmediately: true,
    showCorrectAnswers: true,
    passingPercentage: 60,
    attemptsAllowed: 1
  };
}

// Helper function to generate reading activity content
function generateReadingContent(topicTitle: string, index: number) {
  return {
    activityType: 'reading',
    instructions: `Read the following text about ${topicTitle} and answer the questions.`,
    sections: [
      {
        id: generateId(),
        title: `Introduction to ${topicTitle}`,
        content: `This is an introduction to ${topicTitle}. It covers the basic concepts and principles that students need to understand. The content is designed to be engaging and informative, providing a solid foundation for further learning.

        ${topicTitle} is an important subject that helps students develop critical thinking skills and problem-solving abilities. By understanding the key concepts presented in this reading, students will be better prepared for more advanced topics.`,
        checkpoints: [
          {
            id: generateId(),
            question: `What is the main purpose of studying ${topicTitle}?`,
            options: [
              { id: generateId(), text: 'To memorize facts', isCorrect: false },
              { id: generateId(), text: 'To develop critical thinking skills', isCorrect: true },
              { id: generateId(), text: 'To complete homework assignments', isCorrect: false },
              { id: generateId(), text: 'To pass tests', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: generateId(),
        title: `Key Concepts in ${topicTitle}`,
        content: `This section explores the key concepts in ${topicTitle}. It builds upon the introduction and delves deeper into the subject matter. Students will learn about important principles and how they apply in different contexts.

        Understanding these key concepts is essential for mastering ${topicTitle}. The concepts are presented in a logical sequence, with each one building upon the previous. This approach helps students develop a comprehensive understanding of the subject.`,
        checkpoints: [
          {
            id: generateId(),
            question: `Why is it important to understand the key concepts in ${topicTitle}?`,
            options: [
              { id: generateId(), text: 'To impress teachers', isCorrect: false },
              { id: generateId(), text: 'To skip homework', isCorrect: false },
              { id: generateId(), text: 'To develop a comprehensive understanding', isCorrect: true },
              { id: generateId(), text: 'To avoid studying', isCorrect: false }
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
  };
}

// Helper function to generate video activity content
function generateVideoContent(topicTitle: string, index: number) {
  // Create different content based on topic and index
  let videoData = {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default placeholder
    videoTitle: `Introduction to ${topicTitle}`,
    videoDescription: `This video provides an introduction to ${topicTitle} and covers the basic concepts.`,
    duration: 300, // 5 minutes in seconds
    checkpoints: []
  };

  if (topicTitle.toLowerCase().includes('solar system') || topicTitle.toLowerCase().includes('space')) {
    videoData = {
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
      ]
    };
  } else if (topicTitle.toLowerCase().includes('math') || topicTitle.toLowerCase().includes('number')) {
    videoData = {
      videoUrl: 'https://www.youtube.com/embed/EvHiee7gs9Y', // Math video
      videoTitle: 'Math Antics - Order Of Operations',
      videoDescription: 'Learn about the order of operations in mathematics, including parentheses, exponents, multiplication, division, addition, and subtraction.',
      duration: 600, // 10 minutes
      checkpoints: [
        {
          id: generateId(),
          timeInSeconds: 120,
          question: "What does PEMDAS stand for?",
          options: [
            { id: generateId(), text: 'Please Excuse My Dear Aunt Sally', isCorrect: true },
            { id: generateId(), text: 'Parentheses Exponents Multiply Divide Add Subtract', isCorrect: false },
            { id: generateId(), text: 'Both of the above', isCorrect: false },
            { id: generateId(), text: 'None of the above', isCorrect: false }
          ]
        },
        {
          id: generateId(),
          timeInSeconds: 300,
          question: "Which operation comes first in the order of operations?",
          options: [
            { id: generateId(), text: 'Addition', isCorrect: false },
            { id: generateId(), text: 'Multiplication', isCorrect: false },
            { id: generateId(), text: 'Parentheses', isCorrect: true },
            { id: generateId(), text: 'Subtraction', isCorrect: false }
          ]
        }
      ]
    };
  } else if (topicTitle.toLowerCase().includes('animal') || topicTitle.toLowerCase().includes('biology')) {
    videoData = {
      videoUrl: 'https://www.youtube.com/embed/mRidGna-V4E', // Animal video
      videoTitle: 'Animal Classification for Children',
      videoDescription: 'Learn about animal classification and the main animal groups: mammals, birds, fish, reptiles, and amphibians.',
      duration: 420, // 7 minutes
      checkpoints: [
        {
          id: generateId(),
          timeInSeconds: 90,
          question: "Which of these is a characteristic of mammals?",
          options: [
            { id: generateId(), text: 'They lay eggs', isCorrect: false },
            { id: generateId(), text: 'They have scales', isCorrect: false },
            { id: generateId(), text: 'They have fur or hair', isCorrect: true },
            { id: generateId(), text: 'They have gills', isCorrect: false }
          ]
        },
        {
          id: generateId(),
          timeInSeconds: 240,
          question: "Which animal group has feathers?",
          options: [
            { id: generateId(), text: 'Mammals', isCorrect: false },
            { id: generateId(), text: 'Birds', isCorrect: true },
            { id: generateId(), text: 'Reptiles', isCorrect: false },
            { id: generateId(), text: 'Amphibians', isCorrect: false }
          ]
        }
      ]
    };
  }

  return {
    activityType: 'video',
    instructions: `Watch the following video about ${topicTitle} and answer the questions.`,
    videoUrl: videoData.videoUrl,
    videoTitle: videoData.videoTitle,
    videoDescription: videoData.videoDescription,
    duration: videoData.duration,
    checkpoints: videoData.checkpoints,
    showTranscript: true,
    enableCaptions: true,
    allowPlaybackSpeedControl: true,
    showProgressBar: true
  };
}

// Helper function to generate activity content based on activity type
function generateActivityContent(activityType: LearningActivityType, topicTitle: string, index: number) {
  switch (activityType) {
    case LearningActivityType.MULTIPLE_CHOICE:
      return generateMultipleChoiceContent(topicTitle, index);
    case LearningActivityType.TRUE_FALSE:
      return generateTrueFalseContent(topicTitle, index);
    case LearningActivityType.MULTIPLE_RESPONSE:
      return generateMultipleResponseContent(topicTitle, index);
    case LearningActivityType.FILL_IN_THE_BLANKS:
      return generateFillInTheBlanksContent(topicTitle, index);
    case LearningActivityType.MATCHING:
      return generateMatchingContent(topicTitle, index);
    case LearningActivityType.DRAG_AND_DROP:
      return generateDragAndDropContent(topicTitle, index);
    case LearningActivityType.DRAG_THE_WORDS:
      return generateDragTheWordsContent(topicTitle, index);
    case LearningActivityType.FLASH_CARDS:
      return generateFlashCardsContent(topicTitle, index);
    case LearningActivityType.NUMERIC:
      return generateNumericContent(topicTitle, index);
    case LearningActivityType.READING:
      return generateReadingContent(topicTitle, index);
    case LearningActivityType.VIDEO:
      return generateVideoContent(topicTitle, index);
    default:
      return generateMultipleChoiceContent(topicTitle, index);
  }
}

// Main function to seed activities
export async function seedActivitiesByType(
  prisma: PrismaClient,
  subjects: any[],
  classes: any[]
) {
  console.log('Seeding activities by type...');

  // Find subjects by code
  const mathSubject = subjects.find(s => s.code === 'PYP-CL3-MATH');
  const englishSubject = subjects.find(s => s.code === 'PYP-CL3-ENG');
  const scienceSubject = subjects.find(s => s.code === 'PYP-CL3-SCI');

  if (!mathSubject || !englishSubject || !scienceSubject) {
    console.warn('One or more subjects not found. Skipping activities seeding by type.');
    return;
  }

  // Get topic IDs for each subject
  const mathTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: mathSubject.id },
  });

  const englishTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: englishSubject.id },
  });

  const scienceTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: scienceSubject.id },
  });

  // Get class IDs
  if (classes.length === 0) {
    console.warn('No classes found. Skipping activities seeding by type.');
    return;
  }

  // For the specific class case, we'll just use the classes provided
  // This allows us to work with any class, not just Boys/Girls classes
  if (classes.length === 0) {
    console.warn('No classes found. Skipping activities seeding by type.');
    return;
  }

  // Use the first class (or the only class if there's just one)
  const targetClassId = classes[0].id;
  console.log(`Using class ID: ${targetClassId} for activities`);

  // For compatibility with the rest of the code, we'll set both boysClassId and girlsClassId
  // to the same target class ID
  const boysClassId = targetClassId;
  const girlsClassId = targetClassId;

  console.log(`Using class IDs: ${boysClassId} and ${girlsClassId} for activities`);

  // Activity types to create
  const activityTypes = [
    LearningActivityType.MULTIPLE_CHOICE,
    LearningActivityType.TRUE_FALSE,
    LearningActivityType.MULTIPLE_RESPONSE,
    LearningActivityType.FILL_IN_THE_BLANKS,
    LearningActivityType.MATCHING,
    LearningActivityType.DRAG_AND_DROP,
    LearningActivityType.DRAG_THE_WORDS,
    LearningActivityType.FLASH_CARDS,
    LearningActivityType.NUMERIC,
    LearningActivityType.READING,
    LearningActivityType.VIDEO
  ];

  // Create activities for each subject, topic, and activity type
  const subjects_topics = [
    { subject: mathSubject, topics: mathTopics },
    { subject: englishSubject, topics: englishTopics },
    { subject: scienceSubject, topics: scienceTopics }
  ];

  // Check if we have topics for each subject
  if (mathTopics.length === 0 || englishTopics.length === 0 || scienceTopics.length === 0) {
    console.warn('One or more subjects have no topics. Make sure to run the subject topics seed first.');
    console.log(`Math topics: ${mathTopics.length}, English topics: ${englishTopics.length}, Science topics: ${scienceTopics.length}`);
  }

  let createdActivitiesCount = 0;

  console.log('Starting to create activities...');

  for (const { subject, topics } of subjects_topics) {
    console.log(`Creating activities for subject: ${subject.name} (${topics.length} topics)`);

    for (const topic of topics) {
      // Skip parent topics (chapters) - only create activities for actual topics
      if (topic.nodeType === 'CHAPTER') {
        console.log(`Skipping chapter: ${topic.title}`);
        continue;
      }

      console.log(`Creating activities for topic: ${topic.title}`);

      for (const activityType of activityTypes) {
        console.log(`Creating ${activityType} activities...`);

        // Create 5 activities of each type for each topic
        for (let i = 1; i <= 5; i++) {
          // Create for target class
          await prisma.activity.create({
            data: {
              title: `${activityType} Activity ${i} - ${topic.title}`,
              purpose: ActivityPurpose.LEARNING,
              learningType: activityType,
              status: SystemStatus.ACTIVE,
              subjectId: subject.id,
              topicId: topic.id,
              classId: targetClassId,
              content: generateActivityContent(activityType, topic.title, i),
              isGradable: activityType === LearningActivityType.MULTIPLE_CHOICE ||
                activityType === LearningActivityType.TRUE_FALSE ||
                activityType === LearningActivityType.MULTIPLE_RESPONSE ||
                activityType === LearningActivityType.FILL_IN_THE_BLANKS ||
                activityType === LearningActivityType.MATCHING ||
                activityType === LearningActivityType.NUMERIC,
              maxScore: 100,
              passingScore: 60
            }
          });

          createdActivitiesCount += 1;
        }
      }
    }
  }

  console.log(`Created ${createdActivitiesCount} activities by type`);
  console.log('Activities seeding by type completed successfully!');
}
