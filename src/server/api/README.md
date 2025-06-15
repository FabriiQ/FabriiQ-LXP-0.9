# Aivy LXP Backend

This directory contains the backend implementation for the Aivy Learning Experience Platform.

## Architecture

The backend is built using the following technologies:

- **tRPC**: Type-safe API layer
- **Prisma**: Database ORM
- **NextAuth**: Authentication
- **Zod**: Schema validation

## Directory Structure

- `/api`: Main API directory
  - `/middleware`: tRPC middleware for cross-cutting concerns
  - `/routers`: tRPC routers for API endpoints
  - `/services`: Business logic services
  - `/utils`: Utility functions and helpers
  - `/trpc.ts`: tRPC configuration
  - `/root.ts`: Root router that combines all API routers

## Core Features

### Error Handling

The backend implements a standardized error handling system:

- Centralized error handling middleware
- Error types for different scenarios
- Consistent error responses

### Caching

The caching system provides:

- In-memory caching for fast access
- Configurable TTL (Time To Live)
- Cache middleware for tRPC procedures

### Performance Monitoring

Performance monitoring tracks:

- Procedure execution time
- Configurable thresholds for warnings and errors
- Detailed logging

### Rate Limiting

Rate limiting protects the API from abuse:

- Configurable limits and time windows
- User and IP-based rate limiting
- Custom identifier strategies

### Validation

Input validation ensures data integrity:

- Zod schemas for type-safe validation
- Detailed validation error messages
- Validation middleware

### Logging

The logging system provides:

- Different log levels (debug, info, warn, error)
- Structured logging with metadata
- Environment-specific logging behavior

## Services

The backend implements the following services:

- **UserService**: User management
- **AuthService**: Authentication and authorization
- **PermissionService**: Permission management
- **InstitutionService**: Institution management
- **CurriculumService**: Curriculum management
- **EnrollmentService**: Enrollment management
- **FileStorageService**: File storage management
- **CommunicationService**: Communication management

## Testing

The backend includes:

- Unit tests for services
- Mock utilities for testing
- Jest configuration

## API Documentation

API documentation is available at `/api/docs` and provides:

- Endpoint descriptions
- Input/output schemas
- Example requests and responses

# API Documentation

## Services Overview

The API layer is organized into several services that handle different aspects of the Learning Experience Platform (LXP). Each service follows a consistent pattern and implements specific business logic.

### Core Services

1. **Professional Development Service** (`professional.service.ts`)
   - Manages teacher professional development records
   - Handles training enrollments and completion tracking
   - Provides statistics and reporting
   ```typescript
   class ProfessionalService {
     createTraining(data: ProfessionalDevelopmentInput)
     getTraining(id: string)
     listTrainings(params: { teacherId?, type?, startDate?, endDate?, status?, skip?, take? })
     updateTraining(id: string, data: Partial<ProfessionalDevelopmentInput>)
     deleteTraining(id: string)
     getTeacherStats(teacherId: string)
     enrollTeacher(trainingId: string, teacherId: string)
     updateEnrollmentStatus(enrollmentId: string, status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED')
   }
   ```

2. **Analytics Service** (`analytics.service.ts`)
   - Tracks system-wide events and metrics
   - Provides aggregation and reporting capabilities
   ```typescript
   type AnalyticsEventType = 
     | 'LOGIN'
     | 'ASSESSMENT_SUBMISSION'
     | 'ATTENDANCE_MARKED'
     | 'GRADE_UPDATED'
     | 'FEEDBACK_ADDED'
     | 'RESOURCE_ACCESS'
     | 'SYSTEM_ERROR'
     | 'PERFORMANCE_METRIC'
     | 'CLASS_CREATED'
     | 'CLASS_UPDATED'
     | 'ENROLLMENT_CHANGED'
     | 'TEACHER_ASSIGNED'
     | 'SCHEDULE_UPDATED'
     | 'COURSE_CREATED'
     | 'COURSE_UPDATED'
     | 'COURSE_ARCHIVED'
     | 'COURSE_ENROLLMENT_CHANGED'

   class AnalyticsService {
     trackEvent(data: AnalyticsEventInput)
     trackMetric(data: AnalyticsMetricInput)
     getEvents(params: { institutionId?, campusId?, userId?, eventType?, startDate?, endDate?, status?, skip?, take? })
     getMetrics(params: { institutionId?, campusId?, userId?, name?, startDate?, endDate?, status?, skip?, take? })
     aggregateMetrics(params: { institutionId, campusId?, name, startDate?, endDate?, groupBy? })
   }
   ```

3. **Feedback Service** (`feedback.service.ts`)
   - Manages feedback for students and teachers
   - Handles feedback responses and tracking
   - Supports different feedback types and severities
   ```typescript
   class FeedbackService {
     createFeedback(input: CreateFeedbackInput)
     getFeedback(id: string)
     listFeedback(pagination: PaginationInput, filters?: FeedbackFilters)
     updateFeedback(id: string, input: UpdateFeedbackInput)
     addResponse(feedbackId: string, input: CreateResponseInput)
     deleteFeedback(id: string)
     getFeedbackStats(filters?: { classId?, studentId?, teacherId?, startDate?, endDate? })
     createStudentFeedback(data: CreateFeedbackInput)
     createTeacherFeedback(data: CreateFeedbackInput)
     getResponses(feedbackId: string)
   }
   ```

