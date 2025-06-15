/**
 * Points Rate Limiter Service
 * 
 * This service provides rate limiting for point-earning activities to prevent
 * gaming of the system and ensure fair distribution of points.
 */

export interface RateLimitConfig {
  // Time window for rate limiting (in milliseconds)
  windowMs: number;
  
  // Maximum points allowed in the time window
  maxPoints: number;
  
  // Cooldown period for specific activities (in milliseconds)
  cooldownMs: number;
  
  // Whether to allow points to accumulate during cooldown
  accumulateDuringCooldown: boolean;
}

export interface ActivityConfig {
  // Activity type identifier
  type: string;
  
  // Custom rate limit configuration for this activity type
  rateLimit?: Partial<RateLimitConfig>;
  
  // Maximum points allowed per single instance of this activity
  maxPointsPerInstance?: number;
  
  // Whether this activity is exempt from rate limiting
  exempt?: boolean;
}

export interface RateLimitResult {
  // Whether the points are allowed
  allowed: boolean;
  
  // The actual amount of points allowed (may be reduced)
  allowedAmount: number;
  
  // Reason for limiting, if applicable
  reason?: 'window_limit' | 'cooldown' | 'instance_limit';
  
  // When the rate limit will reset
  resetTime?: Date;
  
  // Remaining points allowed in the current window
  remaining?: number;
}

export interface PointsRequest {
  // Student ID
  studentId: string;
  
  // Activity type
  activityType: string;
  
  // Activity ID
  activityId: string;
  
  // Requested points amount
  amount: number;
  
  // Timestamp of the request
  timestamp: Date;
}

export class PointsRateLimiter {
  // Default rate limit configuration
  private defaultConfig: RateLimitConfig = {
    windowMs: 3600000, // 1 hour
    maxPoints: 500,
    cooldownMs: 300000, // 5 minutes
    accumulateDuringCooldown: false
  };
  
  // Activity-specific configurations
  private activityConfigs: Map<string, ActivityConfig> = new Map();
  
  // Cache of student point usage
  private pointsCache: Map<string, {
    windowStart: Date;
    pointsUsed: number;
    activities: Map<string, Date>;
  }> = new Map();
  
  constructor(defaultConfig?: Partial<RateLimitConfig>, activityConfigs?: ActivityConfig[]) {
    // Override default config with provided values
    if (defaultConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...defaultConfig };
    }
    
    // Set up activity configurations
    if (activityConfigs) {
      for (const config of activityConfigs) {
        this.activityConfigs.set(config.type, config);
      }
    }
    
