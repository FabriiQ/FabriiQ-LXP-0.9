'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Sequence Item Interface
 * Represents a single item in a sequence
 */
export interface SequenceItem {
  id: string;
  text: string;
  correctPosition: number; // The correct position in the sequence (0-based)
  feedback?: string;       // Feedback for this item
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
}

/**
 * Sequence Question Interface
 * Represents a single question in a sequence activity
 */
export interface SequenceQuestion {
  id: string;
  text: string;
  items: SequenceItem[];
  explanation?: string;    // Detailed explanation of the correct sequence
  hint?: string;           // Optional hint for students
  points?: number;
  partialCredit?: boolean; // Whether partial credit is allowed
  tags?: string[];         // For AI categorization
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Sequence Activity Interface
 * Represents a complete sequence activity
 */
export interface SequenceActivity extends BaseActivity {
  activityType: 'sequence';
  questions: SequenceQuestion[];
  settings?: ActivitySettings & {
    allowPartialCredit?: boolean; // Whether partial credit is allowed
    shuffleItems?: boolean;       // Whether to shuffle the items
  };
}

/**
 * Create a default sequence activity
 * Used for initializing new activities
 */
export function createDefaultSequenceActivity(): SequenceActivity {
  return {
    id: generateId(),
    title: 'New Sequence Activity',
    description: 'A sequence activity with sample questions',
    instructions: 'Arrange the items in the correct order by dragging and dropping them.',
    activityType: 'sequence',
    questions: [createDefaultSequenceQuestion()],
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
 * Create a default sequence question
 * Used for adding new questions to an activity
 */
export function createDefaultSequenceQuestion(): SequenceQuestion {
  return {
    id: generateId(),
    text: 'Arrange the following events in chronological order',
    items: [
      createSequenceItem('First event in the sequence', 0),
      createSequenceItem('Second event in the sequence', 1),
      createSequenceItem('Third event in the sequence', 2),
      createSequenceItem('Fourth event in the sequence', 3)
    ],
    explanation: 'These events follow a chronological progression.',
    hint: 'Think about the logical order of these events.',
    points: 4,
    partialCredit: true
  };
}

/**
 * Create a sequence item
 * Used for adding new items to a question
 */
export function createSequenceItem(text: string, position: number): SequenceItem {
  return {
    id: generateId(),
    text,
    correctPosition: position,
    feedback: `This item belongs in position ${position + 1}.`
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

/**
 * Calculate the number of inversions in a sequence
 * Used for grading partial credit
 * 
 * @param sequence Array of positions
 * @returns Number of inversions
 */
export function countInversions(sequence: number[]): number {
  let inversions = 0;
  for (let i = 0; i < sequence.length; i++) {
    for (let j = i + 1; j < sequence.length; j++) {
      if (sequence[i] > sequence[j]) {
        inversions++;
      }
    }
  }
  return inversions;
}

/**
 * Calculate the Kendall tau distance between two sequences
 * Used for grading partial credit
 * 
 * @param sequence1 First sequence
 * @param sequence2 Second sequence
 * @returns Kendall tau distance (normalized between 0 and 1)
 */
export function kendallTauDistance(sequence1: number[], sequence2: number[]): number {
  if (sequence1.length !== sequence2.length) {
    throw new Error('Sequences must have the same length');
  }
  
  // Create pairs of indices and values for both sequences
  const pairs1 = sequence1.map((value, index) => ({ index, value }));
  const pairs2 = sequence2.map((value, index) => ({ index, value }));
  
  // Sort pairs by value
  pairs1.sort((a, b) => a.value - b.value);
  pairs2.sort((a, b) => a.value - b.value);
  
  // Create a mapping from value to rank
  const rank1 = new Array(sequence1.length);
  const rank2 = new Array(sequence2.length);
  
  for (let i = 0; i < sequence1.length; i++) {
    rank1[pairs1[i].index] = i;
    rank2[pairs2[i].index] = i;
  }
  
  // Count inversions
  let inversions = 0;
  const maxInversions = (sequence1.length * (sequence1.length - 1)) / 2;
  
  for (let i = 0; i < sequence1.length; i++) {
    for (let j = i + 1; j < sequence1.length; j++) {
      if ((rank1[i] < rank1[j] && rank2[i] > rank2[j]) || 
          (rank1[i] > rank1[j] && rank2[i] < rank2[j])) {
        inversions++;
      }
    }
  }
  
  // Normalize to [0, 1] where 0 means identical sequences
  return maxInversions > 0 ? inversions / maxInversions : 0;
}
