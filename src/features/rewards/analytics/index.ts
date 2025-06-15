'use client';

// Export all analytics functionality
export * from './offline-analytics';

// Define analytics event types
export type RewardsAnalyticsEventType =
  | 'achievement_unlocked'
  | 'points_earned'
  | 'level_up'
  | 'leaderboard_position_changed'
  | 'badge_earned'
  | 'streak_milestone'
  | 'offline_mode_enter'
  | 'offline_mode_exit'
  | 'offline_sync_start'
  | 'offline_sync_complete'
  | 'offline_sync_error';

// Analytics manager (simplified for now)
const analyticsManager = {
  trackEvent: (eventType: string, eventData: any) => {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(eventType, eventData);
    } else {
      console.log(`[Analytics] ${eventType}:`, eventData);
    }
  }
};

/**
 * Track when an achievement is unlocked
 * @param achievementId The ID of the achievement
 * @param studentId The ID of the student
 * @param title The title of the achievement
 * @param type The type of achievement
 */
export function trackAchievementUnlocked(
  achievementId: string,
  studentId: string,
  title: string,
  type: string
): void {
  analyticsManager.trackEvent('achievement_unlocked', {
    achievementId,
    studentId,
    title,
    type,
    timestamp: Date.now()
  });
}

/**
 * Track when points are earned
 * @param pointsId The ID of the points record
 * @param studentId The ID of the student
 * @param amount The amount of points
 * @param source The source of the points
 * @param sourceId Optional ID of the source (e.g., activity ID)
 */
export function trackPointsEarned(
  pointsId: string,
  studentId: string,
  amount: number,
  source: string,
  sourceId?: string
): void {
  analyticsManager.trackEvent('points_earned', {
    pointsId,
    studentId,
    amount,
    source,
    sourceId,
    timestamp: Date.now()
  });
}

/**
 * Track when a student levels up
 * @param levelId The ID of the level record
 * @param studentId The ID of the student
 * @param newLevel The new level number
 * @param previousLevel The previous level number
 */
export function trackLevelUp(
  levelId: string,
  studentId: string,
  newLevel: number,
  previousLevel: number
): void {
  analyticsManager.trackEvent('level_up', {
    levelId,
    studentId,
    newLevel,
    previousLevel,
    levelGain: newLevel - previousLevel,
    timestamp: Date.now()
  });
}

/**
 * Track when a student's leaderboard position changes
 * @param studentId The ID of the student
 * @param leaderboardType The type of leaderboard
 * @param newPosition The new position
 * @param previousPosition The previous position
 * @param referenceId The ID of the reference (e.g., class ID, subject ID)
 */
export function trackLeaderboardPositionChanged(
  studentId: string,
  leaderboardType: string,
  newPosition: number,
  previousPosition: number,
  referenceId: string
): void {
  analyticsManager.trackEvent('leaderboard_position_changed', {
    studentId,
    leaderboardType,
    newPosition,
    previousPosition,
    positionChange: previousPosition - newPosition,
    referenceId,
    timestamp: Date.now()
  });
}

/**
 * Track when a badge is earned
 * @param badgeId The ID of the badge
 * @param studentId The ID of the student
 * @param badgeName The name of the badge
 * @param category The category of the badge
 */
export function trackBadgeEarned(
  badgeId: string,
  studentId: string,
  badgeName: string,
  category: string
): void {
  analyticsManager.trackEvent('badge_earned', {
    badgeId,
    studentId,
    badgeName,
    category,
    timestamp: Date.now()
  });
}

/**
 * Track when a streak milestone is reached
 * @param studentId The ID of the student
 * @param streakType The type of streak
 * @param streakCount The current streak count
 * @param milestone The milestone reached
 */
export function trackStreakMilestone(
  studentId: string,
  streakType: string,
  streakCount: number,
  milestone: number
): void {
  analyticsManager.trackEvent('streak_milestone', {
    studentId,
    streakType,
    streakCount,
    milestone,
    timestamp: Date.now()
  });
}
