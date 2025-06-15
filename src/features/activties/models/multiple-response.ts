'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Multiple Response Option Interface
 * Represents a single option in a multiple response question
 * Similar to multiple choice, but multiple options can be correct
 */
export interface MultipleResponseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Multiple Response Question Interface
 * Represents a single question in a multiple response activity
 */
export interface MultipleResponseQuestion {
  id: string;
  text: string;
  options: MultipleResponseOption[];
  explanation?: string;  // Detailed explanation of the answer
  hint?: string;         // Optional hint for students
  points?: number;
  minCorrectOptions?: number; // Minimum number of correct options required
  maxCorrectOptions?: number; // Maximum number of correct options allowed
  partialCredit?: boolean;    // Whether partial credit is allowed
  tags?: string[];       // For AI categorization
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Multiple Response Activity Interface
 * Represents a complete multiple response activity
 */
export interface MultipleResponseActivity extends BaseActivity {
  activityType: 'multiple-response';
  questions: MultipleResponseQuestion[];
  settings?: ActivitySettings & {
    requireAllCorrect?: boolean; // Whether all correct options must be selected
    allowPartialCredit?: boolean; // Whether partial credit is allowed
  };
}

/**
 * Create a default multiple response activity
 * Used for initializing new activities
 */
export function createDefaultMultipleResponseActivity(): MultipleResponseActivity {
  return {
    id: generateId(),
    title: 'New Multiple Response Quiz',
    description: 'A multiple response quiz with sample questions',
    instructions: 'Read each question carefully and select ALL correct answers.',
    activityType: 'multiple-response',
    questions: [createDefaultMultipleResponseQuestion()],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: true,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      requireAllCorrect: true,
      allowPartialCredit: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default multiple response question
 * Used for adding new questions to an activity
 */
export function createDefaultMultipleResponseQuestion(): MultipleResponseQuestion {
  return {
    id: generateId(),
    text: 'New question',
    options: [
      { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
      { id: generateId(), text: 'Option 2', isCorrect: true, feedback: 'Correct!' },
      { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
      { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
    ],
    explanation: 'Explanation for the correct answers.',
    hint: 'Think about the question carefully and select all that apply.',
    points: 1,
    partialCredit: true
  };
}

/**
 * Create a default multiple response option
 * Used for adding new options to a question
 */
export function createDefaultMultipleResponseOption(isCorrect: boolean = false): MultipleResponseOption {
  return {
    id: generateId(),
    text: isCorrect ? 'Correct option' : 'Incorrect option',
    isCorrect: isCorrect,
    feedback: isCorrect ? 'Correct!' : 'Incorrect.'
  };
}
