# Student Activity Tracking Solution

## Problem Statement

In our student portal, we currently have a disconnect between how activities are displayed and how they're tracked:

1. Activities are displayed based on class and subject assignments in `SubjectActivitiesView.tsx`
2. When a student completes an activity, it's added to the `ActivityGrade` table with a "completed" status
3. However, the activity still appears in the "pending" tab because activities are displayed based on class association rather than their completion status in `ActivityGrade`

This creates confusion for students who see completed activities still appearing in their pending list.

## Current Implementation Analysis

### Activity Display Flow

- Activities are fetched using `api.activity.listByClass.useQuery({ classId })`
- Filtered by subject: `activities.filter(activity => activity.subjectId === subjectId)`
- Status is determined by checking:
  - Activity grades count: `activity._count?.activityGrades > 0`
  - Latest grade status: `latestGrade.status === 'GRADED' || latestGrade.status === 'SUBMITTED'`
  - Due dates and start dates

### Activity Submission Flow

- Student completes an activity → submitted via `submitActivity` in the activity router
- Creates/updates an entry in `ActivityGrade` with status (typically `SUBMITTED` or `GRADED`)
- For non-gradable activities, they're marked with `status = SubmissionStatus.GRADED`

### Database Schema

- **Activity**: Contains all activities created for a class
- **ActivityGrade**: Contains student submissions/grades for activities
  - Has a unique constraint on `[activityId, studentId]`
  - Has a status field (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `GRADED`, etc.)

## Proposed Solution

### 1. Create ActivityGrade Records on Activity Assignment

When an activity is assigned to a class, automatically create `ActivityGrade` records for all students in that class with a status of "UNATTEMPTED".

```typescript
// Add to SubmissionStatus enum
UNATTEMPTED = "UNATTEMPTED"
```

### 2. Modify the Student Activities View

Instead of fetching activities directly from the `Activity` table and then checking for grades:

1. Fetch all `ActivityGrade` records for the current student and class
2. Join with the `Activity` table to get activity details
3. Filter by subject
4. Sort and display based on the `ActivityGrade.status`

### 3. Separate Points from Grades for Non-Gradable Activities

For non-gradable activities, we'll implement a separate points tracking system:

1. All activities (gradable and non-gradable) will have `ActivityGrade` records
2. Non-gradable activities will use the `COMPLETED` status instead of `GRADED`
3. Points will be tracked separately from grades in the rewards system
4. Leaderboards will be based on points, not grades

## Implementation Plan

### Step 1: Update the SubmissionStatus Enum

Add `UNATTEMPTED` and `COMPLETED` to the `SubmissionStatus` on reattemt it will update status resubmitted enum:

```prisma
enum SubmissionStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  GRADED
  RETURNED
  RESUBMITTED
  LATE
  REJECTED
  UNATTEMPTED  // New status for activities not yet attempted
  COMPLETED    // New status for completed non-gradable activities
}
```

### Step 2: Create a Migration Function

Create a one-time migration function to create `ActivityGrade` records for all existing activities and students:

```typescript
async function createMissingActivityGrades() {
  // Get all active classes
  const classes = await prisma.class.findMany({
    where: { status: SystemStatus.ACTIVE },
    select: { id: true }
  });

  for (const classObj of classes) {
    // Get all activities for this class
    const activities = await prisma.activity.findMany({
      where: { classId: classObj.id, status: SystemStatus.ACTIVE },
      select: { id: true, isGradable: true }
    });

    // Get all students enrolled in this class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: classObj.id, status: SystemStatus.ACTIVE },
      select: { studentId: true }
    });

    // For each activity and student combination
    for (const activity of activities) {
      for (const enrollment of enrollments) {
        // Check if an ActivityGrade already exists
        const existingGrade = await prisma.activityGrade.findUnique({
          where: {
            activityId_studentId: {
              activityId: activity.id,
              studentId: enrollment.studentId
            }
          }
        });

        // If no grade exists, create one with UNATTEMPTED status
        if (!existingGrade) {
          await prisma.activityGrade.create({
            data: {
              activityId: activity.id,
              studentId: enrollment.studentId,
              status: 'UNATTEMPTED',
              submittedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    }
  }
}
```

