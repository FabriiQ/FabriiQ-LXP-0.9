/**
 * Balanced Scoring System
 * 
 * This service provides a balanced approach to calculating points across different
 * activity types to ensure fair distribution and prevent gaming of the system.
 */

export interface ActivityTypeConfig {
  // Activity type identifier
  type: string;
  
  // Base points for this activity type
  basePoints: number;
  
  // Weight multiplier for this activity type (1.0 is standard)
  weight: number;
  
  // Maximum points allowed per day for this activity type
  dailyMaxPoints: number;
  
  // Maximum points allowed per week for this activity type
  weeklyMaxPoints: number;
  
  // Whether points scale with difficulty
  scaleWithDifficulty: boolean;
  
  // Whether points scale with score/performance
  scaleWithPerformance: boolean;
  
  // Whether points scale with time spent
  scaleWithTimeSpent: boolean;
  
  // Maximum time (in minutes) that will be considered for scaling
  maxTimeMinutes?: number;
}

export interface DifficultyLevel {
  level: 'easy' | 'medium' | 'hard' | 'expert';
  multiplier: number;
}

export interface PerformanceLevel {
  minScore: number; // Minimum score (0-100) for this level
  maxScore: number; // Maximum score (0-100) for this level
  multiplier: number;
}

export interface PointsCalculationRequest {
  // Activity type
  activityType: string;
  
  // Difficulty level (optional)
  difficultyLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Performance score (0-100)
  score?: number;
  
  // Time spent in minutes
  timeSpentMinutes?: number;
  
  // Whether this is a repeat of an activity
  isRepeat?: boolean;
  
  // Custom multiplier (for special events, etc.)
  customMultiplier?: number;
}

export interface PointsCalculationResult {
  // Base points for the activity type
  basePoints: number;
  
  // Final calculated points
  calculatedPoints: number;
  
  // Breakdown of multipliers applied
  multipliers: {
    difficulty?: number;
    performance?: number;
    timeSpent?: number;
    repeat?: number;
    custom?: number;
  };
  
  // Whether the points were capped by daily/weekly limits
  wasCapped: boolean;
  
  // Original uncapped points (if capped)
  uncappedPoints?: number;
}

export class BalancedScoringSystem {
  // Default activity type configurations
  private activityConfigs: Map<string, ActivityTypeConfig> = new Map();
  
  // Difficulty level multipliers
  private difficultyLevels: DifficultyLevel[] = [
    { level: 'easy', multiplier: 0.8 },
    { level: 'medium', multiplier: 1.0 },
    { level: 'hard', multiplier: 1.3 },
    { level: 'expert', multiplier: 1.6 }
  ];
  
  // Performance level multipliers
  private performanceLevels: PerformanceLevel[] = [
    { minScore: 0, maxScore: 60, multiplier: 0.6 },
    { minScore: 60, maxScore: 70, multiplier: 0.7 },
    { minScore: 70, maxScore: 80, multiplier: 0.8 },
    { minScore: 80, maxScore: 90, multiplier: 0.9 },
    { minScore: 90, maxScore: 100, multiplier: 1.0 }
  ];
  
  // Repeat activity multiplier
  private repeatMultiplier: number = 0.5;
  
  // Usage tracking for rate limiting
  private usageTracking: Map<string, {
    daily: Map<string, number>;
    weekly: Map<string, number>;
    lastReset: Date;
  }> = new Map();
  
  constructor(
    activityConfigs?: ActivityTypeConfig[],
    difficultyLevels?: DifficultyLevel[],
    performanceLevels?: PerformanceLevel[]
  ) {
    // Set up activity configurations
    if (activityConfigs) {
      for (const config of activityConfigs) {
        this.activityConfigs.set(config.type, config);
      }
    } else {
      this.setupDefaultActivityConfigs();
    }
    
    // Set up difficulty levels if provided
    if (difficultyLevels) {
      this.difficultyLevels = difficultyLevels;
    }
    
    // Set up performance levels if provided
    if (performanceLevels) {
      this.performanceLevels = performanceLevels;
    }
  }
  
