/**
 * Utility functions for calculating and formatting learning time
 */

import { ActivityGrade, LearningTimeRecord } from "@prisma/client";

/**
 * Calculate total learning time from both ActivityGrade and LearningTimeRecord sources
 * 
 * @param activityGrade - The activity grade object, possibly with learningTimeRecords
 * @returns Total time spent in minutes
 */
export function calculateTotalLearningTime(
  activityGrade: ActivityGrade & { 
    learningTimeRecords?: LearningTimeRecord[] 
  }
): number {
  // Start with the time recorded directly on the activity grade
  let totalMinutes = activityGrade.timeSpentMinutes || 0;
  
  // Add time from learning time records if available
  if (activityGrade.learningTimeRecords && activityGrade.learningTimeRecords.length > 0) {
    totalMinutes += activityGrade.learningTimeRecords.reduce(
      (sum, record) => sum + record.timeSpentMinutes,
      0
    );
  }
  
  return totalMinutes;
}

/**
 * Calculate total learning time for an activity from both sources
 * 
 * @param activityGrades - Array of activity grades, possibly with learningTimeRecords
 * @param learningTimeRecords - Array of learning time records not associated with grades
 * @returns Total time spent in minutes
 */
export function calculateActivityLearningTime(
  activityGrades: (ActivityGrade & { 
    learningTimeRecords?: LearningTimeRecord[] 
  })[],
  learningTimeRecords: LearningTimeRecord[] = []
): number {
  // Calculate time from activity grades (including their learning time records)
  const gradeTime = activityGrades.reduce((sum, grade) => {
    return sum + calculateTotalLearningTime(grade);
  }, 0);
  
  // Add time from standalone learning time records
  const recordTime = learningTimeRecords.reduce(
    (sum, record) => sum + record.timeSpentMinutes,
    0
  );
  
  return gradeTime + recordTime;
}

/**
 * Format minutes into a human-readable duration string
 * 
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "2h 30m" or "45m")
 */
export function formatLearningTime(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return "-";
  }
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get a color class based on learning time duration
 * 
 * @param minutes - Total minutes
 * @param expectedMinutes - Expected learning time in minutes
 * @returns CSS class name for color coding
 */
export function getLearningTimeColorClass(minutes: number, expectedMinutes: number = 30): string {
  if (!minutes || minutes <= 0) {
    return "text-gray-400";
  }
  
  // If time spent is less than 50% of expected, show as warning
  if (minutes < expectedMinutes * 0.5) {
    return "text-amber-500";
  }
  
  // If time spent is more than 150% of expected, show as potential issue
  if (minutes > expectedMinutes * 1.5) {
    return "text-blue-600";
  }
  
  // Otherwise, show as good
  return "text-green-600";
}
