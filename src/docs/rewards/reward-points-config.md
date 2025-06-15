# Reward Points Configuration

This document describes the reward points configuration system, which allows system administrators to customize point values for various activities, achievements, and rewards in the system.

## Overview

The reward points configuration system provides a centralized way to manage point values for:

1. Student activity points
2. Student achievement points
3. Teacher reward points
4. Coordinator reward points

These configurations are stored in the database and can be modified through the system admin settings interface.

## Database Schema

The reward points configuration is stored in the `reward_points_config` table with the following structure:

```prisma
model RewardPointsConfig {
  id                      String       @id @default(cuid())
  institutionId           String?
  institution             Institution? @relation(fields: [institutionId], references: [id])
  
  // Student Activity Points
  quizPoints              Int          @default(20)
  multipleChoicePoints    Int          @default(20)
  multipleResponsePoints  Int          @default(25)
  fillInTheBlanksPoints   Int          @default(30)
  matchingPoints          Int          @default(35)
  sequencePoints          Int          @default(35)
  dragAndDropPoints       Int          @default(40)
  dragTheWordsPoints      Int          @default(40)
  numericPoints           Int          @default(30)
  trueFalsePoints         Int          @default(15)
  readingPoints           Int          @default(10)
  videoPoints             Int          @default(15)
  h5pPoints               Int          @default(25)
  flashCardsPoints        Int          @default(20)
  assignmentPoints        Int          @default(30)
  projectPoints           Int          @default(50)
  discussionPoints        Int          @default(15)
  
  // Student Achievement Points
  perfectScorePoints      Int          @default(50)
  loginStreakBasePoints   Int          @default(5)
  loginStreakBonusPoints  Int          @default(5)
  highAchiever5Points     Int          @default(10)
  highAchiever10Points    Int          @default(20)
  highAchiever25Points    Int          @default(50)
  highAchiever50Points    Int          @default(100)
  highAchiever100Points   Int          @default(200)
  
  // Teacher Points
  lessonPlanCreationPoints    Int      @default(20)
  lessonPlanApprovalPoints    Int      @default(10)
  activityCreationPoints      Int      @default(15)
  h5pContentCreationPoints    Int      @default(25)
  gradeSubmissionPoints       Int      @default(5)
  perfectAttendancePoints     Int      @default(50)
  studentFeedbackPoints       Int      @default(10)
  classPerformanceBonusPoints Int      @default(100)
  
  // Coordinator Points
  lessonPlanReviewPoints      Int      @default(15)
  teacherObservationPoints    Int      @default(25)
  programDevelopmentPoints    Int      @default(50)
  teacherMentoringPoints      Int      @default(30)
  parentMeetingPoints         Int      @default(20)
  studentCounselingPoints     Int      @default(15)
  
  // Metadata
  isActive                Boolean     @default(true)
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  
  @@index([institutionId])
  @@index([isActive])
  @@map("reward_points_config")
}
```

## API Endpoints

The reward points configuration system provides the following API endpoints:

### Get Reward Points Configuration

```typescript
api.rewardConfig.getRewardPointsConfig.useQuery()
```

This endpoint retrieves the current reward points configuration for the institution. If no configuration exists, it returns the default values.

### Update Reward Points Configuration

```typescript
api.rewardConfig.updateRewardPointsConfig.useMutation(data)
```

This endpoint updates the reward points configuration for the institution. It requires the following data structure:

```typescript
{
  studentActivityPoints: {
    quiz: number,
    multipleChoice: number,
    multipleResponse: number,
    // ... other activity points
  },
  studentAchievementPoints: {
    perfectScore: number,
    loginStreak: number,
    // ... other achievement points
  },
  teacherPoints: {
    lessonPlanCreation: number,
    activityCreation: number,
    // ... other teacher points
  },
  coordinatorPoints: {
    lessonPlanReview: number,
    teacherObservation: number,
    // ... other coordinator points
  }
}
```

## Integration with Reward System

The reward points configuration system integrates with the existing reward system by providing configurable point values for various activities and achievements. The reward system should use these configured values when awarding points to students, teachers, and coordinators.

### Example: Awarding Points for Activity Completion

```typescript
// Get the configured point value for the activity type
const pointValue = await getConfiguredPointValue(activityType);

// Award points to the student
await rewardSystem.awardPoints({
  studentId,
  amount: pointValue,
  source: 'activity',
  sourceId: activityId,
  description: `Completed ${activityType} activity`,
});
```

## User Interface

The reward points configuration system provides a user interface for system administrators to configure point values. This interface is accessible through the system admin settings page at `/admin/system/settings/reward-points`.

The interface is organized into tabs for different categories of point values:

1. Student Activities
2. Student Achievements
3. Teacher Rewards
4. Coordinator Rewards

Each tab contains form fields for configuring the point values for that category.

## Security

Only system administrators can access and modify the reward points configuration. The API endpoints enforce this restriction by checking the user's role before allowing access.

## Future Enhancements

Potential future enhancements to the reward points configuration system include:

1. Institution-specific configurations
2. Campus-specific configurations
3. Program-specific configurations
4. Time-based configurations (e.g., different point values for different academic periods)
5. More granular control over point values (e.g., different point values for different difficulty levels)
6. Audit logging for configuration changes
