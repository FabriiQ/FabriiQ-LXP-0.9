# Student Activity Tracking Solution

This document outlines the implementation of the student activity tracking system in the Aivy LXP platform, focusing on the integration of commitments with activity grades.

## Overview

The student activity tracking system has been enhanced to:

1. Track all activities assigned to students from the moment they are created
2. Support commitment contracts where students commit to completing activities by specific deadlines
3. Award points for meeting commitments
4. Provide a unified view of activities with their status and commitment information

## Implementation Details

### Database Schema Updates

The following changes were made to the Prisma schema:

1. **ActivityGrade Model**:
   - Added `isCommitted` (Boolean) to indicate if an activity is part of a commitment
   - Added `commitmentId` (String, optional) to link to a CommitmentContract
   - Added `commitmentDeadline` (DateTime, optional) to track the deadline for the commitment
   - Added `commitmentMet` (Boolean, optional) to track if the commitment was met

2. **CommitmentContract Model**:
   - Added relation to ActivityGrade to track which activities are part of the commitment

3. **SubmissionStatus Enum**:
   - Added `UNATTEMPTED` status for activities that have been assigned but not started
   - Added `COMPLETED` status for non-gradable activities that have been completed

### Activity Creation Process

When an activity is created:
1. ActivityGrade records are created for all students enrolled in the class
2. These records have `UNATTEMPTED` status (or `DRAFT` until schema migration)
3. This ensures all activities are tracked from the moment they're created

### Activity Submission Process

When an activity is submitted:
1. The ActivityGrade record is updated with the submission details
2. For non-gradable activities, they are marked as `COMPLETED` (or `GRADED` until schema migration)
3. If the activity is part of a commitment, the commitment status is updated
4. Points are awarded if the commitment is met

### Commitment Contract System

The commitment contract system allows:
1. Creating commitments for specific activities with deadlines
2. Tracking progress toward completing committed activities
3. Marking commitments as completed when all activities are done
4. Awarding bonus points for meeting commitments

### Student Portal UI

The student portal UI has been updated to:
1. Use the new `activityGrade.listByStudentAndClass` endpoint to fetch activities with grades
2. Display activities with their correct status based on the ActivityGrade records
3. Show commitment information for activities that are part of commitments

## Migration Process

To implement these changes, the following migration steps are required:

1. Run the Prisma migration to update the schema:
   ```
   npx prisma migrate dev --name add_commitment_to_activity_grade
   ```

2. Run the activity grades migration script to populate ActivityGrade records for existing activities:
   ```
   npx ts-node scripts/migrate-activity-grades.ts
   ```

## Implementation Challenges and Solutions

### Challenge 1: Handling Schema Updates

**Problem**: The code needs to work both before and after the schema migration.

**Solution**: 
- Used raw SQL queries in the CommitmentContractService to handle operations that depend on the new schema
- Added try-catch blocks to gracefully handle cases where the schema hasn't been updated yet
- Used existing enum values (DRAFT, GRADED) as fallbacks until the new ones (UNATTEMPTED, COMPLETED) are available

### Challenge 2: Integrating with the Reward System

**Problem**: Needed to award points for completed commitments.

**Solution**:
- Used direct database inserts to the StudentPoints table instead of depending on the RewardSystem class
- This approach is more resilient to changes in the reward system implementation

### Challenge 3: Efficient Batch Operations

**Problem**: Creating ActivityGrade records for all students and activities could be resource-intensive.

**Solution**:
- Implemented batch processing with pagination (1000 records at a time) in the migration script
- Used Prisma's `createMany` for efficient bulk inserts
- Added `skipDuplicates: true` to handle potential duplicate records gracefully

## Benefits of the Implementation

1. **Improved Activity Tracking**: All activities are tracked from creation to completion
2. **Enhanced Student Engagement**: Commitments provide motivation for students to complete activities on time
3. **Better Data Visibility**: Teachers can see which activities students have committed to and whether they met those commitments
4. **Reward Integration**: Students receive points for meeting commitments, encouraging positive behavior

## Future Enhancements

1. **Commitment UI**: Add UI components for students to create and manage their commitments
2. **Analytics Dashboard**: Provide insights into commitment completion rates and student engagement
3. **Notification System**: Send reminders about upcoming commitment deadlines
4. **Streak Tracking**: Track consecutive days of meeting commitments for additional rewards

## Conclusion

The integration of commitments with activity grades provides a comprehensive solution for tracking student progress and engagement. The system now maintains a clear relationship between activities, grades, and commitments, making it easier to monitor student performance and encourage timely completion of assignments.