  /**
   * Set up default activity configurations
   */
  private setupDefaultActivityConfigs(): void {
    // Academic activities
    this.activityConfigs.set('quiz', {
      type: 'quiz',
      basePoints: 50,
      weight: 1.0,
      dailyMaxPoints: 200,
      weeklyMaxPoints: 500,
      scaleWithDifficulty: true,
      scaleWithPerformance: true,
      scaleWithTimeSpent: false
    });
    
    this.activityConfigs.set('assignment', {
      type: 'assignment',
      basePoints: 100,
      weight: 1.2,
      dailyMaxPoints: 300,
      weeklyMaxPoints: 800,
      scaleWithDifficulty: true,
      scaleWithPerformance: true,
      scaleWithTimeSpent: true,
      maxTimeMinutes: 120
    });
    
    this.activityConfigs.set('exam', {
      type: 'exam',
      basePoints: 200,
      weight: 1.5,
      dailyMaxPoints: 400,
      weeklyMaxPoints: 1000,
      scaleWithDifficulty: true,
      scaleWithPerformance: true,
      scaleWithTimeSpent: false
    });
    
    // Participation activities
    this.activityConfigs.set('discussion', {
      type: 'discussion',
      basePoints: 20,
      weight: 0.8,
      dailyMaxPoints: 100,
      weeklyMaxPoints: 300,
      scaleWithDifficulty: false,
      scaleWithPerformance: true,
      scaleWithTimeSpent: true,
      maxTimeMinutes: 60
    });
    
    this.activityConfigs.set('participation', {
      type: 'participation',
      basePoints: 10,
      weight: 0.7,
      dailyMaxPoints: 50,
      weeklyMaxPoints: 200,
      scaleWithDifficulty: false,
      scaleWithPerformance: true,
      scaleWithTimeSpent: false
    });
    
    // Attendance
    this.activityConfigs.set('attendance', {
      type: 'attendance',
      basePoints: 10,
      weight: 1.0,
      dailyMaxPoints: 20,
      weeklyMaxPoints: 100,
      scaleWithDifficulty: false,
      scaleWithPerformance: false,
      scaleWithTimeSpent: false
    });
    
    // Achievements
    this.activityConfigs.set('achievement', {
      type: 'achievement',
      basePoints: 50,
      weight: 1.0,
      dailyMaxPoints: 200,
      weeklyMaxPoints: 500,
      scaleWithDifficulty: true,
      scaleWithPerformance: false,
      scaleWithTimeSpent: false
    });
  }
  
  /**
   * Calculate points for an activity
   */
  public calculatePoints(
    studentId: string,
    request: PointsCalculationRequest
  ): PointsCalculationResult {
    // Get activity config
    const activityConfig = this.activityConfigs.get(request.activityType);
    
    // If no config found, use a default
    if (!activityConfig) {
      return {
        basePoints: 10,
        calculatedPoints: 10,
        multipliers: {},
        wasCapped: false
      };
    }
    
    // Start with base points
    let points = activityConfig.basePoints;
    const multipliers: PointsCalculationResult['multipliers'] = {};
    
    // Apply difficulty multiplier if applicable
    if (activityConfig.scaleWithDifficulty && request.difficultyLevel) {
      const difficultyLevel = this.difficultyLevels.find(d => d.level === request.difficultyLevel);
      if (difficultyLevel) {
        multipliers.difficulty = difficultyLevel.multiplier;
        points *= difficultyLevel.multiplier;
      }
    }
    
    // Apply performance multiplier if applicable
    if (activityConfig.scaleWithPerformance && request.score !== undefined) {
      const performanceLevel = this.performanceLevels.find(
        p => request.score! >= p.minScore && request.score! <= p.maxScore
      );
      if (performanceLevel) {
        multipliers.performance = performanceLevel.multiplier;
        points *= performanceLevel.multiplier;
      }
    }
    
    // Apply time spent multiplier if applicable
    if (activityConfig.scaleWithTimeSpent && request.timeSpentMinutes !== undefined) {
      const maxTime = activityConfig.maxTimeMinutes || 60;
      const timeMultiplier = Math.min(request.timeSpentMinutes / maxTime, 1);
      multipliers.timeSpent = 0.5 + (timeMultiplier * 0.5); // Scale from 0.5 to 1.0
      points *= multipliers.timeSpent;
    }
    
    // Apply repeat multiplier if applicable
    if (request.isRepeat) {
      multipliers.repeat = this.repeatMultiplier;
      points *= this.repeatMultiplier;
    }
    
    // Apply custom multiplier if provided
    if (request.customMultiplier !== undefined) {
      multipliers.custom = request.customMultiplier;
      points *= request.customMultiplier;
    }
    
    // Apply activity weight
    points *= activityConfig.weight;
    
    // Round to nearest integer
    const uncappedPoints = Math.round(points);
    
    // Check against daily and weekly caps
    const cappedPoints = this.applyCaps(
      studentId,
      request.activityType,
      uncappedPoints,
      activityConfig
    );
    
    return {
      basePoints: activityConfig.basePoints,
      calculatedPoints: cappedPoints,
      multipliers,
      wasCapped: cappedPoints < uncappedPoints,
      uncappedPoints: cappedPoints < uncappedPoints ? uncappedPoints : undefined
    };
  }
  
