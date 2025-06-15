'use client';

/**
 * Flash Cards Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to flash cards activities.
 */

import { FlashCardsActivity, FlashCardDeck, FlashCard } from '../models/flash-cards';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a flash cards activity
 *
 * @param aiContent AI-generated content
 * @returns Flash cards activity
 */
export function convertAIContentToFlashCardsActivity(aiContent: any): FlashCardsActivity {
  // Start with a default activity
  const activity: FlashCardsActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Flash Cards Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Click on a card to flip it and reveal the answer.',
    activityType: 'flash-cards',
    decks: [],
    isGradable: aiContent.isGradable ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      shuffleQuestions: aiContent.shuffleQuestions ?? true,
      showFeedbackImmediately: aiContent.showFeedbackImmediately ?? true,
      passingPercentage: aiContent.passingPercentage ?? 60,
      attemptsAllowed: aiContent.attemptsAllowed ?? 1,
      flipAnimation: aiContent.flipAnimation || 'flip',
      showProgress: aiContent.showProgress ?? true,
      allowSelfAssessment: aiContent.allowSelfAssessment ?? true,
      spaceRepetition: aiContent.spaceRepetition ?? false,
      cardDisplayTime: aiContent.cardDisplayTime ?? 0,
      autoFlip: aiContent.autoFlip ?? false
    }
  };

  // Find decks in the AI content (check all possible locations)
  const aiDecks = aiContent.decks || 
                 aiContent.content?.decks || 
                 aiContent.config?.decks || 
                 [];

  // If there are no decks but there are cards, create a single deck
  if (aiDecks.length === 0 && (aiContent.cards || aiContent.content?.cards || aiContent.config?.cards)) {
    const cards = aiContent.cards || aiContent.content?.cards || aiContent.config?.cards || [];
    
    if (cards.length > 0) {
      aiDecks.push({
        title: 'Default Deck',
        cards
      });
    }
  }

  // Convert each deck to our format
  activity.decks = aiDecks.map((deck: any) => {
    // Create cards
    const cards: FlashCard[] = (deck.cards || []).map((card: any) => {
      // Handle different card formats
      let front = '';
      let back = '';
      let hint = '';
      let tags: string[] = [];
      let media: FlashCard['media'] = {};

      if (typeof card === 'string') {
        // Simple string format - split by delimiter
        const parts = card.split('|').map(part => part.trim());
        front = parts[0] || '';
        back = parts[1] || '';
      } else if (card.front !== undefined && card.back !== undefined) {
        // Object with front and back properties
        front = card.front;
        back = card.back;
        hint = card.hint || '';
        tags = card.tags || [];
        
        // Handle media
        if (card.frontImage || card.frontImageUrl) {
          media.front = {
            type: 'image',
            url: card.frontImage || card.frontImageUrl,
            alt: card.frontImageAlt || '',
            caption: card.frontImageCaption || ''
          };
        } else if (card.frontText) {
          media.front = {
            type: 'text',
            content: card.frontText,
            caption: card.frontTextCaption || ''
          };
        }
        
        if (card.backImage || card.backImageUrl) {
          media.back = {
            type: 'image',
            url: card.backImage || card.backImageUrl,
            alt: card.backImageAlt || '',
            caption: card.backImageCaption || ''
          };
        } else if (card.backText) {
          media.back = {
            type: 'text',
            content: card.backText,
            caption: card.backTextCaption || ''
          };
        }
      } else if (card.question !== undefined && card.answer !== undefined) {
        // Object with question and answer properties
        front = card.question;
        back = card.answer;
        hint = card.hint || '';
        tags = card.tags || [];
      } else if (card.term !== undefined && card.definition !== undefined) {
        // Object with term and definition properties
        front = card.term;
        back = card.definition;
        hint = card.hint || '';
        tags = card.tags || [];
      }

      return {
        id: card.id || generateId(),
        front,
        back,
        hint,
        tags,
        media: Object.keys(media).length > 0 ? media : undefined
      };
    });

    // If no cards were found, add a default one
    if (cards.length === 0) {
      cards.push({
        id: generateId(),
        front: 'Sample Question',
        back: 'Sample Answer',
        hint: '',
        tags: []
      });
    }

    // Create the deck
    return {
      id: deck.id || generateId(),
      title: deck.title || 'New Deck',
      description: deck.description || '',
      cards
    };
  });

  // If no decks were found, add a default one
  if (activity.decks.length === 0) {
    activity.decks = [
      {
        id: generateId(),
        title: 'Default Deck',
        description: 'A deck of flash cards',
        cards: [
          {
            id: generateId(),
            front: 'What is the capital of France?',
            back: 'Paris',
            hint: '',
            tags: []
          },
          {
            id: generateId(),
            front: 'What is the capital of Japan?',
            back: 'Tokyo',
            hint: '',
            tags: []
          },
          {
            id: generateId(),
            front: 'What is the capital of Australia?',
            back: 'Canberra',
            hint: '',
            tags: []
          }
        ]
      }
    ];
  }

  return activity;
}