    // Set up default activity configurations if not provided
    this.setupDefaultActivityConfigs();
  }
  
  /**
   * Set up default activity configurations
   */
  private setupDefaultActivityConfigs(): void {
    // Only set up defaults if not already configured
    if (this.activityConfigs.size === 0) {
      // Academic activities (higher limits, less strict)
      this.activityConfigs.set('quiz', {
        type: 'quiz',
        rateLimit: {
          windowMs: 3600000, // 1 hour
          maxPoints: 300,
          cooldownMs: 60000 // 1 minute
        },
        maxPointsPerInstance: 100
      });
      
      this.activityConfigs.set('assignment', {
        type: 'assignment',
        rateLimit: {
          windowMs: 86400000, // 24 hours
          maxPoints: 500,
          cooldownMs: 300000 // 5 minutes
        },
        maxPointsPerInstance: 200
      });
      
      // Participation activities (lower limits, more strict)
      this.activityConfigs.set('participation', {
        type: 'participation',
        rateLimit: {
          windowMs: 3600000, // 1 hour
          maxPoints: 100,
          cooldownMs: 600000 // 10 minutes
        },
        maxPointsPerInstance: 20
      });
      
      // Attendance (exempt from rate limiting)
      this.activityConfigs.set('attendance', {
        type: 'attendance',
        exempt: true
      });
      
      // Achievements (exempt from rate limiting)
      this.activityConfigs.set('achievement', {
        type: 'achievement',
        exempt: true
      });
    }
  }
  
  /**
   * Check if a points request is allowed
   */
  public checkLimit(request: PointsRequest): RateLimitResult {
    // Get activity config
    const activityConfig = this.activityConfigs.get(request.activityType);
    
    // If activity is exempt from rate limiting, allow it
    if (activityConfig?.exempt) {
      return {
        allowed: true,
        allowedAmount: request.amount
      };
    }
    
    // Get effective rate limit config for this activity
    const effectiveConfig: RateLimitConfig = {
      ...this.defaultConfig,
      ...(activityConfig?.rateLimit || {})
    };
    
    // Check instance limit
    const instanceLimit = activityConfig?.maxPointsPerInstance || effectiveConfig.maxPoints;
    if (request.amount > instanceLimit) {
      return {
        allowed: true, // Allow but reduce
        allowedAmount: instanceLimit,
        reason: 'instance_limit',
        remaining: 0
      };
    }
    
    // Get or create student cache entry
    const cacheKey = `${request.studentId}`;
    let cacheEntry = this.pointsCache.get(cacheKey);
    
    const now = request.timestamp;
    
    // If no cache entry or window has expired, create a new one
    if (!cacheEntry || this.isWindowExpired(cacheEntry.windowStart, now, effectiveConfig.windowMs)) {
      cacheEntry = {
        windowStart: now,
        pointsUsed: 0,
        activities: new Map()
      };
      this.pointsCache.set(cacheKey, cacheEntry);
    }
    
    // Check cooldown for this specific activity
    const activityKey = `${request.activityType}:${request.activityId}`;
    const lastActivityTime = cacheEntry.activities.get(activityKey);
    
    if (lastActivityTime && this.isInCooldown(lastActivityTime, now, effectiveConfig.cooldownMs)) {
      const resetTime = new Date(lastActivityTime.getTime() + effectiveConfig.cooldownMs);
      
      return {
        allowed: false,
        allowedAmount: 0,
        reason: 'cooldown',
        resetTime
      };
    }
    
    // Check window limit
    const remainingPoints = effectiveConfig.maxPoints - cacheEntry.pointsUsed;
    
    if (request.amount > remainingPoints) {
      const resetTime = new Date(cacheEntry.windowStart.getTime() + effectiveConfig.windowMs);
      
      return {
        allowed: false,
        allowedAmount: 0,
        reason: 'window_limit',
        resetTime,
        remaining: remainingPoints
      };
    }
    
    // All checks passed, update cache and allow
    cacheEntry.pointsUsed += request.amount;
    cacheEntry.activities.set(activityKey, now);
    
    return {
      allowed: true,
      allowedAmount: request.amount,
      remaining: effectiveConfig.maxPoints - cacheEntry.pointsUsed
    };
  }
  
  /**
   * Check if a time window has expired
   */
  private isWindowExpired(windowStart: Date, now: Date, windowMs: number): boolean {
    return (now.getTime() - windowStart.getTime()) > windowMs;
  }
  
  /**
   * Check if an activity is in cooldown period
   */
  private isInCooldown(lastActivityTime: Date, now: Date, cooldownMs: number): boolean {
    return (now.getTime() - lastActivityTime.getTime()) < cooldownMs;
  }
  
  /**
   * Register a successful points award (for tracking purposes)
   */
  public registerPointsAwarded(request: PointsRequest, actualAmount: number): void {
    // Get or create student cache entry
    const cacheKey = `${request.studentId}`;
    let cacheEntry = this.pointsCache.get(cacheKey);
    
    const now = request.timestamp;
    
    // If no cache entry, create a new one
    if (!cacheEntry) {
      cacheEntry = {
        windowStart: now,
        pointsUsed: actualAmount,
        activities: new Map()
      };
      this.pointsCache.set(cacheKey, cacheEntry);
      return;
    }
    
    // Update activity timestamp
    const activityKey = `${request.activityType}:${request.activityId}`;
    cacheEntry.activities.set(activityKey, now);
    
    // If window has expired, reset it
    if (this.isWindowExpired(cacheEntry.windowStart, now, this.defaultConfig.windowMs)) {
      cacheEntry.windowStart = now;
      cacheEntry.pointsUsed = actualAmount;
    } else {
      // Otherwise add to existing points
      cacheEntry.pointsUsed += actualAmount;
    }
  }
  
  /**
   * Get current rate limit status for a student
   */
  public getStudentRateLimitStatus(studentId: string): {
    pointsUsed: number;
    maxPoints: number;
    resetTime: Date;
    activities: { type: string; id: string; lastUsed: Date }[];
  } {
    const cacheEntry = this.pointsCache.get(studentId);
    
    if (!cacheEntry) {
      return {
        pointsUsed: 0,
        maxPoints: this.defaultConfig.maxPoints,
        resetTime: new Date(Date.now() + this.defaultConfig.windowMs),
        activities: []
      };
    }
    
    const resetTime = new Date(cacheEntry.windowStart.getTime() + this.defaultConfig.windowMs);
    
    const activities = Array.from(cacheEntry.activities.entries()).map(([key, time]) => {
      const [type, id] = key.split(':');
      return { type, id, lastUsed: time };
    });
    
    return {
      pointsUsed: cacheEntry.pointsUsed,
      maxPoints: this.defaultConfig.maxPoints,
      resetTime,
      activities
    };
  }
  
  /**
   * Clear rate limit cache for testing or administrative purposes
   */
  public clearCache(): void {
    this.pointsCache.clear();
  }
}
