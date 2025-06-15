/**
 * Normalized Scoring Service
 * 
 * This service provides methods for normalizing scores across different contexts
 * to ensure fair comparison between students in different situations.
 */

export interface NormalizationContext {
  // Context identifier
  contextId: string;
  
  // Context type (class, subject, course, campus)
  contextType: 'class' | 'subject' | 'course' | 'campus';
  
  // Average score in this context
  averageScore: number;
  
  // Standard deviation of scores in this context
  standardDeviation: number;
  
  // Number of students in this context
  studentCount: number;
  
  // Difficulty rating of this context (0-10)
  difficultyRating?: number;
  
  // Additional metadata for this context
  metadata?: Record<string, any>;
}

export interface StudentContext {
  // Student identifier
  studentId: string;
  
  // Raw score in this context
  rawScore: number;
  
  // Context identifier
  contextId: string;
  
  // Time spent in this context (in hours)
  timeSpentHours?: number;
  
  // Number of activities completed in this context
  activitiesCompleted?: number;
  
  // Total number of activities in this context
  totalActivities?: number;
  
  // Join date for this context
  joinDate?: Date;
  
  // Additional metadata for this student in this context
  metadata?: Record<string, any>;
}

export interface NormalizationOptions {
  // Normalization method to use
  method: 'z-score' | 'percentile' | 'min-max' | 'adjusted-z-score';
  
  // Whether to apply difficulty adjustment
  applyDifficultyAdjustment?: boolean;
  
  // Whether to apply time spent adjustment
  applyTimeSpentAdjustment?: boolean;
  
  // Whether to apply late joiner handicap
  applyLateJoinerHandicap?: boolean;
  
  // Whether to apply completion rate adjustment
  applyCompletionRateAdjustment?: boolean;
}

export interface NormalizedScore {
  // Student identifier
  studentId: string;
  
  // Context identifier
  contextId: string;
  
  // Raw score before normalization
  rawScore: number;
  
  // Normalized score
  normalizedScore: number;
  
  // Percentile rank (0-100)
  percentileRank?: number;
  
  // Z-score (standard deviations from mean)
  zScore?: number;
  
  // Adjustments applied
  adjustments: {
    difficulty?: number;
    timeSpent?: number;
    lateJoiner?: number;
    completionRate?: number;
  };
  
  // Normalization method used
  method: string;
}

export class NormalizedScoringService {
  // Cache of normalization contexts
  private contexts: Map<string, NormalizationContext> = new Map();
  
  // Cache of student contexts
  private studentContexts: Map<string, StudentContext[]> = new Map();
  
  constructor() {}
  
  /**
   * Register a normalization context
   */
  public registerContext(context: NormalizationContext): void {
    this.contexts.set(context.contextId, context);
  }
  
  /**
   * Register a student context
   */
  public registerStudentContext(studentContext: StudentContext): void {
    const studentContexts = this.studentContexts.get(studentContext.studentId) || [];
    
    // Check if this context already exists for this student
    const existingIndex = studentContexts.findIndex(sc => sc.contextId === studentContext.contextId);
    
    if (existingIndex >= 0) {
      // Update existing context
      studentContexts[existingIndex] = studentContext;
    } else {
      // Add new context
      studentContexts.push(studentContext);
    }
    
    this.studentContexts.set(studentContext.studentId, studentContexts);
  }
  
  /**
   * Get a normalization context
   */
  public getContext(contextId: string): NormalizationContext | undefined {
    return this.contexts.get(contextId);
  }
  
  /**
   * Get all student contexts for a student
   */
  public getStudentContexts(studentId: string): StudentContext[] {
    return this.studentContexts.get(studentId) || [];
  }
  
  /**
   * Get a specific student context
   */
  public getStudentContext(studentId: string, contextId: string): StudentContext | undefined {
    const studentContexts = this.studentContexts.get(studentId) || [];
    return studentContexts.find(sc => sc.contextId === contextId);
  }
  
