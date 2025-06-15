# API Documentation

## 1. Authentication Endpoints

### 1.1 User Authentication
```typescript
// Login procedure
router.procedure('auth.login')
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    campusId: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    // Authentication logic
  });

// Registration procedure
router.procedure('auth.register')
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    role: z.enum(['STUDENT', 'TEACHER', 'COORDINATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN'])
  }))
  .mutation(async ({ input, ctx }) => {
    // Registration logic
  });
```

## 2. Academic Management

### 2.1 Program Management
```typescript
// Create program
router.procedure('programs.create')
  .input(z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    level: z.number(),
    duration: z.number(),
    campusId: z.string(),
    curriculum: z.array(z.object({
      termNumber: z.number(),
      courses: z.array(z.string())
    }))
  }))
  .mutation(async ({ input, ctx }) => {
    // Program creation logic
  });

// Update program
router.procedure('programs.update')
  .input(z.object({
    id: z.string(),
    updates: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      curriculum: z.array(z.object({
        termNumber: z.number(),
        courses: z.array(z.string())
      })).optional()
    })
  }))
  .mutation(async ({ input, ctx }) => {
    // Program update logic
  });
```

### 2.2 Course Management
```typescript
// Create course
router.procedure('courses.create')
  .input(z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    credits: z.number(),
    prerequisites: z.array(z.string()).optional(),
    syllabus: z.object({
      objectives: z.array(z.string()),
      topics: z.array(z.string()),
      assessments: z.array(z.object({
        type: z.string(),
        weightage: z.number()
      }))
    })
  }))
  .mutation(async ({ input, ctx }) => {
    // Course creation logic
  });

// Get course details
router.procedure('courses.getById')
  .input(z.string())
  .query(async ({ input, ctx }) => {
    // Course retrieval logic
  });
```

## 3. Assessment Management

### 3.1 Assessment Templates
```typescript
// Create assessment template
router.procedure('assessments.createTemplate')
  .input(z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(['QUIZ', 'ASSIGNMENT', 'PROJECT', 'EXAM']),
    maxScore: z.number(),
    passingScore: z.number(),
    gradingType: z.enum(['AUTOMATIC', 'MANUAL', 'HYBRID']),
    rubric: z.array(z.object({
      criterion: z.string(),
      weight: z.number(),
      levels: z.array(z.object({
        score: z.number(),
        description: z.string()
      }))
    }))
  }))
  .mutation(async ({ input, ctx }) => {
    // Template creation logic
  });
```

### 3.2 Assessment Submissions
```typescript
// Submit assessment
router.procedure('assessments.submit')
  .input(z.object({
    assessmentId: z.string(),
    content: z.object({
      answers: z.array(z.object({
        questionId: z.string(),
        response: z.union([z.string(), z.number(), z.array(z.string())])
      })),
      attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string()
      })).optional()
    })
  }))
  .mutation(async ({ input, ctx }) => {
    // Submission logic
  });
```

## 4. Schedule Management

### 4.1 Teacher Schedules
```typescript
// Create teacher schedule
router.procedure('schedules.createTeacher')
  .input(z.object({
    teacherId: z.string(),
    termId: z.string(),
    periods: z.array(z.object({
      dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      startTime: z.string(),
      endTime: z.string(),
      type: z.enum(['LECTURE', 'LAB', 'TUTORIAL']),
      classId: z.string()
    }))
  }))
  .mutation(async ({ input, ctx }) => {
    // Schedule creation logic
  });
```

### 4.2 Facility Schedules
```typescript
// Create facility schedule
router.procedure('schedules.createFacility')
  .input(z.object({
    facilityId: z.string(),
    termId: z.string(),
    periods: z.array(z.object({
      dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      startTime: z.string(),
      endTime: z.string(),
      type: z.enum(['CLASS', 'EVENT', 'MAINTENANCE']),
      classId: z.string().optional(),
      eventId: z.string().optional()
    }))
  }))
  .mutation(async ({ input, ctx }) => {
    // Schedule creation logic
  });
```

## 5. Feedback System

### 5.1 Student Feedback
```typescript
// Create student feedback
router.procedure('feedback.createStudent')
  .input(z.object({
    studentId: z.string(),
    type: z.enum([
      'ACADEMIC_PERFORMANCE',
      'BEHAVIORAL',
      'ATTENDANCE',
      'PARTICIPATION'
    ]),
    severity: z.enum(['POSITIVE', 'NEUTRAL', 'CONCERN', 'CRITICAL']),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string()
    })).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    // Feedback creation logic
  });
```

### 5.2 Teacher Feedback
```typescript
// Create teacher feedback
router.procedure('feedback.createTeacher')
  .input(z.object({
    teacherId: z.string(),
    type: z.enum([
      'TEACHING_QUALITY',
      'CLASS_MANAGEMENT',
      'STUDENT_ENGAGEMENT',
      'PROFESSIONAL_DEVELOPMENT'
    ]),
    severity: z.enum(['POSITIVE', 'NEUTRAL', 'CONCERN', 'CRITICAL']),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string()
    })).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    // Feedback creation logic
  });
```

## 6. Analytics & Reporting

### 6.1 Analytics Events
```typescript
// Track analytics event
router.procedure('analytics.trackEvent')
  .input(z.object({
    type: z.string(),
    metadata: z.record(z.unknown()),
    timestamp: z.date(),
    userId: z.string().optional(),
    sessionId: z.string(),
    deviceInfo: z.object({
      type: z.string(),
      os: z.string(),
      browser: z.string()
    })
  }))
  .mutation(async ({ input, ctx }) => {
    // Event tracking logic
  });
```

### 6.2 Report Generation
```typescript
// Generate academic report
router.procedure('reports.generateAcademic')
  .input(z.object({
    type: z.enum(['STUDENT_PROGRESS', 'CLASS_PERFORMANCE', 'PROGRAM_METRICS']),
    filters: z.object({
      startDate: z.date(),
      endDate: z.date(),
      programId: z.string().optional(),
      classId: z.string().optional(),
      studentId: z.string().optional()
    }),
    format: z.enum(['PDF', 'EXCEL', 'CSV'])
  }))
  .query(async ({ input, ctx }) => {
    // Report generation logic
  });
``` 