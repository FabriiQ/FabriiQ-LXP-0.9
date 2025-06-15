# Student Activity Tracking Implementation Plan

This document outlines the specific code changes needed to implement the solution described in `student-activity-tracking-solution.md`. The implementation will resolve the disconnect between activity display and tracking in the student portal.

## 1. Schema Updates

### 1.1 Update SubmissionStatus Enum

**File:** `src/server/api/constants.ts`

```typescript
export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  GRADED = "GRADED",
  RETURNED = "RETURNED",
  RESUBMITTED = "RESUBMITTED",
  LATE = "LATE",
  REJECTED = "REJECTED",
  UNATTEMPTED = "UNATTEMPTED",  // New status
  COMPLETED = "COMPLETED"       // New status for non-gradable activities
}
```

**File:** `prisma/schema.prisma`

Update the SubmissionStatus enum in the schema and add commitment fields to ActivityGrade:

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
  UNATTEMPTED
  COMPLETED
}

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

### 1.2 Create Database Migration

Create a migration to update the schema and add partitioning:

```bash
npx prisma migrate dev --name add_unattempted_status_and_commitment_fields
```

## 2. API Updates

### 2.1 Create New ActivityGrade Endpoint

**File:** `src/server/api/routers/activityGrade.ts`

Add a new endpoint to fetch activities with grades for a student:

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

### 2.2 Update Activity Creation Process

**File:** `src/server/api/routers/activity.ts`

Modify the `create` procedure to create ActivityGrade records for all students:

```typescript
// After successfully creating the activity
const activity = await service.createActivity(activityInput);

// Get all students enrolled in the class
const enrollments = await ctx.prisma.studentEnrollment.findMany({
  where: {
    classId: input.classId,
    status: 'ACTIVE',
  },
  select: {
    studentId: true,
  },
});

// Create ActivityGrade records for all students with UNATTEMPTED status
if (enrollments.length > 0) {
  const gradeData = enrollments.map(enrollment => ({
    studentId: enrollment.studentId,
    activityId: activity.id,
    status: SubmissionStatus.UNATTEMPTED,
    submittedAt: new Date(),
  }));

  // Batch insert the grade records
  if (gradeData.length > 0) {
    await ctx.prisma.activityGrade.createMany({
      data: gradeData,
      skipDuplicates: true,
    });
  }
}
```

### 2.3 Update Activity Submission Process

**File:** `src/server/api/services/activity-submission.service.ts`

Modify the submission process to handle non-gradable activities:

```typescript
// For non-gradable activities
if (!activity.isGradable && isNonGradableCompletion) {
  // Use COMPLETED status instead of GRADED for non-gradable activities
  status = SubmissionStatus.COMPLETED;
  
  // Set a default score of 100% for non-gradable activities
  score = 100;
  feedback = "Activity completed successfully";
}
```

## 3. UI Updates

### 3.1 Update SubjectActivitiesView Component

**File:** `src/components/student/SubjectActivitiesView.tsx`

Replace the current activity fetching with the new endpoint:

```typescript
// Replace this:
const { data: activities, isLoading } = api.activity.listByClass.useQuery(
  {
    classId
  },
  {
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  }
);

// With this:
const { data: activityGrades, isLoading } = api.activityGrade.listByStudentAndClass.useQuery(
  {
    classId,
    subjectId
  },
  {
    enabled: !!classId && !!subjectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  }
);
```

Update the activity processing logic:

```typescript
// Replace this:
const processedActivities = useMemo(() => {
  // Always define these variables
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // If no activities, return empty array
  if (!activities) return [];

  // Filter activities by subject ID
  const subjectActivities = activities.filter(activity =>
    activity.subjectId === subjectId
  );

  // Process the real activities with additional metadata
  return subjectActivities.map((activity: any) => {
    // Determine activity status based on dates, grades, and submission status
    let status = 'pending';

    // Check if the activity has grades and their status
    const hasGrades = activity._count?.activityGrades > 0;

    // Get the most recent grade if available
    const latestGrade = activity.activityGrades && activity.activityGrades.length > 0
      ? activity.activityGrades[0]
      : null;
    
    // ... rest of the processing logic
  });
}, [activities, subjectId]);

// With this:
const processedActivities = useMemo(() => {
  if (!activityGrades) return [];
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
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
    
    // Mark activities created in the last 7 days as new
    const createdAt = activity.createdAt ? new Date(activity.createdAt) : null;
    const isNew = createdAt ? createdAt > oneWeekAgo : false;
    
    // Add commitment information
    const isCommitted = grade.isCommitted || false;
    const commitmentDeadline = grade.commitmentDeadline ? new Date(grade.commitmentDeadline) : null;
    const isCommitmentOverdue = commitmentDeadline && now > commitmentDeadline;
    
    // Return the processed activity
    return {
      ...activity,
      status,
      score: grade.score,
      isNew,
      isCommitted,
      commitmentDeadline,
      isCommitmentOverdue,
      // Other properties...
    };
  });
}, [activityGrades]);
```

