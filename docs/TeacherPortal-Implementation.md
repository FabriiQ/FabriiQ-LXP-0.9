# Teacher Portal Implementation Guide

## Overview
This document outlines the implementation plan for the Teacher Portal, focusing on class management, scheduling, attendance tracking, assessments, and activities with a mobile-first approach.

## 1. Portal Structure

### Base Path: `/teacher`
```typescript
// Route Structure
/teacher
├── dashboard                    // Teacher dashboard
├── classes                      // Classes overview
│   └── [classId]               // Individual class
│       ├── attendance          // Class attendance
│       ├── assessments         // Class assessments
│       ├── activities          // Class activities
│       └── students            // Class students
├── schedule                     // Teacher schedule
└── profile                     // Teacher profile
```

## 2. Existing API Integration

### TRPC Routers to Utilize
- `class.router.ts`: Class management operations
- `attendance.router.ts`: Attendance tracking
- `assessment.router.ts`: Assessment management
- `schedule.router.ts`: Schedule management
- `analytics.router.ts`: Performance analytics
- `user.router.ts`: Teacher profile management

### Key API Endpoints
```typescript
// Class Management
getTeacherClasses(teacherId: string)
getClassDetails(classId: string)
updateClassDetails(classId: string, data: ClassUpdateInput)

// Attendance
recordAttendance(classId: string, data: AttendanceInput[])
getAttendanceReport(classId: string, date: Date)
updateAttendance(attendanceId: string, data: AttendanceUpdateInput)

// Assessments
createAssessment(data: AssessmentInput)
gradeAssessment(assessmentId: string, grades: GradeInput[])
getAssessmentResults(assessmentId: string)

// Schedule
getTeacherSchedule(teacherId: string, termId: string)
updateSchedulePreferences(teacherId: string, preferences: SchedulePreferences)
```

## 3. Component Implementation

### Shared Components Location
```typescript
src/components/teacher/
├── classes/
│   ├── ClassCard.tsx
│   ├── ClassList.tsx
│   ├── ClassHeader.tsx
│   └── ClassMetrics.tsx
├── attendance/
│   ├── AttendanceRecorder.tsx
│   ├── AttendanceGrid.tsx
│   └── AttendanceStats.tsx
├── assessments/
│   ├── AssessmentCreator.tsx
│   ├── GradingInterface.tsx
│   └── ResultsViewer.tsx
└── schedule/
    ├── ScheduleView.tsx
    ├── WeeklyCalendar.tsx
    └── TimeSlotPicker.tsx
```

## 4. Page Implementation Details

### 4.1 Dashboard (`/teacher/dashboard`)
```typescript
// Components Required
- TeacherMetrics
- UpcomingClasses
- RecentActivities
- PendingAssessments
- QuickActions

// API Integration
- analyticsRouter.getTeacherMetrics
- classRouter.getUpcomingClasses
- assessmentRouter.getPendingAssessments
```

### 4.2 Classes Overview (`/teacher/classes`)
```typescript
// Components Required
- ClassFilterBar
- ClassGrid/ClassList (toggleable view)
- ClassSearchInput
- SortingControls
- PaginationControls

// API Integration
- classRouter.getTeacherClasses
- classRouter.getClassStats
```

### 4.3 Individual Class (`/teacher/classes/[classId]`)
```typescript
// Components Required
- ClassHeader
- ClassMetrics
- SubjectsList (conditional based on teacher role)
- StudentList
- ActivityTimeline
- AssessmentOverview

// API Integration
- classRouter.getClassDetails
- analyticsRouter.getClassMetrics
- teacherRouter.getTeacherRole // New endpoint to check teacher role
```

### 4.4 Class Attendance (`/teacher/classes/[classId]/attendance`)
```typescript
// Components Required
- AttendanceRecorder
- AttendanceGrid
- DatePicker
- AttendanceStats
- BulkActions

// API Integration
- attendanceRouter.recordAttendance
- attendanceRouter.getAttendanceReport
```