4. **Scheduling Services**
   
   a. **Teacher Schedule Service** (`teacher-schedule.service.ts`)
   - Manages teacher timetables and availability
   - Handles schedule conflicts and period assignments
   - Supports term-based scheduling
   ```typescript
   class TeacherScheduleService {
     createSchedule(data: TeacherScheduleInput)
     addPeriod(data: SchedulePeriodInput)
     getSchedule(id: string)
     listSchedules(params: { teacherId?, termId?, status?, skip?, take? })
     updateSchedule(id: string, data: Partial<TeacherScheduleInput>)
     removePeriod(scheduleId: string, periodId: string)
     getTeacherAvailability(teacherId: string, termId: string, dayOfWeek: DayOfWeek)
   }
   ```

   b. **Facility Schedule Service** (`facility-schedule.service.ts`)
   - Manages facility bookings and availability
   - Handles room conflicts and period assignments
   - Supports term-based scheduling
   ```typescript
   class FacilityScheduleService {
     createSchedule(data: FacilityScheduleInput)
     addPeriod(data: SchedulePeriodInput)
     getSchedule(id: string)
     listSchedules(params: { facilityId?, termId?, status?, skip?, take? })
     updateSchedule(id: string, data: Partial<FacilityScheduleInput>)
     deleteSchedule(id: string)
     removePeriod(scheduleId: string, periodId: string)
     getFacilityAvailability(facilityId: string, dayOfWeek: DayOfWeek, startTime: Date, endTime: Date)
   }
   ```

## Common Patterns

### Error Handling
All services use the `TRPCError` class for consistent error handling:
```typescript
throw new TRPCError({
  code: 'NOT_FOUND' | 'BAD_REQUEST' | ...,
  message: 'Descriptive error message'
});
```

### Pagination
Services that return lists support pagination with consistent parameters:
```typescript
interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### Status Management
All entities follow a consistent status pattern using enums:
```typescript
enum SystemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}
```

### Database Access
All services use a shared Prisma instance for database access:
```typescript
import { prisma } from '../../db';
```

## Type System

### Common Types
1. **Service Types** (`types/service.ts`)
   ```typescript
   interface StringFilter {
     equals?: string;
     contains?: string;
     startsWith?: string;
     endsWith?: string;
     mode?: 'default' | 'insensitive';
   }

   interface DateTimeFilter {
     equals?: Date;
     lt?: Date;
     lte?: Date;
     gt?: Date;
     gte?: Date;
   }

   interface JsonFilter {
     equals?: Prisma.JsonValue;
     path?: string[];
     string_contains?: string;
     string_starts_with?: string;
     string_ends_with?: string;
     array_contains?: Prisma.JsonValue;
     array_starts_with?: Prisma.JsonValue;
     array_ends_with?: Prisma.JsonValue;
   }
   ```

2. **Prisma Types** (`types/prisma.ts`)
   ```typescript
   interface WithPrisma {
     prisma: PrismaClient;
   }

   interface ServiceConfig extends WithPrisma {}
   ```

## Best Practices

1. **Input Validation**
   - All services validate input data before processing
   - Entity existence is checked before operations
   - Relationships are validated when required
   ```typescript
   // Example validation
   const teacher = await this.prisma.teacher.findUnique({
     where: { id: data.teacherId }
   });
   if (!teacher) {
     throw new TRPCError({
       code: 'NOT_FOUND',
       message: 'Teacher not found'
     });
   }
   ```

2. **Transaction Management**
   - Related operations are wrapped in transactions
   - Ensures data consistency across tables
   ```typescript
   // Example transaction
   const feedbackBase = await this.prisma.feedbackBase.create({
     data: {
       ...feedbackData,
       status: 'ACTIVE'
     }
   });
   ```

3. **Security**
   - Status-based soft deletes
   - Proper error messages without exposing internals
   - Input sanitization and validation

4. **Performance**
   - Efficient query patterns with proper includes
   - Pagination for list operations
   - Optimized database access
   ```typescript
   // Example efficient query
   return this.prisma.teacherSchedule.findMany({
     where: { status: 'ACTIVE' },
     include: {
       teacher: true,
       periods: {
         where: { status: 'ACTIVE' },
         include: { timetablePeriod: true }
       }
     }
   });
   ```

## Testing

Each service should have corresponding test files that cover:
- Unit tests for business logic
- Integration tests for database operations
- API endpoint tests for complete flows

## Future Improvements

1. **Caching Layer**
   - Implement caching for frequently accessed data
   - Use Redis or similar for distributed caching

2. **Rate Limiting**
   - Add rate limiting middleware
   - Protect against abuse

3. **Logging**
   - Enhanced logging for debugging
   - Audit trails for important operations

4. **Metrics**
   - Performance monitoring
   - Usage statistics

5. **Documentation**
   - API documentation using OpenAPI/Swagger
   - Integration with documentation tools

6. **Type Safety**
   - Stricter type checking
   - Runtime type validation
   - Better error handling for type mismatches 