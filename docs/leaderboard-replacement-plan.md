# Leaderboard Replacement Plan

This document outlines the plan to replace all existing leaderboard implementations across different portals with the new unified leaderboard implementation. The goal is to ensure consistency, improve performance, and provide a better user experience.

## Current Implementations

### 1. Teacher Portal
- Uses `UnifiedLeaderboard.tsx` component
- Found in pages:
  - `/teacher/leaderboard/page.tsx`
  - `/teacher/classes/[classId]/leaderboard/page.tsx`

### 2. Student Portal
- Uses `StudentLeaderboard.tsx` component
- Found in pages:
  - `/student/leaderboard/page.tsx`
- Also uses `ClassLeaderboard.tsx` in some views

### 3. Coordinator Portal
- Uses `UnifiedLeaderboard.tsx` component
- Found in pages:
  - `/admin/coordinator/classes/[id]/leaderboard/page.tsx`
  - `/admin/coordinator/courses/[id]/leaderboard/page.tsx`

### 4. Admin Portal
- Uses `UnifiedLeaderboard.tsx` component
- Found in pages:
  - `/admin/campus/classes/[id]/leaderboard/page.tsx`

## New Implementation

The new unified leaderboard implementation is located in the `src/features/leaderboard` directory and includes:

- Core components:
  - `StandardLeaderboard.tsx` (replaces `UnifiedLeaderboard.tsx`)
  - `BaseLeaderboardTable.tsx` (replaces `LeaderboardTable.tsx`)
  - `VirtualizedLeaderboardTable.tsx` (updated version)
  - `StudentLeaderboardView.tsx` (replaces `StudentLeaderboard.tsx`)
  - `TeacherLeaderboardView.tsx` (new component)
  - `AdminLeaderboardView.tsx` (new component)

- Hooks:
  - `useLeaderboard.ts`
  - `useLeaderboardFilters.ts`
  - `useLeaderboardSync.ts`
  - `useLeaderboardGoals.ts`

- Services:
  - `unified-leaderboard.service.ts`

## Replacement Plan

### Phase 1: Preparation

1. [ ] Create adapter components to ease transition
   - [ ] Create `LegacyLeaderboardAdapter.tsx` to wrap the new components with the old props interface
   - [ ] Create `StudentLeaderboardAdapter.tsx` for student portal compatibility

2. [ ] Update API endpoints
   - [ ] Ensure the new leaderboard API endpoints are available and working
   - [ ] Test API endpoints with different entity types and time granularities

### Phase 2: Teacher Portal Migration

1. [ ] Update `/teacher/leaderboard/page.tsx`
   - [ ] Replace `UnifiedLeaderboard` with `StandardLeaderboard` or `TeacherLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Test with different class and campus selections

2. [ ] Update `/teacher/classes/[classId]/leaderboard/page.tsx`
   - [ ] Replace `UnifiedLeaderboard` with `StandardLeaderboard` or `TeacherLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Test with different classes

### Phase 3: Student Portal Migration

1. [ ] Update `/student/leaderboard/page.tsx`
   - [ ] Replace `StudentLeaderboard` with `StudentLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Ensure student-specific features (personal position highlight, etc.) work correctly

2. [ ] Replace `ClassLeaderboard.tsx` usage
   - [ ] Identify all places where `ClassLeaderboard.tsx` is used
   - [ ] Replace with appropriate new component
   - [ ] Test functionality

### Phase 4: Coordinator Portal Migration

1. [ ] Update `/admin/coordinator/classes/[id]/leaderboard/page.tsx`
   - [ ] Replace `UnifiedLeaderboard` with `StandardLeaderboard` or `AdminLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Test with different classes

2. [ ] Update `/admin/coordinator/courses/[id]/leaderboard/page.tsx`
   - [ ] Replace `UnifiedLeaderboard` with `StandardLeaderboard` or `AdminLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Test with different courses

### Phase 5: Admin Portal Migration

1. [ ] Update `/admin/campus/classes/[id]/leaderboard/page.tsx`
   - [ ] Replace `UnifiedLeaderboard` with `StandardLeaderboard` or `AdminLeaderboardView`
   - [ ] Update props to match new component requirements
   - [ ] Test with different classes

### Phase 6: Testing

1. [ ] Test all portals with different user roles
   - [ ] Test as student
   - [ ] Test as teacher
   - [ ] Test as coordinator
   - [ ] Test as admin

2. [ ] Test edge cases
   - [ ] Empty leaderboard
   - [ ] Large number of students
   - [ ] Students with same scores
   - [ ] Offline functionality

3. [ ] Test performance
   - [ ] Load time
   - [ ] Scrolling performance
   - [ ] Filter/sort operations

### Phase 7: Cleanup

1. [ ] Remove deprecated components
   - [ ] `UnifiedLeaderboard.tsx`
   - [ ] `LeaderboardTable.tsx`
   - [ ] `StudentLeaderboard.tsx`
   - [ ] `ClassLeaderboard.tsx`
   - [ ] Any other unused leaderboard components

2. [ ] Remove deprecated services
   - [ ] `leaderboard.service.ts`
   - [ ] `leaderboard.service.optimized.ts`
   - [ ] Any other unused leaderboard services

3. [ ] Update documentation
   - [ ] Update component documentation
   - [ ] Update API documentation
   - [ ] Update user guides

## Files to Replace

### Components
- [ ] `src/components/leaderboard/UnifiedLeaderboard.tsx` → Use `src/features/leaderboard/components/StandardLeaderboard.tsx`
- [ ] `src/components/leaderboard/LeaderboardTable.tsx` → Use `src/features/leaderboard/components/BaseLeaderboardTable.tsx`
- [ ] `src/components/shared/entities/students/StudentLeaderboard.tsx` → Use `src/features/leaderboard/components/StudentLeaderboardView.tsx`
- [ ] `src/components/student/ClassLeaderboard.tsx` → Use appropriate component from `src/features/leaderboard/components/`

### Services
- [ ] `src/server/api/services/leaderboard.service.ts` → Use `src/features/leaderboard/services/unified-leaderboard.service.ts`
- [ ] `src/server/api/services/leaderboard.service.optimized.ts` → Use `src/features/leaderboard/services/unified-leaderboard.service.ts`

## Timeline

- Phase 1 (Preparation): 1 day
- Phase 2 (Teacher Portal): 1 day
- Phase 3 (Student Portal): 1 day
- Phase 4 (Coordinator Portal): 1 day
- Phase 5 (Admin Portal): 1 day
- Phase 6 (Testing): 2 days
- Phase 7 (Cleanup): 1 day

Total estimated time: 8 days