### 4.5 Class Assessments (`/teacher/classes/[classId]/assessments`)
```typescript
// Components Required
- AssessmentCreator
- GradingInterface
- ResultsViewer
- AssessmentList
- GradeDistributionChart

// API Integration
- assessmentRouter.createAssessment
- assessmentRouter.gradeAssessment
- assessmentRouter.getAssessmentResults
```

### 4.4 Class Activities (`/teacher/classes/[classId]/activities`)
```typescript
// Components Required
- ActivityCreator
  ├── TopicSelector (from subject topics)
  ├── ActivityTypeSelector
  ├── ContentEditor
  └── GradingConfigForm (for gradable activities)
- ActivityList
  ├── ActivityCard
  ├── ActivityStatusBadge
  └── ActivityMetrics
- TopicProgressTracker
- ActivityFilters
  ├── SubjectFilter (for class teachers)
  ├── TopicFilter
  └── TypeFilter

// API Integration
- activityRouter.createActivity
- activityRouter.getActivities
- subjectTopicRouter.getTopics
- activityRouter.getActivityGrades
```

### 4.5 Activity Details (`/teacher/classes/[classId]/activities/[activityId]`)
```typescript
// Components Required
- ActivityHeader
- ActivityContent
- StudentProgress
- GradingInterface (if gradable)
- ActivityAnalytics

// API Integration
- activityRouter.getActivityDetails
- activityRouter.updateActivity
- activityRouter.gradeActivity
```

### 4.6 Teacher Communications (`/teacher/communications`)
```typescript
// Components Required
- MessageThreadList
  ├── ThreadCard
  ├── UnreadBadge
  └── LastMessagePreview
- MessageComposer
  ├── RecipientSelector (Students/Parents)
  ├── MessageEditor
  └── AttachmentHandler
- ThreadView
  ├── MessageList
  ├── MessageInput
  └── ParticipantInfo

// API Integration
- communicationRouter.sendMessage
- communicationRouter.getThreads
```

### 4.7 Resource Management (`/teacher/resources`)
```typescript
// Components Required
- ResourceLibrary
  ├── ResourceGrid
  ├── ResourceFilters
  └── ResourceUploader
- ResourceViewer
  ├── ResourcePreview
  ├── SharingControls
  └── ResourceMetadata
- LessonPlanner
  ├── PlanEditor
  ├── ResourceAttacher
  └── ScheduleIntegration

// API Integration
- resourceRouter.createResource
- resourceRouter.shareResource
```

## 5. Mobile-First Implementation Guidelines

### 5.1 Responsive Design Principles
- Use fluid grids and flexible layouts
- Implement touch-friendly interfaces
- Use bottom navigation for mobile views
- Implement swipe gestures for common actions

### 5.2 Mobile-Specific Components
```typescript
// Bottom Navigation
const TeacherBottomNav = () => {
  return (
    <BottomNav>
      <NavItem icon={HomeIcon} path="/teacher/dashboard" />
      <NavItem icon={ClassIcon} path="/teacher/classes" />
      <NavItem icon={CalendarIcon} path="/teacher/schedule" />
      <NavItem icon={ProfileIcon} path="/teacher/profile" />
    </BottomNav>
  );
};

// Swipeable Class Cards
const SwipeableClassCard = () => {
  return (
    <SwipeableItem
      leftAction={() => handleAttendance()}
      rightAction={() => handleAssessments()}
    >
      <ClassCardContent />
    </SwipeableItem>
  );
};
```

### 5.3 Mobile Optimization
- Implement lazy loading for lists and grids
- Use virtual scrolling for long lists
- Optimize images and assets for mobile
- Implement offline capabilities for attendance recording

### 5.3 Notification System
```typescript
// Components Required
- NotificationCenter
  ├── NotificationList
  ├── NotificationFilters
  └── NotificationActions
- NotificationBadge
- NotificationPreview

// API Integration
- notificationRouter.getTeacherNotifications
- notificationRouter.markAsRead

// Notification Types
enum NotificationType {
  SUBMISSION = 'SUBMISSION',
  ATTENDANCE = 'ATTENDANCE',
  ASSESSMENT = 'ASSESSMENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}
```

## 6. UI/UX Guidelines

