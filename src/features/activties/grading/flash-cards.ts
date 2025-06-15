'use client';

/**
 * Flash Cards Activity Grading
 *
 * This file contains functions for grading flash cards activities.
 */

import { FlashCardsActivity } from '../models/flash-cards';
import { GradingResult } from '../models/base';

/**
 * Grade a flash cards activity
 * 
 * Flash cards are typically self-assessed, so this grading function
 * calculates a score based on the user's self-assessment.
 *
 * @param activity The activity to grade
 * @param knownCards Record of card IDs to boolean indicating if the user knew the card
 * @returns Grading result
 */
export function gradeFlashCardsActivity(
  activity: FlashCardsActivity,
  knownCards: Record<string, boolean>
): GradingResult {
  // Count total cards
  const totalCards = activity.decks.reduce(
    (total, deck) => total + deck.cards.length, 
    0
  );
  
  // Count known cards
  const knownCardsCount = Object.values(knownCards).filter(known => known).length;
  
  // Calculate percentage
  const percentage = totalCards > 0 ? (knownCardsCount / totalCards) * 100 : 0;
  
  // Determine if passed
  const passingPercentage = activity.settings?.passingPercentage || 60;
  const passed = percentage >= passingPercentage;

  // Return grading result
  return {
    score: knownCardsCount,
    maxScore: totalCards,
    percentage,
    passed,
    questionResults: [], // Flash cards don't have traditional questions
    completedAt: new Date()
  };
}
