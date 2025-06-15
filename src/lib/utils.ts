import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO } from "date-fns"

/**
 * Merges class names using clsx and tailwind-merge
 * @param inputs - Class names to merge
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a string using date-fns
 * @param date Date to format
 * @param formatString Format string to use (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, formatString: string = 'MMM d, yyyy'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatString) : 'Invalid date';
}

/**
 * Format a time string (HH:MM) to a more readable format
 * @param time Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string): string {
  if (!time) return '';
  
  // Validate time format (HH:MM)
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return 'Invalid time';
  
  // Convert to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate the duration in months between two dates
 * @param startDate Start date
 * @param endDate End date
 * @returns Duration in months
 */
export function calculateDurationInMonths(startDate: Date, endDate: Date): number {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
         (endDate.getMonth() - startDate.getMonth());
}
