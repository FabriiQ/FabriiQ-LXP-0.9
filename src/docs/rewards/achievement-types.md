# Achievement Types and Criteria

This document outlines the various achievement types available in the student portal reward system, along with their criteria for unlocking.

## Overview

Achievements are designed to motivate students, recognize their progress, and encourage engagement with the learning platform. Each achievement has specific criteria that must be met to unlock it, and students can track their progress toward each achievement.

## Achievement Types

### Class Achievements

Class achievements are specific to a particular class and recognize student progress and participation within that class.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Class Explorer | Completed your first activity in this class | Complete 1 activity in the class |
| Class Enthusiast | Completed 10 activities in this class | Complete 10 activities in the class |
| Class Master | Completed all activities in this class | Complete all activities in the class |
| Perfect Score | Achieved 100% on an activity in this class | Score 100% on any activity in the class |
| High Achiever | Maintained an average score of 90% or higher | Maintain a 90%+ average across all graded activities |

### Subject Achievements

Subject achievements span across classes and recognize mastery of specific subject areas.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Subject Novice | Completed your first activity in this subject | Complete 1 activity in the subject |
| Subject Explorer | Completed 10 activities in this subject | Complete 10 activities in the subject |
| Subject Master | Achieved an average score of 90% or higher in this subject | Maintain a 90%+ average across all graded activities in the subject |
| Subject Expert | Completed all activities in this subject with an average of 85%+ | Complete all activities with 85%+ average |

### Login Achievements

Login achievements recognize consistent engagement with the platform.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| First Day | Logged in for the first time | Log in to the platform once |
| Regular Visitor | Logged in 5 days in a row | Log in for 5 consecutive days |
| Dedicated Learner | Logged in 10 days in a row | Log in for 10 consecutive days |
| Learning Enthusiast | Logged in 30 days in a row | Log in for 30 consecutive days |

### Streak Achievements

Streak achievements recognize consistent activity completion.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Getting Started | Completed activities on 2 consecutive days | Complete at least one activity per day for 2 consecutive days |
| Momentum Builder | Completed activities on 5 consecutive days | Complete at least one activity per day for 5 consecutive days |
| Consistency King | Completed activities on 10 consecutive days | Complete at least one activity per day for 10 consecutive days |
| Unstoppable | Completed activities on 30 consecutive days | Complete at least one activity per day for 30 consecutive days |

### Milestone Achievements

Milestone achievements recognize reaching significant numbers of completed activities or points.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| First Steps | Completed your first activity | Complete 1 activity |
| Getting Going | Completed 10 activities | Complete 10 activities |
| Half Century | Completed 50 activities | Complete 50 activities |
| Century | Completed 100 activities | Complete 100 activities |
| Point Collector | Earned 100 points | Earn 100 points |
| Point Gatherer | Earned 500 points | Earn 500 points |
| Point Hoarder | Earned 1,000 points | Earn 1,000 points |
| Point Master | Earned 5,000 points | Earn 5,000 points |

### Special Achievements

Special achievements are unique recognitions that may be awarded by teachers or triggered by special events.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Helping Hand | Helped another student with their work | Teacher-awarded |
| Creative Thinker | Demonstrated exceptional creativity | Teacher-awarded |
| Problem Solver | Found an innovative solution to a problem | Teacher-awarded |
| Team Player | Collaborated effectively with classmates | Teacher-awarded |
| Early Bird | Completed an activity before its due date | Complete any activity at least 24 hours before the deadline |

### Grade Achievements

Grade achievements recognize exceptional performance in graded activities.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Perfect Score | Achieved 100% on an activity | Score 100% on any activity |
| A Grade Student | Achieved an A grade (90%+) on 10 activities | Score 90%+ on 10 different activities |
| Consistent Performer | Maintained an average grade of 85%+ across all activities | Maintain an 85%+ average across all graded activities |
| Improvement Star | Improved your score by 20% on a retake | Improve score by at least 20% when retaking an activity |

### Activity Achievements

Activity achievements recognize completion of specific types of activities.

| Achievement | Description | Criteria |
|-------------|-------------|----------|
| Quiz Master | Completed 10 quizzes | Complete 10 quiz-type activities |
| Essay Expert | Completed 5 essay assignments | Complete 5 essay-type activities |
| Project Pro | Completed 3 projects | Complete 3 project-type activities |
| Multimedia Maven | Completed 5 multimedia activities | Complete 5 activities with multimedia components |

## Achievement Progress Tracking

Each achievement tracks progress toward completion. For example:
- "Class Master" might show "15/20 activities completed"
- "Streak" achievements track the current streak and the target
- "Grade" achievements track the number of qualifying grades achieved

## Achievement Rewards

When students unlock achievements, they receive:
1. A visual notification with animation
2. Points added to their total (varies by achievement difficulty)
3. The achievement badge displayed on their profile
4. Progress toward the next level

## Implementation Details

Achievements are implemented in the following files:
- `src/features/rewards/achievements/index.ts` - Core achievement logic
- `src/components/rewards/AchievementBadge.tsx` - UI component for displaying achievements
- `src/components/rewards/AchievementGrid.tsx` - Grid display of achievements
- `src/components/rewards/LazyAchievementGrid.tsx` - Optimized grid with lazy loading

For technical details on how achievements are tracked and awarded, see the [API Endpoints documentation](./api-endpoints.md).
