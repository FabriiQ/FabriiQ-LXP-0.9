'use client';

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Fill in the Blanks Blank Interface
 * Represents a single blank in a fill in the blanks question
 */
export interface FillInTheBlanksBlank {
  id: string;
  correctAnswers: string[];  // Array of acceptable answers
  caseSensitive?: boolean;   // Whether answers are case sensitive
  feedback?: string;         // Feedback for this blank
  size?: number;             // Visual size of the blank (in characters)
}

/**
 * Fill in the Blanks Question Interface
 * Represents a single question in a fill in the blanks activity
 */
export interface FillInTheBlanksQuestion {
  id: string;
  text: string;              // Text with placeholders for blanks: "The capital of France is {{0}}"
  blanks: FillInTheBlanksBlank[];
  explanation?: string;      // Detailed explanation of the answer
  hint?: string;             // Optional hint for students
  points?: number;
  partialCredit?: boolean;   // Whether partial credit is allowed
  tags?: string[];           // For AI categorization
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Fill in the Blanks Activity Interface
 * Represents a complete fill in the blanks activity
 */
export interface FillInTheBlanksActivity extends BaseActivity {
  activityType: 'fill-in-the-blanks';
  questions: FillInTheBlanksQuestion[];
  settings?: ActivitySettings & {
    allowPartialCredit?: boolean; // Whether partial credit is allowed
    caseSensitiveByDefault?: boolean; // Default case sensitivity for all blanks
  };
}

/**
 * Create a default fill in the blanks activity
 * Used for initializing new activities
 */
export function createDefaultFillInTheBlanksActivity(): FillInTheBlanksActivity {
  return {
    id: generateId(),
    title: 'New Fill in the Blanks Activity',
    description: 'A fill in the blanks activity with sample questions',
    instructions: 'Read each sentence carefully and fill in the blanks with the correct words.',
    activityType: 'fill-in-the-blanks',
    questions: [createDefaultFillInTheBlanksQuestion()],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      allowPartialCredit: true,
      caseSensitiveByDefault: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default fill in the blanks question
 * Used for adding new questions to an activity
 */
export function createDefaultFillInTheBlanksQuestion(): FillInTheBlanksQuestion {
  const blank1Id = generateId();
  const blank2Id = generateId();
  
  return {
    id: generateId(),
    text: 'The capital of France is {{' + blank1Id + '}} and the capital of Italy is {{' + blank2Id + '}}.',
    blanks: [
      {
        id: blank1Id,
        correctAnswers: ['Paris'],
        caseSensitive: false,
        feedback: 'Paris is the capital of France.'
      },
      {
        id: blank2Id,
        correctAnswers: ['Rome'],
        caseSensitive: false,
        feedback: 'Rome is the capital of Italy.'
      }
    ],
    explanation: 'Paris is the capital of France, and Rome is the capital of Italy.',
    hint: 'Think about the major European capitals.',
    points: 2,
    partialCredit: true
  };
}

/**
 * Create a default blank
 * Used for adding new blanks to a question
 */
export function createDefaultBlank(): FillInTheBlanksBlank {
  return {
    id: generateId(),
    correctAnswers: ['answer'],
    caseSensitive: false,
    feedback: 'Feedback for this blank'
  };
}

/**
 * Parse text with blanks
 * Extracts the text parts and blank IDs from a text with placeholders
 * 
 * @param text Text with placeholders like "The capital of France is {{blankId}}"
 * @returns Array of text parts and blank IDs
 */
export function parseTextWithBlanks(text: string): { type: 'text' | 'blank', content: string }[] {
  const parts: { type: 'text' | 'blank', content: string }[] = [];
  let currentIndex = 0;
  
  // Regular expression to match {{blankId}}
  const blankRegex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = blankRegex.exec(text)) !== null) {
    // Add text before the blank
    if (match.index > currentIndex) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex, match.index)
      });
    }
    
    // Add the blank ID
    parts.push({
      type: 'blank',
      content: match[1]
    });
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (currentIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(currentIndex)
    });
  }
  
  return parts;
}

/**
 * Format text with blanks
 * Replaces blank IDs with their index for display
 * 
 * @param text Text with placeholders like "The capital of France is {{blankId}}"
 * @param blanks Array of blanks
 * @returns Text with blanks replaced by their index: "The capital of France is _____(1)"
 */
export function formatTextWithBlanks(text: string, blanks: FillInTheBlanksBlank[]): string {
  let formattedText = text;
  
  // Create a map of blank IDs to their index
  const blankMap = new Map<string, number>();
  blanks.forEach((blank, index) => {
    blankMap.set(blank.id, index + 1);
  });
  
  // Replace each {{blankId}} with _____(index)
  blanks.forEach(blank => {
    const index = blankMap.get(blank.id);
    const placeholder = `{{${blank.id}}}`;
    const replacement = `_____(${index})`;
    formattedText = formattedText.replace(placeholder, replacement);
  });
  
  return formattedText;
}
