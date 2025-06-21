/**
 * Tests for enrollment number generation utilities
 */

import { 
  generateEnrollmentNumber, 
  generateShortEnrollmentNumber, 
  validateEnrollmentNumber,
  generateBatchEnrollmentNumbers 
} from '../enrollment-number';

describe('Enrollment Number Generation', () => {
  describe('generateEnrollmentNumber', () => {
    it('should generate a unique enrollment number', () => {
      const enrollmentNumber = generateEnrollmentNumber();
      expect(enrollmentNumber).toBeDefined();
      expect(typeof enrollmentNumber).toBe('string');
      expect(enrollmentNumber.length).toBeGreaterThan(10);
    });

    it('should generate different numbers on consecutive calls', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateEnrollmentNumber());
      }
      expect(numbers.size).toBe(100); // All should be unique
    });

    it('should use custom institution and campus codes when provided', () => {
      const enrollmentNumber = generateEnrollmentNumber('TECH', 'NORTH');
      expect(enrollmentNumber).toMatch(/^TECH-NORTH/);
    });

    it('should use default institution and campus codes', () => {
      const currentYear = new Date().getFullYear().toString();
      const enrollmentNumber = generateEnrollmentNumber();
      expect(enrollmentNumber).toMatch(new RegExp(`^INST-MAIN-${currentYear}`));
    });
  });

  describe('generateShortEnrollmentNumber', () => {
    it('should generate a shorter enrollment number', () => {
      const shortNumber = generateShortEnrollmentNumber();
      const longNumber = generateEnrollmentNumber();
      expect(shortNumber.length).toBeLessThan(longNumber.length);
    });

    it('should use ST as default prefix', () => {
      const enrollmentNumber = generateShortEnrollmentNumber();
      expect(enrollmentNumber).toMatch(/^ST/);
    });

    it('should use custom prefix when provided', () => {
      const enrollmentNumber = generateShortEnrollmentNumber('ABC');
      expect(enrollmentNumber).toMatch(/^ABC/);
    });
  });

  describe('validateEnrollmentNumber', () => {
    it('should validate correct enrollment number formats', () => {
      expect(validateEnrollmentNumber('INST-MAIN-2024-1234')).toBe(true);
      expect(validateEnrollmentNumber('TECH-NORTH-2024-5678')).toBe(true);
      expect(validateEnrollmentNumber('UNIV-SOUTH-2024-9012')).toBe(true);
    });

    it('should reject invalid enrollment number formats', () => {
      expect(validateEnrollmentNumber('short')).toBe(false);
      expect(validateEnrollmentNumber('invalid@number')).toBe(false);
      expect(validateEnrollmentNumber('has spaces')).toBe(false);
      expect(validateEnrollmentNumber('')).toBe(false);
    });
  });

  describe('generateBatchEnrollmentNumbers', () => {
    it('should generate the requested number of unique enrollment numbers', () => {
      const batch = generateBatchEnrollmentNumbers(10);
      expect(batch).toHaveLength(10);
      
      const uniqueNumbers = new Set(batch);
      expect(uniqueNumbers.size).toBe(10); // All should be unique
    });

    it('should generate unique numbers even for large batches', () => {
      const batch = generateBatchEnrollmentNumbers(50);
      expect(batch).toHaveLength(50);
      
      const uniqueNumbers = new Set(batch);
      expect(uniqueNumbers.size).toBe(50); // All should be unique
    });

    it('should use custom institution and campus codes for batch generation', () => {
      const batch = generateBatchEnrollmentNumbers(5, 'BATCH', 'TEST');
      batch.forEach(number => {
        expect(number).toMatch(/^BATCH-TEST/);
      });
    });
  });

  describe('Collision Resistance', () => {
    it('should generate unique numbers under rapid generation', async () => {
      const numbers = new Set<string>();
      const promises: Promise<string>[] = [];

      // Generate 100 numbers concurrently
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(generateEnrollmentNumber()));
      }

      const results = await Promise.all(promises);
      results.forEach(number => numbers.add(number));

      expect(numbers.size).toBe(100); // All should be unique
    });

    it('should handle high-frequency generation', () => {
      const numbers = new Set<string>();
      
      // Generate numbers in tight loop
      for (let i = 0; i < 1000; i++) {
        numbers.add(generateEnrollmentNumber());
      }

      expect(numbers.size).toBe(1000); // All should be unique
    });
  });
});
