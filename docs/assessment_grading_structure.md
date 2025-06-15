# Enhancing Topic-Level Granularity Without Breaking Existing Structure

## Current Limitations

The current system has two key limitations:

1. **Lack of Topic-Level Granularity**: Assessments and activities are linked to subjects as a whole, not to specific topics within subjects.
2. **Disconnection Between Activities and Assessments**: Activities exist as learning tasks but aren't well-integrated into the assessment and grading framework.

## Proposed Enhancement Strategy

We can address these limitations without breaking the existing structure by implementing the following enhancements:

### 1. Add Topic Structure Without Breaking Subject Relationships

```prisma
// New model for topics within subjects
model SubjectTopic {
  id                  String                @id @default(cuid())
  code                String                // Topic code (unique within subject)
  title               String                // Topic title
  description         String?               // Topic description
  context             String?               // Educational context
  learningOutcomes    Json?                 // Structured learning outcomes
  nodeType            SubjectNodeType       // CHAPTER, TOPIC, or SUBTOPIC
  orderIndex          Int                   // For ordering topics within a subject
  subjectId           String                // Parent subject
  parentTopicId       String?               // Optional parent topic (for subtopics)
  status              SystemStatus          @default(ACTIVE)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  subject             Subject               @relation(fields: [subjectId], references: [id])
  parentTopic         SubjectTopic?         @relation("TopicHierarchy", fields: [parentTopicId], references: [id])
  childTopics         SubjectTopic[]        @relation("TopicHierarchy")
  
  // New relationships for existing entities
  assessmentTopics    AssessmentTopic[]     // Link to assessments
  activityTopics      ActivityTopic[]       // Link to activities

  @@unique([subjectId, code])
  @@index([subjectId, nodeType])
  @@index([parentTopicId])
  @@map("subject_topics")
}
```

### 2. Create Junction Tables for Existing Entities

```prisma
// Junction table for assessments and topics
model AssessmentTopic {
  id                  String                @id @default(cuid())
  assessmentId        String
  topicId             String
  weightage           Float?                // Optional topic-specific weightage
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  assessment          Assessment            @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  topic               SubjectTopic          @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([assessmentId, topicId])
  @@index([topicId])
  @@map("assessment_topics")
}

// Junction table for activities and topics
model ActivityTopic {
  id                  String                @id @default(cuid())
  activityId          String
  topicId             String
  orderIndex          Int                   // For ordering activities within a topic
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  activity            Activity              @relation(fields: [activityId], references: [id], onDelete: Cascade)
  topic               SubjectTopic          @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([activityId, topicId])
  @@index([topicId])
  @@map("activity_topics")
}
```

### 3. Update Existing Models with New Relationships

```prisma
// Update Assessment model
model Assessment {
  // ... existing fields ...
  
  // Add relationship to AssessmentTopic
  topics              AssessmentTopic[]
  
  // ... existing relationships ...
}

// Update Activity model
model Activity {
  // ... existing fields ...
  
  // Add relationship to ActivityTopic
  topics              ActivityTopic[]
  
  // ... existing relationships ...
}
```

### 4. Add Topic-Level Submission Analysis

```prisma
// New model for topic-level submission analysis
model SubmissionTopicAnalysis {
  id                  String                @id @default(cuid())
  submissionId        String
  topicId             String
  score               Float?                // Topic-specific score
  mastery             Float?                // Topic mastery level (0-1)
  feedback            String?               // Topic-specific feedback
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  submission          AssessmentSubmission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  topic               SubjectTopic          @relation(fields: [topicId], references: [id])

  @@unique([submissionId, topicId])
  @@index([topicId])
  @@map("submission_topic_analyses")
}

// Update AssessmentSubmission model
model AssessmentSubmission {
  // ... existing fields ...
  
  // Add relationship to SubmissionTopicAnalysis
  topicAnalyses       SubmissionTopicAnalysis[]
  
  // ... existing relationships ...
}
```

### 5. Add Activity Grading Capability

