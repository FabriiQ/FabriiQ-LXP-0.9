'use client';

/**
 * Drag the Words Activity Models
 *
 * This file contains the data models for drag the words activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Draggable Word Interface
 * Represents a draggable word in a drag the words activity
 */
export interface DraggableWord {
  id: string;
  text: string;
  correctIndex: number;
  feedback?: string;
}

/**
 * Drag the Words Question Interface
 * Represents a single question in a drag the words activity
 */
export interface DragTheWordsQuestion {
  id: string;
  text: string;
  words: DraggableWord[];
  explanation?: string;
  hint?: string;
  points?: number;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Drag the Words Activity Interface
 * Represents a complete drag the words activity
 */
export interface DragTheWordsActivity extends BaseActivity {
  activityType: 'drag-the-words';
  questions: DragTheWordsQuestion[];
  settings?: ActivitySettings & {
    showWordBank?: boolean;
    highlightCorrectPositions?: boolean;
    caseSensitive?: boolean;
    allowSpaces?: boolean;
  };
}

/**
 * Create a default drag the words activity
 * Used for initializing new activities
 */
export function createDefaultDragTheWordsActivity(): DragTheWordsActivity {
  return {
    id: generateId(),
    title: 'New Drag the Words Activity',
    description: 'A drag the words activity with sample questions',
    instructions: 'Drag the words to their correct positions in the text.',
    activityType: 'drag-the-words',
    questions: [createDefaultDragTheWordsQuestion()],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      showWordBank: true,
      highlightCorrectPositions: true,
      caseSensitive: false,
      allowSpaces: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default drag the words question
 * Used for adding new questions to an activity
 */
export function createDefaultDragTheWordsQuestion(): DragTheWordsQuestion {
  return {
    id: generateId(),
    text: 'The quick *brown* fox jumps over the *lazy* dog.',
    words: [
      {
        id: generateId(),
        text: 'brown',
        correctIndex: 0,
        feedback: 'Correct! The fox is brown.'
      },
      {
        id: generateId(),
        text: 'lazy',
        correctIndex: 1,
        feedback: 'Correct! The dog is lazy.'
      }
    ],
    explanation: 'This is a common English pangram that contains all the letters of the alphabet.',
    hint: 'Think about the common characteristics of foxes and dogs.',
    points: 2
  };
}

/**
 * Parse text with placeholders
 * Converts text with asterisks (*) into an array of text parts and placeholder indices
 * 
 * @param text Text with placeholders marked by asterisks (*)
 * @returns Array of text parts and placeholder indices
 */
export function parseTextWithPlaceholders(text: string): Array<{ type: 'text' | 'placeholder', content: string, index?: number }> {
  const parts: Array<{ type: 'text' | 'placeholder', content: string, index?: number }> = [];
  let currentText = '';
  let inPlaceholder = false;
  let placeholderIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '*') {
      if (inPlaceholder) {
        // End of placeholder
        parts.push({ type: 'placeholder', content: currentText, index: placeholderIndex });
        placeholderIndex++;
        currentText = '';
        inPlaceholder = false;
      } else {
        // Start of placeholder
        if (currentText) {
          parts.push({ type: 'text', content: currentText });
          currentText = '';
        }
        inPlaceholder = true;
      }
    } else {
      currentText += char;
    }
  }
  
  // Add any remaining text
  if (currentText) {
    parts.push({ type: 'text', content: currentText });
  }
  
  return parts;
}

/**
 * Extract words from text with placeholders
 * Extracts words marked by asterisks (*) from the text
 * 
 * @param text Text with words marked by asterisks (*)
 * @returns Array of extracted words
 */
export function extractWordsFromText(text: string): string[] {
  const words: string[] = [];
  let inWord = false;
  let currentWord = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '*') {
      if (inWord) {
        // End of word
        words.push(currentWord);
        currentWord = '';
        inWord = false;
      } else {
        // Start of word
        inWord = true;
      }
    } else if (inWord) {
      currentWord += char;
    }
  }
  
  return words;
}

/**
 * Create draggable words from text
 * Creates draggable words from text with placeholders
 * 
 * @param text Text with placeholders marked by asterisks (*)
 * @returns Array of draggable words
 */
export function createDraggableWordsFromText(text: string): DraggableWord[] {
  const words = extractWordsFromText(text);
  
  return words.map((word, index) => ({
    id: generateId(),
    text: word,
    correctIndex: index,
    feedback: `Correct! "${word}" is in the right position.`
  }));
}
