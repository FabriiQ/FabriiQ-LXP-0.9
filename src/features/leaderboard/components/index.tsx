/**
 * Leaderboard Components
 *
 * This file exports types and non-dynamic components.
 * Dynamic components are exported from client-components.tsx.
 */

// Export directly used types to avoid dynamic imports for types
export * from '../types/standard-leaderboard';
export type { Milestone } from './LeaderboardMilestones';
export type { VirtualizedLeaderboardEntry } from './VirtualizedLeaderboardTable';

// Core components (loaded immediately)
export { LeaderboardRankChangeAnimation } from './LeaderboardRankChangeAnimation';
export { LeaderboardSyncStatus } from './LeaderboardSyncStatus';

// Re-export client components
export * from './client-components';
