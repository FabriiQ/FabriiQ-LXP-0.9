/**
 * Unified Leaderboard System
 *
 * This module provides a standardized leaderboard implementation across all portals
 * with clear separation between academic performance metrics and reward points.
 */

// Export types
export * from './types/standard-leaderboard';

// Export services
export * from './services/unified-leaderboard.service';
// export * from './services/leaderboard-partitioning.service';

// Export components
export * from './components';

// Export utilities
export * from './utils';

// Export hooks
export * from './hooks/useTouchInteractions';
export * from './hooks/useLeaderboardGoals';

// Export hooks
export * from './hooks/useLeaderboard';
export * from './hooks/useLeaderboardFilters';
export * from './hooks/useLeaderboardSync';
export * from './hooks/useLeaderboardGoals';
// export * from './hooks/useStudentPosition';

// Export utilities
export * from './utils/leaderboard-calculations';
export * from './utils/partition-helpers';