## 4. Commitment Integration

### 4.1 Create Commitment Service

**File:** `src/server/api/services/commitment.service.ts`

```typescript
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

export class CommitmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createCommitment(studentId: string, activities: string[], deadline: Date, title?: string, description?: string) {
    // Create the commitment contract
    const commitment = await this.prisma.commitmentContract.create({
      data: {
        id: uuidv4(),
        studentId,
        title: title || "Activity Completion Commitment",
        description: description || `Commitment to complete ${activities.length} activities by ${deadline.toLocaleDateString()}`,
        startDate: new Date(),
        endDate: deadline,
        status: 'ACTIVE',
        type: 'ACTIVITY_COMPLETION',
        targetValue: activities.length,
        currentValue: 0
      }
    });
    
    // Update ActivityGrade records for the committed activities
    await this.prisma.activityGrade.updateMany({
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

  async updateCommitmentStatus(activityGradeId: string) {
    // Get the activity grade with commitment info
    const activityGrade = await this.prisma.activityGrade.findUnique({
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
      await this.prisma.activityGrade.update({
        where: { id: activityGradeId },
        data: { commitmentMet: completedOnTime }
      });
      
      // Update the commitment contract progress
      if (completedOnTime) {
        await this.prisma.commitmentContract.update({
          where: { id: activityGrade.commitmentId },
          data: {
            currentValue: { increment: 1 }
          }
        });
      }
      
      // Check if all committed activities are completed
      const totalCommitted = await this.prisma.activityGrade.count({
        where: {
          commitmentId: activityGrade.commitmentId,
          isCommitted: true
        }
      });
      
      const completedCommitted = await this.prisma.activityGrade.count({
        where: {
          commitmentId: activityGrade.commitmentId,
          isCommitted: true,
          commitmentMet: true
        }
      });
      
      // If all activities are completed, mark the commitment as fulfilled
      if (completedCommitted === totalCommitted) {
        await this.prisma.commitmentContract.update({
          where: { id: activityGrade.commitmentId },
          data: {
            status: 'FULFILLED',
            completedAt: new Date()
          }
        });
      }
    }
  }
}
```

## 5. Migration Script

Create a script to populate ActivityGrade records for existing activities:

**File:** `scripts/migrate-activity-grades.ts`

```typescript
import { PrismaClient, SystemStatus, SubmissionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createMissingActivityGrades() {
  console.log('Starting migration of activity grades...');
  
  // Get all active classes
  const classes = await prisma.class.findMany({
    where: { status: SystemStatus.ACTIVE },
    select: { id: true }
  });
  
  console.log(`Found ${classes.length} active classes`);
  
  let totalActivities = 0;
  let totalStudents = 0;
  let totalCreated = 0;
  
  for (const classObj of classes) {
    // Get all activities for this class
    const activities = await prisma.activity.findMany({
      where: { classId: classObj.id, status: SystemStatus.ACTIVE },
      select: { id: true, isGradable: true }
    });
    
    totalActivities += activities.length;
    console.log(`Processing ${activities.length} activities for class ${classObj.id}`);
    
    // Get all students enrolled in this class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: classObj.id, status: SystemStatus.ACTIVE },
      select: { studentId: true }
    });
    
    totalStudents += enrollments.length;
    console.log(`Processing ${enrollments.length} students for class ${classObj.id}`);
    
    // Prepare batch data
    const batchData = [];
    
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
        
        // If no grade exists, add to batch
        if (!existingGrade) {
          batchData.push({
            id: uuidv4(),
            activityId: activity.id,
            studentId: enrollment.studentId,
            status: SubmissionStatus.UNATTEMPTED,
            submittedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Batch insert if we have data
    if (batchData.length > 0) {
      // Insert in batches of 1000 to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < batchData.length; i += batchSize) {
        const batch = batchData.slice(i, i + batchSize);
        await prisma.activityGrade.createMany({
          data: batch,
          skipDuplicates: true
        });
        console.log(`Created ${batch.length} activity grades (batch ${i/batchSize + 1})`);
      }
      totalCreated += batchData.length;
    }
  }
  
  console.log('Migration complete!');
  console.log(`Processed ${totalActivities} activities for ${totalStudents} students`);
  console.log(`Created ${totalCreated} new ActivityGrade records`);
}

createMissingActivityGrades()
  .catch(e => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 6. Leaderboard Updates

The leaderboard services already use points from the StudentPoints table rather than directly from ActivityGrade, which aligns with our approach of separating points from grades. No major changes are needed here.

## 7. Testing Plan

1. Test activity creation with automatic ActivityGrade creation
2. Test activity submission and status updates
3. Test commitment creation and tracking
4. Test leaderboard functionality with the new system
5. Performance testing with large datasets
