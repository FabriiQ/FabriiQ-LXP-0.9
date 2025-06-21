/**
 * Utility functions for generating unique enrollment numbers
 */

/**
 * Generates a readable enrollment number in format: INST-CAMP-YYYY-NNNN
 * @param institutionCode - Institution code (2-3 letters)
 * @param campusCode - Campus code (2-3 letters)
 * @param customPrefix - Optional custom prefix instead of institution-campus
 * @returns A readable enrollment number string
 */
export function generateEnrollmentNumber(institutionCode?: string, campusCode?: string, customPrefix?: string): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const uniqueNumber = `${timestamp}${random}`.slice(-4); // Keep it to 4 digits

  if (customPrefix) {
    return `${customPrefix}-${year}-${uniqueNumber}`;
  }

  const instCode = institutionCode || 'INST';
  const campCode = campusCode || 'MAIN';

  return `${instCode}-${campCode}-${year}-${uniqueNumber}`;
}

/**
 * Generates a shorter enrollment number for display purposes
 * @param prefix - Optional prefix (default: 'ST')
 * @returns A shorter enrollment number
 */
export function generateShortEnrollmentNumber(prefix: string = 'ST'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${year}${timestamp}${random}`;
}

/**
 * Validates an enrollment number format
 * @param enrollmentNumber - The enrollment number to validate
 * @returns True if the format is valid
 */
export function validateEnrollmentNumber(enrollmentNumber: string): boolean {
  // Basic validation - should be at least 8 characters and contain only alphanumeric characters and hyphens
  return /^[A-Za-z0-9-]{8,}$/.test(enrollmentNumber);
}

/**
 * Generates a batch of unique enrollment numbers
 * @param count - Number of enrollment numbers to generate
 * @param institutionCode - Institution code
 * @param campusCode - Campus code
 * @returns Array of unique enrollment numbers
 */
export function generateBatchEnrollmentNumbers(count: number, institutionCode?: string, campusCode?: string): string[] {
  const numbers = new Set<string>();

  while (numbers.size < count) {
    // Add a small delay to ensure timestamp uniqueness
    const delay = Math.floor(Math.random() * 10);
    const enrollmentNumber = generateEnrollmentNumber(institutionCode, campusCode);
    numbers.add(enrollmentNumber);

    // Small delay to prevent identical timestamps
    if (numbers.size < count) {
      // Use a synchronous delay for small batches
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait for very small delay
      }
    }
  }

  return Array.from(numbers);
}
