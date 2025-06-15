# Leaderboard Replacement Implementation Guide

This guide provides detailed implementation instructions for replacing the existing leaderboard components with the new unified leaderboard implementation.

## 1. Teacher Portal Implementation

### 1.1 Campus Leaderboard Page

**File**: `/app/teacher/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<UnifiedLeaderboard
  campusId={activeCampus.campusId}
  campusName={activeCampus.campus.name}
/>
```

**New Implementation**:
```tsx
import { StandardLeaderboard } from '@/features/leaderboard';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<StandardLeaderboard
  entityType={LeaderboardEntityType.CAMPUS}
  entityId={activeCampus.campusId}
  title={`Campus Leaderboard: ${activeCampus.campus.name}`}
  description="Student rankings and performance metrics across the campus"
/>
```

### 1.2 Class Leaderboard Page

**File**: `/app/teacher/classes/[classId]/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<UnifiedLeaderboard
  classId={classId}
  courseId={classEntity.courseCampus.courseId}
  campusId={classEntity.courseCampus.campusId}
  className={classEntity.name}
  courseName={classEntity.courseCampus.course.name}
  campusName={classEntity.courseCampus.campus.name}
  showOnlyClassTab={true}
/>
```

**New Implementation**:
```tsx
import { StandardLeaderboard } from '@/features/leaderboard';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<StandardLeaderboard
  entityType={LeaderboardEntityType.CLASS}
  entityId={classId}
  title={`Class Leaderboard: ${classEntity.name}`}
  description={`Rankings for ${classEntity.name}`}
  metadata={{
    courseId: classEntity.courseCampus.courseId,
    courseName: classEntity.courseCampus.course.name,
    campusId: classEntity.courseCampus.campusId,
    campusName: classEntity.courseCampus.campus.name
  }}
/>
```

## 2. Student Portal Implementation

### 2.1 Student Leaderboard Page

**File**: `/app/student/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<Tabs defaultValue="class" className="w-full">
  <TabsList className="mb-6 grid w-full grid-cols-3">
    <TabsTrigger value="class">Class</TabsTrigger>
    <TabsTrigger value="grade">Grade</TabsTrigger>
    <TabsTrigger value="campus">Campus</TabsTrigger>
  </TabsList>

  <TabsContent value="class">
    <StudentLeaderboard
      studentId={user.id}
      studentPosition={5}
      studentPreviousPosition={7}
      studentScore={850}
      leaderboard={leaderboardData}
    />
  </TabsContent>
  
  {/* Other tabs */}
</Tabs>
```

**New Implementation**:
```tsx
import { StudentLeaderboardView } from '@/features/leaderboard';
import { LeaderboardEntityType, TimeGranularity } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<Tabs defaultValue="class" className="w-full">
  <TabsList className="mb-6 grid w-full grid-cols-3">
    <TabsTrigger value="class">Class</TabsTrigger>
    <TabsTrigger value="grade">Grade</TabsTrigger>
    <TabsTrigger value="campus">Campus</TabsTrigger>
  </TabsList>

  <TabsContent value="class">
    <StudentLeaderboardView
      entityType={LeaderboardEntityType.CLASS}
      entityId={activeClass.id}
      currentStudentId={user.id}
      timeGranularity={TimeGranularity.ALL_TIME}
      showPersonalStats={true}
    />
  </TabsContent>
  
  <TabsContent value="grade">
    <StudentLeaderboardView
      entityType={LeaderboardEntityType.COURSE}
      entityId={activeClass.courseCampus.courseId}
      currentStudentId={user.id}
      timeGranularity={TimeGranularity.ALL_TIME}
      showPersonalStats={true}
    />
  </TabsContent>
  
  <TabsContent value="campus">
    <StudentLeaderboardView
      entityType={LeaderboardEntityType.CAMPUS}
      entityId={activeClass.courseCampus.campusId}
      currentStudentId={user.id}
      timeGranularity={TimeGranularity.ALL_TIME}
      showPersonalStats={true}
    />
  </TabsContent>
</Tabs>
```

## 3. Coordinator Portal Implementation

### 3.1 Class Leaderboard Page

**File**: `/app/admin/coordinator/classes/[id]/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<UnifiedLeaderboard
  classId={params.id}
  courseId={classData.courseCampus.courseId}
  campusId={classData.courseCampus.campusId}
  className={classData.name}
  courseName={classData.courseCampus.course.name}
  campusName={classData.courseCampus.campus.name}
/>
```