### Step 3: Create ActivityGrades for New Activities

Add a hook to automatically create `ActivityGrade` records when a new activity is created:

```typescript
async function createActivityGradesForNewActivity(activityId: string, classId: string) {
  // Get all students enrolled in this class
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      classId: classId,
      status: SystemStatus.ACTIVE
    },
    select: { studentId: true }
  });

  // Create ActivityGrade records for each student
  const activityGrades = enrollments.map(enrollment => ({
    activityId: activityId,
    studentId: enrollment.studentId,
    status: 'UNATTEMPTED',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Batch insert all records
  if (activityGrades.length > 0) {
    await prisma.activityGrade.createMany({
      data: activityGrades,
      skipDuplicates: true
    });
  }
}
```

### Step 4: Create a New API Endpoint

Create a new API endpoint in the `activityGrade` router to fetch activities with grades for a student:

```typescript
listByStudentAndClass: protectedProcedure
  .input(
    z.object({
      classId: z.string(),
      subjectId: z.string().optional()
    })
  )
  .query(async ({ ctx, input }) => {
    // Find the student profile for the current user
    const studentProfile = await ctx.prisma.studentProfile.findFirst({
      where: { userId: ctx.session.user.id },
    });

    if (!studentProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student profile not found for current user',
      });
    }

    // Build the where condition
    const whereCondition: any = {
      studentId: studentProfile.id,
      activity: {
        classId: input.classId,
        status: SystemStatus.ACTIVE
      }
    };

    // Add subject filter if provided
    if (input.subjectId) {
      whereCondition.activity.subjectId = input.subjectId;
    }

    // Fetch activity grades with activity details
    const activityGrades = await ctx.prisma.activityGrade.findMany({
      where: whereCondition,
      include: {
        activity: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
            topic: {
              select: {
                id: true,
                title: true,
                code: true,
              }
            }
          }
        }
      },
      orderBy: [
        { activity: { createdAt: 'desc' } }
      ]
    });

    return activityGrades;
  }),
```

### Step 5: Update the Student Activities View

Modify the `SubjectActivitiesView.tsx` component to use the new endpoint:

```typescript
// Replace the current activity fetching with:
const { data: activityGrades, isLoading } = api.activityGrade.listByStudentAndClass.useQuery(
  {
    classId,
    subjectId
  },
  {
    enabled: !!classId && !!subjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: 1000,
  }
);

// Process these activity grades to get the activities with their status
const processedActivities = useMemo(() => {
  if (!activityGrades) return [];

  return activityGrades.map(grade => {
    const activity = grade.activity;

    // Map the ActivityGrade status to our display status
    let status = 'pending';
    switch (grade.status) {
      case 'GRADED':
      case 'COMPLETED':
        status = 'completed';
        break;
      case 'SUBMITTED':
      case 'DRAFT':
        status = 'in-progress';
        break;
      case 'UNATTEMPTED':
        // Check if the activity is overdue or upcoming based on dates
        const now = new Date();
        const isOverdue = activity.endDate && new Date(activity.endDate) < now;
        const isUpcoming = activity.startDate && new Date(activity.startDate) > now;

        if (isOverdue) {
          status = 'overdue';
        } else if (isUpcoming) {
          status = 'upcoming';
        } else {
          status = 'pending';
        }
        break;
      default:
        status = 'pending';
    }

    // Return the processed activity with status from ActivityGrade
    return {
      ...activity,
      status,
      score: grade.score,
      // Other properties...
    };
  });
}, [activityGrades]);
```

## Scalability Considerations

For a system with 100,000+ students, we need to ensure our solution is scalable:

### 1. Database Partitioning

While the `ActivityGrade` table currently has indexes, we need to implement true database partitioning to handle the massive scale:

