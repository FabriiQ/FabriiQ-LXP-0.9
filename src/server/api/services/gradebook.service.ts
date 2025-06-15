/**
 * Gradebook Service
 *
 * This service handles operations related to gradebooks and student grades,
 * including updating gradebooks with activity grades.
 */

import { prisma } from '@/server/db';
import { logger } from '@/server/api/utils/logger';
import { ActivityGrade } from '@prisma/client';
import { TRPCError } from '@trpc/server';

/**
 * Update a student's gradebook with an activity grade
 *
 * This function finds the student's grade record in the gradebook and updates
 * the activityGrades field with the new activity grade information.
 *
 * @param gradeBookId The ID of the gradebook to update
 * @param studentId The ID of the student
 * @param activityGrade The activity grade to add to the gradebook
 * @returns The updated student grade record
 */
export async function updateGradebookWithActivityGrade(
  gradeBookId: string,
  studentId: string,
  activityGrade: ActivityGrade
): Promise<any> {
  try {
    // Get the activity to access its maxScore
    const activity = await prisma.activity.findUnique({
      where: { id: activityGrade.activityId }
    });

    // Default maxScore to 100 if not specified in the activity
    const maxScore = activity?.maxScore || 100;

    // Find the student's grade record in the gradebook
    let studentGrade = await prisma.studentGrade.findUnique({
      where: {
        gradeBookId_studentId: {
          gradeBookId,
          studentId
        }
      }
    });

    // If no student grade record exists, create one
    if (!studentGrade) {
      studentGrade = await prisma.studentGrade.create({
        data: {
          gradeBookId,
          studentId,
          assessmentGrades: {},
          activityGrades: {
            [activityGrade.activityId]: {
              id: activityGrade.id,
              score: activityGrade.score,
              maxScore: maxScore,
              submittedAt: activityGrade.submittedAt,
              gradedAt: activityGrade.gradedAt,
              status: activityGrade.status
            }
          }
        }
      });

      logger.debug('Created new student grade record with activity grade', {
        gradeBookId,
        studentId,
        activityGradeId: activityGrade.id
      });

      return studentGrade;
    }

    // Get the current activity grades or initialize an empty object
    const currentActivityGrades = studentGrade.activityGrades as Record<string, any> || {};

    // Update the activity grade in the record
    const updatedActivityGrades = {
      ...currentActivityGrades,
      [activityGrade.activityId]: {
        id: activityGrade.id,
        score: activityGrade.score,
        maxScore: maxScore,
        submittedAt: activityGrade.submittedAt,
        gradedAt: activityGrade.gradedAt,
        status: activityGrade.status
      }
    };

    // Update the student grade record
    const updatedStudentGrade = await prisma.studentGrade.update({
      where: {
        id: studentGrade.id
      },
      data: {
        activityGrades: updatedActivityGrades,
        // Recalculate the final grade if needed
        // This would depend on the gradebook's calculation rules
        updatedAt: new Date()
      }
    });

    logger.debug('Updated student grade record with activity grade', {
      gradeBookId,
      studentId,
      activityGradeId: activityGrade.id
    });

    return updatedStudentGrade;
  } catch (error) {
    logger.error('Error updating gradebook with activity grade', { error });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to update gradebook: ${(error as Error).message}`
    });
  }
}

/**
 * Calculate a student's final grade based on activity and assessment grades
 *
 * This function recalculates a student's final grade based on their
 * activity and assessment grades according to the gradebook's calculation rules.
 *
 * @param gradeBookId The ID of the gradebook
 * @param studentId The ID of the student
 * @returns The updated student grade record with the recalculated final grade
 */
export async function recalculateStudentFinalGrade(
  gradeBookId: string,
  studentId: string
): Promise<any> {
  try {
    // Get the student grade record
    const studentGrade = await prisma.studentGrade.findUnique({
      where: {
        gradeBookId_studentId: {
          gradeBookId,
          studentId
        }
      }
    });

    if (!studentGrade) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student grade record not found'
      });
    }

    // Get the gradebook to access calculation rules
    const gradeBook = await prisma.gradeBook.findUnique({
      where: { id: gradeBookId }
    });

    if (!gradeBook) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Gradebook not found'
      });
    }

    // Get the calculation rules
    const calculationRules = gradeBook.calculationRules as any;

    // Get the activity and assessment grades
    const activityGrades = studentGrade.activityGrades as Record<string, any> || {};
    const assessmentGrades = studentGrade.assessmentGrades as Record<string, any> || {};

    // Calculate the final grade based on the calculation rules
    // This is a simplified example - actual implementation would depend on your specific rules
    let finalGrade = 0;
    let totalWeight = 0;

    // Calculate weighted average of activity grades
    if (calculationRules.activityWeight) {
      const activityScores = Object.values(activityGrades)
        .filter((grade: any) => grade.score !== null && grade.maxScore > 0)
        .map((grade: any) => (grade.score / grade.maxScore) * 100);

      if (activityScores.length > 0) {
        const activityAverage = activityScores.reduce((sum, score) => sum + score, 0) / activityScores.length;
        finalGrade += activityAverage * (calculationRules.activityWeight / 100);
        totalWeight += calculationRules.activityWeight;
      }
    }

    // Calculate weighted average of assessment grades
    if (calculationRules.assessmentWeight) {
      const assessmentScores = Object.values(assessmentGrades)
        .filter((grade: any) => grade.score !== null && grade.maxScore > 0)
        .map((grade: any) => (grade.score / grade.maxScore) * 100);

      if (assessmentScores.length > 0) {
        const assessmentAverage = assessmentScores.reduce((sum, score) => sum + score, 0) / assessmentScores.length;
        finalGrade += assessmentAverage * (calculationRules.assessmentWeight / 100);
        totalWeight += calculationRules.assessmentWeight;
      }
    }

    // Normalize the final grade if weights don't add up to 100
    if (totalWeight > 0 && totalWeight !== 100) {
      finalGrade = (finalGrade / totalWeight) * 100;
    }

    // Determine the letter grade based on the final grade
    let letterGrade = '';
    if (calculationRules.letterGradeScale) {
      for (const [grade, threshold] of Object.entries(calculationRules.letterGradeScale)) {
        if (finalGrade >= (threshold as number)) {
          letterGrade = grade;
          break;
        }
      }
    }

    // Update the student grade record with the recalculated final grade
    const updatedStudentGrade = await prisma.studentGrade.update({
      where: {
        id: studentGrade.id
      },
      data: {
        finalGrade,
        letterGrade,
        updatedAt: new Date()
      }
    });

    logger.debug('Recalculated student final grade', {
      gradeBookId,
      studentId,
      finalGrade,
      letterGrade
    });

    return updatedStudentGrade;
  } catch (error) {
    logger.error('Error recalculating student final grade', { error });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to recalculate final grade: ${(error as Error).message}`
    });
  }
}
