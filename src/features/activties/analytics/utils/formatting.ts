/**
 * Formatting utilities for analytics data
 */

/**
 * Format a number with commas
 * 
 * @param value Number to format
 * @param decimalPlaces Number of decimal places
 * @returns Formatted number
 */
export function formatNumber(value: number, decimalPlaces = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * Format a percentage
 * 
 * @param value Percentage value
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage
 */
export function formatPercentage(value: number, decimalPlaces = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Format time in seconds
 * 
 * @param seconds Time in seconds
 * @returns Formatted time
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes} min ${remainingSeconds} sec`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format a date
 * 
 * @param date Date to format
 * @param includeTime Whether to include time
 * @returns Formatted date
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = 'numeric';
    options.hour12 = true;
  }
  
  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Format a metric value
 * 
 * @param value Metric value
 * @param format Metric format
 * @returns Formatted metric value
 */
export function formatMetricValue(
  value: number | string,
  format: 'number' | 'percentage' | 'time' | 'currency' | undefined
): string {
  if (typeof value === 'string') {
    return value;
  }
  
  switch (format) {
    case 'number':
      return formatNumber(value);
    case 'percentage':
      return formatPercentage(value);
    case 'time':
      return formatTime(value);
    case 'currency':
      return `$${formatNumber(value, 2)}`;
    default:
      return String(value);
  }
}

/**
 * Get a color for a percentage value
 * 
 * @param percentage Percentage value
 * @returns Color
 */
export function getPercentageColor(percentage: number): string {
  if (percentage >= 90) {
    return '#4caf50'; // Green
  } else if (percentage >= 75) {
    return '#8bc34a'; // Light Green
  } else if (percentage >= 60) {
    return '#ffeb3b'; // Yellow
  } else if (percentage >= 40) {
    return '#ff9800'; // Orange
  } else {
    return '#f44336'; // Red
  }
}

/**
 * Get a grade letter from a percentage
 * 
 * @param percentage Percentage value
 * @returns Grade letter
 */
export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) {
    return 'A';
  } else if (percentage >= 80) {
    return 'B';
  } else if (percentage >= 70) {
    return 'C';
  } else if (percentage >= 60) {
    return 'D';
  } else {
    return 'F';
  }
}

/**
 * Get a color for a change value
 * 
 * @param change Change value
 * @returns Color
 */
export function getChangeColor(change: number): string {
  if (change > 0) {
    return '#4caf50'; // Green
  } else if (change < 0) {
    return '#f44336'; // Red
  } else {
    return '#9e9e9e'; // Gray
  }
}

/**
 * Format a change value
 * 
 * @param change Change value
 * @returns Formatted change
 */
export function formatChange(change: number): string {
  if (change > 0) {
    return `+${formatPercentage(change)}`;
  } else if (change < 0) {
    return formatPercentage(change);
  } else {
    return '0%';
  }
}
