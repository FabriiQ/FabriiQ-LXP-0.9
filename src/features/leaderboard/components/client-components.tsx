'use client';

/**
 * Client-side Leaderboard Components with Code Splitting
 *
 * This file exports leaderboard components with code splitting to improve
 * initial load performance. Components are grouped into logical bundles
 * and loaded dynamically when needed.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/atoms/skeleton';

// Skeleton loaders for dynamic components
const LeaderboardTableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-48" />
    <div className="space-y-2 mt-4">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LeaderboardMilestonesSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-48" />
    <div className="space-y-2 mt-4">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dynamic imports for code splitting

// Bundle 1: Core Leaderboard Components
export const StandardLeaderboard = dynamic(
  () => import('./StandardLeaderboard').then(mod => ({ default: mod.StandardLeaderboard })),
  {
    loading: () => <LeaderboardTableSkeleton />,
    ssr: false
  }
);

export const BaseLeaderboardTable = dynamic(
  () => import('./BaseLeaderboardTable').then(mod => ({ default: mod.BaseLeaderboardTable })),
  {
    loading: () => <LeaderboardTableSkeleton />,
    ssr: false
  }
);

export const LeaderboardFilters = dynamic(
  () => import('./LeaderboardFilters').then(mod => ({ default: mod.LeaderboardFilters })),
  { ssr: false }
);

// Bundle 2: Virtualized Leaderboard Components
export const VirtualizedLeaderboardTable = dynamic(
  () => import('./VirtualizedLeaderboardTable').then(mod => ({ default: mod.VirtualizedLeaderboardTable })),
  {
    loading: () => <LeaderboardTableSkeleton />,
    ssr: false
  }
);

// Bundle 3: Milestone and Achievement Components
export const LeaderboardMilestones = dynamic(
  () => import('./LeaderboardMilestones').then(mod => ({ default: mod.LeaderboardMilestones })),
  {
    loading: () => <LeaderboardMilestonesSkeleton />,
    ssr: false
  }
);

export const LeaderboardPersonalBestIndicator = dynamic(
  () => import('./LeaderboardPersonalBestIndicator').then(mod => ({ default: mod.LeaderboardPersonalBestIndicator })),
  { ssr: false }
);

// Bundle 4: Interactive Components
export const LeaderboardInteractiveRow = dynamic(
  () => import('./LeaderboardInteractiveRow').then(mod => ({ default: mod.LeaderboardInteractiveRow })),
  { ssr: false }
);

export const LeaderboardRealTimeUpdates = dynamic(
  () => import('./LeaderboardRealTimeUpdates').then(mod => ({ default: mod.LeaderboardRealTimeUpdates })),
  { ssr: false }
);

// Bundle 5: Transparency Components
export const RankingAlgorithmDocumentation = dynamic(
  () => import('./transparency/RankingAlgorithmDocumentation').then(mod => ({ default: mod.RankingAlgorithmDocumentation })),
  { ssr: false }
);

export const ScoringSystemVisualizer = dynamic(
  () => import('./transparency/ScoringSystemVisualizer').then(mod => ({ default: mod.ScoringSystemVisualizer })),
  { ssr: false }
);

export const PointsBreakdownComponent = dynamic(
  () => import('./transparency/PointsBreakdownComponent').then(mod => ({ default: mod.PointsBreakdownComponent })),
  { ssr: false }
);

export const LeaderboardHistoryViewer = dynamic(
  () => import('./transparency/LeaderboardHistoryViewer').then(mod => ({ default: mod.LeaderboardHistoryViewer })),
  { ssr: false }
);

export const PointEarningRulesDocumentation = dynamic(
  () => import('./fairness/PointEarningRulesDocumentation').then(mod => ({ default: mod.PointEarningRulesDocumentation })),
  { ssr: false }
);

// Bundle 6: Anti-Gaming Components
export const EducatorControlPanel = dynamic(
  () => import('./anti-gaming/EducatorControlPanel').then(mod => ({ default: mod.EducatorControlPanel })),
  { ssr: false }
);

export const HighValueActivityVerification = dynamic(
  () => import('./anti-gaming/HighValueActivityVerification').then(mod => ({ default: mod.HighValueActivityVerification })),
  { ssr: false }
);

// Bundle 7: Fairness Components
export const CategoryBasedComparison = dynamic(
  () => import('./fairness/CategoryBasedComparison').then(mod => ({ default: mod.CategoryBasedComparison })),
  { ssr: false }
);

export const DisputeResolutionSystem = dynamic(
  () => import('./fairness/DisputeResolutionSystem').then(mod => ({ default: mod.DisputeResolutionSystem })),
  { ssr: false }
);

export const LateJoinerHandicapSystem = dynamic(
  () => import('./fairness/LateJoinerHandicapSystem').then(mod => ({ default: mod.LateJoinerHandicapSystem })),
  { ssr: false }
);

// Wrapped components with Suspense
export const StandardLeaderboardWithSuspense = (props: any) => (
  <Suspense fallback={<LeaderboardTableSkeleton />}>
    <StandardLeaderboard {...props} />
  </Suspense>
);

export const BaseLeaderboardTableWithSuspense = (props: any) => (
  <Suspense fallback={<LeaderboardTableSkeleton />}>
    <BaseLeaderboardTable {...props} />
  </Suspense>
);

export const VirtualizedLeaderboardTableWithSuspense = (props: any) => (
  <Suspense fallback={<LeaderboardTableSkeleton />}>
    <VirtualizedLeaderboardTable {...props} />
  </Suspense>
);

export const LeaderboardMilestonesWithSuspense = (props: any) => (
  <Suspense fallback={<LeaderboardMilestonesSkeleton />}>
    <LeaderboardMilestones {...props} />
  </Suspense>
);
