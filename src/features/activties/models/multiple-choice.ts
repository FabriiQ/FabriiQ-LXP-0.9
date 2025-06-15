'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Multiple Choice Option Interface
 * Represents a single option in a multiple choice question
 */
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

/**
 * Multiple Choice Question Interface
 * Represents a single question in a multiple choice activity
 */
export interface MultipleChoiceQuestion {
  id: string;
  text: string;
  options: MultipleChoiceOption[];
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
 * Multiple Choice Activity Interface
 * Represents a complete multiple choice activity
 */
export interface MultipleChoiceActivity extends BaseActivity {
  activityType: 'multiple-choice';
  questions: MultipleChoiceQuestion[];
  settings?: ActivitySettings;
}

/**
 * Create a default multiple choice activity
 * Used for initializing new activities
 */
export function createDefaultMultipleChoiceActivity(): MultipleChoiceActivity {
  return {
    id: generateId(),
    title: 'New Multiple Choice Quiz',
    description: 'A multiple choice quiz with sample questions',
    instructions: 'Read each question carefully and select the best answer.',
    activityType: 'multiple-choice',
    questions: [createDefaultMultipleChoiceQuestion()],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: true,
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
 * Create a default multiple choice question
 * Used for adding new questions to an activity
 */
export function createDefaultMultipleChoiceQuestion(): MultipleChoiceQuestion {
  return {
    id: generateId(),
    text: 'New question',
    options: [
      { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
      { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
      { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
      { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
    ],
    explanation: 'Explanation for the correct answer.',
    hint: 'Think about the question carefully.',
    points: 1
  };
}

/**
 * Create a default multiple choice option
 * Used for adding new options to a question
 */
export function createDefaultMultipleChoiceOption(isCorrect: boolean = false): MultipleChoiceOption {
  return {
    id: generateId(),
    text: isCorrect ? 'Correct option' : 'Incorrect option',
    isCorrect: isCorrect,
    feedback: isCorrect ? 'Correct!' : 'Incorrect.'
  };
}
