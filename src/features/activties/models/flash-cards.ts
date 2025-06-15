'use client';

/**
 * Flash Cards Activity Models
 *
 * This file contains the data models for flash cards activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Flash Card Interface
 * Represents a single flash card in a flash cards activity
 */
export interface FlashCard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
  media?: {
    front?: {
      type: 'image' | 'text';
      url?: string; // Optional for text type
      content?: string; // For text type
      alt?: string;
      caption?: string;
    };
    back?: {
      type: 'image' | 'text';
      url?: string; // Optional for text type
      content?: string; // For text type
      alt?: string;
      caption?: string;
    };
  };
}

/**
 * Flash Card Deck Interface
 * Represents a deck of flash cards in a flash cards activity
 */
export interface FlashCardDeck {
  id: string;
  title: string;
  description?: string;
  cards: FlashCard[];
}

/**
 * Flash Cards Activity Interface
 * Represents a complete flash cards activity
 */
export interface FlashCardsActivity extends BaseActivity {
  activityType: 'flash-cards';
  decks: FlashCardDeck[];
  settings?: ActivitySettings & {
    flipAnimation?: 'flip' | 'slide' | 'fade';
    showProgress?: boolean;
    allowSelfAssessment?: boolean;
    spaceRepetition?: boolean;
    cardDisplayTime?: number; // in seconds
    autoFlip?: boolean;
  };
}

/**
 * Create a default flash cards activity
 * Used for initializing new activities
 */
export function createDefaultFlashCardsActivity(): FlashCardsActivity {
  return {
    id: generateId(),
    title: 'New Flash Cards Activity',
    description: 'A flash cards activity with sample cards',
    instructions: 'Click on a card to flip it and reveal the answer.',
    activityType: 'flash-cards',
    decks: [createDefaultFlashCardDeck()],
    settings: {
      shuffleQuestions: true,
      showFeedbackImmediately: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      flipAnimation: 'flip',
      showProgress: true,
      allowSelfAssessment: true,
      spaceRepetition: false,
      cardDisplayTime: 0, // 0 means no auto-flip
      autoFlip: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default flash card deck
 * Used for adding new decks to an activity
 */
export function createDefaultFlashCardDeck(): FlashCardDeck {
  return {
    id: generateId(),
    title: 'New Deck',
    description: 'A deck of flash cards',
    cards: [
      createDefaultFlashCard('What is the capital of France?', 'Paris'),
      createDefaultFlashCard('What is the capital of Japan?', 'Tokyo'),
      createDefaultFlashCard('What is the capital of Australia?', 'Canberra')
    ]
  };
}

/**
 * Create a default flash card
 * Used for adding new cards to a deck
 */
export function createDefaultFlashCard(front: string = 'Front of card', back: string = 'Back of card'): FlashCard {
  return {
    id: generateId(),
    front,
    back,
    hint: '',
    tags: []
  };
}