### 6.1 Design System Integration
- Use shadcn/ui components consistently
- Follow established color schemes and typography
- Maintain consistent spacing and layout patterns

### 6.2 Interaction Patterns
```typescript
// Touch-friendly controls
const TouchFriendlySelect = styled(Select)`
  min-height: 48px; // Minimum touch target size
  margin: 8px 0;    // Adequate spacing
`;

// Gesture handlers
const GestureWrapper = ({ children }) => {
  const handleSwipe = (direction) => {
    // Handle swipe gestures
  };

  return (
    <SwipeHandler onSwipe={handleSwipe}>
      {children}
    </SwipeHandler>
  );
};
```

## 7. Implementation Phases

### Phase 1: Core Features
1. Dashboard implementation
2. Basic class list and detail views
3. Simple attendance recording

### Phase 2: Advanced Features
1. Assessment management
2. Detailed analytics
3. Activity tracking

### Phase 3: Mobile Optimization
1. Gesture controls
2. Offline capabilities
3. Performance optimization

## 8. Testing Strategy

### 8.1 Component Testing
```typescript
// Example test structure
describe('TeacherClassList', () => {
  it('renders class cards correctly', () => {
    // Test implementation
  });

  it('handles class selection', () => {
    // Test implementation
  });
});
```

### 8.2 Integration Testing
- Test API integration
- Test navigation flows
- Test offline functionality

## 9. Performance Considerations

### 9.1 Optimization Techniques
- Implement React.memo for heavy components
- Use SWR for data fetching
- Implement proper loading states
- Use image optimization

### 9.2 Monitoring
- Track component render performance
- Monitor API response times
- Track user interaction metrics

## 10. Teacher Role Implementation

### 10.1 Role-Based Access Control
```typescript
// Teacher Role Types
enum TeacherRole {
  CLASS_TEACHER,
  SUBJECT_TEACHER
}

// Role Check Component
const RoleBasedView = ({ 
  classTeacherContent, 
  subjectTeacherContent,
  teacherId,
  classId 
}) => {
  const { data: teacherRole } = useTeacherRole(teacherId, classId);
  
  return teacherRole === TeacherRole.CLASS_TEACHER 
    ? classTeacherContent 
    : subjectTeacherContent;
};
```

### 10.2 View Differences

#### Class Teacher View
- Full access to all subjects in the class
- Can view and manage all activities across subjects
- Complete student performance overview
- Access to class-wide analytics

#### Subject Teacher View
- Limited to assigned subjects only
- Can create/manage activities for their subjects
- Student performance view limited to their subject
- Subject-specific analytics

### 10.3 API Integration for Role-Based Access

```typescript
// Example API endpoints
interface TeacherAccess {
  // Check teacher's role in a class
  getTeacherRole(teacherId: string, classId: string): TeacherRole;
  
  // Get accessible subjects for a teacher
  getTeacherSubjects(teacherId: string, classId: string): Subject[];
  
  // Get teacher's subject qualifications
  getTeacherQualifications(teacherId: string): TeacherSubjectQualification[];
}

// Example component implementation
const SubjectsList = () => {
  const { teacherId, classId } = useParams();
  const { data: subjects } = useTeacherSubjects(teacherId, classId);
  
  return (
    <List>
      {subjects.map(subject => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          canEdit={subject.teacherId === teacherId}
        />
      ))}
    </List>
  );
};
```

### 10.4 Database Relationships (from schema)
```typescript
// Key relationships
- TeacherProfile -> Class (ClassTeacher relationship)
- TeacherProfile -> TeacherSubjectQualification -> Subject
- TeacherSubjectAssignment -> Class
```

## 11. Activity Management Implementation

### 11.1 Activity Creation Flow
```typescript
// Activity Creation Steps
1. Select Subject (if class teacher)
2. Select Topic from subject hierarchy
3. Configure Activity
   - Basic Details (title, description)
   - Activity Type Selection
   - Content Creation
   - Grading Configuration (optional)
4. Set Activity Parameters
   - Due Date
   - Visibility
   - Student Instructions

// Activity Types Support
enum ActivityType {
  ASSIGNMENT,
  QUIZ,
  DISCUSSION,
  PRACTICAL,
  READING,
  OTHER
}
```

