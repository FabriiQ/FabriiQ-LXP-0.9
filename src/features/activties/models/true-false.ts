'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * True/False Question Interface
 * Represents a single question in a true/false activity
 */
export interface TrueFalseQuestion {
  id: string;
  text: string;
  isTrue: boolean;
  explanation?: string;  // Detailed explanation of the answer
  hint?: string;         // Optional hint for students
  points?: number;
  tags?: string[];       // For AI categorization
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * True/False Activity Interface
 * Represents a complete true/false activity
 */
export interface TrueFalseActivity extends BaseActivity {
  activityType: 'true-false';
  questions: TrueFalseQuestion[];
  settings?: ActivitySettings;
}

/**
 * Create a default true/false activity
 * Used for initializing new activities
 */
export function createDefaultTrueFalseActivity(): TrueFalseActivity {
  return {
    id: generateId(),
    title: 'New True/False Quiz',
    description: 'A true/false quiz with sample questions',
    instructions: 'Read each statement carefully and determine if it is true or false.',
    activityType: 'true-false',
    questions: [createDefaultTrueFalseQuestion()],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default true/false question
 * Used for adding new questions to an activity
 */
export function createDefaultTrueFalseQuestion(): TrueFalseQuestion {
  return {
    id: generateId(),
    text: 'New statement',
    isTrue: true,
    explanation: 'Explanation for why this statement is true/false.',
    hint: 'Think about the statement carefully.',
    points: 1
  };
}
