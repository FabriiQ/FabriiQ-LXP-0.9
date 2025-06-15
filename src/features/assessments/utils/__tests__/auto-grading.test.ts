import { describe, it, expect } from 'vitest';
import { 
  gradeMultipleChoiceQuestion, 
  gradeTrueFalseQuestion,
  gradeNumericQuestion,
  gradeShortAnswerQuestion,
  gradeAssessment
} from '../auto-grading';
import { Question, QuestionType } from '../../types/question';

describe('Auto-grading utilities', () => {
  describe('gradeMultipleChoiceQuestion', () => {
    it('should correctly grade a multiple choice question with correct answer', () => {
      const question: Question = {
        id: 'q1',
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What is the capital of France?',
        points: 5,
        choices: [
          { id: 'a', text: 'London', isCorrect: false },
          { id: 'b', text: 'Paris', isCorrect: true },
          { id: 'c', text: 'Berlin', isCorrect: false },
          { id: 'd', text: 'Madrid', isCorrect: false },
        ],
        difficulty: 'MEDIUM',
      };
      
      const result = gradeMultipleChoiceQuestion(question, 'b');
      
      expect(result.score).toBe(5);
      expect(result.maxScore).toBe(5);
      expect(result.isCorrect).toBe(true);
      expect(result.percentageScore).toBe(100);
    });
    
    it('should correctly grade a multiple choice question with incorrect answer', () => {
      const question: Question = {
        id: 'q1',
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What is the capital of France?',
        points: 5,
        choices: [
          { id: 'a', text: 'London', isCorrect: false },
          { id: 'b', text: 'Paris', isCorrect: true },
          { id: 'c', text: 'Berlin', isCorrect: false },
          { id: 'd', text: 'Madrid', isCorrect: false },
        ],
        difficulty: 'MEDIUM',
      };
      
      const result = gradeMultipleChoiceQuestion(question, 'a');
      
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(5);
      expect(result.isCorrect).toBe(false);
      expect(result.percentageScore).toBe(0);
      expect(result.feedback).toContain('Paris');
    });
  });
  
  describe('gradeTrueFalseQuestion', () => {
    it('should correctly grade a true/false question with correct answer', () => {
      const question: Question = {
        id: 'q2',
        type: QuestionType.TRUE_FALSE,
        text: 'Paris is the capital of France',
        points: 2,
        correctAnswer: true,
        difficulty: 'EASY',
      };
      
      const result = gradeTrueFalseQuestion(question, 'true');
      
      expect(result.score).toBe(2);
      expect(result.maxScore).toBe(2);
      expect(result.isCorrect).toBe(true);
      expect(result.percentageScore).toBe(100);
    });
  });
  
  describe('gradeNumericQuestion', () => {
    it('should correctly grade a numeric question with exact match', () => {
      const question: Question = {
        id: 'q3',
        type: QuestionType.NUMERIC,
        text: 'What is 2 + 2?',
        points: 3,
        correctAnswer: 4,
        difficulty: 'EASY',
      };
      
      const result = gradeNumericQuestion(question, '4');
      
      expect(result.score).toBe(3);
      expect(result.maxScore).toBe(3);
      expect(result.isCorrect).toBe(true);
      expect(result.percentageScore).toBe(100);
    });
    
    it('should correctly grade a numeric question with tolerance', () => {
      const question: Question = {
        id: 'q4',
        type: QuestionType.NUMERIC,
        text: 'What is the value of π (pi)?',
        points: 5,
        correctAnswer: 3.14159,
        tolerance: 0.01,
        difficulty: 'MEDIUM',
      };
      
      const result = gradeNumericQuestion(question, '3.14');
      
      expect(result.score).toBe(5);
      expect(result.maxScore).toBe(5);
      expect(result.isCorrect).toBe(true);
      expect(result.percentageScore).toBe(100);
    });
  });
  
  describe('gradeShortAnswerQuestion', () => {
    it('should correctly grade a short answer question', () => {
      const question: Question = {
        id: 'q5',
        type: QuestionType.SHORT_ANSWER,
        text: 'What is the capital of France?',
        points: 4,
        correctAnswer: 'Paris',
        difficulty: 'MEDIUM',
      };
      
      const result = gradeShortAnswerQuestion(question, 'Paris');
      
      expect(result.score).toBe(4);
      expect(result.maxScore).toBe(4);
      expect(result.isCorrect).toBe(true);
      expect(result.percentageScore).toBe(100);
    });
    
    it('should handle case-insensitive matching', () => {
      const question: Question = {
        id: 'q5',
        type: QuestionType.SHORT_ANSWER,
        text: 'What is the capital of France?',
        points: 4,
        correctAnswer: 'Paris',
        difficulty: 'MEDIUM',
      };
      
      const result = gradeShortAnswerQuestion(question, 'paris');
      
      expect(result.score).toBe(4);
      expect(result.isCorrect).toBe(true);
    });
  });
  
  describe('gradeAssessment', () => {
    it('should correctly grade an entire assessment', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: QuestionType.MULTIPLE_CHOICE,
          text: 'What is the capital of France?',
          points: 5,
          choices: [
            { id: 'a', text: 'London', isCorrect: false },
            { id: 'b', text: 'Paris', isCorrect: true },
            { id: 'c', text: 'Berlin', isCorrect: false },
            { id: 'd', text: 'Madrid', isCorrect: false },
          ],
          difficulty: 'MEDIUM',
        },
        {
          id: 'q2',
          type: QuestionType.TRUE_FALSE,
          text: 'Paris is the capital of France',
          points: 2,
          correctAnswer: true,
          difficulty: 'EASY',
        },
        {
          id: 'q3',
          type: QuestionType.NUMERIC,
          text: 'What is 2 + 2?',
          points: 3,
          correctAnswer: 4,
          difficulty: 'EASY',
        },
      ];
      
      const answers = {
        q1: 'b',
        q2: 'true',
        q3: '4',
      };
      
      const result = gradeAssessment(questions, answers);
      
      expect(result.totalScore).toBe(10);
      expect(result.maxScore).toBe(10);
      expect(result.percentageScore).toBe(100);
      expect(result.requiresManualGrading).toBe(false);
      expect(result.questionResults.q1.isCorrect).toBe(true);
      expect(result.questionResults.q2.isCorrect).toBe(true);
      expect(result.questionResults.q3.isCorrect).toBe(true);
    });
  });
});