  /**
   * Normalize a student's score in a context
   */
  public normalizeScore(
    studentId: string,
    contextId: string,
    options: NormalizationOptions
  ): NormalizedScore | null {
    // Get student context
    const studentContext = this.getStudentContext(studentId, contextId);
    if (!studentContext) return null;
    
    // Get normalization context
    const context = this.getContext(contextId);
    if (!context) return null;
    
    // Initialize adjustments
    const adjustments: NormalizedScore['adjustments'] = {};
    
    // Start with raw score
    let score = studentContext.rawScore;
    
    // Apply difficulty adjustment if requested
    if (options.applyDifficultyAdjustment && context.difficultyRating !== undefined) {
      const difficultyAdjustment = this.calculateDifficultyAdjustment(context.difficultyRating);
      adjustments.difficulty = difficultyAdjustment;
      score *= difficultyAdjustment;
    }
    
    // Apply time spent adjustment if requested
    if (options.applyTimeSpentAdjustment && studentContext.timeSpentHours !== undefined) {
      const timeSpentAdjustment = this.calculateTimeSpentAdjustment(studentContext.timeSpentHours);
      adjustments.timeSpent = timeSpentAdjustment;
      score *= timeSpentAdjustment;
    }
    
    // Apply late joiner handicap if requested
    if (options.applyLateJoinerHandicap && studentContext.joinDate !== undefined) {
      const lateJoinerAdjustment = this.calculateLateJoinerHandicap(studentContext.joinDate);
      adjustments.lateJoiner = lateJoinerAdjustment;
      score *= lateJoinerAdjustment;
    }
    
    // Apply completion rate adjustment if requested
    if (
      options.applyCompletionRateAdjustment && 
      studentContext.activitiesCompleted !== undefined && 
      studentContext.totalActivities !== undefined
    ) {
      const completionRate = studentContext.activitiesCompleted / studentContext.totalActivities;
      const completionRateAdjustment = this.calculateCompletionRateAdjustment(completionRate);
      adjustments.completionRate = completionRateAdjustment;
      score *= completionRateAdjustment;
    }
    
    // Calculate normalized score based on selected method
    let normalizedScore = 0;
    let percentileRank: number | undefined = undefined;
    let zScore: number | undefined = undefined;
    
    switch (options.method) {
      case 'z-score':
        zScore = this.calculateZScore(score, context.averageScore, context.standardDeviation);
        normalizedScore = this.convertZScoreToScale(zScore, 0, 100);
        break;
        
      case 'percentile':
        percentileRank = this.calculatePercentileRank(score, contextId);
        normalizedScore = percentileRank;
        break;
        
      case 'min-max':
        normalizedScore = this.calculateMinMaxNormalization(score, contextId);
        break;
        
      case 'adjusted-z-score':
        zScore = this.calculateZScore(score, context.averageScore, context.standardDeviation);
        // Apply sigmoid transformation to handle outliers better
        normalizedScore = this.sigmoidTransform(zScore);
        break;
        
      default:
        normalizedScore = score;
    }
    
    return {
      studentId,
      contextId,
      rawScore: studentContext.rawScore,
      normalizedScore,
      percentileRank,
      zScore,
      adjustments,
      method: options.method
    };
  }
  
  /**
   * Calculate Z-score (standard deviations from mean)
   */
  private calculateZScore(score: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0; // Avoid division by zero
    return (score - mean) / stdDev;
  }
  
  /**
   * Convert Z-score to a scale (default 0-100)
   */
  private convertZScoreToScale(zScore: number, min: number = 0, max: number = 100): number {
    // Clip extreme z-scores to prevent unreasonable values
    const clippedZScore = Math.max(-3, Math.min(3, zScore));
    
    // Convert to 0-1 scale (assuming normal distribution)
    const normalizedValue = (clippedZScore + 3) / 6;
    
    // Scale to desired range
    return min + normalizedValue * (max - min);
  }
  
