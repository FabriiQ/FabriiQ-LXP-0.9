# Teacher Performance Model

## Overview

The Teacher Performance Model is designed to track, analyze, and visualize teacher performance metrics across various dimensions. This model complements the ClassPerformance model by focusing specifically on teacher-related metrics, enabling comprehensive evaluation and feedback for teachers.

## Goals

- Create a comprehensive model for tracking teacher performance metrics
- Enable data-driven teacher evaluation and feedback
- Support professional development planning
- Provide insights for school administrators and coordinators
- Integrate with existing class performance metrics

## Database Schema

```prisma
model TeacherPerformance {
  id                      String   @id @default(cuid())
  teacherId               String   @unique
  teacher                 TeacherProfile @relation(fields: [teacherId], references: [id])
  
  // Teaching metrics
  classCount              Int      @default(0)
  studentCount            Int      @default(0)
  
  // Attendance metrics
  attendanceRate          Float    @default(0)
  classesAttended         Int      @default(0)
  classesAbsent           Int      @default(0)
  
  // Grading metrics
  gradingTimeliness       Float    @default(0)
  activitiesCreated       Int      @default(0)
  activitiesGraded        Int      @default(0)
  gradingCompletionRate   Float    @default(0)
  
  // Student performance metrics
  averageStudentGrade     Float    @default(0)
  studentPassingRate      Float    @default(0)
  studentImprovementRate  Float    @default(0)
  
  // Feedback metrics
  feedbackCount           Int      @default(0)
  positiveFeedbackCount   Int      @default(0)
  positiveFeedbackRate    Float    @default(0)
  
  // Professional development
  trainingHours           Int      @default(0)
  certifications          Int      @default(0)
  
  // Lesson planning
  lessonPlansCreated      Int      @default(0)
  lessonPlanQualityScore  Float    @default(0)
  
  // Timestamps
  lastUpdated             DateTime @default(now())
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  // Metadata
  metadata                Json?

  @@index([teacherId])
  @@map("teacher_performance")
}
```

## Service Implementation

### TeacherPerformanceService

The TeacherPerformanceService handles all operations related to the TeacherPerformance model:

```typescript
class TeacherPerformanceService {
  // Get teacher performance by teacher ID
  async getTeacherPerformance(teacherId: string): Promise<TeacherPerformance> { ... }
  
  // Update teacher performance metrics
  async updateTeacherPerformance(teacherId: string, data: Partial<TeacherPerformance>): Promise<TeacherPerformance> { ... }
  
  // Calculate and update all metrics for a teacher
  async calculateAndUpdateMetrics(teacherId: string): Promise<TeacherPerformance> { ... }
  
  // Batch update multiple teachers
  async batchUpdateTeacherPerformance(teacherIds: string[]): Promise<TeacherPerformance[]> { ... }
}
```

## API Endpoints

### TeacherPerformanceRouter

```typescript
export const teacherPerformanceRouter = createTRPCRouter({
  // Get teacher performance by teacher ID
  getByTeacherId: protectedProcedure
    .input(z.object({ teacherId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new TeacherPerformanceService({ prisma: ctx.prisma });
      return service.getTeacherPerformance(input.teacherId);
    }),
    
  // Get performance for multiple teachers
  getByTeacherIds: protectedProcedure
    .input(z.object({ teacherIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const service = new TeacherPerformanceService({ prisma: ctx.prisma });
      return service.getTeacherPerformanceByIds(input.teacherIds);
    }),
    
  // Update teacher performance metrics
  updateMetrics: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      data: z.object({
        // Define updatable fields here
      }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new TeacherPerformanceService({ prisma: ctx.prisma });
      return service.updateTeacherPerformance(input.teacherId, input.data);
    }),
});
```

## Automatic Updates

The TeacherPerformance model will be automatically updated through various triggers:

1. **Event-based updates**: When related data changes (class assignments, grades, attendance, etc.)
2. **Scheduled jobs**: Regular background jobs to ensure data consistency
3. **On-demand calculations**: When specific metrics need to be recalculated

