# Academic Cycle Structure in Aivy LXP

## Table of Contents

1. [Introduction](#introduction)
2. [Academic Structure Hierarchy](#academic-structure-hierarchy)
3. [Core Components](#core-components)
   - [Academic Cycle](#academic-cycle)
   - [Terms](#terms)
   - [Classes](#classes)
   - [Schedule Patterns](#schedule-patterns)
4. [Business Rules and Logic](#business-rules-and-logic)
5. [Role-Based Access Control](#role-based-access-control)
6. [Implementation Flow](#implementation-flow)
7. [Use Cases](#use-cases)
8. [Integration Points](#integration-points)
9. [Best Practices](#best-practices)

## Introduction

The Academic Cycle structure in Aivy LXP provides a comprehensive framework for organizing educational activities across time. This document outlines the hierarchical components, their relationships, business rules, and implementation strategies to effectively manage different academic systems including annual, semester, trimester, quarter, and custom approaches.

This flexible structure allows educational institutions to configure their preferred academic calendar while maintaining a consistent approach to scheduling, assessment, attendance tracking, and reporting.

## Academic Structure Hierarchy

```
Institution
│
└── Academic Cycles
    │
    ├── Terms (with TermType and TermPeriod)
    │   │
    │   ├── Classes
    │   │   │
    │   │   ├── Timetables
    │   │   │   │
    │   │   │   └── TimetablePeriods (specific scheduled sessions)
    │   │   │
    │   │   ├── Assessments
    │   │   │   │
    │   │   │   └── AssessmentSubmissions
    │   │   │
    │   │   └── Activities
    │   │
    │   └── SchedulePatterns (define recurring class schedules)
    │
    ├── Calendar Events (institution-wide events)
    │
    └── Holidays (non-instructional days)
```

## Core Components

### Academic Cycle

The Academic Cycle serves as the top-level container for organizing educational activities across a specific period.

**Key Attributes:**
- **ID**: Unique identifier
- **Code**: Unique code for the cycle (must be unique across the system)
- **Name**: Descriptive name (e.g., "2023-2024" or "Spring 2024 Short Course")
- **Description**: Optional detailed description
- **Start Date**: Beginning of the academic cycle
- **End Date**: End of the academic cycle
- **Type**: Type of cycle (ANNUAL, SEMESTER, TRIMESTER, QUARTER, CUSTOM)
- **Duration**: Duration in months (calculated automatically)
- **Status**: ACTIVE, INACTIVE, ARCHIVED, DELETED
- **Institution ID**: Reference to parent institution
- **Created By**: User who created the cycle
- **Updated By**: User who last updated the cycle

**Relationships:**
- **Many-to-One with Institution**: Each cycle belongs to one institution
- **One-to-Many with Terms**: A cycle contains multiple terms
- **One-to-Many with Calendar Events**: Academic events within the cycle
- **One-to-Many with Holidays**: Holidays within the cycle
- **Many-to-One with User (Creator)**: Tracks who created the cycle
- **Many-to-One with User (Updater)**: Tracks who last updated the cycle

**Database Indexes:**
- `[institutionId, startDate, endDate]`: For efficient date-based queries
- `[institutionId, status]`: For filtering active cycles by institution
- `[code]`: For unique code lookups
- `[type, status]`: For filtering by type and status

### Terms

Terms represent major divisions within an academic cycle, with specific type and period information.

**Key Attributes:**
- **ID**: Unique identifier
- **Code**: Unique code for the term
- **Name**: Descriptive name (e.g., "Fall 2023")
- **Description**: Optional detailed description
- **TermType**: Type of term (SEMESTER, TRIMESTER, QUARTER, THEME_BASED, CUSTOM)
- **TermPeriod**: Specific period within the type:
  - For SEMESTER: FALL, SPRING, SUMMER, WINTER
  - For TRIMESTER: FIRST_TRIMESTER, SECOND_TRIMESTER, THIRD_TRIMESTER
  - For QUARTER: FIRST_QUARTER, SECOND_QUARTER, THIRD_QUARTER, FOURTH_QUARTER
  - For THEME_BASED: THEME_UNIT
- **Start Date**: Beginning of the term
- **End Date**: End of the term
- **Course ID**: Reference to associated course
- **Academic Cycle ID**: Reference to parent academic cycle
- **Status**: ACTIVE, INACTIVE, ARCHIVED, DELETED
- **Schedule Pattern ID**: Optional reference to a recurring schedule pattern

**Relationships:**
- **Many-to-One with Academic Cycle**: Each term belongs to one academic cycle
- **Many-to-One with Course**: Each term is associated with a course
- **One-to-Many with Classes**: Classes are assigned to specific terms
- **One-to-Many with Assessments**: Term-based assessment planning
- **One-to-Many with Facility Schedules**: Term-specific facility scheduling
- **One-to-Many with Grade Books**: Term-based grade management
- **Many-to-One with Schedule Pattern**: Optional association with a recurring schedule

**Database Indexes:**
- `[courseId, code]`: For efficient course-specific term lookups
- `[courseId, status]`: For filtering active terms by course
- `[academicCycleId]`: For finding terms within a cycle
- `[termType, termPeriod]`: For filtering by term type and period

### Classes

Classes represent specific course offerings within a term.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Class name
- **Description**: Detailed description
- **Course Campus ID**: Reference to the campus-specific course offering
- **Term ID**: Reference to the term when the class is offered
- **Program Campus ID**: Optional reference to the program-campus association
- **Start Date**: Start date for the class
- **End Date**: End date for the class
- **Status**: Status of the class (ACTIVE, COMPLETED, etc.)

**Relationships:**
- **Many-to-One with Term**: Each class belongs to a specific term
- **Many-to-One with Course Campus**: Each class is an instance of a course at a specific campus
- **Many-to-One with Program Campus**: Optional association with a program at a specific campus
- **One-to-Many with Timetables**: Class-specific schedules
- **One-to-Many with Assessments**: Assessments assigned to the class
- **One-to-Many with Activities**: Activities associated with the class
- **Many-to-Many with Students**: Students enrolled in the class
- **Many-to-Many with Teachers**: Teachers assigned to the class

### Schedule Patterns

Schedule Patterns define recurring meeting patterns for classes and terms.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Pattern name
- **Description**: Optional description
- **Days of Week**: Array of days when sessions occur
- **Start Time**: Beginning time for sessions
- **End Time**: Ending time for sessions
- **Recurrence Type**: Type of recurrence (WEEKLY, BIWEEKLY, etc.)
- **Start Date**: Beginning of the pattern
- **End Date**: Optional end of the pattern

**Relationships:**
- **One-to-Many with Terms**: Patterns can be applied to multiple terms
- **One-to-Many with Schedule Exceptions**: Exceptions to the regular pattern

## Business Rules and Logic

The academic cycle implementation enforces several business rules to ensure data integrity and proper educational planning:

### 1. Cycle Creation and Validation

- **Date Validation**: Start date must be before end date
- **Type Validation**: Type must be one of the predefined types (ANNUAL, SEMESTER, TRIMESTER, QUARTER, CUSTOM)
- **Duration Calculation**: Duration is automatically calculated in months based on start and end dates
- **Overlap Prevention**: Active academic cycles cannot overlap within the same institution
- **Code Uniqueness**: Each academic cycle must have a unique code

```typescript
// Date validation
if (data.startDate >= data.endDate) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Start date must be before end date"
  });
}

// Type validation
if (!this.validateType(data.type)) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
  });
}

// Duration calculation
const durationInMonths = Math.ceil(
  (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
);

// Overlap prevention
const overlappingCycle = await this.prisma.academicCycle.findFirst({
  where: {
    institutionId: data.institutionId,
    status: "ACTIVE",
    OR: [
      {
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate }
      }
    ]
  }
});

if (overlappingCycle) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Date range overlaps with an existing academic cycle"
  });
}
```

### 2. Cycle Retrieval and Filtering

- **Current Cycle**: The system can identify the current active cycle based on the current date
- **Date Range Filtering**: Cycles can be filtered by date ranges
- **Type Filtering**: Cycles can be filtered by type
- **Status Filtering**: Cycles can be filtered by status

```typescript
// Get current cycle
async getCurrentAcademicCycle(institutionId: string) {
  const now = new Date();
  
  return this.prisma.academicCycle.findFirst({
    where: {
      institutionId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now }
    },
    include: academicCycleInclude
  });
}

// Get cycles by date range
async getAcademicCyclesByDateRange(params: {
  institutionId: string;
  startDate: Date;
  endDate: Date;
  type?: AcademicCycleType;
}) {
  // Validate type if provided
  if (params.type && !this.validateType(params.type)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
    });
  }

  return this.prisma.academicCycle.findMany({
    where: {
      institutionId: params.institutionId,
      status: "ACTIVE",
      startDate: { lte: params.endDate },
      endDate: { gte: params.startDate },
      ...(params.type && { type: params.type })
    },
    include: academicCycleInclude,
    orderBy: { startDate: 'asc' }
  });
}
```

### 3. Cycle Updates and Deletion

- **Audit Trail**: All changes are tracked with updatedBy and updatedAt fields
- **Term Dependency**: Cycles with active terms cannot be deleted
- **Status Management**: Cycles can be archived rather than deleted to preserve historical data

### 4. Term Management

- **Term Type Validation**: Terms must have a valid TermType
- **Term Period Validation**: Term periods must be appropriate for the selected term type
- **Date Containment**: Term dates must fall within the parent academic cycle dates
- **Course Association**: Each term must be associated with a course

## Role-Based Access Control

The academic cycle implementation includes a comprehensive role-based access control system:

### Permission Types

```typescript
export const ACADEMIC_CYCLE_PERMISSIONS = {
  // Institution Level
  MANAGE_ACADEMIC_CYCLES: 'academic_cycle.manage',
  VIEW_ALL_ACADEMIC_CYCLES: 'academic_cycle.view.all',
  
  // Campus Level
  MANAGE_CAMPUS_ACADEMIC_CYCLES: 'academic_cycle.campus.manage',
  VIEW_CAMPUS_ACADEMIC_CYCLES: 'academic_cycle.campus.view',
  
  // Class Level
  VIEW_CLASS_ACADEMIC_CYCLES: 'academic_cycle.class.view',
};
```

### Role-Permission Mapping

```typescript
export const ROLE_PERMISSIONS = {
  // System Level
  SYSTEM_ADMIN: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES,
  ],
  
  // Institution Level
  ADMINISTRATOR: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES,
  ],

  // Campus Level
  CAMPUS_ADMIN: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_CAMPUS_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ],
  
  CAMPUS_COORDINATOR: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ],
  
  // Academic Roles
  TEACHER: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ],
  
  // Student Roles
  STUDENT: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ],
};
```

### Access Control Implementation

The system implements access control at the service level:

```typescript
async listAcademicCycles(params: {
  institutionId: string;
  campusId?: string;
  userId: string;
  userType: UserType;
}) {
  const { institutionId, campusId, userId, userType } = params;

  // Check permissions based on role
  if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES)) {
    // Institution admin can view all cycles
    return this.prisma.academicCycle.findMany({
      where: { institutionId },
      include: { terms: true },
    });
  }

  if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES)) {
    // Campus admin/coordinator can view campus-specific cycles
    return this.prisma.academicCycle.findMany({
      where: {
        institutionId,
        terms: {
          some: {
            classes: {
              some: {
                courseCampus: {
                  campusId,
                },
              },
            },
          },
        },
        include: { terms: true },
      });
    }
  }

  // Teachers and students can view cycles related to their classes
  if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES)) {
    const userClasses = await this.getUserClasses(userId, userType);
    return this.prisma.academicCycle.findMany({
      where: {
        terms: {
          some: {
            classes: {
              some: {
                id: { in: userClasses.map(c => c.id) },
              },
            },
          },
        },
        include: { terms: true },
      });
    }
  }

  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

## Implementation Flow

The implementation flow for academic structures follows these steps:

1. **Define Academic Cycle**:
   - Create a new academic cycle with start and end dates
   - Define the type, name, and status
   - Calculate the duration automatically

2. **Configure Terms**:
   - Create terms based on the institution's preferred system (semesters, trimesters, etc.)
   - Define term types and periods
   - Set start and end dates for each term
   - Assign terms to the academic cycle and associated courses

3. **Set Up Calendar Elements**:
   - Define holidays that affect the academic calendar
   - Create academic events (registration, exams, etc.)
   - Assign these to appropriate academic cycles

4. **Create Classes**:
   - Set up classes for courses offered during specific terms
   - Define class-specific details (teachers, capacity, etc.)
   - Assign classes to appropriate terms and campus-specific programs

5. **Establish Schedules**:
   - Create schedule patterns for recurring class meetings
   - Set up timetables associated with classes and terms
   - Generate timetable periods based on patterns and calendar constraints

6. **Plan Assessments and Activities**:
   - Create assessments for classes within terms
   - Define activities to structure the learning process
   - Align these with terms and calendar events

## Use Cases

### Case 1: University Using Semester System

**Academic Cycle**: 2023-2024 (August 2023 - May 2024)
- Type: ANNUAL
- Duration: 10 months (calculated automatically)

**Terms**:
- Fall Semester (August 15, 2023 - December 20, 2023)
  - TermType: SEMESTER
  - TermPeriod: FALL
- Spring Semester (January 10, 2024 - May 15, 2024)
  - TermType: SEMESTER
  - TermPeriod: SPRING

**Classes**: Multiple classes assigned to each term
- Each with timetables, assessments, and activities
- Scheduled around holidays and academic events

**Access Control**:
- Institution administrators can manage and view all cycles
- Campus administrators can manage campus-specific cycles
- Teachers can view cycles related to their classes
- Students can view cycles related to their enrolled classes

### Case 2: School Using Trimester System

**Academic Cycle**: 2023-2024 (August 2023 - June 2024)
- Type: ANNUAL
- Duration: 11 months (calculated automatically)

**Terms**:
- Fall Trimester (August 25, 2023 - November 20, 2023)
  - TermType: TRIMESTER
  - TermPeriod: FIRST_TRIMESTER
- Winter Trimester (November 27, 2023 - March 8, 2024)
  - TermType: TRIMESTER
  - TermPeriod: SECOND_TRIMESTER
- Spring Trimester (March 18, 2024 - June 10, 2024)
  - TermType: TRIMESTER
  - TermPeriod: THIRD_TRIMESTER

### Case 3: Short Course Using Custom Cycle

**Academic Cycle**: Spring Bootcamp 2024 (March 1, 2024 - April 30, 2024)
- Type: CUSTOM
- Duration: 2 months (calculated automatically)

**Terms**:
- Bootcamp Term (March 1, 2024 - April 30, 2024)
  - TermType: CUSTOM
  - TermPeriod: THEME_UNIT

## Integration Points

The academic structure integrates with several other system components:

### 1. Calendar Management
- Holidays and academic events appear on calendars
- Timetable periods show on user schedules
- Provides conflict detection and resolution

### 2. Attendance Tracking
- Timetable periods serve as the basis for attendance records
- Holidays are excluded from attendance calculations
- Terms provide context for attendance reporting

### 3. Assessment and Grading
- Assessments are associated with classes within terms
- Term structure enables period-specific grading policies
- Grade books are organized by terms

### 4. Reporting and Analytics
- Academic cycle and term structure provides time-based reporting
- Comparisons can be made across terms and academic cycles
- Attendance, assessment, and activity data can be aggregated by term

### 5. User Scheduling
- Teacher and student schedules are based on timetable periods
- Facility scheduling respects academic calendar constraints
- Schedule conflicts are prevented based on calendar rules

## Best Practices

1. **Planning Ahead**:
   - Define the entire academic cycle structure before the cycle begins
   - Set up terms and major events in advance
   - Consider the appropriate cycle type for your institution's needs

2. **Calendar Consistency**:
   - Maintain consistent naming conventions for terms
   - Ensure date ranges don't overlap inappropriately
   - Document any special cases or exceptions

3. **Flexible Implementation**:
   - Choose the term type system that best fits the institution
   - Use the appropriate term periods for your educational context
   - Consider the relationship between terms and courses

4. **Access Control**:
   - Implement proper role-based access control
   - Ensure users can only access cycles relevant to their role
   - Maintain audit trails for all changes

5. **Performance Optimization**:
   - Use the provided database indexes for efficient queries
   - Consider the impact of large date range queries
   - Implement pagination for listing large numbers of cycles

By following these guidelines and understanding the complete academic structure, administrators can effectively manage complex educational calendars while supporting teaching, learning, and reporting needs. 