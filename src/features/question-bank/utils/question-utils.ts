import { DifficultyLevel } from '../models/types';

/**
 * Get the CSS color class for a difficulty level
 * @param difficulty The difficulty level
 * @returns CSS class for the difficulty color
 */
export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colors: Record<DifficultyLevel, string> = {
    [DifficultyLevel.VERY_EASY]: 'bg-emerald-400 dark:bg-emerald-500',
    [DifficultyLevel.EASY]: 'bg-green-500 dark:bg-green-600',
    [DifficultyLevel.MEDIUM]: 'bg-yellow-500 dark:bg-yellow-600',
    [DifficultyLevel.HARD]: 'bg-orange-500 dark:bg-orange-600',
    [DifficultyLevel.VERY_HARD]: 'bg-red-500 dark:bg-red-600'
  };

  return colors[difficulty] || 'bg-gray-500 dark:bg-gray-600';
};

/**
 * Format a date for display
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Truncate text to a specified length
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Strip HTML tags from text
 * @param html HTML string
 * @returns Plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Count words in a text
 * @param text The text to count words in
 * @returns Number of words
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  const plainText = stripHtml(text);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
};