### Background Jobs

```typescript
// Scheduled job to update all teacher performance metrics
export async function updateAllTeacherPerformanceMetrics() {
  const teachers = await prisma.teacherProfile.findMany({
    where: { status: 'ACTIVE' }
  });
  
  const service = new TeacherPerformanceService({ prisma });
  await service.batchUpdateTeacherPerformance(teachers.map(t => t.id));
}
```

## Caching Strategy

The caching strategy will leverage the existing offline-first approach:

1. **Server-side caching**:
   - Redis cache for frequently accessed teacher performance data
   - Configurable TTL based on data volatility
   - Cache invalidation on data updates

2. **Client-side caching**:
   - IndexedDB for offline storage
   - Service worker for offline functionality
   - Optimistic UI updates for better user experience

## Mobile-First Approach

The TeacherPerformance model is designed with mobile-first principles:

1. **Efficient data transfer**:
   - Minimal payload size
   - Compressed data formats
   - Partial data loading

2. **Responsive UI components**:
   - Adaptive layouts
   - Progressive loading
   - Touch-friendly interactions

3. **Offline capabilities**:
   - Local data persistence
   - Background synchronization
   - Conflict resolution

## Performance Metrics Calculation

### Teaching Metrics
- **Class Count**: Total number of classes assigned to the teacher
- **Student Count**: Total number of students across all classes

### Attendance Metrics
- **Attendance Rate**: Percentage of classes attended by the teacher
- **Classes Attended**: Number of classes attended
- **Classes Absent**: Number of classes missed

### Grading Metrics
- **Grading Timeliness**: Score based on how quickly activities are graded (0-100)
- **Activities Created**: Number of activities created by the teacher
- **Activities Graded**: Number of activities graded by the teacher
- **Grading Completion Rate**: Percentage of assigned activities that have been graded

### Student Performance Metrics
- **Average Student Grade**: Average grade across all students in teacher's classes
- **Student Passing Rate**: Percentage of students passing the teacher's classes
- **Student Improvement Rate**: Average improvement in student grades over time

### Feedback Metrics
- **Feedback Count**: Total number of feedback entries provided by the teacher
- **Positive Feedback Count**: Number of positive feedback entries
- **Positive Feedback Rate**: Percentage of feedback that is positive

### Professional Development
- **Training Hours**: Number of professional development hours completed
- **Certifications**: Number of certifications obtained

### Lesson Planning
- **Lesson Plans Created**: Number of lesson plans created
- **Lesson Plan Quality Score**: Average quality score of lesson plans (0-100)

## Integration with Other Models

The TeacherPerformance model integrates with several other models in the system:

1. **ClassPerformance**: Teacher performance is directly linked to class performance
2. **StudentProfile**: Student metrics contribute to teacher performance evaluation
3. **Activity**: Activity creation and grading metrics
4. **Attendance**: Teacher attendance records
5. **Feedback**: Feedback provided by and about the teacher
6. **LessonPlan**: Lesson planning metrics

## Implementation Timeline

1. **Phase 1: Database Schema and Core Service**
   - Create TeacherPerformance model in Prisma schema
   - Implement basic TeacherPerformanceService
   - Add database migrations

2. **Phase 2: API Endpoints and Integration**
   - Create TRPC router for TeacherPerformance
   - Update existing components to use new endpoints
   - Implement caching strategy

3. **Phase 3: Automatic Updates and Background Jobs**
   - Add event listeners for data changes
   - Implement scheduled background jobs
   - Set up monitoring and logging

4. **Phase 4: Testing and Optimization**
   - Write unit and integration tests
   - Perform load testing
   - Optimize based on performance metrics

## Conclusion

The TeacherPerformance model provides a comprehensive solution for tracking and analyzing teacher performance metrics. By consolidating all metrics into a single model and implementing automatic updates, we can provide valuable insights for teachers, coordinators, and administrators, ultimately improving teaching quality and student outcomes.
