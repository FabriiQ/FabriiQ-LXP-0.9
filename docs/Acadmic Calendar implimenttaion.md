# Calendar Management Implementation Plan for Aivy LXP

## Table of Contents

1. [Current System Analysis](#current-system-analysis) ✅
2. [Proposed Calendar Features](#proposed-calendar-features) ✅
3. [Schema Changes](#schema-changes) ✅
4. [API Layer Implementation](#api-layer-implementation) ✅
5. [Frontend Implementation](#frontend-implementation) 🚧
6. [Business Logic Impacts](#business-logic-impacts) 🚧
7. [Implementation Strategy](#implementation-strategy) 🚧
8. [Testing Strategy](#testing-strategy) 🚧
9. [Integration Points](#integration-points) 🚧
10. [Performance Considerations](#performance-considerations) 🚧

## Completed Tasks

### Schema Changes ✅

#### Core Models

```prisma
model AcademicCycle {
  id              String       @id @default(cuid())
  code            String       @unique
  name            String
  description     String?
  startDate       DateTime
  endDate         DateTime
  status          SystemStatus @default(ACTIVE)
  institutionId   String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  institution     Institution  @relation(fields: [institutionId], references: [id])
  terms           Term[]
  calendarEvents  AcademicCalendarEvent[]

  @@index([institutionId, startDate, endDate])
  @@map("academic_cycles")
}

model Term {
  id                String                @id @default(cuid())
  code              String                @unique
  name              String
  description       String?
  termType          TermType              @default(SEMESTER)
  termPeriod        TermPeriod            @default(FALL)
  startDate         DateTime
  endDate           DateTime
  courseId          String
  academicCycleId   String
  status            SystemStatus          @default(ACTIVE)
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  deletedAt         DateTime?
  course            Course                @relation(fields: [courseId], references: [id])
  academicCycle     AcademicCycle         @relation(fields: [academicCycleId], references: [id])
  classes           Class[]
  assessments       Assessment[]
  facilitySchedules FacilitySchedule[]
  gradeBooks        GradeBook[]
  teacherSchedules  TeacherSchedule[]
  schedulePatternId String?
  schedulePattern   SchedulePattern?      @relation(fields: [schedulePatternId], references: [id])

  @@index([academicCycleId])
  @@index([courseId])
  @@index([termType, termPeriod])
  @@map("terms")
}

model Holiday {
  id          String       @id @default(cuid())
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  type        HolidayType
  affectsAll  Boolean      @default(true)
  campuses    Campus[]     // Many-to-many relationship
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@map("holidays")
}

model AcademicCalendarEvent {
  id               String                @id @default(cuid())
  name             String
  description      String?
  startDate        DateTime
  endDate          DateTime
  type             AcademicEventType
  academicPeriodId String?
  academicPeriod   AcademicPeriod?       @relation(fields: [academicPeriodId], references: [id])
  campusId         String?
  campus           Campus?               @relation(fields: [campusId], references: [id])
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
  
  @@map("academic_calendar_events")
}

model SchedulePattern {
  id           String               @id @default(cuid())
  name         String
  description  String?
  daysOfWeek   DayOfWeek[]
  startTime    String               // Time in HH:MM format
  endTime      String               // Time in HH:MM format
  recurrence   RecurrenceType       @default(WEEKLY)
  startDate    DateTime
  endDate      DateTime?
  timetables   Timetable[]
  exceptions   ScheduleException[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  
  @@map("schedule_patterns")
}

model ScheduleException {
  id                String           @id @default(cuid())
  schedulePatternId String
  schedulePattern   SchedulePattern  @relation(fields: [schedulePatternId], references: [id])
  exceptionDate     DateTime
  reason            String?
  alternativeDate   DateTime?
  alternativeStart  String?          // Time in HH:MM format
  alternativeEnd    String?          // Time in HH:MM format
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  @@map("schedule_exceptions")
}

enum RecurrenceType {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

model AcademicCycleTemplate {
  id                 String               @id @default(cuid())
  name               String
  description        String?
  periodStructure    AcademicPeriodType[]
  defaultPeriodDays  Int[]                // Duration of each period in days
  defaultHolidays    HolidayTemplate[]
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  
  @@map("academic_cycle_templates")
}

model HolidayTemplate {
  id                    String                 @id @default(cuid())
  name                  String
  description           String?
  dayOffset             Int                    // Days from academic cycle start
  duration              Int                    // Number of days
  type                  HolidayType
  academicCycleTemplateId String?
  academicCycleTemplate  AcademicCycleTemplate?  @relation(fields: [academicCycleTemplateId], references: [id])
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  
  @@map("holiday_templates")
}
```

### API Layer Implementation ✅

#### New Services

1. **AcademicCycleService**
   - CRUD operations for academic cycles
   - Validation for date ranges and overlapping cycles
   - Methods for getting current cycle and cycles by date range
   - Integration with calendar events and terms

2. **CalendarReportService**
   - Generate monthly calendar reports
   - Generate term calendar reports
   - Calculate working days excluding holidays
   - Group events and holidays by type

#### New Routers

1. **AcademicCycleRouter**
   - Protected endpoints for CRUD operations
   - Authorization checks for admin operations
   - Input validation using Zod schemas
   - Support for pagination and filtering

## Remaining Tasks

### Frontend Implementation 🚧
1. Calendar Components
   - [ ] Base Calendar component with different views (month, week, day)
   - [ ] Holiday management components
   - [ ] Academic event management components
   - [ ] Schedule pattern management components
   - [ ] Calendar visualization components

2. Forms and Dialogs
   - [ ] Holiday creation/edit form
   - [ ] Academic event creation/edit form
   - [ ] Schedule pattern creation/edit form
   - [ ] Schedule exception creation/edit form

3. Calendar Views
   - [ ] Year view for academic planning
   - [ ] Month view for detailed planning
   - [ ] Week view for scheduling
   - [ ] Day view for detailed scheduling

4. Role-Based Views
   - [ ] Admin view for system-wide planning
   - [ ] Teacher view for class scheduling
   - [ ] Student view for class attendance

### Business Logic Impacts 🚧
1. Attendance System
   - [ ] Update attendance calculation to exclude holidays
   - [ ] Handle class cancellations due to events
   - [ ] Update attendance reports

2. Scheduling System
   - [ ] Integrate schedule patterns with timetable generation
   - [ ] Handle schedule exceptions
   - [ ] Update conflict detection

3. Notification System
   - [ ] Add notifications for upcoming events
   - [ ] Add notifications for schedule changes
   - [ ] Add notifications for holiday reminders

### Implementation Strategy 🚧
1. Phase 1: Core Calendar Features
   - [ ] Basic calendar views
   - [ ] Holiday management
   - [ ] Academic event management

2. Phase 2: Advanced Features
   - [ ] Schedule pattern implementation
   - [ ] Integration with attendance system
   - [ ] Integration with notification system

3. Phase 3: Optimization and Enhancement
   - [ ] Performance optimization
   - [ ] UI/UX improvements
   - [ ] Additional features based on feedback

### Testing Strategy 🚧
1. Unit Tests
   - [ ] Service layer tests
   - [ ] Router tests
   - [ ] Permission system tests

2. Integration Tests
   - [ ] Calendar feature integration tests
   - [ ] System integration tests

3. UI Tests
   - [ ] Component tests
   - [ ] End-to-end tests

### Integration Points 🚧
1. Attendance System
   - [ ] Update attendance calculation logic
   - [ ] Modify attendance reports

2. Notification System
   - [ ] Add calendar event notifications
   - [ ] Add schedule change notifications

3. Reporting System
   - [ ] Add calendar data to reports
   - [ ] Create new calendar-specific reports

### Performance Considerations 🚧
1. Database Optimization
   - [ ] Review and optimize indexes
   - [ ] Implement caching where appropriate

2. Frontend Optimization
   - [ ] Implement lazy loading for calendar views
   - [ ] Optimize calendar rendering

3. API Optimization
   - [ ] Implement pagination for large datasets
   - [ ] Optimize query performance

## Current System Analysis

### Existing Calendar-Related Models

The current system includes the following calendar-related models:

1. **AcademicCycle**
   - Represents a full academic cycle (e.g., "2023-2028")
   - Contains start and end dates
   - Has a one-to-many relationship with Terms

2. **Term**
   - Represents major divisions within an academic cycle
   - Enhanced with TermType (SEMESTER, TRIMESTER, QUARTER, THEME_BASED, CUSTOM)
   - Includes TermPeriod (FALL, SPRING, SUMMER, WINTER, etc.)
   - Contains start and end dates
   - Belongs to an AcademicCycle and a Course
   - Supports various academic period systems through type and period enums

3. **Timetable**
   - Represents a schedule container
   - Has a one-to-many relationship with TimetablePeriod
   - Currently lacks integration with holidays and academic events
   - Does not support recurring schedules efficiently

4. **TimetablePeriod**
   - Represents individual scheduled periods
   - Contains day of week, start time, end time
   - Links to subjects, teachers, and facilities
   - Currently requires manual creation for each occurrence

5. **TeacherSchedule** and **TeacherSchedulePeriod**
   - Teacher-specific scheduling

6. **FacilitySchedule** and **FacilitySchedulePeriod**
   - Facility-specific scheduling

### Term Type Implementation

The system now supports various academic period systems through the Term model's type and period fields:

```prisma
enum TermType {
  SEMESTER
  TRIMESTER
  QUARTER
  THEME_BASED
  CUSTOM
}

enum TermPeriod {
  FALL
  SPRING
  SUMMER
  WINTER
  FIRST_QUARTER
  SECOND_QUARTER
  THIRD_QUARTER
  FOURTH_QUARTER
  FIRST_TRIMESTER
  SECOND_TRIMESTER
  THIRD_TRIMESTER
  THEME_UNIT
}

model Term {
  id                String                @id @default(cuid())
  code              String                @unique
  name              String
  description       String?
  termType          TermType              @default(SEMESTER)
  termPeriod        TermPeriod            @default(FALL)
  startDate         DateTime
  endDate           DateTime
  courseId          String
  academicCycleId   String
  status            SystemStatus          @default(ACTIVE)
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  deletedAt         DateTime?
  
  // Relations
  course            Course                @relation(fields: [courseId], references: [id])
  academicCycle     AcademicCycle         @relation(fields: [academicCycleId], references: [id])
  classes           Class[]
  assessments       Assessment[]
  facilitySchedules FacilitySchedule[]
  gradeBooks        GradeBook[]
  teacherSchedules  TeacherSchedule[]

  @@index([academicCycleId])
  @@index([courseId])
  @@index([termType, termPeriod])
}
```

### Term Type Validation Rules

1. **Semester System**:
   - When `termType` is SEMESTER:
     - Valid periods: FALL, SPRING, SUMMER, WINTER
     - Typical duration: 15-18 weeks

2. **Trimester System**:
   - When `termType` is TRIMESTER:
     - Valid periods: FIRST_TRIMESTER, SECOND_TRIMESTER, THIRD_TRIMESTER
     - Typical duration: 12-13 weeks

3. **Quarter System**:
   - When `termType` is QUARTER:
     - Valid periods: FIRST_QUARTER, SECOND_QUARTER, THIRD_QUARTER, FOURTH_QUARTER
     - Typical duration: 10-11 weeks

4. **Theme-Based System**:
   - When `termType` is THEME_BASED:
     - Valid period: THEME_UNIT
     - Flexible duration

5. **Custom System**:
   - When `termType` is CUSTOM:
     - Any period is valid
     - Flexible duration

### Implementation Considerations

1. **Data Migration**:
   - Existing terms have been migrated to use the new type and period fields
   - Migration script handles the conversion based on naming patterns and dates
   - Backup of old data is maintained for reference

2. **Validation Logic**:
   - Service layer enforces valid type-period combinations
   - Frontend provides appropriate period options based on selected type
   - Database constraints ensure data integrity

3. **UI/UX Updates**:
   - Term creation/edit forms updated to include type and period selection
   - Type selection affects available period options
   - Calendar views reflect the new structure

4. **API Changes**:
   - Term endpoints updated to handle type and period fields
   - Additional validation for type-period combinations
   - Documentation updated to reflect new fields

5. **Reporting Impact**:
   - Reports now use term type and period for better categorization
   - Historical data analysis considers the new term structure
   - Improved filtering and grouping capabilities

### Limitations of Current Implementation

The current implementation lacks:

1. **Holiday Management**
   - No way to define holidays or non-instructional days
   - No way to exclude holidays from scheduling

2. **Academic Calendar Events**
   - No structured way to define important academic events
   - No way to visualize the academic calendar

3. **Recurring Schedule Patterns**
   - Limited support for defining recurring patterns
   - No way to handle exceptions to recurring patterns
   - Manual and error-prone timetable period creation
   - Difficult to reschedule or update multiple related timetable periods

4. **Calendar Visualization**
   - No dedicated calendar views for different stakeholders
   - No integrated view of timetables, holidays, and academic events
   - No easy way to identify scheduling conflicts

5. **Integration with Attendance**
   - No systematic way to exclude holidays from attendance calculations
   - No way to handle class cancellations due to events

6. **Notification System**
   - No automated notifications for calendar events
   - No reminders for upcoming deadlines or schedule changes

## Proposed Calendar Features

### Holiday Management

1. **Holiday Definition**
   - Define holidays with name, description, date range
   - Categorize holidays (national, religious, institutional)
   - Specify which campuses are affected

2. **Holiday Visualization**
   - Display holidays on calendars
   - Filter holidays by type or campus

### Academic Calendar Events

1. **Event Definition**
   - Define academic events with name, description, date range
   - Categorize events (registration, exams, orientation, etc.)
   - Link events to academic periods and campuses

2. **Event Visualization**
   - Display events on calendars
   - Filter events by type, academic period, or campus

### Schedule Patterns

1. **Pattern Definition**
   - Define recurring patterns (weekly, biweekly, etc.)
   - Specify days of week and time ranges
   - Set start and end dates for patterns

2. **Exception Handling**
   - Define exceptions to patterns
   - Reschedule or cancel specific occurrences

### Calendar Visualization

1. **Multiple Views**
   - Year view for academic planning
   - Month view for detailed planning
   - Week view for scheduling
   - Day view for detailed scheduling

2. **Role-Based Views**
   - Admin view for system-wide planning
   - Teacher view for class scheduling
   - Student view for class attendance

## Schema Changes

### New Models

```prisma
model Holiday {
  id          String       @id @default(cuid())
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  type        HolidayType
  affectsAll  Boolean      @default(true)
  campuses    Campus[]     // Many-to-many relationship
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@map("holidays")
}

enum HolidayType {
  NATIONAL
  RELIGIOUS
  INSTITUTIONAL
  ADMINISTRATIVE
  WEATHER
  OTHER
}

model AcademicCalendarEvent {
  id               String                @id @default(cuid())
  name             String
  description      String?
  startDate        DateTime
  endDate          DateTime
  type             AcademicEventType
  academicPeriodId String?
  academicPeriod   AcademicPeriod?       @relation(fields: [academicPeriodId], references: [id])
  campusId         String?
  campus           Campus?               @relation(fields: [campusId], references: [id])
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
  
  @@map("academic_calendar_events")
}

enum AcademicEventType {
  REGISTRATION
  ADD_DROP
  WITHDRAWAL
  EXAMINATION
  GRADING
  ORIENTATION
  GRADUATION
  OTHER
}

model SchedulePattern {
  id           String               @id @default(cuid())
  name         String
  description  String?
  daysOfWeek   DayOfWeek[]
  startTime    String               // Time in HH:MM format
  endTime      String               // Time in HH:MM format
  recurrence   RecurrenceType       @default(WEEKLY)
  startDate    DateTime
  endDate      DateTime?
  timetables   Timetable[]
  exceptions   ScheduleException[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  
  @@map("schedule_patterns")
}

model ScheduleException {
  id                String           @id @default(cuid())
  schedulePatternId String
  schedulePattern   SchedulePattern  @relation(fields: [schedulePatternId], references: [id])
  exceptionDate     DateTime
  reason            String?
  alternativeDate   DateTime?
  alternativeStart  String?          // Time in HH:MM format
  alternativeEnd    String?          // Time in HH:MM format
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  @@map("schedule_exceptions")
}

enum RecurrenceType {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

model AcademicCycleTemplate {
  id                 String               @id @default(cuid())
  name               String
  description        String?
  periodStructure    AcademicPeriodType[]
  defaultPeriodDays  Int[]                // Duration of each period in days
  defaultHolidays    HolidayTemplate[]
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  
  @@map("academic_cycle_templates")
}

model HolidayTemplate {
  id                    String                 @id @default(cuid())
  name                  String
  description           String?
  dayOffset             Int                    // Days from academic cycle start
  duration              Int                    // Number of days
  type                  HolidayType
  academicCycleTemplateId String?
  academicCycleTemplate  AcademicCycleTemplate?  @relation(fields: [academicCycleTemplateId], references: [id])
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  
  @@map("holiday_templates")
}
```

### Relationship Updates

1. **Campus Model**
   - Add relation to Holiday model
   - Add relation to AcademicCalendarEvent model

```prisma
model Campus {
  // Existing fields...
  holidays          Holiday[]
  calendarEvents    AcademicCalendarEvent[]
}
```

2. **AcademicPeriod Model**
   - Add relation to AcademicCalendarEvent model

```prisma
model AcademicPeriod {
  // Existing fields...
  calendarEvents    AcademicCalendarEvent[]
}
```

3. **Timetable Model**
   - Add relation to SchedulePattern model

```prisma
model Timetable {
  // Existing fields...
  schedulePatternId String?
  schedulePattern   SchedulePattern? @relation(fields: [schedulePatternId], references: [id])
  periods           TimetablePeriod[]
}
```

4. **Class Model**
   - Add relations to Holiday and AcademicCalendarEvent models

```prisma
model Class {
  // Existing fields...
  holidays          Holiday[]              // Classes affected by specific holidays
  academicEvents    AcademicCalendarEvent[] // Class-specific events
}
```

### Timetable Model Updates

To support the Calendar Management system, we need to enhance the Timetable models:

```prisma
model Timetable {
  // Existing fields...
  schedulePatternId String?
  schedulePattern   SchedulePattern? @relation(fields: [schedulePatternId], references: [id])
  periods           TimetablePeriod[]
}

model TimetablePeriod {
  id            String                     @id @default(cuid())
  timetableId   String
  timetable     Timetable                 @relation(fields: [timetableId], references: [id])
  dayOfWeek     DayOfWeek
  date          DateTime                   // Specific date for this period
  startTime     String                    // Time in HH:MM format
  endTime       String                    // Time in HH:MM format
  status        TimetablePeriodStatus     @default(SCHEDULED)
  facilityId    String?
  facility      Facility?                 @relation(fields: [facilityId], references: [id])
  teacherId     String?
  teacher       User?                     @relation(fields: [teacherId], references: [id])
  cancellation  TimetablePeriodCancellation?
  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt
  
  @@index([date])
  @@index([facilityId, date])
  @@index([teacherId, date])
}

enum TimetablePeriodStatus {
  SCHEDULED
  CANCELLED
  COMPLETED
}

model TimetablePeriodCancellation {
  id                String            @id @default(cuid())
  timetablePeriodId String            @unique
  timetablePeriod   TimetablePeriod   @relation(fields: [timetablePeriodId], references: [id])
  reason            String
  cancelledAt       DateTime
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}
```

### Database Performance Optimization

Add appropriate indexes for date-based queries:

```prisma
model Holiday {
  // Fields...
  @@index([startDate, endDate])
}

model AcademicCalendarEvent {
  // Fields...
  @@index([startDate, endDate, academicPeriodId])
  @@index([startDate, endDate, campusId])
}

model SchedulePattern {
  // Fields...
  @@index([startDate, endDate])
}
```

### Academic Cycle Template System

```prisma
model AcademicCycleTemplate {
  id                 String               @id @default(cuid())
  name               String
  description        String?
  periodStructure    AcademicPeriodType[]
  defaultPeriodDays  Int[]                // Duration of each period in days
  defaultHolidays    HolidayTemplate[]
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  
  @@map("academic_cycle_templates")
}

model HolidayTemplate {
  id                    String                 @id @default(cuid())
  name                  String
  description           String?
  dayOffset             Int                    // Days from academic cycle start
  duration              Int                    // Number of days
  type                  HolidayType
  academicCycleTemplateId String?
  academicCycleTemplate  AcademicCycleTemplate?  @relation(fields: [academicCycleTemplateId], references: [id])
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  
  @@map("holiday_templates")
}
```

## API Layer Implementation

### New Routers

#### 1. Holiday Router

```typescript
// src/server/api/routers/holiday.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { HolidayService } from "../services/holiday.service";
import { SystemStatus, UserType } from "../constants";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createHolidaySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]),
  affectsAll: z.boolean().default(true),
  campusIds: z.array(z.string()).optional(),
});

const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]).optional(),
  affectsAll: z.boolean().optional(),
  campusIds: z.array(z.string()).optional(),
});

export const holidayRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createHolidaySchema)
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (
        ctx.session.userType !== UserType.SYSTEM_ADMIN &&
        ctx.session.userType !== UserType.SYSTEM_MANAGER &&
        ctx.session.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      
      const service = new HolidayService({ prisma: ctx.prisma });
      return service.createHoliday(input);
    }),
    
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const service = new HolidayService({ prisma: ctx.prisma });
      return service.getHoliday(input.id);
    }),
    
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]).optional(),
      campusId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const service = new HolidayService({ prisma: ctx.prisma });
      return service.listHolidays(input);
    }),
    
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateHolidaySchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (
        ctx.session.userType !== UserType.SYSTEM_ADMIN &&
        ctx.session.userType !== UserType.SYSTEM_MANAGER &&
        ctx.session.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      
      const service = new HolidayService({ prisma: ctx.prisma });
      return service.updateHoliday(input.id, input.data);
    }),
    
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (
        ctx.session.userType !== UserType.SYSTEM_ADMIN &&
        ctx.session.userType !== UserType.SYSTEM_MANAGER
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      
      const service = new HolidayService({ prisma: ctx.prisma });
      return service.deleteHoliday(input.id);
    }),
});
```

#### 2. Academic Calendar Event Router

```typescript
// src/server/api/routers/academicCalendarEvent.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AcademicCalendarService } from "../services/academicCalendar.service";
import { UserType } from "../constants";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(["REGISTRATION", "ADD_DROP", "WITHDRAWAL", "EXAMINATION", "GRADING", "ORIENTATION", "GRADUATION", "OTHER"]),
  academicPeriodId: z.string().optional(),
  campusId: z.string().optional(),
});

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["REGISTRATION", "ADD_DROP", "WITHDRAWAL", "EXAMINATION", "GRADING", "ORIENTATION", "GRADUATION", "OTHER"]).optional(),
  academicPeriodId: z.string().optional(),
  campusId: z.string().optional(),
});

export const academicCalendarEventRouter = createTRPCRouter({
  // Similar CRUD operations as the holiday router
  // ...
});
```

#### 3. Schedule Pattern Router

```typescript
// src/server/api/routers/schedulePattern.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ScheduleService } from "../services/schedule.service";
import { UserType } from "../constants";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createPatternSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  daysOfWeek: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),   // HH:MM format
  recurrence: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]).default("WEEKLY"),
  startDate: z.date(),
  endDate: z.date().optional(),
});

const createExceptionSchema = z.object({
  schedulePatternId: z.string(),
  exceptionDate: z.date(),
  reason: z.string().optional(),
  alternativeDate: z.date().optional(),
  alternativeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM format
  alternativeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),   // HH:MM format
});

export const schedulePatternRouter = createTRPCRouter({
  // CRUD operations for schedule patterns
  // ...
  
  // Operations for schedule exceptions
  // ...
  
  // Generate occurrences based on pattern
  generateOccurrences: protectedProcedure
    .input(z.object({
      patternId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      const service = new ScheduleService({ prisma: ctx.prisma });
      return service.generateOccurrences(input.patternId, input.startDate, input.endDate);
    }),
});
```

### New Services

#### 1. Holiday Service

```typescript
// src/server/api/services/holiday.service.ts
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface HolidayServiceContext {
  prisma: PrismaClient;
}

export class HolidayService {
  private prisma: PrismaClient;
  
  constructor({ prisma }: HolidayServiceContext) {
    this.prisma = prisma;
  }
  
  async createHoliday(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    type: string;
    affectsAll: boolean;
    campusIds?: string[];
  }) {
    // Validate date range
    if (data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }
    
    // Create holiday
    const holiday = await this.prisma.holiday.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type as any,
        affectsAll: data.affectsAll,
        // Connect campuses if provided
        ...(data.campusIds && data.campusIds.length > 0
          ? {
              campuses: {
                connect: data.campusIds.map(id => ({ id })),
              },
            }
          : {}),
      },
    });
    
    return holiday;
  }
  
  // Other methods for CRUD operations
  // ...
  
  // Method to check if a date is a holiday
  async isHoliday(date: Date, campusId?: string) {
    const count = await this.prisma.holiday.count({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
        OR: [
          { affectsAll: true },
          {
            campuses: {
              some: {
                id: campusId,
              },
            },
          },
        ],
      },
    });
    
    return count > 0;
  }
  
  // Method to get holidays in a date range
  async getHolidaysInRange(startDate: Date, endDate: Date, campusId?: string) {
    return this.prisma.holiday.findMany({
      where: {
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
            affectsAll: true,
          },
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
            campuses: {
              some: {
                id: campusId,
              },
            },
          },
        ],
      },
      include: {
        campuses: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  // Method to integrate with attendance tracking
  async calculateAttendanceWithHolidays(classId: string, startDate: Date, endDate: Date) {
    // Get class details
    const classDetails = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        campusId: true,
      },
    });
    
    if (!classDetails) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Class not found",
      });
    }
    
    // Get scheduled sessions
    const scheduledSessions = await this.prisma.timetablePeriod.findMany({
      where: {
        timetable: {
          classId,
        },
        dayOfWeek: {
          in: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        },
      },
    });
    
    // Generate all scheduled dates in the range
    const scheduledDates = this.generateScheduledDates(
      scheduledSessions,
      startDate,
      endDate
    );
    
    // Get holidays in the range
    const holidays = await this.getHolidaysInRange(
      startDate,
      endDate,
      classDetails.campusId
    );
    
    // Exclude holidays from scheduled dates
    const effectiveSchoolDays = scheduledDates.filter(date => 
      !holidays.some(holiday => 
        this.dateOverlaps(date, holiday.startDate, holiday.endDate)
      )
    );
    
    // Calculate attendance
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    // Process attendance statistics
    const attendanceStats = this.calculateAttendanceStatistics(
      attendanceRecords,
      effectiveSchoolDays
    );
    
    return {
      totalScheduledDays: scheduledDates.length,
      holidays: holidays.length,
      effectiveSchoolDays: effectiveSchoolDays.length,
      ...attendanceStats,
    };
  }
  
  // Helper method to check if a date overlaps with a date range
  private dateOverlaps(date: Date, startDate: Date, endDate: Date): boolean {
    const dateOnly = new Date(date.setHours(0, 0, 0, 0));
    const startOnly = new Date(startDate.setHours(0, 0, 0, 0));
    const endOnly = new Date(endDate.setHours(0, 0, 0, 0));
    
    return dateOnly >= startOnly && dateOnly <= endOnly;
  }
}
```

#### 2. Academic Calendar Service

```typescript
// src/server/api/services/academicCalendar.service.ts
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface AcademicCalendarServiceContext {
  prisma: PrismaClient;
}

export class AcademicCalendarService {
  private prisma: PrismaClient;
  
  constructor({ prisma }: AcademicCalendarServiceContext) {
    this.prisma = prisma;
  }
  
  // CRUD operations for academic calendar events
  // ...
  
  // Method to get events in a date range
  async getEventsInRange(startDate: Date, endDate: Date, options?: {
    academicPeriodId?: string;
    campusId?: string;
    type?: string;
  }) {
    return this.prisma.academicCalendarEvent.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(options?.academicPeriodId ? { academicPeriodId: options.academicPeriodId } : {}),
        ...(options?.campusId ? { campusId: options.campusId } : {}),
        ...(options?.type ? { type: options.type as any } : {}),
      },
      include: {
        academicPeriod: true,
        campus: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
  
  // Method to check for event conflicts
  async checkEventConflicts(startDate: Date, endDate: Date, options?: {
    academicPeriodId?: string;
    campusId?: string;
    excludeEventId?: string;
  }) {
    const conflicts = await this.prisma.academicCalendarEvent.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(options?.academicPeriodId ? { academicPeriodId: options.academicPeriodId } : {}),
        ...(options?.campusId ? { campusId: options.campusId } : {}),
        ...(options?.excludeEventId ? { id: { not: options.excludeEventId } } : {}),
      },
    });
    
    return conflicts;
  }

  // Method to integrate with notification system
  async sendEventNotifications(eventId: string) {
    const event = await this.prisma.academicCalendarEvent.findUnique({
      where: { id: eventId },
      include: {
        academicPeriod: true,
        campus: true,
      },
    });
    
    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Academic calendar event not found",
      });
    }
    
    // Determine which users should be notified based on event type and scope
    let userIds: string[] = [];
    
    if (event.campusId) {
      // Campus-specific event: notify users with access to this campus
      const campusUsers = await this.prisma.userCampusAccess.findMany({
        where: {
          campusId: event.campusId,
          status: "ACTIVE",
        },
        select: {
          userId: true,
        },
      });
      userIds = campusUsers.map(user => user.userId);
    } else {
      // System-wide event: notify all users
      const allUsers = await this.prisma.user.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });
      userIds = allUsers.map(user => user.id);
    }
    
    // Create notifications for each user
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.prisma.notification.create({
          data: {
            userId,
            title: `Academic Calendar: ${event.name}`,
            body: event.description || `Event scheduled from ${event.startDate.toLocaleDateString()} to ${event.endDate.toLocaleDateString()}`,
            type: "ACADEMIC_CALENDAR",
            priority: "NORMAL",
            status: "UNREAD",
          },
        })
      )
    );
    
    return notifications;
  }
}
```

#### 3. Schedule Service

```typescript
// src/server/api/services/schedule.service.ts
import { PrismaClient, DayOfWeek, RecurrenceType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { addDays, addWeeks, addMonths, isSameDay, format, parse } from "date-fns";

interface ScheduleServiceContext {
  prisma: PrismaClient;
}

export class ScheduleService {
  private prisma: PrismaClient;
  
  constructor({ prisma }: ScheduleServiceContext) {
    this.prisma = prisma;
  }
  
  // CRUD operations for schedule patterns and exceptions
  // ...
  
  // Method to generate occurrences based on a pattern
  async generateOccurrences(patternId: string, startDate: Date, endDate: Date) {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id: patternId },
      include: {
        exceptions: true,
      },
    });
    
    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }
    
    // Ensure pattern start date is not after the requested start date
    const effectiveStartDate = pattern.startDate > startDate ? pattern.startDate : startDate;
    
    // Ensure pattern end date (if any) is not before the requested end date
    const effectiveEndDate = pattern.endDate && pattern.endDate < endDate ? pattern.endDate : endDate;
    
    // Generate occurrences based on pattern
    const occurrences = [];
    let currentDate = new Date(effectiveStartDate);
    
    while (currentDate <= effectiveEndDate) {
      // Check if the current day of week is included in the pattern
      const currentDayOfWeek = this.getDayOfWeek(currentDate);
      if (pattern.daysOfWeek.includes(currentDayOfWeek)) {
        // Check if this date is not an exception
        const isException = pattern.exceptions.some(exception => 
          isSameDay(exception.exceptionDate, currentDate)
        );
        
        if (!isException) {
          // Add occurrence
          occurrences.push({
            date: new Date(currentDate),
            startTime: pattern.startTime,
            endTime: pattern.endTime,
          });
        } else {
          // Check if there's an alternative date
          const exception = pattern.exceptions.find(exception => 
            isSameDay(exception.exceptionDate, currentDate)
          );
          
          if (exception?.alternativeDate) {
            occurrences.push({
              date: new Date(exception.alternativeDate),
              startTime: exception.alternativeStart || pattern.startTime,
              endTime: exception.alternativeEnd || pattern.endTime,
              isRescheduled: true,
              originalDate: new Date(currentDate),
            });
          }
        }
      }
      
      // Advance to next date based on recurrence type
      currentDate = this.advanceDate(currentDate, pattern.recurrence);
    }
    
    return occurrences;
  }
  
  // Helper method to get day of week
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
    ];
    return days[date.getDay()];
  }
  
  // Helper method to advance date based on recurrence type
  private advanceDate(date: Date, recurrence: RecurrenceType): Date {
    switch (recurrence) {
      case "DAILY":
        return addDays(date, 1);
      case "WEEKLY":
        return addDays(date, 1);
      case "BIWEEKLY":
        return date.getDay() === 6 ? addDays(date, 8) : addDays(date, 1);
      case "MONTHLY":
        return date.getDay() === 6 ? addMonths(date, 1) : addDays(date, 1);
      case "CUSTOM":
        return addDays(date, 1); // Default to daily for custom
      default:
        return addDays(date, 1);
    }
  }
  
  // Method to check for schedule conflicts
  async checkScheduleConflicts(options: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    daysOfWeek: DayOfWeek[];
    facilityId?: string;
    teacherId?: string;
    excludePatternId?: string;
  }) {
    // Implementation would check for conflicts with existing schedules
    // This is complex and would require generating occurrences for all patterns
    // that might conflict and checking each occurrence
    // ...
    
    // 1. Get all patterns that might conflict
    const potentialConflictPatterns = await this.prisma.schedulePattern.findMany({
      where: {
        startDate: { lte: options.endDate },
        OR: [
          { endDate: { gte: options.startDate } },
          { endDate: null },
        ],
        id: options.excludePatternId ? { not: options.excludePatternId } : undefined,
      },
      include: {
        exceptions: true,
        timetables: {
          where: {
            OR: [
              options.facilityId ? { facilityId: options.facilityId } : {},
              options.teacherId ? { teacherId: options.teacherId } : {},
            ],
          },
        },
      },
    });
    
    // 2. Generate occurrences for each pattern
    const allOccurrences = await Promise.all(
      potentialConflictPatterns.map(pattern => 
        this.generateOccurrencesForPattern(
          pattern, 
          options.startDate, 
          options.endDate
        )
      )
    );
    
    // 3. Filter occurrences that conflict with the proposed schedule
    const conflicts = allOccurrences.flat().filter(occurrence => {
      // Check if the day of week conflicts
      if (!options.daysOfWeek.includes(this.getDayOfWeek(occurrence.date))) {
        return false;
      }
      
      // Check if the time conflicts
      // This requires comparing time strings like "13:30" and "14:45"
      return this.timeRangesOverlap(
        options.startTime, 
        options.endTime,
        occurrence.startTime,
        occurrence.endTime
      );
    });
    
    return conflicts;
  }

  // Helper method to check if time ranges overlap
  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert "HH:MM" strings to minutes since midnight for easier comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    
    const start1Minutes = toMinutes(start1);
    const end1Minutes = toMinutes(end1);
    const start2Minutes = toMinutes(start2);
    const end2Minutes = toMinutes(end2);
    
    // Check if the ranges overlap
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  }
}
```

## Frontend Implementation

### New Components

#### 0. Calendar Role-Based Permissions

```typescript
// src/lib/permissions/calendarPermissions.ts
import { UserType } from "@prisma/client";

export enum CalendarAction {
  VIEW_HOLIDAYS = "VIEW_HOLIDAYS",
  CREATE_HOLIDAY = "CREATE_HOLIDAY",
  UPDATE_HOLIDAY = "UPDATE_HOLIDAY",
  DELETE_HOLIDAY = "DELETE_HOLIDAY",
  
  VIEW_ACADEMIC_EVENTS = "VIEW_ACADEMIC_EVENTS",
  CREATE_ACADEMIC_EVENT = "CREATE_ACADEMIC_EVENT",
  UPDATE_ACADEMIC_EVENT = "UPDATE_ACADEMIC_EVENT",
  DELETE_ACADEMIC_EVENT = "DELETE_ACADEMIC_EVENT",
  
  VIEW_SCHEDULE_PATTERNS = "VIEW_SCHEDULE_PATTERNS",
  CREATE_SCHEDULE_PATTERN = "CREATE_SCHEDULE_PATTERN",
  UPDATE_SCHEDULE_PATTERN = "UPDATE_SCHEDULE_PATTERN",
  DELETE_SCHEDULE_PATTERN = "DELETE_SCHEDULE_PATTERN",
  
  VIEW_CALENDAR = "VIEW_CALENDAR",
  EXPORT_CALENDAR = "EXPORT_CALENDAR",
}

// Permission matrix by user role
export const calendarPermissionsByRole: Record<UserType, CalendarAction[]> = {
  SYSTEM_ADMIN: Object.values(CalendarAction), // All permissions
  
  SYSTEM_MANAGER: Object.values(CalendarAction), // All permissions
  
  CAMPUS_ADMIN: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.CREATE_HOLIDAY,
    CalendarAction.UPDATE_HOLIDAY,
    
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    CalendarAction.DELETE_ACADEMIC_EVENT,
    
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    CalendarAction.CREATE_SCHEDULE_PATTERN,
    CalendarAction.UPDATE_SCHEDULE_PATTERN,
    CalendarAction.DELETE_SCHEDULE_PATTERN,
    
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  
  CAMPUS_COORDINATOR: [
    CalendarAction.VIEW_HOLIDAYS,
    
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    CalendarAction.CREATE_SCHEDULE_PATTERN,
    CalendarAction.UPDATE_SCHEDULE_PATTERN,
    
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  
  CAMPUS_TEACHER: [
    CalendarAction.VIEW_HOLIDAYS,
    
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  
  CAMPUS_STUDENT: [
    CalendarAction.VIEW_HOLIDAYS,
    
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    
    CalendarAction.VIEW_CALENDAR,
  ],
  
  CAMPUS_PARENT: [
    CalendarAction.VIEW_HOLIDAYS,
    
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    
    CalendarAction.VIEW_CALENDAR,
  ],
};

// Check if a user has a specific calendar permission
export function hasCalendarPermission(userType: UserType, action: CalendarAction): boolean {
  return calendarPermissionsByRole[userType]?.includes(action) || false;
}
```

#### 1. Calendar Component

```tsx
// src/components/ui/calendar/calendar.tsx
'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  color?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  holidays?: Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    type: string;
  }>;
  showWeekends?: boolean;
  disablePastDates?: boolean;
  userType: UserType;
  campusId?: string;
}

export function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  
  // Function to render events and holidays
  const renderDateCell = (date: Date) => {
    // Get events for this date
    const dateEvents = events.filter(event => 
      isSameDay(date, event.start) || 
      (event.start <= date && event.end >= date)
    );
    
    // Get holidays for this date
    const dateHolidays = holidays?.filter(holiday => 
      (holiday.startDate <= date && holiday.endDate >= date)
    );
    
    return (
      <div className="h-full">
        {/* Date number */}
        <div className={`text-sm ${
          !isSameMonth(date, currentDate) ? 'text-gray-400' : ''
        } ${
          isSameDay(date, new Date()) ? 'bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''
        }`}>
          {format(date, 'd')}
        </div>
        
        {/* Holiday indicators */}
        {dateHolidays?.map(holiday => (
          <div 
            key={holiday.id}
            className="text-xs mt-1 bg-red-100 text-red-800 rounded px-1 truncate"
            title={holiday.name}
          >
            {holiday.name}
          </div>
        ))}
        
        {/* Event indicators */}
        {dateEvents.map(event => (
          <div 
            key={event.id}
            className={`text-xs mt-1 bg-${event.color || 'blue'}-100 text-${event.color || 'blue'}-800 rounded px-1 truncate`}
            title={event.title}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  };
  
  // Calendar view rendering logic would be implemented here
  // ...
}
```

#### 2. Holiday Management Components

```tsx
// src/components/calendar/holiday/HolidayForm.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

// Schema definition, component implementation...
```

#### 3. Academic Calendar Event Components

```tsx
// src/components/calendar/event/AcademicEventForm.tsx
'use client';

// Similar structure to HolidayForm
```

#### 4. Schedule Pattern Components

```tsx
// src/components/calendar/schedule/SchedulePatternForm.tsx
'use client';

// Implementation of the schedule pattern form
```

### Calendar Utility Functions

```typescript
// src/lib/date-utils.ts
import { format, parseISO, isValid, differenceInDays, addDays, isSameDay } from 'date-fns';

// Standard date formatter for consistency across the application
export function formatDate(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatString) : 'Invalid date';
}

// Format time consistently
export function formatTime(time: string): string {
  if (!time) return '';
  
  // Validate time format (HH:MM)
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return 'Invalid time';
  
  // Convert to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Generate dates between start and end date
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const days = differenceInDays(endDate, startDate) + 1;
  
  for (let i = 0; i < days; i++) {
    dates.push(addDays(startDate, i));
  }
  
  return dates;
}

// Check if a date is a holiday
export function isHoliday(date: Date, holidays: Array<{ startDate: Date; endDate: Date }>): boolean {
  return holidays.some(holiday => 
    date >= holiday.startDate && date <= holiday.endDate
  );
}

// Check if two date ranges overlap
export function dateRangesOverlap(
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}
```

### Timetable Management Components

```tsx
// src/components/timetable/TimetableCalendarView.tsx
'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import { hasCalendarPermission, CalendarAction } from '@/lib/permissions/calendarPermissions';

interface TimetableCalendarViewProps {
  classId?: string;
  teacherId?: string;
  facilityId?: string;
  userType: UserType;
}

export function TimetableCalendarView({ 
  classId, 
  teacherId, 
  facilityId,
  userType
}: TimetableCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start, end };
  });
  
  const { toast } = useToast();
  
  const { data, isLoading, refetch } = api.timetable.getCalendarView.useQuery({
    classId,
    teacherId,
    facilityId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  
  const cancelPeriodMutation = api.timetable.cancelPeriod.useMutation({
    onSuccess: () => {
      toast({
        title: "Period cancelled",
        description: "The timetable period has been cancelled successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel period",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };
  
  const handleCancelPeriod = (reason: string) => {
    if (selectedEvent?.type === 'timetable') {
      cancelPeriodMutation.mutate({
        periodId: selectedEvent.id,
        reason,
      });
    }
  };
  
  const canCreateTimetable = hasCalendarPermission(userType, CalendarAction.CREATE_SCHEDULE_PATTERN);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable Calendar</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setView('month')}
            className={view === 'month' ? 'bg-primary text-white' : ''}
          >
            Month
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setView('week')}
            className={view === 'week' ? 'bg-primary text-white' : ''}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setView('day')}
            className={view === 'day' ? 'bg-primary text-white' : ''}
          >
            Day
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div>Loading calendar...</div>
      ) : (
        <Calendar 
          events={data?.calendarEvents || []}
          onEventClick={handleEventClick}
          holidays={data?.holidays}
          view={view}
          userType={userType}
        />
      )}
      
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <div className="font-semibold">Date</div>
                <div>{formatDate(selectedEvent.start)}</div>
              </div>
              
              {selectedEvent.type === 'timetable' && (
                <>
                  <div>
                    <div className="font-semibold">Time</div>
                    <div>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</div>
                  </div>
                  
                  {selectedEvent.teacher && (
                    <div>
                      <div className="font-semibold">Teacher</div>
                      <div>{selectedEvent.teacher}</div>
                    </div>
                  )}
                  
                  {selectedEvent.facility && (
                    <div>
                      <div className="font-semibold">Facility</div>
                      <div>{selectedEvent.facility}</div>
                    </div>
                  )}
                  
                  {hasCalendarPermission(userType, CalendarAction.UPDATE_SCHEDULE_PATTERN) && (
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                        Close
                      </Button>
                      <Button variant="destructive" onClick={() => handleCancelPeriod("Cancelled by administrator")}>
                        Cancel Period
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {selectedEvent.type === 'holiday' && (
                <div>
                  <div className="font-semibold">Holiday Type</div>
                  <div>{selectedEvent.holidayType}</div>
                </div>
              )}
              
              {selectedEvent.type === 'academicEvent' && (
                <div>
                  <div className="font-semibold">Event Type</div>
                  <div>{selectedEvent.eventType}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

