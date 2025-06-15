'use client';

/**
 * Numeric Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to numeric activities.
 */

import { NumericActivity, NumericQuestion } from '../models/numeric';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a numeric activity
 *
 * @param aiContent AI-generated content
 * @returns Numeric activity
 */
export function convertAIContentToNumericActivity(aiContent: any): NumericActivity {
  // Start with a default activity
  const activity: NumericActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Numeric Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Enter the correct numeric answer for each question.',
    activityType: 'numeric',
    questions: [],
    isGradable: aiContent.isGradable ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      shuffleQuestions: aiContent.shuffleQuestions ?? false,
      showFeedbackImmediately: aiContent.showFeedbackImmediately ?? true,
      showCorrectAnswers: aiContent.showCorrectAnswers ?? true,
      passingPercentage: aiContent.passingPercentage ?? 60,
      attemptsAllowed: aiContent.attemptsAllowed ?? 1,
      decimalPlaces: aiContent.decimalPlaces ?? 2,
      showCalculator: aiContent.showCalculator ?? true,
      requireUnit: aiContent.requireUnit ?? false,
      showFeedbackAfterEachQuestion: aiContent.showFeedbackAfterEachQuestion ?? true
    }
  };

  // Find questions in the AI content (check all possible locations)
  const aiQuestions = aiContent.questions || 
                     aiContent.content?.questions || 
                     aiContent.config?.questions || 
                     [];

  // Convert each question to our format
  activity.questions = aiQuestions.map((q: any) => {
    // Handle different question formats
    let text = '';
    let correctAnswer = 0;
    let acceptableRange: { min: number; max: number } | undefined = undefined;
    let unit = '';
    let explanation = '';
    let hint = '';
    let points = 1;
    let media: NumericQuestion['media'] = undefined;

    // Extract question text
    if (typeof q === 'string') {
      // Simple string format - assume it's just the question text
      text = q;
    } else {
      // Object format
      text = q.text || q.question || '';
      correctAnswer = parseFloat(q.correctAnswer || q.answer || '0');
      unit = q.unit || '';
      explanation = q.explanation || '';
      hint = q.hint || '';
      points = parseInt(q.points || '1');
      
      // Handle acceptable range
      if (q.acceptableRange) {
        acceptableRange = {
          min: parseFloat(q.acceptableRange.min || q.acceptableRange[0] || correctAnswer - 0.01),
          max: parseFloat(q.acceptableRange.max || q.acceptableRange[1] || correctAnswer + 0.01)
        };
      } else if (q.tolerance) {
        // Handle tolerance format
        const tolerance = parseFloat(q.tolerance);
        acceptableRange = {
          min: correctAnswer - tolerance,
          max: correctAnswer + tolerance
        };
      }
      
      // Handle media
      if (q.image || q.imageUrl) {
        media = {
          type: 'image',
          url: q.image || q.imageUrl,
          alt: q.imageAlt || q.alt || '',
          caption: q.imageCaption || q.caption || ''
        };
      } else if (q.additionalText) {
        media = {
          type: 'text',
          content: q.additionalText,
          caption: q.textCaption || ''
        };
      }
    }

    // Create the question
    return {
      id: q.id || generateId(),
      text,
      correctAnswer,
      acceptableRange,
      unit,
      explanation,
      hint,
      points,
      media
    };
  });

  // If no questions were found, add a default one
  if (activity.questions.length === 0) {
    activity.questions = [
      {
        id: generateId(),
        text: 'What is the value of π (pi) to 2 decimal places?',
        correctAnswer: 3.14,
        acceptableRange: {
          min: 3.13,
          max: 3.15
        },
        unit: '',
        explanation: 'The value of π (pi) is approximately 3.14159...',
        hint: 'Round to 2 decimal places.',
        points: 1
      }
    ];
  }

  return activity;
}
