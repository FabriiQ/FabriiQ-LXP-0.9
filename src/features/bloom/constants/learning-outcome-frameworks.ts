/**
 * Learning Outcome Frameworks Constants
 *
 * This file contains constants and metadata for different learning outcome frameworks.
 */

import { LearningOutcomeFramework, LearningOutcomeFrameworkMetadata } from '../types/bloom-taxonomy';

/**
 * Metadata for each learning outcome framework
 */
export const LEARNING_OUTCOME_FRAMEWORK_METADATA: Record<LearningOutcomeFramework, LearningOutcomeFrameworkMetadata> = {
  [LearningOutcomeFramework.ABCD]: {
    framework: LearningOutcomeFramework.ABCD,
    name: 'ABCD Method',
    description: 'Audience, Behavior, Condition, Degree - A comprehensive framework for writing clear and measurable learning outcomes',
    structure: 'Given [Condition], the [Audience] will be able to [Behavior] to [Degree]',
    example: 'Given a case study of a business ethical dilemma, the student will be able to analyze the motivations of key stakeholders with 90% accuracy.',
  },
  [LearningOutcomeFramework.SMART]: {
    framework: LearningOutcomeFramework.SMART,
    name: 'SMART Objectives',
    description: 'Specific, Measurable, Achievable, Relevant, Time-bound - A framework for creating clear and attainable learning objectives',
    structure: 'Specific and Measurable action that is Achievable, Relevant, and Time-bound',
    example: 'Students will be able to solve quadratic equations using the quadratic formula with 85% accuracy within a 50-minute class period.',
  },
  [LearningOutcomeFramework.SIMPLE]: {
    framework: LearningOutcomeFramework.SIMPLE,
    name: 'Simple Format',
    description: 'Basic learning outcome format focusing on clear action verbs and observable behaviors',
    structure: 'Students will be able to [Action Verb] [Content/Skill]',
    example: 'Students will be able to identify the main themes in a literary work.',
  },
};

/**
 * Ordered array of learning outcome frameworks
 */
export const ORDERED_FRAMEWORKS: LearningOutcomeFramework[] = [
  LearningOutcomeFramework.ABCD,
  LearningOutcomeFramework.SMART,
  LearningOutcomeFramework.SIMPLE,
];

/**
 * Framework-specific prompts for AI generation
 */
export const FRAMEWORK_PROMPTS: Record<LearningOutcomeFramework, string> = {
  [LearningOutcomeFramework.ABCD]: `
    Use the ABCD Method for writing learning outcomes:
    - A (Audience): Always "The student" or "Students"
    - B (Behavior): Observable and measurable action using appropriate Bloom's Taxonomy verbs
    - C (Condition): Context, tools, resources, or circumstances provided
    - D (Degree): Standard of performance, accuracy, or quality expected
    
    Format: "Given [Condition], the student will be able to [Behavior] to [Degree]."
    
    Ensure each outcome is:
    - Complete and comprehensive
    - Measurable and observable
    - Realistic and achievable
    - Aligned with the specified Bloom's level
  `,
  [LearningOutcomeFramework.SMART]: `
    Use SMART Objectives framework for writing learning outcomes:
    - Specific: Clearly defined with no ambiguity
    - Measurable: Quantifiable or observable
    - Achievable: Realistic and attainable
    - Relevant: Aligned with course goals and standards
    - Time-bound: Achievable within the given timeframe
    
    Focus on creating outcomes that are practical and can be assessed effectively.
    Include specific performance criteria and standards where appropriate.
  `,
  [LearningOutcomeFramework.SIMPLE]: `
    Use a simple, clear format for learning outcomes:
    - Start with "Students will be able to..."
    - Use appropriate action verbs from Bloom's Taxonomy
    - Focus on observable behaviors and skills
    - Keep language clear and concise
    - Ensure outcomes are student-centered
    
    Avoid overly complex language while maintaining clarity and measurability.
  `,
};

/**
 * Default framework for new learning outcomes
 */
export const DEFAULT_FRAMEWORK = LearningOutcomeFramework.ABCD;
