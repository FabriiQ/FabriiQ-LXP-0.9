/**
 * Leaderboard Utilities
 * 
 * This file exports all utility functions and hooks for the leaderboard feature.
 */

// Export progressive loading utilities
export * from './progressive-loading';

// Export data-efficient API utilities
export * from './data-efficient-api';

// Export battery-efficient update utilities
export * from './battery-efficient-updates';

/**
 * Format a number with appropriate suffixes (K, M, B)
 * 
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  if (value === 0) {
    return '0';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue < 1000) {
    return value.toString();
  }
  
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const suffixIndex = Math.floor(Math.log10(absValue) / 3);
  const suffix = suffixes[Math.min(suffixIndex, suffixes.length - 1)];
  
  const scaledValue = value / Math.pow(10, suffixIndex * 3);
  const formattedValue = scaledValue.toFixed(decimals);
  
  // Remove trailing zeros and decimal point if not needed
  return formattedValue.replace(/\.0+$/, '') + suffix;
}

/**
 * Calculate the percentage change between two values
 * 
 * @param currentValue Current value
 * @param previousValue Previous value
 * @returns Percentage change
 */
export function calculatePercentageChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

/**
 * Format a percentage change with appropriate sign and suffix
 * 
 * @param percentageChange Percentage change
 * @param decimals Number of decimal places
 * @returns Formatted percentage change string
 */
export function formatPercentageChange(percentageChange: number, decimals = 1): string {
  const sign = percentageChange > 0 ? '+' : '';
  return `${sign}${percentageChange.toFixed(decimals)}%`;
}

/**
 * Check if the device is a mobile device
 * 
 * @returns Whether the device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if the device supports touch events
 * 
 * @returns Whether the device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if the user prefers reduced motion
 * 
 * @returns Whether the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if the app is running in a PWA context
 * 
 * @returns Whether the app is running in a PWA context
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Check if the device is online
 * 
 * @returns Whether the device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }
  
  return navigator.onLine;
}

/**
 * Get the device orientation
 * 
 * @returns Device orientation ('portrait' or 'landscape')
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') {
    return 'portrait';
  }
  
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * Debounce a function
 * 
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * 
 * @param func Function to throttle
 * @param limit Limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: number | null = null;
  let lastRan: number = 0;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      if (lastFunc !== null) {
        clearTimeout(lastFunc);
      }
      
      lastFunc = window.setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
