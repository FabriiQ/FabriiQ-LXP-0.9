# Leaderboard Cleanup Guide

After successfully migrating all portals to the new unified leaderboard implementation, the following files and components should be removed to maintain a clean codebase. This guide provides a comprehensive checklist to ensure a smooth transition and prevent any regressions.

## Migration Status

- [x] Student Portal - Completed
- [x] Teacher Portal - Completed
- [x] Coordinator Portal - Completed
- [x] Campus Admin Portal - Completed
- [x] Parent Portal - Completed

## Benefits of the New Implementation

- **Unified Architecture**: Single source of truth for leaderboard data
- **Enhanced Performance**: Virtualization for large datasets, optimized queries
- **Improved User Experience**: Microinteractions, animations, and real-time updates
- **Transparency Features**: Points breakdown, scoring explanations, and history
- **Mobile-First Design**: Fully responsive across all devices
- **Offline Support**: Data synchronization and conflict resolution
- **Accessibility**: WCAG 2.1 AA compliant components

## New Implementation Overview

The new unified leaderboard implementation is located in the `src/features/leaderboard` directory and follows a feature-first architecture. It includes:

- **Core Components**: Standardized, reusable components for all portals
- **Specialized Views**: Portal-specific implementations
- **Microinteractions**: Enhanced user experience features
- **Transparency Features**: Components for explaining the scoring system
- **Unified Service**: Single source of truth for leaderboard data
- **Optimized Performance**: Virtualization and efficient data handling

## Components to Remove

### 1. Main Leaderboard Components

- [ ] `src/components/leaderboard/UnifiedLeaderboard.tsx`
  - Replaced by `src/features/leaderboard/components/StandardLeaderboard.tsx`
  - Used in teacher, coordinator, and admin portals

- [ ] `src/components/leaderboard/LeaderboardTable.tsx`
  - Replaced by `src/features/leaderboard/components/BaseLeaderboardTable.tsx`
  - Used by UnifiedLeaderboard

- [ ] `src/components/leaderboard/LeaderboardTable.enhanced.tsx`
  - Functionality merged into base components in the new implementation

- [ ] `src/components/shared/entities/students/StudentLeaderboard.tsx`
  - Replaced by `src/features/leaderboard/components/StudentLeaderboardView.tsx`
  - Used in student portal

- [ ] `src/components/student/ClassLeaderboard.tsx`
  - Replaced by appropriate components from the new implementation
  - Used in student portal

### 2. Supporting Components

- [ ] `src/components/leaderboard/LeaderboardFilters.tsx`
  - Replaced by `src/features/leaderboard/components/LeaderboardFilters.tsx`

- [ ] `src/components/leaderboard/LeaderboardSkeleton.tsx`
  - Replaced by skeletons in the new implementation

- [ ] `src/components/leaderboard/LeaderboardTabs.tsx`
  - Functionality integrated into new components

### 3. Microinteraction Components

- [ ] `src/components/leaderboard/RankChangeIndicator.tsx`
  - Replaced by `src/features/leaderboard/components/microinteractions/RankChangeIndicator.tsx`

- [ ] `src/components/leaderboard/PointsAnimation.tsx`
  - Replaced by `src/features/leaderboard/components/microinteractions/PointsAnimation.tsx`

- [ ] `src/components/leaderboard/LeaderboardConfetti.tsx`
  - Replaced by `src/features/leaderboard/components/microinteractions/LeaderboardConfetti.tsx`

### 4. Transparency Components

- [ ] `src/components/leaderboard/PointsBreakdown.tsx`
  - Replaced by `src/features/leaderboard/components/transparency/PointsBreakdownComponent.tsx`

- [ ] `src/components/leaderboard/ScoringExplanation.tsx`
  - Replaced by `src/features/leaderboard/components/transparency/ScoringSystemVisualizer.tsx`

- [ ] `src/components/leaderboard/LeaderboardHistory.tsx`
  - Replaced by `src/features/leaderboard/components/transparency/LeaderboardHistoryViewer.tsx`

## Services to Remove

- [ ] `src/server/api/services/leaderboard.service.ts`
  - Replaced by `src/features/leaderboard/services/unified-leaderboard.service.ts`

- [ ] `src/server/api/services/leaderboard.service.optimized.ts`
  - Replaced by optimized queries in the new implementation

- [ ] `src/server/api/services/leaderboard-queries.ts`
  - Replaced by new query utilities

- [ ] `src/server/api/services/optimized-queries.ts`
  - Replaced by `src/features/leaderboard/services/optimized-leaderboard-queries.ts`

- [ ] `src/server/api/services/leaderboard-cache.ts`
  - Replaced by `src/features/leaderboard/utils/leaderboard-cache.ts`

## API Routes to Update

- [ ] `src/server/api/routers/leaderboard.ts`
  - Update to use the new unified leaderboard service

- [ ] `src/server/api/routers/student-leaderboard.ts`
  - Update to use the new unified leaderboard service

## Types to Remove

- [ ] `src/server/api/types/leaderboard.ts`
  - Replaced by `src/features/leaderboard/types/standard-leaderboard.ts`
  - Keep only if needed for backward compatibility during transition

- [ ] `src/types/leaderboard.d.ts`
  - Replaced by `src/features/leaderboard/types/standard-leaderboard.ts`

## Hooks to Remove