#### Current Scale Challenge:
- 1 student × 500 activities per month = 6,000 activities per year per student
- 100 students per class × 6,000 activities = 600,000 activities per class per year
- Multiple classes across multiple years = Potentially millions of records

#### Recommended Partitioning Strategy:

```sql
-- Create partitioned ActivityGrade table
CREATE TABLE "activity_grades" (
    -- Fields remain the same
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" FLOAT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'UNATTEMPTED',
    -- Other fields...

    -- Add partition key
    "partitionKey" TEXT GENERATED ALWAYS AS (
        'class_' || "classId" || '_term_' || "termId"
    ) STORED,

    CONSTRAINT "activity_grades_pkey" PRIMARY KEY ("id", "partitionKey")
) PARTITION BY LIST ("partitionKey");

-- Create partitions for each class and term
CREATE TABLE "activity_grades_class1_term1"
    PARTITION OF "activity_grades"
    FOR VALUES IN ('class_class1_term_term1');

-- Create archive partition for older data
CREATE TABLE "activity_grades_archive"
    PARTITION OF "activity_grades"
    FOR VALUES IN ('archive');
```

- We'll maintain the existing indexes for query optimization:
  - Indexes on `[studentId]`, `[status]`, `[gradedAt]`, `[submittedAt]`
  - Compound indexes on `[activityId, submittedAt]`, `[studentId, submittedAt]`
  - Archiving indexes: `[isArchived]`, `[activityId, studentId, isArchived]`, `[activityId, status, isArchived]`

### 2. Batch Processing

When creating `ActivityGrade` records for a new activity, use batch operations:

```typescript
await prisma.activityGrade.createMany({
  data: activityGrades,
  skipDuplicates: true
});
```

### 3. Background Processing

Create `ActivityGrade` records in background jobs for large classes:

```typescript
// Queue a background job to create ActivityGrade records
await backgroundJobQueue.add('createActivityGrades', {
  activityId,
  classId
}, {
  priority: 5,
  attempts: 3
});
```

### 4. Caching Strategy

Implement aggressive caching for activity lists:

```typescript
const { data: activityGrades, isLoading } = api.activityGrade.listByStudentAndClass.useQuery(
  {
    classId,
    subjectId
  },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  }
);
```

## Commitment Integration

Students can create commitments to complete specific activities within a certain timeframe. We'll integrate this with our ActivityGrade system:

### 1. Commitment Data Structure

Update the ActivityGrade schema to include commitment-related fields:

```prisma
model ActivityGrade {
  // Existing fields...

  // Commitment fields
  isCommitted        Boolean   @default(false)
  commitmentId       String?
  commitmentDeadline DateTime?
  commitmentMet      Boolean?

  // Relation to CommitmentContract
  commitment         CommitmentContract? @relation(fields: [commitmentId], references: [id])
}
```

### 2. Commitment Creation Flow

When a student creates a commitment:

```typescript
async function createCommitment(studentId: string, activities: string[], deadline: Date) {
  // Create the commitment contract
  const commitment = await prisma.commitmentContract.create({
    data: {
      studentId,
      title: "Activity Completion Commitment",
      description: `Commitment to complete ${activities.length} activities by ${deadline.toLocaleDateString()}`,
      startDate: new Date(),
      endDate: deadline,
      status: 'ACTIVE',
      type: 'ACTIVITY_COMPLETION',
      targetValue: activities.length,
      currentValue: 0
    }
  });

  // Update ActivityGrade records for the committed activities
  await prisma.activityGrade.updateMany({
    where: {
      studentId,
      activityId: { in: activities },
      status: 'UNATTEMPTED'
    },
    data: {
      isCommitted: true,
      commitmentId: commitment.id,
      commitmentDeadline: deadline
    }
  });

  return commitment;
}
```

### 3. Activity Completion and Commitment Tracking

When an activity is completed, check and update the commitment status:

