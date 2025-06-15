'use client';

/**
 * Drag the Words Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to drag the words activities.
 */

import { DragTheWordsActivity, DragTheWordsQuestion, DraggableWord, parseTextWithPlaceholders, createDraggableWordsFromText } from '../models/drag-the-words';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a drag the words activity
 *
 * @param aiContent AI-generated content
 * @returns Drag the words activity
 */
export function convertAIContentToDragTheWordsActivity(aiContent: any): DragTheWordsActivity {
  // Start with a default activity
  const activity: DragTheWordsActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Drag the Words Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Drag the words to their correct positions in the text.',
    activityType: 'drag-the-words',
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
      showWordBank: aiContent.showWordBank ?? true,
      highlightCorrectPositions: aiContent.highlightCorrectPositions ?? true,
      caseSensitive: aiContent.caseSensitive ?? false,
      allowSpaces: aiContent.allowSpaces ?? true
    }
  };

  // Find questions in the AI content (check all possible locations)
  const aiQuestions = aiContent.questions || 
                     aiContent.content?.questions || 
                     aiContent.config?.questions || 
                     [];

  // Convert each question to our format
  activity.questions = aiQuestions.map((q: any) => {
    // Get the text with placeholders
    let text = q.text || q.question || '';
    
    // If the text doesn't have placeholders, try to create them
    if (!text.includes('*')) {
      // Check if there are words and positions
      if (q.words && Array.isArray(q.words)) {
        // Try to create text with placeholders from words
        q.words.forEach((word: any) => {
          const wordText = typeof word === 'string' ? word : word.text;
          if (wordText && text.includes(wordText)) {
            text = text.replace(wordText, `*${wordText}*`);
          }
        });
      }
    }
    
    // Create words from the text
    let words: DraggableWord[] = [];
    
    if (text.includes('*')) {
      // Extract words from the text
      words = createDraggableWordsFromText(text);
    } else if (q.words && Array.isArray(q.words)) {
      // Use provided words
      words = q.words.map((word: any, index: number) => {
        const wordText = typeof word === 'string' ? word : word.text;
        const correctIndex = typeof word === 'object' && word.correctIndex !== undefined ? 
          word.correctIndex : index;
        
        return {
          id: generateId(),
          text: wordText,
          correctIndex,
          feedback: typeof word === 'object' && word.feedback ? 
            word.feedback : `Correct! "${wordText}" is in the right position.`
        };
      });
      
      // If we have words but no placeholders, create a text with placeholders
      if (words.length > 0 && !text.includes('*')) {
        const parts = text.split(' ');
        const newParts = [...parts];
        
        // Replace some words with placeholders
        words.forEach(word => {
          const index = parts.findIndex(part => 
            part === word.text || 
            part.includes(word.text)
          );
          
          if (index !== -1) {
            newParts[index] = newParts[index].replace(word.text, `*${word.text}*`);
          }
        });
        
        text = newParts.join(' ');
      }
    }
    
    // If we still don't have a proper text with placeholders, create a default one
    if (!text.includes('*') || words.length === 0) {
      text = 'The *quick* *brown* fox jumps over the *lazy* dog.';
      words = createDraggableWordsFromText(text);
    }

    // Create the question
    return {
      id: q.id || generateId(),
      text,
      words,
      explanation: q.explanation || '',
      hint: q.hint || '',
      points: q.points || words.length
    };
  });

  // If no questions were found, add a default one
  if (activity.questions.length === 0) {
    const defaultText = 'The *quick* *brown* fox jumps over the *lazy* dog.';
    
    activity.questions = [
      {
        id: generateId(),
        text: defaultText,
        words: createDraggableWordsFromText(defaultText),
        explanation: 'This is a common English pangram that contains all the letters of the alphabet.',
        hint: 'Think about the common characteristics of foxes and dogs.',
        points: 3
      }
    ];
  }

  return activity;
}