  /**
   * Calculate percentile rank
   */
  private calculatePercentileRank(score: number, contextId: string): number {
    const context = this.getContext(contextId);
    if (!context) return 50; // Default to median if context not found
    
    // Get all student scores in this context
    const allScores: number[] = [];
    
    this.studentContexts.forEach((contexts, _) => {
      const matchingContext = contexts.find(c => c.contextId === contextId);
      if (matchingContext) {
        allScores.push(matchingContext.rawScore);
      }
    });
    
    if (allScores.length === 0) return 50;
    
    // Count scores below the given score
    const scoresBelow = allScores.filter(s => s < score).length;
    
    // Calculate percentile
    return (scoresBelow / allScores.length) * 100;
  }
  
  /**
   * Calculate min-max normalization
   */
  private calculateMinMaxNormalization(score: number, contextId: string): number {
    const context = this.getContext(contextId);
    if (!context) return 50; // Default to middle if context not found
    
    // Get all student scores in this context
    const allScores: number[] = [];
    
    this.studentContexts.forEach((contexts, _) => {
      const matchingContext = contexts.find(c => c.contextId === contextId);
      if (matchingContext) {
        allScores.push(matchingContext.rawScore);
      }
    });
    
    if (allScores.length === 0) return 50;
    
    // Find min and max scores
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    
    // Avoid division by zero
    if (maxScore === minScore) return 50;
    
    // Normalize to 0-100 scale
    return ((score - minScore) / (maxScore - minScore)) * 100;
  }
  
  /**
   * Apply sigmoid transformation to z-score
   */
  private sigmoidTransform(zScore: number): number {
    // Sigmoid function: 1 / (1 + e^(-x))
    const sigmoid = 1 / (1 + Math.exp(-zScore));
    
    // Scale to 0-100
    return sigmoid * 100;
  }
  
  /**
   * Calculate difficulty adjustment factor
   */
  private calculateDifficultyAdjustment(difficultyRating: number): number {
    // Scale from 0-10 to adjustment factor
    // Higher difficulty = higher adjustment (more points)
    return 1 + ((difficultyRating - 5) / 10);
  }
  
  /**
   * Calculate time spent adjustment factor
   */
  private calculateTimeSpentAdjustment(timeSpentHours: number): number {
    // Diminishing returns for time spent
    // More time = slightly higher adjustment, but with diminishing returns
    return 1 + (Math.log10(1 + timeSpentHours) / 10);
  }
  
  /**
   * Calculate late joiner handicap
   */
  private calculateLateJoinerHandicap(joinDate: Date): number {
    // Calculate days since start of term (assuming term started 4 months ago)
    const termStart = new Date();
    termStart.setMonth(termStart.getMonth() - 4);
    
    const daysSinceTermStart = Math.max(0, (joinDate.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate handicap factor (max 20% boost for very late joiners)
    return 1 + Math.min(0.2, daysSinceTermStart / 120);
  }
  
  /**
   * Calculate completion rate adjustment
   */
  private calculateCompletionRateAdjustment(completionRate: number): number {
    // Higher completion rate = higher adjustment
    // But with diminishing returns above 80%
    if (completionRate <= 0.8) {
      return 0.8 + (completionRate * 0.25);
    } else {
      return 1 + ((completionRate - 0.8) * 0.1);
    }
  }
  
  /**
   * Normalize scores for all students in a context
   */
  public normalizeAllScores(
    contextId: string,
    options: NormalizationOptions
  ): Map<string, NormalizedScore> {
    const results = new Map<string, NormalizedScore>();
    
    // Get all students in this context
    this.studentContexts.forEach((contexts, studentId) => {
      const matchingContext = contexts.find(c => c.contextId === contextId);
      if (matchingContext) {
        const normalizedScore = this.normalizeScore(studentId, contextId, options);
        if (normalizedScore) {
          results.set(studentId, normalizedScore);
        }
      }
    });
    
    return results;
  }
  
  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.contexts.clear();
    this.studentContexts.clear();
  }
}
