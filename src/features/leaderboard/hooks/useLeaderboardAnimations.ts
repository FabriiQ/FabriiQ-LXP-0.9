'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StandardLeaderboardEntry } from '../types/standard-leaderboard';

export interface RankChangeAnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  smallChangeThreshold?: number;
  largeChangeThreshold?: number;
}

export interface LeaderboardAnimationOptions {
  rankChangeConfig?: RankChangeAnimationConfig;
  enableHapticFeedback?: boolean;
  reducedMotion?: boolean;
}

/**
 * Hook for managing leaderboard animations and microinteractions
 */
export function useLeaderboardAnimations(
  options: LeaderboardAnimationOptions = {}
) {
  const {
    rankChangeConfig = {
      duration: 800,
      delay: 100,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smallChangeThreshold: 3,
      largeChangeThreshold: 10
    },
    enableHapticFeedback = true,
    reducedMotion = false
  } = options;

  const [animatingEntries, setAnimatingEntries] = useState<Record<string, boolean>>({});
  const [highlightedEntries, setHighlightedEntries] = useState<Record<string, boolean>>({});
  const previousEntriesRef = useRef<StandardLeaderboardEntry[]>([]);
  const animationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Clear all animation timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  /**
   * Trigger haptic feedback if available and enabled
   */
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!enableHapticFeedback || !window.navigator.vibrate) return;

    switch (intensity) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'heavy':
        window.navigator.vibrate([30, 20, 40]);
        break;
    }
  }, [enableHapticFeedback]);

  /**
   * Get animation class based on rank change
   */
  const getRankChangeAnimationClass = useCallback((rankChange?: number): string => {
    if (!rankChange) return '';

    // Respect reduced motion preference
    if (reducedMotion) return rankChange > 0 ? 'rank-improved' : 'rank-decreased';

    const absChange = Math.abs(rankChange);

    if (rankChange > 0) {
      // Rank improved (lower number is better)
      if (absChange >= (rankChangeConfig.largeChangeThreshold || 10)) {
        return 'animate-rank-large-improvement';
      } else if (absChange >= (rankChangeConfig.smallChangeThreshold || 3)) {
        return 'animate-rank-medium-improvement';
      }
      return 'animate-rank-small-improvement';
    } else {
      // Rank decreased
      if (absChange >= (rankChangeConfig.largeChangeThreshold || 10)) {
        return 'animate-rank-large-decrease';
      } else if (absChange >= (rankChangeConfig.smallChangeThreshold || 3)) {
        return 'animate-rank-medium-decrease';
      }
      return 'animate-rank-small-decrease';
    }
  }, [reducedMotion, rankChangeConfig]);

  /**
   * Process new leaderboard data and trigger animations
   */
  const processLeaderboardUpdate = useCallback((entries: StandardLeaderboardEntry[]) => {
    // Skip if entries are the same reference as previous entries
    // This prevents unnecessary processing when the data hasn't changed
    if (entries === previousEntriesRef.current) {
      return;
    }

    // Skip if entries are empty
    if (entries.length === 0) {
      previousEntriesRef.current = entries;
      return;
    }

    // Skip if previous entries are empty (first render)
    if (previousEntriesRef.current.length === 0) {
      previousEntriesRef.current = [...entries];
      return;
    }

    // Create a map of previous entries by student ID
    const prevEntriesMap = previousEntriesRef.current.reduce<Record<string, StandardLeaderboardEntry>>(
      (acc, entry) => {
        acc[entry.studentId] = entry;
        return acc;
      },
      {}
    );

    // Track which entries need animation
    const newAnimatingEntries: Record<string, boolean> = {};
    let hasChanges = false;

    // Check each entry for changes
    entries.forEach(entry => {
      const prevEntry = prevEntriesMap[entry.studentId];

      // Skip if no previous entry or no rank change
      if (!prevEntry || entry.rank === prevEntry.rank) return;

      // Mark entry for animation
      newAnimatingEntries[entry.studentId] = true;
      hasChanges = true;

      // Clear any existing timeout for this entry
      if (animationTimeoutsRef.current[entry.studentId]) {
        clearTimeout(animationTimeoutsRef.current[entry.studentId]);
      }

      // Set timeout to end animation
      animationTimeoutsRef.current[entry.studentId] = setTimeout(() => {
        setAnimatingEntries(prev => ({
          ...prev,
          [entry.studentId]: false
        }));

        // Highlight the entry after animation
        setHighlightedEntries(prev => ({
          ...prev,
          [entry.studentId]: true
        }));

        // Clear highlight after a delay
        const highlightTimeout = setTimeout(() => {
          setHighlightedEntries(prev => ({
            ...prev,
            [entry.studentId]: false
          }));
        }, 2000);

        // Store the highlight timeout to clear it if needed
        animationTimeoutsRef.current[`highlight-${entry.studentId}`] = highlightTimeout;
      }, (rankChangeConfig.duration || 800) + (rankChangeConfig.delay || 100));

      // Trigger haptic feedback for significant changes
      if (Math.abs(entry.rank - prevEntry.rank) >= (rankChangeConfig.largeChangeThreshold || 10)) {
        triggerHapticFeedback('medium');
      }
    });

    // Only update state if there are changes
    if (hasChanges) {
      setAnimatingEntries(newAnimatingEntries);
    }

    // Store current entries for next comparison
    previousEntriesRef.current = [...entries];
  }, [rankChangeConfig, triggerHapticFeedback]);

  return {
    animatingEntries,
    highlightedEntries,
    processLeaderboardUpdate,
    getRankChangeAnimationClass,
    triggerHapticFeedback
  };
}
