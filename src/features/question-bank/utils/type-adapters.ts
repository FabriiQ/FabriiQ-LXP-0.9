/**
 * Type Adapters
 *
 * This file provides utility functions to convert between Prisma types and our domain types.
 */

import { Question as PrismaQuestion } from '@prisma/client';
import { Question, QuestionType, DifficultyLevel, SystemStatus, QuestionContent } from '../models/types';

/**
 * Convert a Prisma Question to our domain Question type
 */
export function adaptPrismaQuestion(prismaQuestion: any): Question {
  if (!prismaQuestion) {
    throw new Error('Cannot adapt null or undefined question');
  }

  try {
    return {
      id: prismaQuestion.id,
      questionBankId: prismaQuestion.questionBankId,
      title: prismaQuestion.title,
      questionType: prismaQuestion.questionType as QuestionType,
      difficulty: prismaQuestion.difficulty as DifficultyLevel,
      content: prismaQuestion.content as QuestionContent,
      metadata: prismaQuestion.metadata ? (prismaQuestion.metadata as Record<string, any>) : {},
      status: prismaQuestion.status as SystemStatus,
      courseId: prismaQuestion.courseId,
      subjectId: prismaQuestion.subjectId,
      topicId: prismaQuestion.topicId,
      gradeLevel: prismaQuestion.gradeLevel,
      sourceId: prismaQuestion.sourceId,
      sourceReference: prismaQuestion.sourceReference,
      year: prismaQuestion.year,
      createdById: prismaQuestion.createdById,
      updatedById: prismaQuestion.updatedById,
      createdAt: prismaQuestion.createdAt,
      updatedAt: prismaQuestion.updatedAt,
      partitionKey: prismaQuestion.partitionKey,
      // If the question has categories, adapt them too
      categories: prismaQuestion.categories,
      // If the question has versions, adapt them too
      versions: prismaQuestion.versions,
    };
  } catch (error) {
    console.error('Error adapting question:', error);
    throw new Error('Failed to adapt question');
  }
}

/**
 * Convert an array of Prisma Questions to our domain Question type
 */
export function adaptPrismaQuestions(prismaQuestions: any[]): Question[] {
  if (!Array.isArray(prismaQuestions)) {
    console.error('adaptPrismaQuestions received non-array input:', prismaQuestions);
    return [];
  }

  try {
    return prismaQuestions.map(question => {
      try {
        return adaptPrismaQuestion(question);
      } catch (error) {
        console.error('Error adapting individual question:', error);
        // Return a placeholder question to avoid breaking the UI
        return null as unknown as Question;
      }
    }).filter(Boolean) as Question[]; // Filter out any null values
  } catch (error) {
    console.error('Error adapting questions array:', error);
    return [];
  }
}

/**
 * Convert any object to a Question type
 * This is useful for components that need to work with Question objects
 * but receive data from different sources
 */
export function asQuestion(obj: any): Question {
  try {
    return adaptPrismaQuestion(obj);
  } catch (error) {
    console.error('Error in asQuestion:', error);
    throw new Error('Failed to convert object to Question');
  }
}

/**
 * Convert any array to a Question array
 * This is useful for components that need to work with Question arrays
 * but receive data from different sources
 */
export function asQuestions(objs: any[]): Question[] {
  if (!Array.isArray(objs)) {
    console.error('asQuestions received non-array input:', objs);
    return [];
  }

  try {
    return objs.map(obj => {
      try {
        return asQuestion(obj);
      } catch (error) {
        console.error('Error converting individual object to Question:', error);
        return null as unknown as Question;
      }
    }).filter(Boolean) as Question[]; // Filter out any null values
  } catch (error) {
    console.error('Error converting objects array to Questions:', error);
    return [];
  }
}
