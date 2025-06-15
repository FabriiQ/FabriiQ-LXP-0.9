/**
 * JSON Parser for Question Bank
 * 
 * This utility provides functions for parsing JSON files into question objects
 * that can be imported into the question bank.
 */

import { 
  CreateQuestionInput, 
  QuestionType, 
  DifficultyLevel 
} from '../models/types';
import { convertRowToQuestion } from './parser-utils';

// Define the interface for validation errors
interface ValidationError {
  row: number;
  errors: string[];
}

// Define the interface for parse result
interface ParseResult {
  questions: CreateQuestionInput[];
  errors: ValidationError[];
  totalRows: number;
  successfulRows: number;
}

/**
 * Parse a JSON file into question objects
 * @param file The JSON file to parse
 * @param questionBankId The ID of the question bank to import into
 * @returns A promise that resolves to the parse result
 */
export async function parseJSON(file: File, questionBankId: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const jsonData = JSON.parse(jsonString);
        
        // Check if the JSON is an array of questions
        if (!Array.isArray(jsonData)) {
          throw new Error('JSON data must be an array of questions');
        }
        
        const questions: CreateQuestionInput[] = [];
        const errors: ValidationError[] = [];
        const totalRows = jsonData.length;
        
        jsonData.forEach((row: any, index: number) => {
          try {
            const question = convertRowToQuestion(row, questionBankId, index + 1);
            if (question) {
              questions.push(question);
            }
          } catch (error) {
            errors.push({
              row: index + 1,
              errors: [(error as Error).message]
            });
          }
        });
        
        resolve({
          questions,
          errors,
          totalRows,
          successfulRows: questions.length
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON file: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read JSON file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Generate a sample JSON file for a specific question type
 * @param questionType The type of question
 * @returns The sample JSON file as a string
 */
export function generateSampleJSON(questionType: QuestionType): string {
  // Create a sample question based on the question type
  const sampleQuestion = createSampleQuestion(questionType);
  
  // Convert to JSON string with pretty formatting
  return JSON.stringify([sampleQuestion], null, 2);
}

/**
 * Create a sample question object for a specific question type
 * @param questionType The type of question
 * @returns The sample question object
 */
function createSampleQuestion(questionType: QuestionType): any {
  const baseQuestion = {
    title: `Sample ${questionType} Question`,
    questionType,
    difficulty: DifficultyLevel.MEDIUM,
    subjectId: 'subject-123',
    courseId: 'course-456',
    topicId: 'topic-789',
    gradeLevel: 5,
    year: 2023,
    sourceReference: 'Sample Source'
  };
  
  let content: any = {};
  
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      content = {
        text: 'What is the capital of France?',
        options: [
          { id: 'option-1', text: 'Paris', isCorrect: true },
          { id: 'option-2', text: 'London', isCorrect: false },
          { id: 'option-3', text: 'Berlin', isCorrect: false },
          { id: 'option-4', text: 'Madrid', isCorrect: false }
        ],
        explanation: 'Paris is the capital of France.',
        hint: 'Think of the Eiffel Tower.'
      };
      break;
    
    case QuestionType.TRUE_FALSE:
      content = {
        text: 'Paris is the capital of France.',
        correctAnswer: true,
        explanation: 'Paris is indeed the capital of France.',
        hint: 'Think of the Eiffel Tower.'
      };
      break;
    
    case QuestionType.MULTIPLE_RESPONSE:
      content = {
        text: 'Which of the following are planets in our solar system?',
        options: [
          { id: 'option-1', text: 'Earth', isCorrect: true },
          { id: 'option-2', text: 'Mars', isCorrect: true },
          { id: 'option-3', text: 'Sun', isCorrect: false },
          { id: 'option-4', text: 'Moon', isCorrect: false }
        ],
        explanation: 'Earth and Mars are planets in our solar system.',
        hint: 'The Sun is a star, and the Moon is a satellite.',
        requireAllCorrect: false
      };
      break;
    
    case QuestionType.FILL_IN_THE_BLANKS:
      content = {
        text: 'The capital of France is [blank1] and the capital of Germany is [blank2].',
        blanks: [
          { id: 'blank1', correctAnswers: ['Paris'], feedback: 'Correct!' },
          { id: 'blank2', correctAnswers: ['Berlin'], feedback: 'Correct!' }
        ],
        explanation: 'Paris is the capital of France, and Berlin is the capital of Germany.',
        hint: 'Think of famous landmarks in these cities.',
        caseSensitive: false
      };
      break;
    
    case QuestionType.MATCHING:
      content = {
        text: 'Match the countries with their capitals.',
        pairs: [
          { id: 'pair-1', left: 'France', right: 'Paris' },
          { id: 'pair-2', left: 'Germany', right: 'Berlin' },
          { id: 'pair-3', left: 'Spain', right: 'Madrid' },
          { id: 'pair-4', left: 'Italy', right: 'Rome' }
        ],
        explanation: 'These are the correct matches of countries and their capitals.',
        hint: 'Think of famous landmarks in these cities.'
      };
      break;
    
    case QuestionType.DRAG_AND_DROP:
      content = {
        text: 'Drag the planets to their correct order from the Sun.',
        items: [
          { id: 'item-1', text: 'Earth', correctZoneId: 'zone-3', feedback: 'Correct!' },
          { id: 'item-2', text: 'Mercury', correctZoneId: 'zone-1', feedback: 'Correct!' },
          { id: 'item-3', text: 'Venus', correctZoneId: 'zone-2', feedback: 'Correct!' },
          { id: 'item-4', text: 'Mars', correctZoneId: 'zone-4', feedback: 'Correct!' }
        ],
        zones: [
          { id: 'zone-1', text: '1st' },
          { id: 'zone-2', text: '2nd' },
          { id: 'zone-3', text: '3rd' },
          { id: 'zone-4', text: '4th' }
        ],
        explanation: 'The correct order of planets from the Sun is: Mercury, Venus, Earth, Mars.',
        hint: 'Mercury is closest to the Sun.'
      };
      break;
    
    case QuestionType.NUMERIC:
      content = {
        text: 'What is the value of π (pi) to 2 decimal places?',
        correctAnswer: 3.14,
        tolerance: 0.01,
        explanation: 'The value of π to 2 decimal places is 3.14.',
        hint: 'It\'s approximately 22/7.',
        unit: ''
      };
      break;
    
    case QuestionType.SHORT_ANSWER:
      content = {
        text: 'What is the capital of France?',
        sampleAnswer: 'Paris',
        keywords: ['Paris', 'paris', 'PARIS'],
        explanation: 'Paris is the capital of France.',
        hint: 'Think of the Eiffel Tower.',
        maxLength: 100
      };
      break;
    
    case QuestionType.ESSAY:
      content = {
        text: 'Explain the causes of World War II.',
        rubric: [
          { criterion: 'Historical Accuracy', maxPoints: 10 },
          { criterion: 'Clarity of Explanation', maxPoints: 5 },
          { criterion: 'Use of Evidence', maxPoints: 5 }
        ],
        wordLimit: 500,
        explanation: 'A good answer would include discussion of the Treaty of Versailles, economic conditions, and the rise of fascism.',
        hint: 'Consider political, economic, and social factors.'
      };
      break;
    
    default:
      content = {
        text: 'Sample question content'
      };
      break;
  }
  
  return {
    ...baseQuestion,
    content
  };
}
