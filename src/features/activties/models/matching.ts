'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Matching Pair Interface
 * Represents a single pair of items to be matched
 */
export interface MatchingPair {
  id: string;
  leftItem: {
    id: string;
    text: string;
    media?: {
      type: 'image' | 'video' | 'audio';
      url: string;
      alt?: string;
    };
  };
  rightItem: {
    id: string;
    text: string;
    media?: {
      type: 'image' | 'video' | 'audio';
      url: string;
      alt?: string;
    };
  };
  feedback?: string;  // Feedback for this pair
}

/**
 * Matching Question Interface
 * Represents a single question in a matching activity
 */
export interface MatchingQuestion {
  id: string;
  text: string;
  pairs: MatchingPair[];
  explanation?: string;  // Detailed explanation of the matches
  hint?: string;         // Optional hint for students
  points?: number;
  partialCredit?: boolean; // Whether partial credit is allowed
  tags?: string[];       // For AI categorization
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Matching Activity Interface
 * Represents a complete matching activity
 */
export interface MatchingActivity extends BaseActivity {
  activityType: 'matching';
  questions: MatchingQuestion[];
  settings?: ActivitySettings & {
    allowPartialCredit?: boolean; // Whether partial credit is allowed
    shuffleItems?: boolean;       // Whether to shuffle the right items
  };
}

/**
 * Create a default matching activity
 * Used for initializing new activities
 */
export function createDefaultMatchingActivity(): MatchingActivity {
  return {
    id: generateId(),
    title: 'New Matching Activity',
    description: 'A matching activity with sample questions',
    instructions: 'Match each item on the left with its corresponding item on the right.',
    activityType: 'matching',
    questions: [createDefaultMatchingQuestion()],
    settings: {
      shuffleQuestions: false,
      shuffleItems: true,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      allowPartialCredit: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default matching question
 * Used for adding new questions to an activity
 */
export function createDefaultMatchingQuestion(): MatchingQuestion {
  return {
    id: generateId(),
    text: 'Match the countries with their capitals',
    pairs: [
      createMatchingPair('France', 'Paris'),
      createMatchingPair('Germany', 'Berlin'),
      createMatchingPair('Italy', 'Rome'),
      createMatchingPair('Spain', 'Madrid')
    ],
    explanation: 'These are the capital cities of major European countries.',
    hint: 'Think about the major European capitals.',
    points: 4,
    partialCredit: true
  };
}

/**
 * Create a matching pair
 * Used for adding new pairs to a question
 */
export function createMatchingPair(leftText: string, rightText: string): MatchingPair {
  return {
    id: generateId(),
    leftItem: {
      id: generateId(),
      text: leftText
    },
    rightItem: {
      id: generateId(),
      text: rightText
    },
    feedback: `${leftText} is correctly matched with ${rightText}.`
  };
}

/**
 * Shuffle an array of items
 * Used for randomizing the order of items
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
