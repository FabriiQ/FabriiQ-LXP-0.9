# Reward System

This module provides a comprehensive reward system for the LXP platform, including:

- Point calculation and awarding
- Level progression
- Achievement tracking and unlocking
- Leaderboard generation
- Activity integration

## Usage

### Basic Usage

```typescript
import { PrismaClient } from '@prisma/client';
import { initializeRewardSystem } from '@/features/rewards/index-wrapper';

// Initialize the Prisma client
const prisma = new PrismaClient();

// Initialize the reward system
const { rewardSystem, activityRewardIntegration } = initializeRewardSystem(prisma);

// Award points to a student
await rewardSystem.awardPoints({
  studentId: 'student-id',
  amount: 10,
  source: 'activity-completion',
  sourceId: 'activity-id',
  description: 'Completed activity'
});

// Process activity completion
await activityRewardIntegration.processActivityCompletion(
  'student-id',
  'activity-id',
  {
    gradePercentage: 90,
    isGraded: true,
    complexity: 'medium'
  }
);
```

### Advanced Usage

For more advanced usage, you can directly use the individual systems:

```typescript
import { PrismaClient } from '@prisma/client';
import { RewardSystem } from '@/features/rewards';
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';

// Initialize the Prisma client
const prisma = new PrismaClient();

// Create the reward system
const rewardSystem = new RewardSystem({ prisma });

// Create the activity reward integration
const activityRewardIntegration = new ActivityRewardIntegration(prisma);

// Update achievement progress
await rewardSystem.updateAchievementProgress({
  achievementId: 'achievement-id',
  progress: 5,
  unlocked: true
});

// Get leaderboard data
const leaderboard = await rewardSystem.getLeaderboard({
  type: 'class',
  referenceId: 'class-id',
  timeframe: 'weekly',
  limit: 10
});
```

## TypeScript Support

The reward system includes TypeScript type definitions for all models and functions. To ensure proper type checking, use the provided wrapper functions:

```typescript
import { createRewardSystem, createActivityRewardIntegration } from '@/features/rewards/index-wrapper';

const rewardSystem = createRewardSystem(prisma);
const activityRewardIntegration = createActivityRewardIntegration(prisma);
```

## Database Schema

The reward system requires the following database models:

- `StudentPoints`: Records of points awarded to students
- `StudentLevel`: Student level progression
- `StudentAchievement`: Student achievements
- `StudentPointsAggregate`: Aggregated point totals for leaderboards
- `LeaderboardSnapshot`: Historical leaderboard data

The `StudentProfile` model should also have the following fields:

- `totalPoints`: Total points earned by the student
- `currentLevel`: Current level of the student

## Implementation Notes

- The reward system uses raw SQL queries for updating `totalPoints` and `currentLevel` fields in the `StudentProfile` model to avoid TypeScript errors.
- Type assertions are used for Prisma models that are not properly recognized by TypeScript.
- The `ActivityRewardIntegration` class uses type assertions for `status` fields to handle the difference between `SystemStatus` and `SubmissionStatus` enums.

## Troubleshooting

If you encounter TypeScript errors related to missing Prisma models, make sure you have:

1. Added the required models to your Prisma schema
2. Run `npx prisma generate` to update the Prisma client
3. Used the provided wrapper functions to create reward system instances