### 11.2 Activity Grading Integration
```typescript
interface ActivityGrade {
  activityId: string;
  studentId: string;
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  gradedAt?: Date;
}

// Grading Components
const GradingInterface = () => {
  const { activity, submissions } = useActivityDetails(activityId);
  
  return (
    <GradingContainer>
      <GradingRubric config={activity.gradingConfig} />
      <SubmissionsList submissions={submissions} />
      <BatchGradingTools />
    </GradingContainer>
  );
};
```

### 11.3 Topic Progress Tracking
```typescript
interface TopicProgress {
  topicId: string;
  completedActivities: number;
  totalActivities: number;
  averageScore?: number;
  studentProgress: StudentTopicProgress[];
}

// Progress Tracking Component
const TopicProgressTracker = () => {
  const { data: progress } = useTopicProgress(topicId);
  
  return (
    <ProgressContainer>
      <ProgressMetrics data={progress} />
      <StudentProgressList data={progress.studentProgress} />
    </ProgressContainer>
  );
};
```

## 12. Communication System Implementation

### 12.1 Message Management
```typescript
interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  recipientType: 'STUDENT' | 'PARENT';
  subject: string;
  content: string;
  attachments?: Attachment[];
  createdAt: Date;
  readAt?: Date;
}

// Message Thread Component
const MessageThread = () => {
  const { threadId } = useParams();
  const { data: messages } = useMessages(threadId);
  
  return (
    <ThreadContainer>
      <MessageList messages={messages} />
      <MessageComposer threadId={threadId} />
    </ThreadContainer>
  );
};
```

### 12.2 Parent-Teacher Communication
```typescript
// Parent Communication Features
- Schedule parent meetings
- Share student progress reports
- Send class announcements
- Handle parent queries

// API Integration with existing endpoints
- feedbackRouter (for handling queries)
- communicationRouter (for messages)
```

## 13. Resource Management System

### 13.1 Resource Types and Organization
```typescript
enum ResourceType {
  LESSON_PLAN = 'LESSON_PLAN',
  WORKSHEET = 'WORKSHEET',
  PRESENTATION = 'PRESENTATION',
  DOCUMENT = 'DOCUMENT'
}

enum ResourceVisibility {
  PRIVATE = 'PRIVATE',
  SUBJECT_TEACHERS = 'SUBJECT_TEACHERS',
  ALL_TEACHERS = 'ALL_TEACHERS',
  PUBLIC = 'PUBLIC'
}

// Resource Management Components
const ResourceManager = () => {
  const { data: resources } = useResources();
  
  return (
    <ResourceContainer>
      <ResourceUploader />
      <ResourceLibrary resources={resources} />
      <SharingControls />
    </ResourceContainer>
  );
};
```

### 13.2 Integration with Existing Systems
```typescript
// Integration Points
- Curriculum management (curriculumRouter)
- Class activities (activityRouter)
- Assessment system (assessmentRouter)

// Example Usage
const LessonPlanner = () => {
  const { data: resources } = useResources();
  const { data: curriculum } = useCurriculum();
  
  return (
    <PlannerContainer>
      <TopicSelector curriculum={curriculum} />
      <ResourceSelector resources={resources} />
      <ActivityPlanner />
    </PlannerContainer>
  );
};
```

## 14. System Integration Overview

### 14.1 Router Dependencies
```typescript
// Core Routers
- teacherRouter
- classRouter
- attendanceRouter
- assessmentRouter
- curriculumRouter

// New Routers
- notificationRouter
- communicationRouter
- resourceRouter
```

### 14.2 Data Flow
```typescript
// Example: Activity Creation with Resources
async function createActivityWithResources(data) {
  // 1. Upload resources
  const resources = await resourceRouter.createResource(data.resources);
  
  // 2. Create activity
  const activity = await activityRouter.createActivity({
    ...data,
    resourceIds: resources.map(r => r.id)
  });
  
  // 3. Send notifications
  await notificationRouter.createNotification({
    type: 'ACTIVITY',
    targetIds: data.studentIds,
    activityId: activity.id
  });
}
```

