# Reward System Integration Guide

This document provides guidance on how to integrate the reward system with other parts of the application.

## Overview

The reward system is designed to be modular and easy to integrate with existing systems. The main integration points are:

1. Activity System - Award points when activities are completed
2. Grading System - Award points when grades are submitted
3. Student Dashboard - Display points, level, and achievements
4. Leaderboards - Show student rankings based on points

## Integration with Activity System

To integrate with the activity system, use the `ActivityRewardIntegration` class:

```typescript
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';

// Create an instance with Prisma
const activityRewards = new ActivityRewardIntegration(prisma);

// Process activity completion
const result = await activityRewards.processActivityCompletion(
  studentId,
  activityId,
  {
    gradePercentage: 85, // Optional - percentage score
    isGraded: true,      // Optional - whether this is a graded activity
    complexity: 'medium' // Optional - complexity level for non-graded activities
  }
);

// Result contains awarded points, level-up status, and unlocked achievements
console.log(`Awarded ${result.points} points`);
if (result.levelUp) {
  console.log(`Student leveled up to level ${result.newLevel}`);
}
if (result.achievements.length > 0) {
  console.log(`Unlocked ${result.achievements.length} achievements`);
}
```

## Integration with Grading System

To integrate with the grading system, use the `ActivityRewardIntegration` class:

```typescript
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';

// Create an instance with Prisma
const activityRewards = new ActivityRewardIntegration(prisma);

// Process activity grade
const result = await activityRewards.processActivityGrade(activityGrade);

// Result contains awarded points, level-up status, and unlocked achievements
console.log(`Awarded ${result.points} points`);
if (result.levelUp) {
  console.log(`Student leveled up to level ${result.newLevel}`);
}
if (result.achievements.length > 0) {
  console.log(`Unlocked ${result.achievements.length} achievements`);
}
```

## Integration with Student Dashboard

To display reward information on the student dashboard, use the following components:

```tsx
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { LevelProgress } from '@/components/rewards/LevelProgress';
import { LazyAchievementGrid } from '@/components/rewards/LazyAchievementGrid';

// In your dashboard component
return (
  <div>
    <PointsDisplay
      totalPoints={student.totalPoints}
      dailyPoints={pointsSummary.dailyPoints}
      weeklyPoints={pointsSummary.weeklyPoints}
    />

    <LevelProgress
      level={studentLevel.level}
      currentExp={studentLevel.currentExp}
      nextLevelExp={studentLevel.nextLevelExp}
    />

    <LazyAchievementGrid
      achievements={recentAchievements}
      onAchievementClick={handleAchievementClick}
    />
  </div>
);
```

## Integration with Leaderboards

To display reward-based leaderboards, use the enhanced leaderboard service:

```typescript
import { LeaderboardService } from '@/server/api/services/leaderboard.service.enhanced';

// Create an instance with Prisma
const leaderboardService = new LeaderboardService({ prisma });

// Get class leaderboard with reward system integration
const leaderboard = await leaderboardService.getClassLeaderboardWithRewards(
  classId,
  {
    period: LeaderboardPeriod.WEEKLY,
    limit: 10,
    offset: 0
  }
);

// Display leaderboard using the enhanced component
return (
  <EnhancedLeaderboardTable
    leaderboard={leaderboard}
    currentStudentId={currentUser.id}
    title="Class Leaderboard"
    description="Weekly rankings based on points earned"
    totalStudents={totalStudents}
    currentPeriod={LeaderboardPeriod.WEEKLY}
    onPeriodChange={handlePeriodChange}
    showPagination={true}
  />
);
```

## Background Processing

The reward system includes background processing for tasks like:

- Creating leaderboard snapshots
- Updating point aggregates
- Archiving old data

To run these jobs, use the `RewardProcessingJobs` class:

```typescript
import { RewardProcessingJobs } from '@/server/jobs/reward-processing';

// Create an instance with Prisma
const rewardJobs = new RewardProcessingJobs(prisma);

// Run all jobs
const result = await rewardJobs.runAllJobs();

// Or run specific jobs
await rewardJobs.createClassLeaderboardSnapshots();
await rewardJobs.updatePointAggregates();
await rewardJobs.archiveOldLeaderboardSnapshots(90); // Archive snapshots older than 90 days
```

## API Endpoints

The reward system exposes the following API endpoints through tRPC routers:

### Achievement Router
- `createAchievement`: Create a new achievement for a student
- `updateAchievementProgress`: Update progress on an achievement
- `getStudentAchievements`: Get all achievements for a student
- `getAchievementById`: Get a specific achievement by ID
- `checkAndUpdateProgress`: Check and update achievement progress

### Points Router
- `awardPoints`: Award points to a student
- `getPointsHistory`: Get point history for a student
- `getStudentPoints`: Get total points for a student
- `getLeaderboard`: Get leaderboard data
- `createLeaderboardSnapshot`: Create a snapshot of the current leaderboard

### Level Router
- `initializeStudentLevel`: Initialize a student's level
- `progressLevel`: Progress a student's level
- `getStudentLevel`: Get a student's current level
- `getAllStudentLevels`: Get all levels for a student

## Troubleshooting

### Common Issues

1. **Points not being awarded**
   - Check if the activity or grade exists
   - Verify that the student ID is correct
   - Check for errors in the server logs

2. **Achievements not unlocking**
   - Verify that the achievement criteria are met
   - Check if the achievement already exists for the student
   - Look for errors in the achievement service logs

3. **Leaderboard not showing reward data**
   - Make sure you're using the enhanced leaderboard service
   - Check if the student has any points
   - Verify that the leaderboard component is configured to show reward data

### Logging

The reward system uses the application's logger for error tracking. To debug issues, check the logs for entries with the following prefixes:

- `Error awarding points`
- `Error updating achievement progress`
- `Error progressing level`
- `Error getting leaderboard`

## Schema Updates

If you're integrating the reward system into a new application, make sure the database schema includes the following tables:

- `StudentAchievement`
- `StudentPoints`
- `StudentLevel`
- `StudentPointsAggregate`
- `LeaderboardSnapshot`

And the `StudentProfile` table should have the following fields:

- `totalPoints`
- `currentLevel`

## Performance Considerations

The reward system is designed to handle high volumes of data efficiently:

1. **Use Background Processing**
   - For large batches of points or achievements, use the background processing jobs
   - Schedule leaderboard snapshots during off-peak hours

2. **Implement Caching**
   - Cache frequently accessed data like student levels and point totals
   - Use Redis or a similar caching solution for leaderboards

3. **Optimize Database Queries**
   - Use the aggregation tables for leaderboard calculations
   - Limit the number of achievements loaded at once

4. **Consider Sharding**
   - For very large deployments, consider sharding the reward data by class or campus
