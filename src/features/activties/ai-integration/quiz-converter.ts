'use client';

/**
 * Quiz Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to quiz activities.
 */

import { 
  QuizActivity, 
  QuizQuestion, 
  QuizQuestionType,
  QuizQuestionOption,
  QuizMatchingPair,
  QuizSequenceItem,
  QuizFillInTheBlankBlank
} from '../models/quiz';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a quiz activity
 *
 * @param aiContent AI-generated content
 * @returns Quiz activity
 */
export function convertAIContentToQuizActivity(aiContent: any): QuizActivity {
  // Start with a default activity
  const activity: QuizActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Quiz Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Answer all questions and submit to complete the quiz.',
    activityType: 'quiz',
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
      showQuestionNumbers: aiContent.showQuestionNumbers ?? true,
      allowPartialCredit: aiContent.allowPartialCredit ?? true,
      showTimer: aiContent.showTimer ?? false,
      timeLimit: aiContent.timeLimit ?? 30,
      showProgressBar: aiContent.showProgressBar ?? true,
      allowNavigation: aiContent.allowNavigation ?? true,
      requireAllQuestions: aiContent.requireAllQuestions ?? true,
      showFeedbackAfterEachQuestion: aiContent.showFeedbackAfterEachQuestion ?? false
    }
  };

  // Find questions in the AI content (check all possible locations)
  const aiQuestions = aiContent.questions || 
                     aiContent.content?.questions || 
                     aiContent.config?.questions || 
                     [];

  // Convert each question to our format
  activity.questions = aiQuestions.map((q: any) => {
    // Determine question type
    let questionType: QuizQuestionType = 'multiple-choice'; // Default
    
    if (q.type) {
      // Use provided type if available
      questionType = q.type as QuizQuestionType;
    } else if (q.isTrue !== undefined) {
      // True/False question
      questionType = 'true-false';
    } else if (q.options && Array.isArray(q.options) && q.options.some((opt: any) => opt.isCorrect === true)) {
      // Multiple choice or multiple response
      const multipleCorrect = q.options.filter((opt: any) => opt.isCorrect === true).length > 1;
      questionType = multipleCorrect ? 'multiple-response' : 'multiple-choice';
    } else if (q.matchingPairs || q.pairs) {
      // Matching question
      questionType = 'matching';
    } else if (q.sequenceItems || q.items) {
      // Sequence question
      questionType = 'sequence';
    } else if (q.blanks || q.textWithBlanks) {
      // Fill in the blanks question
      questionType = 'fill-in-the-blanks';
    } else if (q.correctAnswer !== undefined && typeof q.correctAnswer === 'number') {
      // Numeric question
      questionType = 'numeric';
    }
    
    // Create base question
    const question: QuizQuestion = {
      id: q.id || generateId(),
      type: questionType,
      text: q.text || q.question || '',
      explanation: q.explanation || '',
      hint: q.hint || '',
      points: q.points || 1
    };
    
    // Add media if provided
    if (q.image || q.imageUrl) {
      question.media = {
        type: 'image',
        url: q.image || q.imageUrl,
        alt: q.imageAlt || q.alt || '',
        caption: q.imageCaption || q.caption || ''
      };
    } else if (q.additionalText) {
      question.media = {
        type: 'text',
        content: q.additionalText,
        caption: q.textCaption || ''
      };
    }
    
    // Add type-specific properties
    switch (questionType) {
      case 'multiple-choice':
      case 'multiple-response':
        // Add options
        if (q.options && Array.isArray(q.options)) {
          question.options = q.options.map((opt: any) => ({
            id: opt.id || generateId(),
            text: opt.text || '',
            isCorrect: opt.isCorrect || false,
            feedback: opt.feedback || ''
          }));
        } else if (q.choices && Array.isArray(q.choices)) {
          // Alternative format
          question.options = q.choices.map((choice: any) => {
            if (typeof choice === 'string') {
              return {
                id: generateId(),
                text: choice,
                isCorrect: false,
                feedback: ''
              };
            } else {
              return {
                id: choice.id || generateId(),
                text: choice.text || '',
                isCorrect: choice.isCorrect || choice.correct || false,
                feedback: choice.feedback || ''
              };
            }
          });
          
          // If no correct option is marked, mark the first one as correct
          if (!question.options.some(opt => opt.isCorrect)) {
            if (question.options.length > 0) {
              question.options[0].isCorrect = true;
            }
          }
        }
        
        // Ensure we have at least some options
        if (!question.options || question.options.length === 0) {
          question.options = [
            {
              id: generateId(),
              text: 'Option 1',
              isCorrect: true,
              feedback: ''
            },
            {
              id: generateId(),
              text: 'Option 2',
              isCorrect: false,
              feedback: ''
            }
          ];
        }
        break;
        
      case 'true-false':
        // Set isTrue property
        question.isTrue = q.isTrue || q.correctAnswer === true || false;
        break;
        
      case 'matching':
        // Add matching pairs
        const pairs = q.matchingPairs || q.pairs || [];
        if (pairs.length > 0) {
          question.matchingPairs = pairs.map((pair: any) => ({
            id: pair.id || generateId(),
            left: pair.left || pair.term || '',
            right: pair.right || pair.definition || ''
          }));
        } else {
          // Default pairs
          question.matchingPairs = [
            {
              id: generateId(),
              left: 'Item 1',
              right: 'Match 1'
            },
            {
              id: generateId(),
              left: 'Item 2',
              right: 'Match 2'
            }
          ];
        }
        break;
        
      case 'sequence':
        // Add sequence items
        const items = q.sequenceItems || q.items || [];
        if (items.length > 0) {
          question.sequenceItems = items.map((item: any, index: number) => ({
            id: item.id || generateId(),
            text: item.text || '',
            correctPosition: item.correctPosition !== undefined ? item.correctPosition : index
          }));
        } else {
          // Default items
          question.sequenceItems = [
            {
              id: generateId(),
              text: 'First item',
              correctPosition: 0
            },
            {
              id: generateId(),
              text: 'Second item',
              correctPosition: 1
            }
          ];
        }
        break;
        
      case 'fill-in-the-blanks':
        // Add blanks and text with blanks
        question.textWithBlanks = q.textWithBlanks || '';
        
        if (q.blanks && Array.isArray(q.blanks)) {
          question.blanks = q.blanks.map((blank: any) => ({
            id: blank.id || generateId(),
            acceptableAnswers: Array.isArray(blank.acceptableAnswers) ? blank.acceptableAnswers : [blank.acceptableAnswer || ''],
            feedback: blank.feedback || ''
          }));
        } else {
          // Default blanks
          question.blanks = [
            {
              id: 'blank1',
              acceptableAnswers: ['answer'],
              feedback: ''
            }
          ];
        }
        
        // If no text with blanks is provided, create a default one
        if (!question.textWithBlanks) {
          question.textWithBlanks = 'This is a [blank1] question.';
        }
        break;
        
      case 'numeric':
        // Add numeric properties
        question.correctAnswer = q.correctAnswer !== undefined ? parseFloat(q.correctAnswer) : 0;
        
        if (q.acceptableRange) {
          question.acceptableRange = {
            min: parseFloat(q.acceptableRange.min || q.acceptableRange[0] || question.correctAnswer - 0.01),
            max: parseFloat(q.acceptableRange.max || q.acceptableRange[1] || question.correctAnswer + 0.01)
          };
        } else if (q.tolerance) {
          // Handle tolerance format
          const tolerance = parseFloat(q.tolerance);
          question.acceptableRange = {
            min: question.correctAnswer - tolerance,
            max: question.correctAnswer + tolerance
          };
        }
        
        question.unit = q.unit || '';
        break;
    }
    
    return question;
  });

  // If no questions were found, add a default one
  if (activity.questions.length === 0) {
    activity.questions = [
      {
        id: generateId(),
        type: 'multiple-choice',
        text: 'What is the capital of France?',
        options: [
          {
            id: generateId(),
            text: 'Paris',
            isCorrect: true,
            feedback: 'Correct! Paris is the capital of France.'
          },
          {
            id: generateId(),
            text: 'London',
            isCorrect: false,
            feedback: 'Incorrect. London is the capital of the United Kingdom.'
          },
          {
            id: generateId(),
            text: 'Berlin',
            isCorrect: false,
            feedback: 'Incorrect. Berlin is the capital of Germany.'
          },
          {
            id: generateId(),
            text: 'Madrid',
            isCorrect: false,
            feedback: 'Incorrect. Madrid is the capital of Spain.'
          }
        ],
        explanation: 'Paris is the capital and most populous city of France.',
        hint: 'Think about the city with the Eiffel Tower.',
        points: 1
      }
    ];
  }

  return activity;
}