  /**
   * Apply daily and weekly caps to points
   */
  private applyCaps(
    studentId: string,
    activityType: string,
    points: number,
    config: ActivityTypeConfig
  ): number {
    // Get or create usage tracking for this student
    let tracking = this.usageTracking.get(studentId);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = this.getStartOfWeek(now).toISOString().split('T')[0];
    
    // If no tracking or it's been reset, create a new one
    if (!tracking || this.shouldResetTracking(tracking.lastReset, now)) {
      tracking = {
        daily: new Map(),
        weekly: new Map(),
        lastReset: now
      };
      this.usageTracking.set(studentId, tracking);
    }
    
    // Get current daily and weekly usage
    const dailyUsage = tracking.daily.get(`${activityType}:${today}`) || 0;
    const weeklyUsage = tracking.weekly.get(`${activityType}:${startOfWeek}`) || 0;
    
    // Calculate remaining allowances
    const dailyRemaining = Math.max(0, config.dailyMaxPoints - dailyUsage);
    const weeklyRemaining = Math.max(0, config.weeklyMaxPoints - weeklyUsage);
    
    // Cap points to the lower of the two remaining allowances
    const cappedPoints = Math.min(points, dailyRemaining, weeklyRemaining);
    
    // Update usage tracking
    tracking.daily.set(`${activityType}:${today}`, dailyUsage + cappedPoints);
    tracking.weekly.set(`${activityType}:${startOfWeek}`, weeklyUsage + cappedPoints);
    
    return cappedPoints;
  }
  
  /**
   * Check if tracking should be reset
   */
  private shouldResetTracking(lastReset: Date, now: Date): boolean {
    // Reset if it's been more than a day
    return (now.getTime() - lastReset.getTime()) > 86400000; // 24 hours
  }
  
  /**
   * Get the start of the week (Sunday) for a given date
   */
  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    result.setDate(date.getDate() - date.getDay()); // Go back to Sunday
    result.setHours(0, 0, 0, 0); // Start of day
    return result;
  }
  
  /**
   * Get activity configuration
   */
  public getActivityConfig(activityType: string): ActivityTypeConfig | undefined {
    return this.activityConfigs.get(activityType);
  }
  
  /**
   * Get all activity configurations
   */
  public getAllActivityConfigs(): ActivityTypeConfig[] {
    return Array.from(this.activityConfigs.values());
  }
  
  /**
   * Get difficulty levels
   */
  public getDifficultyLevels(): DifficultyLevel[] {
    return this.difficultyLevels;
  }
  
  /**
   * Get performance levels
   */
  public getPerformanceLevels(): PerformanceLevel[] {
    return this.performanceLevels;
  }
  
  /**
   * Get student usage statistics
   */
  public getStudentUsage(studentId: string): {
    daily: { activityType: string; date: string; points: number }[];
    weekly: { activityType: string; week: string; points: number }[];
  } {
    const tracking = this.usageTracking.get(studentId);
    
    if (!tracking) {
      return { daily: [], weekly: [] };
    }
    
    const daily = Array.from(tracking.daily.entries()).map(([key, points]) => {
      const [activityType, date] = key.split(':');
      return { activityType, date, points };
    });
    
    const weekly = Array.from(tracking.weekly.entries()).map(([key, points]) => {
      const [activityType, week] = key.split(':');
      return { activityType, week, points };
    });
    
    return { daily, weekly };
  }
  
  /**
   * Clear usage tracking for testing or administrative purposes
   */
  public clearUsageTracking(): void {
    this.usageTracking.clear();
  }
}
