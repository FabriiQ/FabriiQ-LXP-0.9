# Reward System Documentation

## Overview

The reward system is designed to gamify the learning experience by awarding points, tracking achievements, and implementing level progression for students. This system is integrated with activities, grading, and the student dashboard to provide a comprehensive gamified experience.

## Core Components

### 1. Point System

Points are the primary currency of the reward system. Students earn points through various activities:

- **Activity Completion**: Points are awarded 1:1 with activity scores (e.g., 85% score = 85 points)
- **Daily Logins**: 5 points per day
- **Streak Bonuses**: 5 points × streak days, up to 25 points
- **Non-graded Activities**: 10-50 points based on complexity
- **Achievement Unlocks**: 25-100 points depending on achievement type

Points are tracked at multiple levels:
- Overall (student total)
- Per class
- Per subject
- Time-based aggregates (daily, weekly, monthly, term)

### 2. Level System

Levels represent a student's overall progress and are calculated based on total points:

- Level 1: 0-100 points
- Level 2: 101-250 points
- Level 3: 251-500 points
- Level 4: 501-1000 points
- Level 5: 1001-2000 points
- And so on with increasing thresholds

The experience points required for each level follow an exponential growth formula:
```
nextLevelExp = 100 * (level ^ 1.5)
```

When a student earns enough points to level up:
1. Their level increases
2. Excess points carry over to the next level
3. A level-up notification is displayed
4. Level-based achievements may be unlocked

### 3. Achievement System

Achievements are specific milestones that students can unlock:

- **Class-specific**: Complete all activities in a class
- **Subject mastery**: Achieve 90%+ in all activities for a subject
- **Streak achievements**: Login for consecutive days
- **Point milestones**: Earn specific point thresholds (100, 250, 500, etc.)
- **Level milestones**: Reach specific levels (5, 10, 15, etc.)
- **Special achievements**: Teacher-awarded or system-generated

Each achievement has:
- A title and description
- Progress tracking (current/total)
- Unlocked status
- Visual representation (badge)
- Bonus points when unlocked

### 4. Leaderboard System

Leaderboards display student rankings based on points:

- **Class leaderboards**: Rankings within a specific class
- **Subject leaderboards**: Rankings for a specific subject
- **Overall leaderboards**: Campus-wide rankings

Leaderboards can be filtered by time period:
- Daily
- Weekly
- Monthly
- Term
- All-time

Historical leaderboard data is stored as snapshots for trend analysis.

## Technical Implementation

### Data Models

The reward system uses the following database models:

1. **StudentAchievement**
   - Tracks individual achievements for each student
   - Includes progress, unlock status, and metadata

2. **StudentPoints**
   - Records individual point transactions
   - Includes source, amount, and context (class/subject)

3. **StudentLevel**
   - Tracks level progression for each student
   - Stores current level, experience points, and next level threshold

4. **StudentPointsAggregate**
   - Provides optimized data for leaderboard calculations
   - Aggregates points by time period (daily, weekly, monthly, term)

5. **LeaderboardSnapshot**
   - Stores historical leaderboard data
   - Enables trend analysis and historical comparisons

### API Endpoints

The reward system exposes the following API endpoints through tRPC routers:

#### Achievement Router
- `createAchievement`: Create a new achievement for a student
- `updateAchievementProgress`: Update progress on an achievement
- `getStudentAchievements`: Get all achievements for a student
- `getAchievementById`: Get a specific achievement by ID
- `checkAndUpdateProgress`: Check and update achievement progress

#### Points Router
- `awardPoints`: Award points to a student
- `getPointsHistory`: Get point history for a student
- `getStudentPoints`: Get total points for a student
- `getLeaderboard`: Get leaderboard data
- `createLeaderboardSnapshot`: Create a snapshot of the current leaderboard

#### Level Router
- `initializeStudentLevel`: Initialize a student's level
- `progressLevel`: Progress a student's level
- `getStudentLevel`: Get a student's current level
- `getAllStudentLevels`: Get all levels for a student

### Integration Points

The reward system integrates with several existing systems:

1. **Activity System**
   - Points are awarded when activities are completed
   - Achievement progress is updated based on activity completion
   - Non-graded activities can also award points

2. **Grading System**
   - Points are awarded when grades are submitted
   - Achievement checks are triggered based on grades
   - Leaderboards are updated with new points

3. **Student Dashboard**
   - Displays points, level, and recent achievements
   - Shows leaderboard position
   - Provides notifications for newly unlocked achievements

4. **Student Profile**
   - Displays all achievements
   - Shows level progression
   - Provides detailed point history

## Usage Examples

### Awarding Points

```typescript
// Import the reward system
import { RewardSystem } from '@/features/rewards';

// Create an instance with Prisma
const rewardSystem = new RewardSystem({ prisma });

// Award points for completing an activity
await rewardSystem.awardPoints({
  studentId: 'student123',
  amount: 85, // Based on activity score
  source: 'activity',
  sourceId: 'activity456',
  classId: 'class789',
  subjectId: 'subject101',
  description: 'Completed Math Quiz #3',
});
```

### Updating Achievement Progress

```typescript
// Update progress on an achievement
await rewardSystem.updateAchievementProgress({
  achievementId: 'achievement123',
  progress: 8, // Current progress
  unlocked: false, // Will be automatically set to true if progress >= total
});
```

### Getting Leaderboard Data

```typescript
// Get class leaderboard
const leaderboard = await rewardSystem.getLeaderboard({
  type: 'class',
  referenceId: 'class123',
  timeframe: 'weekly',
  limit: 10,
});
```

## Performance Considerations

The reward system is designed to handle high volumes of data efficiently:

1. **Aggregation Tables**
   - Pre-calculated aggregates for efficient leaderboard queries
   - Optimized for scale with 500,000+ students

2. **Batch Processing**
   - Background jobs for processing rewards
   - Scheduled tasks for updating leaderboards

3. **Caching Strategy**
   - Caching for frequently accessed data
   - Cache invalidation on relevant updates

4. **Data Partitioning**
   - Partitioning by time period
   - Partitioning by entity (class, subject, campus)

## Offline Support

The reward system supports offline usage:

1. **IndexedDB Storage**
   - Offline storage for achievements, points, and levels
   - Sync logic for offline achievements

2. **Conflict Resolution**
   - Handling conflicts for points awarded offline
   - Merging offline and online progress

3. **Analytics**
   - Tracking offline achievement progress
   - Monitoring sync events and conflicts

## Future Enhancements

Potential future enhancements to the reward system:

1. **Team-based Achievements**
   - Collaborative achievements for student groups
   - Class-wide goals and rewards

2. **Customizable Rewards**
   - Teacher-defined achievements and rewards
   - Custom point values for activities

3. **Reward Redemption**
   - Virtual store for redeeming points
   - Digital badges and certificates

4. **Advanced Analytics**
   - Insights into student motivation
   - Correlation between rewards and performance

5. **Adaptive Challenges**
   - Personalized achievement targets
   - Difficulty scaling based on student level
