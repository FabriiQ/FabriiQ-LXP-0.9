'use client';

import { api } from '@/trpc/react';

/**
 * Sync attendance data to the server
 * @param attendance Attendance data to sync
 */
export async function syncAttendanceToServer(attendance: any): Promise<void> {
  try {
    // Use the TRPC API to sync attendance data
    const mutation = api.attendance.bulkCreate.useMutation();
    await mutation.mutateAsync({
      classId: attendance.classId,
      date: new Date(attendance.date),
      attendanceRecords: attendance.records
    });
  } catch (error) {
    console.error('Error syncing attendance to server:', error);
    throw error;
  }
}

/**
 * Sync assessment data to the server
 * @param assessment Assessment data to sync
 */
export async function syncAssessmentToServer(assessment: any): Promise<void> {
  try {
    // Use the TRPC API to sync assessment data
    if (assessment.grades && assessment.grades.length > 0) {
      // If there are grades, use the grade endpoint for each submission
      for (const grade of assessment.grades) {
        const gradeMutation = api.assessment.grade.useMutation();
        await gradeMutation.mutateAsync({
          submissionId: grade.submissionId,
          score: grade.score,
          feedback: grade.feedback
        });
      }
    } else if (assessment.data) {
      // If there's assessment data, use the update endpoint
      const updateMutation = api.assessment.update.useMutation();
      await updateMutation.mutateAsync({
        id: assessment.id,
        ...assessment.data
      });
    }
  } catch (error) {
    console.error('Error syncing assessment to server:', error);
    throw error;
  }
}
