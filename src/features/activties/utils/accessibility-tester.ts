'use client';

/**
 * Accessibility Testing Utility
 * 
 * This utility provides functions to test components for common accessibility issues.
 */

export interface AccessibilityIssue {
  element: HTMLElement;
  type: 'error' | 'warning';
  message: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  rule: string;
}

/**
 * Test for missing alt text on images
 * 
 * @param container The container element to test
 * @returns Array of accessibility issues
 */
export function testImagesForAltText(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Find all images
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    // Check if alt attribute is missing or empty
    if (!img.hasAttribute('alt') || img.getAttribute('alt') === '') {
      issues.push({
        element: img,
        type: 'error',
        message: 'Image is missing alt text',
        impact: 'serious',
        rule: 'images-alt'
      });
    }
  });
  
  return issues;
}

/**
 * Test for proper heading structure
 * 
 * @param container The container element to test
 * @returns Array of accessibility issues
 */
export function testHeadingStructure(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Find all headings
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  // Check for skipped heading levels
  let previousLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.substring(1));
    
    if (level - previousLevel > 1 && previousLevel !== 0) {
      issues.push({
        element: heading,
        type: 'warning',
        message: `Heading level ${level} follows level ${previousLevel}, skipping one or more levels`,
        impact: 'moderate',
        rule: 'heading-order'
      });
    }
    
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Test for color contrast issues
 * 
 * @param container The container element to test
 * @returns Array of accessibility issues
 */
export function testColorContrast(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // This is a simplified version that just checks for known problematic color combinations
  // In a real implementation, you would use a library like axe-core or compute contrast ratios
  
  const elements = container.querySelectorAll('*');
  
  elements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;
    
    // Check for light text on light background
    if (isLightColor(backgroundColor) && isLightColor(color)) {
      issues.push({
        element: element as HTMLElement,
        type: 'warning',
        message: 'Light text on light background may have insufficient contrast',
        impact: 'moderate',
        rule: 'color-contrast'
      });
    }
    
    // Check for dark text on dark background
    if (isDarkColor(backgroundColor) && isDarkColor(color)) {
      issues.push({
        element: element as HTMLElement,
        type: 'warning',
        message: 'Dark text on dark background may have insufficient contrast',
        impact: 'moderate',
        rule: 'color-contrast'
      });
    }
  });
  
  return issues;
}

/**
 * Test for keyboard accessibility issues
 * 
 * @param container The container element to test
 * @returns Array of accessibility issues
 */
export function testKeyboardAccessibility(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Find all interactive elements
  const interactiveElements = container.querySelectorAll('button, a, [role="button"], [tabindex]');
  
  interactiveElements.forEach(element => {
    // Check for negative tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) < 0 && !element.hasAttribute('aria-hidden')) {
      issues.push({
        element: element as HTMLElement,
        type: 'warning',
        message: 'Interactive element with negative tabindex will be unreachable by keyboard',
        impact: 'serious',
        rule: 'keyboard-accessible'
      });
    }
    
    // Check for missing accessible name
    if (!hasAccessibleName(element as HTMLElement)) {
      issues.push({
        element: element as HTMLElement,
        type: 'error',
        message: 'Interactive element has no accessible name',
        impact: 'serious',
        rule: 'accessible-name'
      });
    }
  });
  
  return issues;
}

/**
 * Run all accessibility tests
 * 
 * @param container The container element to test
 * @returns Array of accessibility issues
 */
export function runAccessibilityTests(container: HTMLElement): AccessibilityIssue[] {
  return [
    ...testImagesForAltText(container),
    ...testHeadingStructure(container),
    ...testColorContrast(container),
    ...testKeyboardAccessibility(container)
  ];
}

// Helper functions

function isLightColor(color: string): boolean {
  // Simple check for light colors
  return color.includes('255, 255, 255') || 
         color.includes('rgb(255, 255, 255)') ||
         color.includes('#fff') || 
         color.includes('#ffffff');
}

function isDarkColor(color: string): boolean {
  // Simple check for dark colors
  return color.includes('0, 0, 0') || 
         color.includes('rgb(0, 0, 0)') ||
         color.includes('#000') || 
         color.includes('#000000');
}

function hasAccessibleName(element: HTMLElement): boolean {
  // Check for accessible name from various sources
  return !!(
    element.textContent?.trim() ||
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    (element.tagName === 'INPUT' && element.getAttribute('placeholder')) ||
    (element.tagName === 'IMG' && element.getAttribute('alt'))
  );
}