- [ ] `src/hooks/useLeaderboard.ts`
  - Replaced by `src/features/leaderboard/hooks/useLeaderboard.ts`

- [ ] `src/hooks/useLeaderboardFilters.ts`
  - Replaced by `src/features/leaderboard/hooks/useLeaderboardFilters.ts`

- [ ] `src/hooks/useStudentRanking.ts`
  - Replaced by `src/features/leaderboard/hooks/useStudentPosition.ts`

- [ ] `src/hooks/useLeaderboardData.ts`
  - Replaced by `src/features/leaderboard/hooks/useLeaderboard.ts`

## Utilities to Remove

- [ ] `src/utils/leaderboard-helpers.ts`
  - Replaced by `src/features/leaderboard/utils/leaderboard-calculations.ts`

- [ ] `src/utils/leaderboard-formatting.ts`
  - Replaced by `src/features/leaderboard/utils/formatting.ts`

- [ ] `src/utils/leaderboard-cache.ts`
  - Replaced by `src/features/leaderboard/utils/offline-sync.ts`

## Portal-Specific Components to Update

### Teacher Portal

- [ ] `src/app/teacher/classes/[classId]/leaderboard/page.tsx`
  - Already updated to use `StandardLeaderboard`

- [ ] `src/app/teacher/classes/[classId]/rewards/page.tsx`
  - Update to use new leaderboard components

### Coordinator Portal

- [ ] `src/app/coordinator/programs/[programId]/leaderboard/page.tsx`
  - Update to use `StandardLeaderboard`

- [ ] `src/app/coordinator/courses/[courseId]/leaderboard/page.tsx`
  - Update to use `StandardLeaderboard`

### Campus Admin Portal

- [ ] `src/app/admin/campus/leaderboard/page.tsx`
  - Update to use `StandardLeaderboard`

### Student Portal

- [ ] `src/app/student/class/[id]/leaderboard/page.tsx`
  - Already updated to use `StudentLeaderboardView`

## Testing for Safe Removal

Before removing any file, ensure:

1. **No Imports**: Check that the file is not imported anywhere else in the codebase
   ```bash
   grep -r "import.*from.*[filename]" src/
   ```

2. **No References**: Check that the component or function is not referenced elsewhere
   ```bash
   grep -r "[ComponentName]" src/
   ```

3. **No Type Dependencies**: Check that types are not used elsewhere
   ```bash
   grep -r ":[TypeName]" src/
   ```

4. **No API Dependencies**: Check that API endpoints are not called elsewhere
   ```bash
   grep -r "api\.[routeName]\.[procedureName]" src/
   ```

## Removal Process

For each file:

1. Comment out the file contents and run the application to verify nothing breaks
2. If issues occur, identify the dependencies and update them
3. Once verified safe, remove the file
4. Run tests to ensure everything still works

## Cleanup Verification Checklist

- [ ] All pages that previously used old leaderboard components now use new ones
- [ ] No console errors related to missing components or functions
- [ ] All leaderboard functionality works as expected across all portals
- [ ] No unused imports or references to removed files
- [ ] No TypeScript errors related to removed types
- [ ] All tests pass
- [ ] Microinteractions work correctly (rank change animations, etc.)
- [ ] Transparency features work correctly (points breakdown, history, etc.)
- [ ] Performance is improved with virtualization for large datasets
- [ ] Mobile responsiveness is maintained across all portals

## Post-Cleanup Tasks

- [ ] Update documentation to reflect the new implementation
- [ ] Remove any references to old components in documentation
- [ ] Update any diagrams or architecture documents
- [ ] Inform team members about the changes and new implementation
- [ ] Create user guides for the new leaderboard features
- [ ] Update API documentation for the new endpoints

## Rollback Plan

In case issues are discovered after cleanup:

1. Keep a backup branch with the old implementation
2. Document the mapping between old and new components
3. Have adapter components ready to quickly reintroduce if needed
4. Maintain a compatibility layer for API endpoints during transition

## Final Verification

After all cleanup is complete:

- [ ] Run the application in development mode and verify all leaderboard functionality
- [ ] Build the application and verify no build errors
- [ ] Deploy to a staging environment and test thoroughly
- [ ] Verify performance improvements from the new implementation
- [ ] Test with large datasets (1000+ students) to ensure virtualization works
- [ ] Test on mobile devices to ensure responsive design
- [ ] Test offline functionality and data synchronization
- [ ] Verify accessibility compliance

## Performance Metrics to Verify

Compare the following metrics between old and new implementations:

- [ ] Initial load time (reduced by at least 30%)
- [ ] Memory usage (reduced by at least 25%)
- [ ] API call frequency (reduced by at least 50%)
- [ ] Time to interactive (reduced by at least 40%)
- [ ] Scroll performance (should maintain 60fps even with 1000+ entries)
- [ ] Battery usage on mobile devices (reduced by at least 20%)

## Documentation

The following documentation has been created for the new leaderboard implementation:

- [ ] Technical architecture documentation
- [ ] API documentation
- [ ] Component usage examples
- [ ] User guides for each portal
- [ ] Visual tutorials for end users

## Conclusion

The unified leaderboard implementation represents a significant improvement in both code quality and user experience. By following this cleanup guide, we ensure that the codebase remains maintainable and free of technical debt while providing a consistent experience across all portals.
