# Unified Activity Data Structure

This document defines the unified data structure for activities in the learning platform. This will serve as the single source of truth for all activity-related data structures.

## 1. Core Activity Interface

```typescript
/**
 * Core Activity Interface
 * 
 * This interface defines the common properties for all activities.
 * It serves as the foundation for all activity types.
 */
export interface UnifiedActivity {
  // Core identification
  id: string;
  title: string;
  description?: string;
  
  // Classification
  activityType: string;  // Single source of truth for activity type (e.g., 'multiple-choice', 'reading')
  purpose: ActivityPurpose;  // LEARNING, ASSESSMENT, PRACTICE, ENGAGEMENT
  
  // Content and configuration
  content: Record<string, any>;  // Activity-specific content and configuration
  
  // Grading-related properties
  isGradable: boolean;
  maxScore?: number;
  passingScore?: number;
  gradingConfig?: Record<string, any>;  // Configuration for grading
  
  // Scheduling
  startDate?: Date;
  endDate?: Date;
  duration?: number;  // in minutes
  
  // Metadata
  status: SystemStatus;  // ACTIVE, INACTIVE, ARCHIVED
  subjectId: string;
  topicId?: string;
  classId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  
  // Analytics and tracking
  analyticsConfig?: {
    trackViews?: boolean;
    trackInteractions?: boolean;
    trackCompletion?: boolean;
    customTracking?: Record<string, any>;
  };
}
```

## 2. Activity Type Definition

```typescript
/**
 * Activity Type Definition
 * 
 * This interface defines the structure of an activity type,
 * including its components, capabilities, and default values.
 */
export interface ActivityTypeDefinition<T = any> {
  // Core identification
  id: string;
  name: string;
  description: string;
  
  // Classification
  category: ActivityPurpose;
  tags?: string[];
  
  // Schema and default values
  schema: z.ZodType<T>;
  defaultValue: T;
  
  // Components
  components: {
    editor: React.ComponentType<ActivityEditorProps<T>>;
    viewer: React.ComponentType<ActivityViewerProps<T>>;
    grading?: React.ComponentType<ActivityGradingProps<T>>;
    analytics?: React.ComponentType<ActivityAnalyticsProps>;
  };
  
  // Capabilities
  capabilities: ActivityCapabilities;
  
  // Metadata
  icon?: string;
  version?: string;
}
```

## 3. Activity Capabilities

```typescript
/**
 * Activity Capabilities
 * 
 * This interface defines the capabilities of an activity type.
 * These capabilities determine what features are available for an activity.
 */
export interface ActivityCapabilities {
  // Grading capabilities
  isGradable: boolean;
  hasAutomaticGrading: boolean;
  supportsPartialCredit: boolean;
  requiresTeacherReview: boolean;
  
  // Tracking capabilities
  hasProgressTracking: boolean;
  supportsOfflineMode: boolean;
  
  // Interaction capabilities
  hasInteractiveElements: boolean;
  hasCustomScoring: boolean;
  hasMultipleAttempts: boolean;
  hasTimeLimit: boolean;
  
  // Submission capabilities
  hasSubmission: boolean;
  hasInteraction: boolean;
  hasRealTimeComponents: boolean;
}
```

## 4. Component Props Interfaces

### 4.1. Activity Viewer Props

```typescript
/**
 * Activity Viewer Props
 * 
 * This interface defines the props for activity viewer components.
 */
export interface ActivityViewerProps<T = any> {
  // Core activity data
  activity: UnifiedActivity & T;  // Combine core activity with type-specific data
  
  // Viewing mode
  mode: 'preview' | 'student' | 'teacher' | 'grading';
  
  // Student data (for grading mode)
  studentId?: string;
  studentAnswers?: any;
  
  // Callbacks
  onInteraction?: (data: any) => void;
  onProgress?: (progress: { completed: boolean; state: string }) => void;
  onComplete?: (result: any) => void;
  onSubmit?: (result: any) => void;
  
  // State
  initialState?: string | Record<string, any>;
  
  // Analytics
  disableAnalytics?: boolean;
  institutionId?: string;
}
```

### 4.2. Activity Editor Props

```typescript
/**
 * Activity Editor Props
 * 
 * This interface defines the props for activity editor components.
 */
export interface ActivityEditorProps<T = any> {
  // Core activity data
  activity: UnifiedActivity & T;  // Combine core activity with type-specific data
  
  // Callbacks
  onChange: (updatedActivity: UnifiedActivity & T) => void;
  
  // Editor state
  readOnly?: boolean;
  preview?: boolean;
  
  // Context
  classId?: string;
  subjectId?: string;
}
```

### 4.3. Activity Grading Props

```typescript
/**
 * Activity Grading Props
 * 
 * This interface defines the props for activity grading components.
 */
export interface ActivityGradingProps<T = any> {
  // Core activity data
  activity: UnifiedActivity & T;  // Combine core activity with type-specific data
  
  // Student data
  studentId: string;
  submission: {
    id: string;
    content: any;
    score?: number;
    feedback?: string;
    status: string;
    submittedAt: Date;
    gradedAt?: Date;
  };
  
  // Callbacks
  onGrade: (grade: { score: number; feedback?: string }) => void;
  
  // Grading state
  readOnly?: boolean;
}
```

