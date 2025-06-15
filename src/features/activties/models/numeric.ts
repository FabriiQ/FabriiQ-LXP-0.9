'use client';

/**
 * Numeric Activity Models
 *
 * This file contains the data models for numeric activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Numeric Question Interface
 * Represents a single question in a numeric activity
 */
export interface NumericQuestion {
  id: string;
  text: string;
  correctAnswer: number;
  acceptableRange?: {
    min: number;
    max: number;
  };
  unit?: string;
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
}

/**
 * Numeric Activity Interface
 * Represents a complete numeric activity
 */
export interface NumericActivity extends BaseActivity {
  activityType: 'numeric';
  questions: NumericQuestion[];
  settings?: ActivitySettings & {
    decimalPlaces?: number;
    showCalculator?: boolean;
    requireUnit?: boolean;
    showFeedbackAfterEachQuestion?: boolean;
  };
}

/**
 * Create a default numeric activity
 * Used for initializing new activities
 */
export function createDefaultNumericActivity(): NumericActivity {
  return {
    id: generateId(),
    title: 'New Numeric Activity',
    description: 'A numeric activity with sample questions',
    instructions: 'Enter the correct numeric answer for each question.',
    activityType: 'numeric',
    questions: [createDefaultNumericQuestion()],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      decimalPlaces: 2,
      showCalculator: true,
      requireUnit: false,
      showFeedbackAfterEachQuestion: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default numeric question
 * Used for adding new questions to an activity
 */
export function createDefaultNumericQuestion(): NumericQuestion {
  return {
    id: generateId(),
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

/**
 * Check if a numeric answer is correct
 * 
 * @param question The numeric question
 * @param answer The user's answer
 * @returns Whether the answer is correct
 */
export function isNumericAnswerCorrect(question: NumericQuestion, answer: number): boolean {
  if (question.acceptableRange) {
    return answer >= question.acceptableRange.min && answer <= question.acceptableRange.max;
  } else {
    return answer === question.correctAnswer;
  }
}
