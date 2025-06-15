# Grading and Reward System Documentation

This document provides a comprehensive overview of the activity points, scoring, grading implementation, and reward points system in the Aivy Learning Experience Platform (LXP).

## Table of Contents

1. [Activity Grading System](#activity-grading-system)
   - [Grading Process](#grading-process)
   - [Score Calculation](#score-calculation)
   - [Grading Scales](#grading-scales)
   - [Supported Activity Types](#supported-activity-types)
2. [Points System](#points-system)
   - [Point Awarding Logic](#point-awarding-logic)
   - [Point Sources](#point-sources)
   - [Point Calculation](#point-calculation)
3. [Level Progression System](#level-progression-system)
   - [Level Calculation](#level-calculation)
   - [Experience Points](#experience-points)
   - [Level Names](#level-names)
4. [Achievement System](#achievement-system)
   - [Achievement Types](#achievement-types)
   - [Achievement Unlocking](#achievement-unlocking)
   - [Achievement Rewards](#achievement-rewards)
5. [Leaderboards](#leaderboards)
   - [Leaderboard Types](#leaderboard-types)
   - [Point Aggregation](#point-aggregation)
6. [Integration Points](#integration-points)
   - [Activity Submission Flow](#activity-submission-flow)
   - [Gradebook Integration](#gradebook-integration)

## Activity Grading System

### Grading Process

The activity grading system evaluates student submissions for various activity types and calculates scores based on correctness. The process follows these steps:

1. Student submits an activity through the client interface
2. The submission is processed by the `processActivitySubmission` function
3. The appropriate grading function is called based on the activity type
4. The grading result is stored in the database
5. The gradebook is updated with the new grade
6. Points are awarded based on the grade

### Score Calculation

Scores are calculated differently for each activity type, but generally follow these principles:

- Each question or item has a point value (default is 1 point if not specified)
- The total possible score is the sum of all question/item points
- The earned score is the sum of points for correct answers
- Percentage score is calculated as: `(earned points / total possible points) * 100`
- Passing threshold is typically 60% unless otherwise specified in activity settings

For example, in Multiple Choice activities:

```typescript
// Calculate percentage and passing status
const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
const passed = percentage >= (activity.settings?.passingPercentage || 60);
```

Some activity types support partial credit:

- **Sequence Activities**: Uses Kendall tau distance to calculate partial credit based on how close the student's sequence is to the correct sequence
- **Multiple Response**: Awards partial credit for partially correct selections
- **Matching**: Awards points for each correctly matched pair
- **Drag and Drop**: Awards points for each correctly placed item

### Grading Scales

The system supports different grading scales that can be configured:

```typescript
// Default grading scale
{
  name: '',
  type: GradingType.MANUAL,
  scale: GradingScale.PERCENTAGE,
  minScore: 0,
  maxScore: 100,
  status: SystemStatus.ACTIVE,
  ranges: [
    { grade: 'A', minScore: 90, maxScore: 100, gpaValue: 4.0 },
    { grade: 'B', minScore: 80, maxScore: 89, gpaValue: 3.0 },
    { grade: 'C', minScore: 70, maxScore: 79, gpaValue: 2.0 },
    { grade: 'D', minScore: 60, maxScore: 69, gpaValue: 1.0 },
    { grade: 'F', minScore: 0, maxScore: 59, gpaValue: 0.0 },
  ]
}
```

Letter grades are calculated based on percentage scores:

```typescript
// Convert numeric score to letter grade
let letterGrade = "N/A";
if (grade.score !== null) {
  const score = grade.score;
  const maxScore = grade.activity.maxScore || 100;
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) letterGrade = "A";
  else if (percentage >= 80) letterGrade = "B+";
  else if (percentage >= 70) letterGrade = "B";
  else if (percentage >= 60) letterGrade = "C+";
  else if (percentage >= 50) letterGrade = "C";
  else letterGrade = "D";
}
```

### Supported Activity Types

The system supports grading for the following activity types:

- Multiple Choice
- Multiple Response
- True/False
- Fill in the Blanks
- Matching
- Sequence
- Drag and Drop
- Drag the Words
- Numeric
- Quiz
- Book (with embedded checkpoints)

Each activity type has its own specialized grading function that handles the unique aspects of that activity type.

## Points System

### Point Awarding Logic

The points system awards points to students based on various actions and achievements. Points serve as the currency for the reward system and drive level progression and leaderboards.

Points are awarded through the `awardPoints` function in the `RewardSystem` class:

```typescript
async awardPoints(data: PointsAwardData): Promise<PointsAwardResult> {
  // Create points record
  // Update student's total points
  // Update points aggregates for leaderboards
  // Update student level based on points
  // Check for point-based achievements
}
```

### Point Sources

Points can be awarded from various sources:

1. **Activity Grades**: Points awarded based on activity completion and grades
   ```typescript
   // Calculate grade percentage
   const gradePercentage = score !== null && maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
   
   // Calculate points (1:1 mapping with grade percentage)
   const points = gradePercentage;
   ```

2. **Daily Logins**: Points awarded for logging in daily, with bonuses for streaks
   ```typescript
   // Calculate login points (base 5 points + streak bonus)
   const basePoints = 5;
   const streakBonus = Math.min(streakDays * 5, 25); // Cap at 25 bonus points
   const totalPoints = basePoints + streakBonus;
   ```

3. **Achievements**: Bonus points awarded for unlocking achievements
   ```typescript
   // Different achievement types can have different bonus point values
   let bonusPoints = 25; // Default bonus
   
   switch (achievement.type) {
     case 'class':
       bonusPoints = 50;
       break;
     case 'subject':
       bonusPoints = 40;
       break;
     case 'streak':
       bonusPoints = 30;
       break;
     case 'special':
       bonusPoints = 100;
       break;
   }
   ```

4. **Perfect Scores**: Bonus points for achieving perfect scores
   ```typescript
   // Award bonus points
   await this.rewardSystem.awardPoints({
     studentId,
     amount: 50,
     source: 'perfect-score',
     classId,
     subjectId,
     description: 'Bonus for perfect score',
   });
   ```

### Point Calculation

Points are calculated differently based on the source:

- **Graded Activities**: Points = Percentage Score (e.g., 85% score = 85 points)
- **Non-Graded Activities**: Points based on activity type and complexity
- **Login Streaks**: Base points (5) + streak bonus (up to 25)
- **Achievements**: Fixed bonus based on achievement type

## Level Progression System

### Level Calculation

The level system provides a progression path for students based on accumulated points. Levels are calculated using an exponential formula:

```typescript
/**
 * Calculate the experience points needed for a given level
 */
private calculateExpForLevel(level: number): number {
  // Exponential growth formula: 100 * (level ^ 1.5)
  return Math.floor(100 * Math.pow(level, 1.5));
}
```

This means:
- Level 1: 100 points
- Level 2: 283 points
- Level 3: 520 points
- Level 4: 800 points
- Level 5: 1,118 points
- And so on, with increasing requirements for each level

### Experience Points

When points are awarded, they also count as experience points for level progression:

```typescript
// Update student level based on points
const levelProgression = await this.progressLevel({
  studentId,
  expPoints: amount,
  classId,
});
```

The level progression system tracks:
- Current level
- Current experience points
- Points needed for next level
- Progress percentage toward next level

### Level Names

Levels have descriptive names based on the numeric level:

```typescript
/**
 * Get level name based on level number
 */
getLevelName(level: number): string {
  if (level >= 50) return "Legendary";
  if (level >= 40) return "Mythical";
  if (level >= 30) return "Epic";
  if (level >= 20) return "Master";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Advanced";
  if (level >= 5) return "Intermediate";
  return "Beginner";
}
```

## Achievement System

### Achievement Types

The system includes various types of achievements that students can unlock:

1. **Grade-Based Achievements**:
   - Perfect Score: Achieve 100% on an activity
   - High Achiever: Score 90%+ on multiple activities (milestones at 5, 10, 25, 50, 100)

2. **Activity-Based Achievements**:
   - Activity completion achievements for different activity types
   - Class-specific activity completion achievements

3. **Streak Achievements**:
   - Login Streak: Log in for consecutive days
   - Activity Streak: Complete activities for consecutive days

4. **Point-Based Achievements**:
   - Point milestones (e.g., 100, 500, 1000, 5000 points)
   - Class-specific and subject-specific point milestones

5. **Level-Based Achievements**:
   - Reaching specific level milestones

### Achievement Unlocking

Achievements track progress toward completion and are unlocked when the progress reaches the total:

```typescript
const wasUnlocked = achievement.unlocked;
const newProgress = Math.min(achievement.progress + progressIncrement, achievement.total);
const isNowUnlocked = newProgress >= achievement.total;
const newlyUnlocked = !wasUnlocked && isNowUnlocked;

const updatedAchievement = await this.prisma.studentAchievement.update({
  where: { id: achievementId },
  data: {
    progress: newProgress,
    unlocked: isNowUnlocked,
    ...(newlyUnlocked && { unlockedAt: new Date() }),
  },
});
```

### Achievement Rewards

When achievements are unlocked, bonus points are awarded based on the achievement type:

```typescript
// Different achievement types can have different bonus point values
let bonusPoints = 25; // Default bonus

switch (achievement.type) {
  case 'class':
  case 'class-completion':
    bonusPoints = 50;
    break;
  case 'subject':
  case 'subject-completion':
    bonusPoints = 40;
    break;
  case 'streak':
  case 'streak-milestone':
    bonusPoints = 30;
    break;
  case 'special':
    bonusPoints = 100;
    break;
  case 'perfect-score':
    bonusPoints = 50;
    break;
  case 'high-achiever':
    bonusPoints = 35;
    break;
  case 'level':
    bonusPoints = achievement.total * 2; // Level-based bonus
    break;
  case 'points':
    bonusPoints = Math.floor(achievement.total * 0.1); // 10% of point threshold
    break;
}
```

## Leaderboards

### Leaderboard Types

The system supports multiple types of leaderboards:

1. **Class Leaderboards**: Rankings within a specific class
2. **Subject Leaderboards**: Rankings within a specific subject
3. **Course Leaderboards**: Rankings within a specific course
4. **Overall Leaderboards**: Campus-wide rankings

Leaderboards can be filtered by time period:
- Daily
- Weekly
- Monthly
- All-time

### Point Aggregation

Points are aggregated for leaderboards when they are awarded:

```typescript
/**
 * Update points aggregates for leaderboards
 */
private async updatePointsAggregates(
  studentId: string,
  amount: number,
  classId?: string,
  subjectId?: string
): Promise<void> {
  try {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Start of day

    // Check if aggregate exists for today
    const existingAggregate = await this.prisma.studentPointsAggregate.findFirst({
      where: {
        studentId,
        classId: classId || null,
        subjectId: subjectId || null,
        date,
      },
    });

    if (existingAggregate) {
      // Update existing aggregate
      await this.prisma.studentPointsAggregate.update({
        where: { id: existingAggregate.id },
        data: {
          points: { increment: amount },
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new aggregate
      await this.prisma.studentPointsAggregate.create({
        data: {
          studentId,
          classId,
          subjectId,
          date,
          points: amount,
        },
      });
    }
  } catch (error) {
    logger.error('Error updating points aggregates', { error, studentId, amount });
    // Don't throw here to prevent breaking the main flow
  }
}
```

## Integration Points

### Activity Submission Flow

The complete flow from activity submission to points and rewards:

1. Student submits an activity
2. Activity is graded by the appropriate grading function
3. Grade is stored in the database
4. Gradebook is updated with the new grade
5. Points are awarded based on the grade
6. Level progression is calculated based on the points
7. Achievements are checked and updated
8. Leaderboard data is updated

### Gradebook Integration

The grading system integrates with the gradebook system:

```typescript
// Update the gradebook if needed
if (updateGradebook && activity.isGradable && score !== null) {
  await updateStudentGradebook(
    prisma,
    activityId,
    studentId,
    grade,
    activity.maxScore || 100
  );
}
```

The gradebook system calculates overall grades based on weighted categories:

```typescript
/**
 * Helper method to calculate overall score based on assessment and activity scores
 */
private calculateOverallScore(assessmentScore: number, activityScore: number): number {
  // Default weightage: 70% for assessments, 30% for activities
  const assessmentWeight = 0.7;
  const activityWeight = 0.3;

  return (assessmentScore * assessmentWeight) + (activityScore * activityWeight);
}

/**
 * Helper method to calculate letter grade based on score
 */
private calculateLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
```

Gradebooks can be configured with custom weights and grading scales to meet the needs of different classes and educational approaches.
