import { PrismaClient, SystemStatus } from '@prisma/client';
import { QuestionType, DifficultyLevel } from '../models/types';

/**
 * Seed data utility for the question bank
 * 
 * This file provides functions to seed the question bank with sample data
 * for testing and demonstration purposes.
 */

/**
 * Seed a question bank with multiple choice questions
 * 
 * @param prisma Prisma client instance
 * @param institutionId Institution ID
 * @param subjectId Subject ID
 * @param courseId Course ID (optional)
 * @param userId User ID of the creator
 */
export async function seedMultipleChoiceQuestions(
  prisma: PrismaClient,
  institutionId: string,
  subjectId: string,
  courseId: string | undefined,
  userId: string
) {
  // Create a question bank
  const questionBank = await prisma.questionBank.create({
    data: {
      name: 'Sample Multiple Choice Questions',
      description: 'A collection of sample multiple choice questions for testing',
      institutionId,
      status: SystemStatus.ACTIVE,
      partitionKey: `inst_${institutionId}`,
      createdById: userId,
    },
  });

  // Sample multiple choice questions
  const questions = [
    {
      title: 'Basic Addition',
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      content: {
        text: 'What is 2 + 2?',
        options: [
          { id: '1', text: '3', isCorrect: false, feedback: 'Incorrect. Try again.' },
          { id: '2', text: '4', isCorrect: true, feedback: 'Correct! 2 + 2 = 4' },
          { id: '3', text: '5', isCorrect: false, feedback: 'Incorrect. Try again.' },
          { id: '4', text: '22', isCorrect: false, feedback: 'Incorrect. That would be concatenation, not addition.' },
        ],
        explanation: '2 + 2 = 4 is a basic addition fact.',
        hint: 'Think about counting two items and then two more items.',
      },
      subjectId,
      courseId,
      gradeLevel: 1,
    },
    {
      title: 'Colors of the Rainbow',
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      content: {
        text: 'Which of these colors is NOT in the rainbow?',
        options: [
          { id: '1', text: 'Red', isCorrect: false, feedback: 'Incorrect. Red is part of the rainbow (ROYGBIV).' },
          { id: '2', text: 'Brown', isCorrect: true, feedback: 'Correct! Brown is not in the rainbow.' },
          { id: '3', text: 'Green', isCorrect: false, feedback: 'Incorrect. Green is part of the rainbow (ROYGBIV).' },
          { id: '4', text: 'Violet', isCorrect: false, feedback: 'Incorrect. Violet is part of the rainbow (ROYGBIV).' },
        ],
        explanation: 'The colors of the rainbow are Red, Orange, Yellow, Green, Blue, Indigo, and Violet (ROYGBIV).',
        hint: 'Think about the acronym ROYGBIV.',
      },
      subjectId,
      courseId,
      gradeLevel: 2,
    },
    {
      title: 'Capital of France',
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      content: {
        text: 'What is the capital of France?',
        options: [
          { id: '1', text: 'London', isCorrect: false, feedback: 'Incorrect. London is the capital of the United Kingdom.' },
          { id: '2', text: 'Berlin', isCorrect: false, feedback: 'Incorrect. Berlin is the capital of Germany.' },
          { id: '3', text: 'Paris', isCorrect: true, feedback: 'Correct! Paris is the capital of France.' },
          { id: '4', text: 'Madrid', isCorrect: false, feedback: 'Incorrect. Madrid is the capital of Spain.' },
        ],
        explanation: 'Paris is the capital and most populous city of France.',
        hint: 'Think about the Eiffel Tower.',
      },
      subjectId,
      courseId,
      gradeLevel: 3,
    },
    {
      title: 'Water States',
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      content: {
        text: 'At what temperature does water boil at sea level?',
        options: [
          { id: '1', text: '0°C', isCorrect: false, feedback: 'Incorrect. Water freezes at 0°C.' },
          { id: '2', text: '50°C', isCorrect: false, feedback: 'Incorrect. Water is hot but not boiling at 50°C.' },
          { id: '3', text: '100°C', isCorrect: true, feedback: 'Correct! Water boils at 100°C at sea level.' },
          { id: '4', text: '200°C', isCorrect: false, feedback: 'Incorrect. Water has already turned to steam at this temperature.' },
        ],
        explanation: 'Water boils at 100 degrees Celsius (212 degrees Fahrenheit) at sea level.',
        hint: 'Think about the boiling point of water in Celsius.',
      },
      subjectId,
      courseId,
      gradeLevel: 4,
    },
    {
      title: 'Photosynthesis',
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.HARD,
      content: {
        text: 'Which of the following is NOT required for photosynthesis?',
        options: [
          { id: '1', text: 'Sunlight', isCorrect: false, feedback: 'Incorrect. Sunlight is essential for photosynthesis.' },
          { id: '2', text: 'Carbon dioxide', isCorrect: false, feedback: 'Incorrect. Carbon dioxide is a key input for photosynthesis.' },
          { id: '3', text: 'Water', isCorrect: false, feedback: 'Incorrect. Water is necessary for photosynthesis.' },
          { id: '4', text: 'Oxygen', isCorrect: true, feedback: 'Correct! Oxygen is actually produced during photosynthesis, not required.' },
        ],
        explanation: 'Photosynthesis requires sunlight, carbon dioxide, and water to produce glucose and oxygen.',
        hint: 'Think about the inputs and outputs of photosynthesis.',
      },
      subjectId,
      courseId,
      gradeLevel: 5,
    },
  ];

  // Create the questions
  for (const question of questions) {
    const partitionKey = `inst_${institutionId}_grade_${question.gradeLevel || 0}_subj_${question.subjectId}`;
    
    await prisma.question.create({
      data: {
        questionBankId: questionBank.id,
        title: question.title,
        questionType: question.questionType,
        difficulty: question.difficulty,
        content: question.content as any,
        subjectId: question.subjectId,
        courseId: question.courseId,
        gradeLevel: question.gradeLevel,
        status: SystemStatus.ACTIVE,
        partitionKey,
        createdById: userId,
      },
    });
  }

  // Initialize usage stats for each question
  const createdQuestions = await prisma.question.findMany({
    where: { questionBankId: questionBank.id },
  });

  for (const question of createdQuestions) {
    await prisma.questionUsageStats.create({
      data: {
        questionId: question.id,
        usageCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        partialCount: 0,
      },
    });
  }

  return {
    questionBankId: questionBank.id,
    questionCount: questions.length,
  };
}
