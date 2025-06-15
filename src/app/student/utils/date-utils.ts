/**
 * Custom date utility functions to supplement date-fns
 */

/**
 * Get the start of the month for a given date
 * @param date The date to get the start of month for
 * @returns A new Date representing the first day of the month
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of the month for a given date
 * @param date The date to get the end of month for
 * @returns A new Date representing the last day of the month
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Check if a date is today
 * @param date The date to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Calculate the difference in days between two dates
 * @param dateLeft The later date
 * @param dateRight The earlier date
 * @returns Number of days between the dates
 */
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const diffTime = Math.abs(dateLeft.getTime() - dateRight.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
