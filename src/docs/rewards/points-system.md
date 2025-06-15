# Points System and Calculations

This document outlines the points system used in the student portal reward system, including how points are calculated, awarded, and used.

## Overview

The points system is designed to reward students for their engagement, progress, and achievements within the learning platform. Points are awarded for various activities and accomplishments, and they contribute to a student's overall level and position on leaderboards.

## Point Sources

Points can be earned from the following sources:

### 1. Activity Completion

| Activity Type | Points Awarded | Notes |
|---------------|---------------|-------|
| Graded Activities | 1:1 with score | A score of 85% = 85 points |
| Non-graded Activities | 10-50 points | Based on activity complexity |
| Practice Activities | 5-15 points | Lower points for practice work |
| Bonus Activities | Up to 100 points | Special challenge activities |

### 2. Daily Engagement

| Action | Points Awarded | Notes |
|--------|---------------|-------|
| Daily Login | 5 points | Once per day |
| Streak Bonus | 5 × streak days (max 25) | Additional points for consecutive days |
| First Activity of the Day | 10 points | Encourages daily participation |

### 3. Achievements

| Achievement Type | Points Awarded | Notes |
|------------------|---------------|-------|
| Class Achievements | 25-100 points | Based on difficulty |
| Subject Achievements | 50-150 points | Based on difficulty |
| Login Achievements | 10-50 points | Based on streak length |
| Streak Achievements | 25-100 points | Based on streak length |
| Milestone Achievements | 50-200 points | Based on milestone significance |
| Special Achievements | 25-100 points | Teacher-awarded or special events |
| Grade Achievements | 50-150 points | Based on performance |
| Activity Achievements | 25-75 points | Based on activity type |

### 4. Special Bonuses

| Bonus Type | Points Awarded | Notes |
|------------|---------------|-------|
| Teacher Bonus | Variable | Awarded by teachers for exceptional work |
| Early Completion | 10-25 points | Completing activities before deadlines |
| Perfect Week | 50 points | Completing all assigned activities in a week |
| Improvement Bonus | 10-30 points | Significant improvement over previous performance |

## Point Calculation Formulas

### Graded Activity Points

```
Points = Score Percentage × Activity Point Value
```

Example: A quiz worth 100 points completed with a score of 85% awards 85 points.

### Streak Bonus

```
Streak Bonus = Min(5 × Current Streak Days, 25)
```

Example: A 4-day streak awards an additional 20 points (5 × 4) on the 4th day.

### Achievement Points

Achievement points are fixed values based on the achievement type and difficulty.

### Total Points Calculation

```
Total Points = Sum of all points from activities, logins, streaks, and achievements
```

## Point Tracking and Storage

Points are tracked at multiple levels:

1. **Overall Points**: Total points earned across all classes and subjects
2. **Class Points**: Points earned within a specific class
3. **Subject Points**: Points earned within a specific subject
4. **Time-based Points**: Daily, weekly, monthly, and term points

Points data is stored in the following database tables:
- `student_points`: Individual point transactions
- `student_points_aggregates`: Aggregated point totals for efficient leaderboard calculations

## Point Expiration and Resets

- Points do not expire within an academic year
- Term leaderboards reset at the beginning of each new term
- Historical point data is archived for long-term tracking and analysis

## Points and Leaderboards

Points directly determine a student's position on various leaderboards:

1. **Class Leaderboards**: Based on points earned within a specific class
2. **Subject Leaderboards**: Based on points earned within a specific subject
3. **Overall Leaderboards**: Based on total points earned across all classes and subjects
4. **Time-based Leaderboards**: Daily, weekly, monthly, and term leaderboards

## Points and Level Progression

Points also determine a student's level:

| Level | Points Required |
|-------|----------------|
| Level 1 | 0-100 points |
| Level 2 | 101-250 points |
| Level 3 | 251-500 points |
| Level 4 | 501-1000 points |
| Level 5 | 1001-2000 points |
| Level 6 | 2001-3500 points |
| Level 7 | 3501-5500 points |
| Level 8 | 5501-8000 points |
| Level 9 | 8001-11000 points |
| Level 10 | 11001+ points |

For more details on level progression, see the [Level Progression documentation](./level-progression.md).

## Implementation Details

The points system is implemented in the following files:
- `src/features/rewards/points/index.ts` - Core points logic
- `src/server/api/services/points.service.ts` - Server-side points service
- `src/server/api/routers/points.ts` - API endpoints for points

For technical details on the API endpoints, see the [API Endpoints documentation](./api-endpoints.md).
