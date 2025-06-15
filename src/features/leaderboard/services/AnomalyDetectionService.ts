/**
 * Anomaly Detection Service
 *
 * This service provides methods for detecting suspicious activities in the leaderboard system.
 * It helps prevent gaming of the system by identifying unusual patterns in point earning.
 */

import { StandardLeaderboardEntry } from '../types/standard-leaderboard';

export interface PointEarningEvent {
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnomalyDetectionConfig {
  // Time window for rate limiting (in milliseconds)
  rateWindowMs: number;

  // Maximum points allowed in the rate window
  maxPointsPerWindow: number;

  // Maximum points allowed per single event
  maxPointsPerEvent: number;

  // Threshold for standard deviation multiplier to detect outliers
  outlierThreshold: number;

  // Minimum number of events required for statistical analysis
  minEventsForAnalysis: number;

  // Maximum percentage increase in points allowed in a single day
  maxDailyIncreasePercentage: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType?: 'rate_limit' | 'outlier' | 'unusual_pattern' | 'suspicious_timing';
  confidence: number; // 0-1 scale
  details?: string;
  suggestedAction?: 'flag' | 'review' | 'block';
}

export class AnomalyDetectionService {
  private config: AnomalyDetectionConfig;
  private eventCache: Map<string, PointEarningEvent[]> = new Map();

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    // Default configuration
    this.config = {
      rateWindowMs: 3600000, // 1 hour
      maxPointsPerWindow: 500,
      maxPointsPerEvent: 200,
      outlierThreshold: 2.5, // 2.5 standard deviations
      minEventsForAnalysis: 5,
      maxDailyIncreasePercentage: 50,
      ...config
    };
  }

  /**
   * Check if a point earning event is anomalous
   */
  public detectAnomaly(event: PointEarningEvent, studentHistory?: PointEarningEvent[]): AnomalyDetectionResult {
    // Get student history from cache if not provided
    const history = studentHistory || this.getStudentHistory(event.studentId);

    // Add current event to history for analysis
    const allEvents = [...history, event];

    // Run different anomaly detection checks
    const rateCheck = this.checkRateLimit(event, allEvents);
    if (rateCheck.isAnomaly) return rateCheck;

    const outlierCheck = this.checkOutlier(event, allEvents);
    if (outlierCheck.isAnomaly) return outlierCheck;

    const patternCheck = this.checkUnusualPatterns(event, allEvents);
    if (patternCheck.isAnomaly) return patternCheck;

    const timingCheck = this.checkSuspiciousTiming(event, allEvents);
    if (timingCheck.isAnomaly) return timingCheck;

    // No anomalies detected
    return {
      isAnomaly: false,
      confidence: 0,
    };
  }

  /**
   * Add an event to the cache for future analysis
   */
  public trackEvent(event: PointEarningEvent): void {
    const history = this.eventCache.get(event.studentId) || [];
    history.push(event);

    // Limit cache size by keeping only recent events
    const recentEvents = history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100); // Keep last 100 events

