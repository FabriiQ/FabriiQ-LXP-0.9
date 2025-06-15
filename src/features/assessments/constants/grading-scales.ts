/**
 * Grading scale definitions
 */

// Grading scale interface
export interface GradingScale {
  id: string;
  name: string;
  description: string;
  grades: GradeLevel[];
}

// Grade level interface
export interface GradeLevel {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  description: string;
  color: string;
}

// Standard percentage-based grading scale (A, B, C, D, F)
export const STANDARD_GRADING_SCALE: GradingScale = {
  id: 'standard',
  name: 'Standard Grading Scale',
  description: 'Traditional A-F grading scale based on percentages',
  grades: [
    {
      grade: 'A',
      minPercentage: 90,
      maxPercentage: 100,
      description: 'Excellent',
      color: 'green',
    },
    {
      grade: 'B',
      minPercentage: 80,
      maxPercentage: 89.99,
      description: 'Good',
      color: 'blue',
    },
    {
      grade: 'C',
      minPercentage: 70,
      maxPercentage: 79.99,
      description: 'Satisfactory',
      color: 'yellow',
    },
    {
      grade: 'D',
      minPercentage: 60,
      maxPercentage: 69.99,
      description: 'Needs Improvement',
      color: 'orange',
    },
    {
      grade: 'F',
      minPercentage: 0,
      maxPercentage: 59.99,
      description: 'Failing',
      color: 'red',
    },
  ],
};

// Pass/Fail grading scale
export const PASS_FAIL_GRADING_SCALE: GradingScale = {
  id: 'pass-fail',
  name: 'Pass/Fail',
  description: 'Simple pass/fail grading scale',
  grades: [
    {
      grade: 'Pass',
      minPercentage: 60,
      maxPercentage: 100,
      description: 'Passing grade',
      color: 'green',
    },
    {
      grade: 'Fail',
      minPercentage: 0,
      maxPercentage: 59.99,
      description: 'Failing grade',
      color: 'red',
    },
  ],
};

// Mastery-based grading scale
export const MASTERY_GRADING_SCALE: GradingScale = {
  id: 'mastery',
  name: 'Mastery-Based',
  description: 'Grading scale based on levels of mastery',
  grades: [
    {
      grade: 'Mastery',
      minPercentage: 90,
      maxPercentage: 100,
      description: 'Complete mastery of the subject',
      color: 'green',
    },
    {
      grade: 'Proficient',
      minPercentage: 75,
      maxPercentage: 89.99,
      description: 'Proficient understanding',
      color: 'blue',
    },
    {
      grade: 'Developing',
      minPercentage: 60,
      maxPercentage: 74.99,
      description: 'Developing understanding',
      color: 'yellow',
    },
    {
      grade: 'Beginning',
      minPercentage: 0,
      maxPercentage: 59.99,
      description: 'Beginning understanding',
      color: 'red',
    },
  ],
};

// Collection of all grading scales
export const GRADING_SCALES: Record<string, GradingScale> = {
  standard: STANDARD_GRADING_SCALE,
  passFail: PASS_FAIL_GRADING_SCALE,
  mastery: MASTERY_GRADING_SCALE,
};

// Function to get grade from percentage
export function getGradeFromPercentage(percentage: number, scaleId: string = 'standard'): GradeLevel | null {
  const scale = GRADING_SCALES[scaleId];
  if (!scale) return null;

  return scale.grades.find(
    (grade) => percentage >= grade.minPercentage && percentage <= grade.maxPercentage
  ) || null;
}
