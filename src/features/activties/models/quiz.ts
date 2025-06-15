'use client';

/**
 * Quiz Activity Models
 *
 * This file contains the data models for quiz activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Quiz Question Type
 * Represents the different types of questions that can be included in a quiz
 */
export type QuizQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'multiple-response'
  | 'fill-in-the-blanks'
  | 'matching'
  | 'sequence'
  | 'numeric';

/**
 * Quiz Question Option Interface
 * Represents an option in a multiple-choice or multiple-response question
 */
export interface QuizQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

/**
 * Quiz Matching Pair Interface
 * Represents a matching pair in a matching question
 */
export interface QuizMatchingPair {
  id: string;
  left: string;
  right: string;
}

/**
 * Quiz Sequence Item Interface
 * Represents an item in a sequence question
 */
export interface QuizSequenceItem {
  id: string;
  text: string;
  correctPosition: number;
}

/**
 * Quiz Fill in the Blanks Blank Interface
 * Represents a blank in a fill-in-the-blanks question
 */
export interface QuizFillInTheBlankBlank {
  id: string;
  acceptableAnswers: string[];
  feedback?: string;
}

/**
 * Quiz Question Interface
 * Represents a single question in a quiz activity
 */
export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  text: string;
  explanation?: string;
  hint?: string;
  points?: number;
  media?: {
    type: 'image' | 'text';
    url?: string;
    content?: string;
    alt?: string;
    caption?: string;
  };

  // Type-specific properties
  options?: QuizQuestionOption[];  // For multiple-choice and multiple-response
  isTrue?: boolean;                // For true-false
  matchingPairs?: QuizMatchingPair[]; // For matching
  sequenceItems?: QuizSequenceItem[]; // For sequence
  correctAnswer?: number;          // For numeric
  acceptableRange?: {              // For numeric
    min: number;
    max: number;
  };
  unit?: string;                   // For numeric
  blanks?: QuizFillInTheBlankBlank[]; // For fill-in-the-blanks
  textWithBlanks?: string;         // For fill-in-the-blanks

  // Question bank reference for tracking usage
  questionBankRef?: string;        // Reference to the original question in the question bank
}

/**
 * Quiz Activity Interface
 * Represents a complete quiz activity
 */
export interface QuizActivity extends BaseActivity {
  activityType: 'quiz';
  questions: QuizQuestion[];
  settings?: ActivitySettings & {
    showQuestionNumbers?: boolean;
    allowPartialCredit?: boolean;
    showTimer?: boolean;
    timeLimit?: number; // in minutes
    showProgressBar?: boolean;
    allowNavigation?: boolean;
    requireAllQuestions?: boolean;
    showFeedbackAfterEachQuestion?: boolean;
  };
}

/**
 * Create a default quiz activity
 * Used for initializing new activities
 */
export function createDefaultQuizActivity(): QuizActivity {
  return {
    id: generateId(),
    title: 'New Quiz Activity',
    description: 'A quiz activity with sample questions',
    instructions: 'Answer all questions and submit to complete the quiz.',
    activityType: 'quiz',
    questions: [
      createDefaultMultipleChoiceQuestion(),
      createDefaultTrueFalseQuestion(),
      createDefaultNumericQuestion()
    ],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      showQuestionNumbers: true,
      allowPartialCredit: true,
      showTimer: false,
      timeLimit: 30,
      showProgressBar: true,
      allowNavigation: true,
      requireAllQuestions: true,
      showFeedbackAfterEachQuestion: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default multiple-choice question
 * Used for adding new multiple-choice questions to a quiz
 */
export function createDefaultMultipleChoiceQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'multiple-choice',
    text: 'What is the capital of France?',
    options: [
      {
        id: generateId(),
        text: 'Paris',
        isCorrect: true,
        feedback: 'Correct! Paris is the capital of France.'
      },
      {
        id: generateId(),
        text: 'London',
        isCorrect: false,
        feedback: 'Incorrect. London is the capital of the United Kingdom.'
      },
      {
        id: generateId(),
        text: 'Berlin',
        isCorrect: false,
        feedback: 'Incorrect. Berlin is the capital of Germany.'
      },
      {
        id: generateId(),
        text: 'Madrid',
        isCorrect: false,
        feedback: 'Incorrect. Madrid is the capital of Spain.'
      }
    ],
    explanation: 'Paris is the capital and most populous city of France.',
    hint: 'Think about the city with the Eiffel Tower.',
    points: 1
  };
}

