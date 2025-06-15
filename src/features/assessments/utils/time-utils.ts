/**
 * Utility functions for time-related operations in assessments
 */

/**
 * Format seconds into a human-readable time string (MM:SS or HH:MM:SS)
 * @param seconds Total seconds to format
 * @returns Formatted time string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Format with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  // Include hours only if there are any
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Calculate the time remaining for an assessment with a time limit
 * @param startTime The time when the assessment was started
 * @param timeLimit The time limit in minutes
 * @returns Remaining time in seconds, or null if no time limit
 */
export function calculateTimeRemaining(
  startTime: Date,
  timeLimit: number | null | undefined
): number | null {
  if (!timeLimit) return null;

  const now = new Date();
  const timeLimitMs = timeLimit * 60 * 1000; // Convert minutes to milliseconds
  const endTime = new Date(startTime.getTime() + timeLimitMs);
  const remainingMs = endTime.getTime() - now.getTime();

  // Return remaining time in seconds, or 0 if time is up
  return Math.max(0, Math.floor(remainingMs / 1000));
}