**New Implementation**:
```tsx
import { StandardLeaderboard } from '@/features/leaderboard';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<StandardLeaderboard
  entityType={LeaderboardEntityType.CLASS}
  entityId={params.id}
  title={`Class Leaderboard: ${classData.name}`}
  description="Student rankings and performance metrics for this class"
  metadata={{
    courseId: classData.courseCampus.courseId,
    courseName: classData.courseCampus.course.name,
    campusId: classData.courseCampus.campusId,
    campusName: classData.courseCampus.campus.name
  }}
/>
```

### 3.2 Course Leaderboard Page

**File**: `/app/admin/coordinator/courses/[id]/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<UnifiedLeaderboard
  courseId={params.id}
  campusId={campusId}
  courseName={course.name}
  campusName={campusName}
/>
```

**New Implementation**:
```tsx
import { StandardLeaderboard } from '@/features/leaderboard';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<StandardLeaderboard
  entityType={LeaderboardEntityType.COURSE}
  entityId={params.id}
  title={`Course Leaderboard: ${course.name}`}
  description="Student rankings and performance metrics for this course"
  metadata={{
    campusId: campusId,
    campusName: campusName
  }}
/>
```

## 4. Admin Portal Implementation

### 4.1 Class Leaderboard Page

**File**: `/app/admin/campus/classes/[id]/leaderboard/page.tsx`

**Current Implementation**:
```tsx
<UnifiedLeaderboard
  classId={id}
  courseId={classData.courseCampus.courseId}
  campusId={classData.courseCampus.campusId}
  className={classData.name}
  courseName={classData.courseCampus.course.name}
  campusName={classData.courseCampus.campus.name}
/>
```

**New Implementation**:
```tsx
import { StandardLeaderboard } from '@/features/leaderboard';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

// ...

<StandardLeaderboard
  entityType={LeaderboardEntityType.CLASS}
  entityId={id}
  title={`Leaderboard: ${classData.name}`}
  description="Student rankings and performance metrics"
  metadata={{
    courseId: classData.courseCampus.courseId,
    courseName: classData.courseCampus.course.name,
    campusId: classData.courseCampus.campusId,
    campusName: classData.courseCampus.campus.name
  }}
/>
```

## 5. Creating Adapter Components (Optional)

If you need to maintain backward compatibility during the transition, consider creating adapter components:

### 5.1 Legacy Leaderboard Adapter

**File**: `src/features/leaderboard/adapters/LegacyLeaderboardAdapter.tsx`

```tsx
import { StandardLeaderboard } from '../components/StandardLeaderboard';
import { LeaderboardEntityType } from '../types/standard-leaderboard';

interface LegacyLeaderboardAdapterProps {
  classId?: string;
  subjectId?: string;
  courseId?: string;
  campusId: string;
  className?: string;
  subjectName?: string;
  courseName?: string;
  campusName?: string;
  showOnlyClassTab?: boolean;
}

export function LegacyLeaderboardAdapter({
  classId,
  subjectId,
  courseId,
  campusId,
  className,
  subjectName,
  courseName,
  campusName,
  showOnlyClassTab = false,
}: LegacyLeaderboardAdapterProps) {
  // Determine entity type and ID based on legacy props
  const entityType = classId ? LeaderboardEntityType.CLASS :
                    subjectId ? LeaderboardEntityType.SUBJECT :
                    courseId ? LeaderboardEntityType.COURSE :
                    LeaderboardEntityType.CAMPUS;
  
  const entityId = classId || subjectId || courseId || campusId;
  
  // Determine title based on entity type
  const title = classId ? `Class Leaderboard: ${className || ''}` :
                subjectId ? `Subject Leaderboard: ${subjectName || ''}` :
                courseId ? `Course Leaderboard: ${courseName || ''}` :
                `Campus Leaderboard: ${campusName || ''}`;
  
  return (
    <StandardLeaderboard
      entityType={entityType}
      entityId={entityId}
      title={title}
      metadata={{
        classId,
        className,
        subjectId,
        subjectName,
        courseId,
        courseName,
        campusId,
        campusName
      }}
    />
  );
}
```

## 6. Testing Checklist

- [ ] Verify leaderboard data loads correctly
- [ ] Test filtering and sorting functionality
- [ ] Verify student position highlighting works
- [ ] Test pagination/virtualization with large datasets
- [ ] Verify offline functionality
- [ ] Test on mobile devices
- [ ] Verify animations and microinteractions
- [ ] Test with different user roles and permissions
