'use client';

/**
 * Book Activity Models
 *
 * This file contains the data models for book activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';
import { ReadingSection } from './reading';

/**
 * Book Checkpoint Interface
 * Represents an embedded activity checkpoint within a book section
 */
export interface BookCheckpoint {
  id: string;
  activityId: string;
  activityType: string; // 'multiple_choice', 'fill_in_the_blanks', etc.
  title: string;
  description?: string;
  isRequired: boolean; // If true, must be completed to proceed
  position: 'before' | 'after' | 'middle'; // Position relative to section content
  content?: any; // The actual activity content (optional, can be loaded separately)
}

/**
 * Book Section Interface
 * Extends ReadingSection to include checkpoints
 */
export interface BookSection extends ReadingSection {
  checkpoints?: BookCheckpoint[];
}

/**
 * Book Activity Interface
 * Represents a complete book activity with sections and checkpoints
 */
export interface BookActivity extends BaseActivity {
  activityType: 'book';
  learningActivityType: 'BOOK';
  sections: BookSection[];
  settings?: ActivitySettings & {
    showTableOfContents?: boolean;
    enableTextToSpeech?: boolean;
    enableHighlighting?: boolean;
    enableNotes?: boolean;
    readingTimeEstimate?: number; // in minutes
    showProgressBar?: boolean;
    fontSizeAdjustable?: boolean;
    checkpointStyle?: 'inline' | 'modal' | 'sidebar';
    requireCheckpointCompletion?: boolean;
    showCheckpointFeedback?: boolean;
  };
}

/**
 * Create a default book activity
 * Used for initializing new activities
 */
export function createDefaultBookActivity(): BookActivity {
  return {
    id: generateId(),
    title: 'New Book Activity',
    description: 'An interactive book with reading sections and activity checkpoints',
    instructions: 'Read through the content and complete the activities to progress.',
    activityType: 'book',
    learningActivityType: 'BOOK',
    sections: [createDefaultBookSection()],
    settings: {
      showTableOfContents: true,
      enableTextToSpeech: true,
      enableHighlighting: true,
      enableNotes: true,
      readingTimeEstimate: 10,
      showProgressBar: true,
      fontSizeAdjustable: true,
      checkpointStyle: 'inline',
      requireCheckpointCompletion: true,
      showCheckpointFeedback: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default book section
 * Used for adding new sections to a book activity
 */
export function createDefaultBookSection(): BookSection {
  return {
    id: generateId(),
    title: 'Introduction',
    content: `
      <h2>Introduction</h2>
      <p>This is a sample book section. You can edit this content using the rich text editor.</p>
      <p>Book activities combine reading with interactive checkpoints to enhance learning.</p>
    `,
    checkpoints: []
  };
}

/**
 * Create a default book checkpoint
 * Used for adding new checkpoints to a book section
 */
export function createDefaultBookCheckpoint(activityType: string = 'multiple_choice'): BookCheckpoint {
  return {
    id: generateId(),
    activityId: '', // Will be set when an activity is selected or created
    activityType,
    title: 'Checkpoint Question',
    description: 'Answer this question to continue',
    isRequired: true,
    position: 'after'
  };
}