### 4.4. Activity Analytics Props

```typescript
/**
 * Activity Analytics Props
 * 
 * This interface defines the props for activity analytics components.
 */
export interface ActivityAnalyticsProps {
  // Core activity data
  activityId: string;
  classId: string;
  
  // Filters
  dateRange?: { start: Date; end: Date };
  studentIds?: string[];
  
  // Display options
  showIndividualResults?: boolean;
  showAggregateResults?: boolean;
}
```

## 5. Activity Result Interfaces

### 5.1. Grading Result

```typescript
/**
 * Grading Result
 * 
 * This interface defines the result of grading an activity.
 */
export interface GradingResult {
  // Core result data
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  
  // Detailed results
  questionResults?: QuestionResult[];
  
  // Feedback
  feedback?: string;
  detailedFeedback?: Record<string, any>;
  
  // Metadata
  attemptId?: string;
  submittedAt?: Date;
  gradedAt?: Date;
}
```

### 5.2. Question Result

```typescript
/**
 * Question Result
 * 
 * This interface defines the result of grading a single question.
 */
export interface QuestionResult {
  // Core result data
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  
  // User answer
  userAnswer: any;
  correctAnswer: any;
  
  // Feedback
  feedback?: string;
}
```

## 6. Activity State Interfaces

### 6.1. Activity Progress

```typescript
/**
 * Activity Progress
 * 
 * This interface defines the progress of a student in an activity.
 */
export interface ActivityProgress {
  // Core progress data
  activityId: string;
  studentId: string;
  
  // Progress state
  state: 'not_started' | 'in_progress' | 'completed' | 'submitted' | 'graded';
  progress: number;  // 0-100
  
  // Time tracking
  startedAt?: Date;
  lastAccessedAt?: Date;
  completedAt?: Date;
  
  // State data
  stateData?: Record<string, any>;
}
```

### 6.2. Activity Interaction

```typescript
/**
 * Activity Interaction
 * 
 * This interface defines an interaction with an activity.
 */
export interface ActivityInteraction {
  // Core interaction data
  activityId: string;
  studentId: string;
  
  // Interaction details
  type: string;
  data: any;
  
  // Metadata
  timestamp: Date;
  deviceInfo?: {
    type: string;
    browser: string;
    os: string;
  };
}
```

## 7. Database Schema Updates

The Prisma schema should be updated to align with the unified activity structure. Here are the key models:

```prisma
model Activity {
  id             String          @id @default(cuid())
  title          String
  description    String?
  activityType   String          // Single source of truth for activity type
  purpose        ActivityPurpose
  content        Json
  isGradable     Boolean         @default(false)
  maxScore       Float?
  passingScore   Float?
  gradingConfig  Json?
  startDate      DateTime?
  endDate        DateTime?
  duration       Int?            // in minutes
  status         SystemStatus    @default(ACTIVE)
  subjectId      String
  subject        Subject         @relation(fields: [subjectId], references: [id])
  topicId        String?
  topic          Topic?          @relation(fields: [topicId], references: [id])
  classId        String
  class          Class           @relation(fields: [classId], references: [id])
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  createdById    String
  createdBy      User            @relation(fields: [createdById], references: [id])
  activityGrades ActivityGrade[]
  analyticsConfig Json?

  @@index([subjectId])
  @@index([classId])
  @@index([topicId])
  @@index([createdById])
  @@index([activityType])
}

model ActivityGrade {
  id          String           @id @default(cuid())
  activityId  String
  activity    Activity         @relation(fields: [activityId], references: [id])
  studentId   String
  student     StudentProfile   @relation(fields: [studentId], references: [id])
  score       Float?
  feedback    String?
  status      SubmissionStatus
  content     Json?            // Student answers
  submittedAt DateTime?
  gradedAt    DateTime?
  gradedById  String?
  gradedBy    User?            @relation("GradedActivities", fields: [gradedById], references: [id])
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([activityId, studentId])
  @@index([activityId])
  @@index([studentId])
  @@index([gradedById])
}

model ActivityProgress {
  id             String   @id @default(cuid())
  activityId     String
  activity       Activity @relation(fields: [activityId], references: [id])
  studentId      String
  student        StudentProfile @relation(fields: [studentId], references: [id])
  state          String
  progress       Float    @default(0)
  startedAt      DateTime?
  lastAccessedAt DateTime?
  completedAt    DateTime?
  stateData      Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([activityId, studentId])
  @@index([activityId])
  @@index([studentId])
}
```

## 8. Implementation Plan

1. Create a new file `src/features/activities/types/unified-types.ts` with these interfaces
2. Update the activity registry to use these interfaces
3. Update all activity type implementations to conform to these interfaces
4. Create base components that use these interfaces
5. Update the API services to align with these data structures
6. Ensure the database schema is compatible with these structures

## Conclusion

This unified activity data structure provides a solid foundation for the activity system. By standardizing the interfaces and data structures, we can ensure consistency across all activity types and components. This will make the system more maintainable, extensible, and reliable.
