'use client';

/**
 * Base Activity Models
 *
 * This file contains the base interfaces for all activity types.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns
 * 4. Extensible - Easy to add new activity types
 */

/**
 * Base Activity Interface
 * All activity types extend this interface
 */
export interface BaseActivity {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  activityType: string;
  isGradable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: ActivityMetadata;
}

/**
 * Activity Metadata
 * Additional information about the activity
 */
export interface ActivityMetadata {
  aiGenerated?: boolean;
  updatedByAI?: boolean;
  lastAIUpdateTime?: string;
  generationPrompt?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // in minutes
  keywords?: string[];
  learningObjectives?: string[];
  authorNotes?: string;
  version?: string;
}

/**
 * Activity Settings Interface
 * Common settings for activities
 */
export interface ActivitySettings {
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showFeedbackImmediately?: boolean;
  showCorrectAnswers?: boolean;
  passingPercentage?: number;
  attemptsAllowed?: number;
  timeLimit?: number; // in minutes
}

/**
 * Grading Result Interface
 * Used for returning grading results
 */
export interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
  overallFeedback?: string;
  completedAt: Date;
}

/**
 * Question Result Interface
 * Used for returning results for individual questions
 */
export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  selectedOptionId?: string;
  correctOptionId?: string;
  feedback?: string;
  explanation?: string;
  answerAnalysis?: string;
  // For fill in the blanks activities
  blankResults?: Array<{
    blankId: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswers: string[];
  }>;
}

/**
 * Generate a unique ID
 * Used for creating new activities and questions
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