    this.eventCache.set(event.studentId, recentEvents);
  }

  /**
   * Get student history from cache
   */
  private getStudentHistory(studentId: string): PointEarningEvent[] {
    return this.eventCache.get(studentId) || [];
  }

  /**
   * Check if event exceeds rate limits
   */
  private checkRateLimit(event: PointEarningEvent, history: PointEarningEvent[]): AnomalyDetectionResult {
    // Check if single event exceeds max points per event
    if (event.amount > this.config.maxPointsPerEvent) {
      return {
        isAnomaly: true,
        anomalyType: 'rate_limit',
        confidence: 0.9,
        details: `Event exceeds maximum points per event (${event.amount} > ${this.config.maxPointsPerEvent})`,
        suggestedAction: 'review'
      };
    }

    // Check if total points in time window exceeds limit
    const now = event.timestamp.getTime();
    const windowStart = now - this.config.rateWindowMs;

    const recentEvents = history.filter(e => e.timestamp.getTime() > windowStart);
    const totalPointsInWindow = recentEvents.reduce((sum, e) => sum + e.amount, 0);

    if (totalPointsInWindow > this.config.maxPointsPerWindow) {
      return {
        isAnomaly: true,
        anomalyType: 'rate_limit',
        confidence: 0.8,
        details: `Total points in time window exceeds limit (${totalPointsInWindow} > ${this.config.maxPointsPerWindow})`,
        suggestedAction: 'flag'
      };
    }

    return { isAnomaly: false, confidence: 0 };
  }

  /**
   * Check if event is a statistical outlier
   */
  private checkOutlier(event: PointEarningEvent, history: PointEarningEvent[]): AnomalyDetectionResult {
    // Need minimum number of events for statistical analysis
    if (history.length < this.config.minEventsForAnalysis) {
      return { isAnomaly: false, confidence: 0 };
    }

    // Calculate mean and standard deviation of point amounts
    const amounts = history.map(e => e.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Check if current event is an outlier
    const zScore = (event.amount - mean) / stdDev;

    if (zScore > this.config.outlierThreshold) {
      const confidence = Math.min(0.5 + (zScore - this.config.outlierThreshold) / 10, 0.95);

      return {
        isAnomaly: true,
        anomalyType: 'outlier',
        confidence,
        details: `Event is a statistical outlier (z-score: ${zScore.toFixed(2)})`,
        suggestedAction: confidence > 0.8 ? 'review' : 'flag'
      };
    }

    return { isAnomaly: false, confidence: 0 };
  }

  /**
   * Check for unusual patterns in point earning
   */
  private checkUnusualPatterns(event: PointEarningEvent, history: PointEarningEvent[]): AnomalyDetectionResult {
    // Need minimum number of events for pattern analysis
    if (history.length < this.config.minEventsForAnalysis) {
      return { isAnomaly: false, confidence: 0 };
    }

    // Check for repeated identical amounts in short time periods
    const last24Hours = new Date(event.timestamp.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = history.filter(e => e.timestamp > last24Hours);

    const identicalAmounts = recentEvents.filter(e =>
      e.amount === event.amount &&
      e.source === event.source &&
      e.studentId === event.studentId
    );

    if (identicalAmounts.length >= 5) { // 5 or more identical events in 24 hours
      return {
        isAnomaly: true,
        anomalyType: 'unusual_pattern',
        confidence: 0.7,
        details: `Unusual pattern detected: ${identicalAmounts.length} identical point earnings in 24 hours`,
        suggestedAction: 'flag'
      };
    }

    // Check for sudden large increases in daily point totals
    const dailyTotals = new Map<string, number>();

    for (const e of history) {
      const dateKey = e.timestamp.toISOString().split('T')[0];
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + e.amount);
    }

    const dailyValues = Array.from(dailyTotals.values());
    if (dailyValues.length >= 2) {
      const sortedValues = [...dailyValues].sort((a, b) => a - b);
      const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];

      const todayKey = event.timestamp.toISOString().split('T')[0];
      const todayTotal = dailyTotals.get(todayKey) || 0;

      const percentIncrease = ((todayTotal / medianValue) - 1) * 100;

      if (percentIncrease > this.config.maxDailyIncreasePercentage) {
        return {
          isAnomaly: true,
          anomalyType: 'unusual_pattern',
          confidence: 0.6,
          details: `Unusual pattern detected: ${percentIncrease.toFixed(0)}% increase in daily points`,
          suggestedAction: 'flag'
        };
      }
    }

    return { isAnomaly: false, confidence: 0 };
  }

  /**
   * Check for suspicious timing of point earning events
   */
  private checkSuspiciousTiming(event: PointEarningEvent, history: PointEarningEvent[]): AnomalyDetectionResult {
    // Need minimum number of events for timing analysis
    if (history.length < this.config.minEventsForAnalysis) {
      return { isAnomaly: false, confidence: 0 };
    }

    // Check for events at unusual hours (e.g., middle of the night)
    const hour = event.timestamp.getHours();
    const isSchoolHours = hour >= 7 && hour <= 18; // 7 AM to 6 PM

    if (!isSchoolHours && event.amount > this.config.maxPointsPerEvent / 2) {
      return {
        isAnomaly: true,
        anomalyType: 'suspicious_timing',
        confidence: 0.5,
        details: `Suspicious timing: Large point earning (${event.amount}) outside school hours (${hour}:00)`,
        suggestedAction: 'flag'
      };
    }

    // Check for extremely rapid succession of events
    const sortedEvents = [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sortedEvents.length >= 3) {
      const recentEvents = sortedEvents.slice(-3);
      const timeDiffs: number[] = [];

      for (let i = 1; i < recentEvents.length; i++) {
        timeDiffs.push(recentEvents[i].timestamp.getTime() - recentEvents[i-1].timestamp.getTime());
      }

      // Initialize with a default value if array is empty
      if (timeDiffs.length === 0) {
        timeDiffs.push(Infinity);
      }

      const minTimeDiff = Math.min(...timeDiffs);

      // If events are less than 5 seconds apart
      if (minTimeDiff < 5000) {
        return {
          isAnomaly: true,
          anomalyType: 'suspicious_timing',
          confidence: 0.6,
          details: `Suspicious timing: Multiple events in rapid succession (${(minTimeDiff/1000).toFixed(1)} seconds apart)`,
          suggestedAction: 'flag'
        };
      }
    }

    return { isAnomaly: false, confidence: 0 };
  }

  /**
   * Analyze leaderboard for potential anomalies
   */
  public analyzeLeaderboard(leaderboard: StandardLeaderboardEntry[]): Map<string, AnomalyDetectionResult> {
    const results = new Map<string, AnomalyDetectionResult>();

    // Check for unusual distributions or patterns in the leaderboard
    if (leaderboard.length < 5) return results;

    // Calculate statistics for the leaderboard
    const points = leaderboard.map(entry => entry.rewardPoints);
    const mean = points.reduce((sum, val) => sum + val, 0) / points.length;
    const variance = points.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / points.length;
    const stdDev = Math.sqrt(variance);

    // Check each entry for being an outlier
    for (const entry of leaderboard) {
      const zScore = (entry.rewardPoints - mean) / stdDev;

      if (zScore > this.config.outlierThreshold * 1.5) { // Higher threshold for leaderboard analysis
        results.set(entry.studentId, {
          isAnomaly: true,
          anomalyType: 'outlier',
          confidence: 0.7,
          details: `Student has unusually high points compared to peers (z-score: ${zScore.toFixed(2)})`,
          suggestedAction: 'review'
        });
      }
    }

    return results;
  }
}
