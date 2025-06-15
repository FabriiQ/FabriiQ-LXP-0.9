'use client';

/**
 * Reading Activity Models
 *
 * This file contains the data models for reading activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Reading Section Interface
 * Represents a section in a reading activity
 */
export interface ReadingSection {
  id: string;
  title: string;
  content: string; // Rich text content
  media?: {
    type: 'image' | 'text';
    url?: string;
    content?: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Reading Activity Interface
 * Represents a complete reading activity
 */
export interface ReadingActivity extends BaseActivity {
  activityType: 'reading';
  sections: ReadingSection[];
  settings?: ActivitySettings & {
    showTableOfContents?: boolean;
    enableTextToSpeech?: boolean;
    enableHighlighting?: boolean;
    enableNotes?: boolean;
    readingTimeEstimate?: number; // in minutes
    showProgressBar?: boolean;
    fontSizeAdjustable?: boolean;
  };
}

/**
 * Create a default reading activity
 * Used for initializing new activities
 */
export function createDefaultReadingActivity(): ReadingActivity {
  return {
    id: generateId(),
    title: 'New Reading Activity',
    description: 'A reading activity with sample content',
    instructions: 'Read through the content at your own pace.',
    activityType: 'reading',
    sections: [createDefaultReadingSection()],
    settings: {
      showTableOfContents: true,
      enableTextToSpeech: true,
      enableHighlighting: true,
      enableNotes: true,
      readingTimeEstimate: 5,
      showProgressBar: true,
      fontSizeAdjustable: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default reading section
 * Used for adding new sections to a reading activity
 */
export function createDefaultReadingSection(): ReadingSection {
  return {
    id: generateId(),
    title: 'Introduction',
    content: `
      <h2>Introduction</h2>
      <p>This is a sample reading section. You can edit this content using the rich text editor.</p>
      <p>Reading activities are designed to provide students with informative content that they can read at their own pace.</p>
      <p>You can include:</p>
      <ul>
        <li>Text formatting (bold, italic, etc.)</li>
        <li>Lists (ordered and unordered)</li>
        <li>Images</li>
        <li>Tables</li>
        <li>And more!</li>
      </ul>
    `
  };
}
