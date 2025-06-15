'use client';

import { api } from '@/utils/api';

/**
 * Hook for recording question usage
 *
 * This hook provides functions for recording and retrieving question usage data.
 */
export const useQuestionUsage = () => {
  const recordUsageMutation = api.questionUsage.recordQuestionUsage.useMutation();

  /**
   * Record a student's answer to a question
   *
   * @param questionBankRef The ID of the question in the question bank
   * @param wasCorrect Whether the student answered correctly
   * @param timeToAnswer Time taken to answer in seconds
   * @param activityId The ID of the activity
   * @param studentId The ID of the student
   */
  const recordQuestionAnswer = async (
    questionBankRef: string,
    wasCorrect: boolean,
    timeToAnswer: number,
    activityId: string,
    studentId: string,
    classId?: string
  ) => {
    if (!questionBankRef) {
      console.warn('No question bank reference provided, skipping usage tracking');
      return;
    }

    try {
      await recordUsageMutation.mutateAsync({
        questionId: questionBankRef,
        wasCorrect,
        timeToAnswer,
        activityId,
        studentId,
        classId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording question usage:', error);
      return { success: false, error };
    }
  };

  return {
    recordQuestionAnswer,
    isRecording: recordUsageMutation.isLoading,
  };
};