```prisma
// New model for activity submissions
model ActivitySubmission {
  id                  String                @id @default(cuid())
  activityId          String
  studentId           String
  content             Json?
  attachments         Json?
  score               Float?                // Optional score if activity is graded
  feedback            String?
  status              SubmissionStatus
  submittedAt         DateTime?
  gradedAt            DateTime?
  gradedById          String?
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  activity            Activity              @relation(fields: [activityId], references: [id])
  student             StudentProfile        @relation(fields: [studentId], references: [id])
  gradedBy            User?                 @relation(fields: [gradedById], references: [id])
  topicAnalyses       ActivityTopicAnalysis[]

  @@unique([activityId, studentId])
  @@index([status])
  @@map("activity_submissions")
}

// New model for topic-level activity analysis
model ActivityTopicAnalysis {
  id                  String                @id @default(cuid())
  submissionId        String
  topicId             String
  score               Float?
  feedback            String?
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  submission          ActivitySubmission    @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  topic               SubjectTopic          @relation(fields: [topicId], references: [id])

  @@unique([submissionId, topicId])
  @@index([topicId])
  @@map("activity_topic_analyses")
}

// Update Activity model
model Activity {
  // ... existing fields and relationships ...
  
  // Add relationship to ActivitySubmission
  submissions         ActivitySubmission[]
  
  // Add field to indicate if activity is gradable
  isGradable          Boolean               @default(false)
  maxScore            Float?
  
  // ... other fields ...
}
```

### 6. Enhance StudentGrade with Topic-Level Analysis

```prisma
// Update StudentGrade model
model StudentGrade {
  // ... existing fields ...
  
  // Add field for topic-level performance
  topicPerformance    Json?                 // Structured data on topic-level performance
  
  // Add relationship to new topic performance model
  topicGrades         StudentTopicGrade[]
  
  // ... existing relationships ...
}

// New model for student topic grades
model StudentTopicGrade {
  id                  String                @id @default(cuid())
  studentGradeId      String
  topicId             String
  score               Float?
  mastery             Float?                // 0-1 mastery level
  assessmentScores    Json?                 // Assessment scores for this topic
  activityScores      Json?                 // Activity scores for this topic
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relationships
  studentGrade        StudentGrade          @relation(fields: [studentGradeId], references: [id], onDelete: Cascade)
  topic               SubjectTopic          @relation(fields: [topicId], references: [id])

  @@unique([studentGradeId, topicId])
  @@index([topicId])
  @@map("student_topic_grades")
}
```

## Implementation Strategy

This enhancement can be implemented in phases without disrupting the existing system:

### Phase 1: Topic Structure and Relationships

1. Add the `SubjectTopic` model and its relationships
2. Create junction tables (`AssessmentTopic`, `ActivityTopic`)
3. Update existing models with new relationships
4. Migrate existing data:
   - Create default topics for each subject based on available metadata
   - Link existing assessments and activities to appropriate topics

### Phase 2: Topic-Level Analysis

1. Add `SubmissionTopicAnalysis` model
2. Enhance assessment grading to include topic-level analysis
3. Update reporting to show topic-level performance

### Phase 3: Activity Grading Integration

1. Add `ActivitySubmission` and related models
2. Implement activity grading functionality
3. Integrate activity grades into overall student performance

### Phase 4: Enhanced Student Grades

1. Update `StudentGrade` with topic-level performance data
2. Add `StudentTopicGrade` model
3. Enhance grade calculation to include topic-level mastery

## Benefits of This Approach

1. **Preserves Existing Structure**: All existing relationships remain intact
2. **Adds Granularity**: Provides topic-level tracking without breaking existing functionality
3. **Integrates Activities**: Allows activities to be graded and contribute to overall performance
4. **Enhances Analytics**: Enables detailed analysis of student performance at the topic level
5. **Supports Competency-Based Education**: Tracks mastery of specific topics and competencies
6. **Maintains Backward Compatibility**: Existing code will continue to work while new features are added

## Conclusion

This enhancement strategy addresses the limitations of the current system while preserving its existing structure. By adding topic-level granularity and integrating activities into the assessment framework, the system will provide more detailed insights into student performance and learning outcomes. The phased implementation approach ensures minimal disruption to existing functionality while gradually introducing new capabilities.
