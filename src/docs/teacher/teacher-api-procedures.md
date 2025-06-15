# Teacher API Procedures

This document describes the API procedures available in the teacher router for accessing class-related data.

## Class Data Procedures

### getClassById

Retrieves detailed information about a specific class.

```typescript
api.teacher.getClassById.useQuery({ classId: string })
```

**Input:**
- `classId`: The ID of the class to retrieve

**Returns:**
- Class details including:
  - Basic class information
  - Term information
  - Course and subject information
  - Program information
  - Campus and facility information
  - Teacher assignments
  - Counts of students, activities, assessments, and attendance records

**Authorization:**
- User must be authenticated as a teacher
- Teacher must be assigned to the requested class

**Example Usage:**
```typescript
const { data: classData, isLoading } = api.teacher.getClassById.useQuery(
  { classId },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

### getClassMetrics

Retrieves performance metrics for a specific class.

```typescript
api.teacher.getClassMetrics.useQuery({ classId: string })
```

**Input:**
- `classId`: The ID of the class to retrieve metrics for

**Returns:**
- Class performance metrics including:
  - Academic metrics (average grade, passing rate, highest/lowest grades)
  - Attendance metrics (attendance rate, present/absent/late/excused counts)
  - Participation metrics (participation rate, active/inactive students)
  - Activity metrics (completion rate, completed/total activities)
  - Assessment metrics (completion rate, completed/total assessments)
  - Time metrics (average/total learning time)

**Authorization:**
- User must be authenticated as a teacher
- Teacher must be assigned to the requested class

**Example Usage:**
```typescript
const { data: classMetrics, isLoading } = api.teacher.getClassMetrics.useQuery(
  { classId },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

### getRecentClassActivities

Retrieves the most recent activities for a specific class.

```typescript
api.teacher.getRecentClassActivities.useQuery({ 
  classId: string,
  limit?: number // Default: 5, Max: 100
})
```

**Input:**
- `classId`: The ID of the class to retrieve activities for
- `limit`: (Optional) The maximum number of activities to return (default: 5, max: 100)

**Returns:**
- List of recent activities including:
  - Activity details (title, description, type, etc.)
  - Subject information
  - Topic information
  - Count of activity grades

**Authorization:**
- User must be authenticated as a teacher
- Teacher must be assigned to the requested class

**Example Usage:**
```typescript
const { data: recentActivities, isLoading } = api.teacher.getRecentClassActivities.useQuery(
  { classId, limit: 5 },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

### getUpcomingClassAssessments

Retrieves upcoming assessments for a specific class.

```typescript
api.teacher.getUpcomingClassAssessments.useQuery({ 
  classId: string,
  limit?: number // Default: 5, Max: 100
})
```

**Input:**
- `classId`: The ID of the class to retrieve assessments for
- `limit`: (Optional) The maximum number of assessments to return (default: 5, max: 100)

**Returns:**
- List of upcoming assessments including:
  - Assessment details (title, description, type, due date, etc.)
  - Subject information
  - Count of submissions

**Authorization:**
- User must be authenticated as a teacher
- Teacher must be assigned to the requested class

**Example Usage:**
```typescript
const { data: upcomingAssessments, isLoading } = api.teacher.getUpcomingClassAssessments.useQuery(
  { classId, limit: 5 },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

## Other Teacher Procedures

### getClassActivities

Retrieves activities for a specific class with pagination support.

```typescript
api.teacher.getClassActivities.useQuery({ 
  classId: string,
  subjectId?: string,
  limit?: number, // Default: 50, Max: 100
  cursor?: string
})
```

### getClassLessonPlans

Retrieves lesson plans for a specific class.

```typescript
api.teacher.getClassLessonPlans.useQuery({ classId: string })
```

### getClassStudents

Retrieves students enrolled in a specific class.

```typescript
api.teacher.getClassStudents.useQuery({ classId: string })
```

### getTeacherById

Retrieves detailed information about a specific teacher.

```typescript
api.teacher.getTeacherById.useQuery({ id: string })
```

### getTeacherClasses

Retrieves classes assigned to a specific teacher.

```typescript
api.teacher.getTeacherClasses.useQuery({ teacherId: string })
```