/**
 * Create a default true-false question
 * Used for adding new true-false questions to a quiz
 */
export function createDefaultTrueFalseQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'true-false',
    text: 'The Earth is flat.',
    isTrue: false,
    explanation: 'The Earth is approximately spherical in shape, slightly flattened at the poles.',
    hint: 'Think about what scientists have proven about the shape of our planet.',
    points: 1
  };
}

/**
 * Create a default multiple-response question
 * Used for adding new multiple-response questions to a quiz
 */
export function createDefaultMultipleResponseQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'multiple-response',
    text: 'Which of the following are planets in our solar system?',
    options: [
      {
        id: generateId(),
        text: 'Earth',
        isCorrect: true,
        feedback: 'Correct! Earth is a planet in our solar system.'
      },
      {
        id: generateId(),
        text: 'Jupiter',
        isCorrect: true,
        feedback: 'Correct! Jupiter is a planet in our solar system.'
      },
      {
        id: generateId(),
        text: 'Sun',
        isCorrect: false,
        feedback: 'Incorrect. The Sun is a star, not a planet.'
      },
      {
        id: generateId(),
        text: 'Moon',
        isCorrect: false,
        feedback: 'Incorrect. The Moon is a natural satellite of Earth, not a planet.'
      }
    ],
    explanation: 'The planets in our solar system are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
    hint: 'Think about celestial bodies that orbit the Sun and are not stars or moons.',
    points: 2
  };
}

/**
 * Create a default fill-in-the-blanks question
 * Used for adding new fill-in-the-blanks questions to a quiz
 */
export function createDefaultFillInTheBlanksQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'fill-in-the-blanks',
    text: 'Complete the sentence:',
    textWithBlanks: 'The capital of France is [blank1], and the capital of Italy is [blank2].',
    blanks: [
      {
        id: 'blank1',
        acceptableAnswers: ['Paris', 'paris'],
        feedback: 'Paris is the capital of France.'
      },
      {
        id: 'blank2',
        acceptableAnswers: ['Rome', 'rome'],
        feedback: 'Rome is the capital of Italy.'
      }
    ],
    explanation: 'Paris is the capital of France, and Rome is the capital of Italy.',
    hint: 'Think about famous European cities.',
    points: 2
  };
}

/**
 * Create a default matching question
 * Used for adding new matching questions to a quiz
 */
export function createDefaultMatchingQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'matching',
    text: 'Match the countries with their capitals:',
    matchingPairs: [
      {
        id: generateId(),
        left: 'France',
        right: 'Paris'
      },
      {
        id: generateId(),
        left: 'Germany',
        right: 'Berlin'
      },
      {
        id: generateId(),
        left: 'Italy',
        right: 'Rome'
      },
      {
        id: generateId(),
        left: 'Spain',
        right: 'Madrid'
      }
    ],
    explanation: 'Each country has a unique capital city.',
    hint: 'Think about the major cities in each country.',
    points: 4
  };
}

/**
 * Create a default sequence question
 * Used for adding new sequence questions to a quiz
 */
export function createDefaultSequenceQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'sequence',
    text: 'Arrange the following events in chronological order:',
    sequenceItems: [
      {
        id: generateId(),
        text: 'World War I',
        correctPosition: 0
      },
      {
        id: generateId(),
        text: 'World War II',
        correctPosition: 1
      },
      {
        id: generateId(),
        text: 'Cold War',
        correctPosition: 2
      },
      {
        id: generateId(),
        text: 'Fall of the Berlin Wall',
        correctPosition: 3
      }
    ],
    explanation: 'World War I (1914-1918) was followed by World War II (1939-1945), then the Cold War (1947-1991), and finally the Fall of the Berlin Wall (1989).',
    hint: 'Think about the order of major historical events in the 20th century.',
    points: 4
  };
}

/**
 * Create a default numeric question
 * Used for adding new numeric questions to a quiz
 */
export function createDefaultNumericQuestion(): QuizQuestion {
  return {
    id: generateId(),
    type: 'numeric',
    text: 'What is the value of π (pi) to 2 decimal places?',
    correctAnswer: 3.14,
    acceptableRange: {
      min: 3.13,
      max: 3.15
    },
    unit: '',
    explanation: 'The value of π (pi) is approximately 3.14159...',
    hint: 'Round to 2 decimal places.',
    points: 1
  };
}