```typescript
// Add to the activity submission service
async function updateCommitmentStatus(activityGradeId: string) {
  // Get the activity grade with commitment info
  const activityGrade = await prisma.activityGrade.findUnique({
    where: { id: activityGradeId },
    select: {
      studentId: true,
      commitmentId: true,
      isCommitted: true,
      commitmentDeadline: true,
      submittedAt: true
    }
  });

  // If this activity is part of a commitment
  if (activityGrade?.isCommitted && activityGrade.commitmentId) {
    // Check if completed before deadline
    const completedOnTime = activityGrade.submittedAt <= activityGrade.commitmentDeadline;

    // Update the activity grade commitment status
    await prisma.activityGrade.update({
      where: { id: activityGradeId },
      data: { commitmentMet: completedOnTime }
    });

    // Update the commitment contract progress
    if (completedOnTime) {
      await prisma.commitmentContract.update({
        where: { id: activityGrade.commitmentId },
        data: {
          currentValue: { increment: 1 }
        }
      });
    }

    // Check if all committed activities are completed
    const totalCommitted = await prisma.activityGrade.count({
      where: {
        commitmentId: activityGrade.commitmentId,
        isCommitted: true
      }
    });

    const completedCommitted = await prisma.activityGrade.count({
      where: {
        commitmentId: activityGrade.commitmentId,
        isCommitted: true,
        commitmentMet: true
      }
    });

    // If all activities are completed, mark the commitment as fulfilled
    if (completedCommitted === totalCommitted) {
      await prisma.commitmentContract.update({
        where: { id: activityGrade.commitmentId },
        data: {
          status: 'FULFILLED',
          completedAt: new Date()
        }
      });

      // Award points or badges for commitment completion
      await rewardSystem.awardCommitmentCompletion(
        activityGrade.studentId,
        activityGrade.commitmentId
      );
    }
  }
}
```

### 4. Commitment Display in UI

In the student activities view, show commitment indicators:

```typescript
// Add to the processed activities in SubjectActivitiesView
const processedActivities = useMemo(() => {
  if (!activityGrades) return [];

  return activityGrades.map(grade => {
    // Existing mapping code...

    // Add commitment information
    const isCommitted = grade.isCommitted || false;
    const commitmentDeadline = grade.commitmentDeadline ? new Date(grade.commitmentDeadline) : null;
    const isCommitmentOverdue = commitmentDeadline && new Date() > commitmentDeadline;

    return {
      ...activity,
      status,
      score: grade.score,
      isCommitted,
      commitmentDeadline,
      isCommitmentOverdue,
      // Other properties...
    };
  });
}, [activityGrades]);
```

## Points vs. Grades Separation

For a cleaner separation between points and grades:

1. **ActivityGrade**: Tracks completion status and academic performance
   - For gradable activities: `DRAFT` → `SUBMITTED` → `GRADED`
   - For non-gradable activities: `UNATTEMPTED` → `COMPLETED`

2. **RewardPoints**: Tracks points earned from activities
   - Points can be awarded for both gradable and non-gradable activities
   - Points can be weighted differently from grades
   - Leaderboards are based on points, not grades
   - Commitment completion can award bonus points

This separation allows for more flexibility in the reward system while maintaining academic integrity in the grading system.

## Implementation Timeline

1. **Phase 1**: Update schema and create migration scripts
   - Add `UNATTEMPTED` and `COMPLETED` statuses
   - Add commitment fields to ActivityGrade
   - Implement database partitioning

2. **Phase 2**: Implement new API endpoints and update UI components
   - Create new ActivityGrade endpoints
   - Update SubjectActivitiesView
   - Add commitment integration

3. **Phase 3**: Run migration for existing activities
   - Create ActivityGrade records for all existing activities
   - Backfill commitment data if available

4. **Phase 4**: Update activity creation flow
   - Automatically create ActivityGrade records for new activities
   - Implement commitment creation flow

5. **Phase 5**: Testing and validation
   - Verify correct status display
   - Test commitment tracking
   - Performance testing with large datasets
