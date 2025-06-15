# Question Bank Technical Documentation

This document provides technical details about the Question Bank implementation.

## Table of Contents

- [Architecture](#architecture)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Components](#components)
- [Services](#services)
- [Integration Points](#integration-points)
- [Database Schema](#database-schema)

## Architecture

The Question Bank feature follows a layered architecture:

1. **Data Layer**: Prisma models and database schema
2. **Service Layer**: Business logic for question management and usage tracking
3. **API Layer**: tRPC routers for exposing functionality
4. **UI Layer**: React components for user interaction

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  UI Components  │────▶│   tRPC Router   │────▶│    Services     │────▶│  Prisma Models  │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Data Models

The Question Bank feature uses the following primary data models:

### QuestionBank

Represents a collection of questions, typically organized by subject or course.

### Question

Represents an individual assessment question with various properties.

### QuestionUsageStats

Tracks usage statistics for questions, including usage count and performance metrics.

### QuestionClassUsage

Tracks how questions are used within specific classes.

### QuestionActivityUsage

Tracks how questions are used within specific activities in classes.

## API Endpoints

The Question Bank feature exposes the following tRPC endpoints:

### Question Bank Management

- `questionBank.getQuestionBanks`: Get all question banks with optional filtering
- `questionBank.getQuestionBank`: Get a specific question bank by ID
- `questionBank.createQuestionBank`: Create a new question bank
- `questionBank.updateQuestionBank`: Update an existing question bank
- `questionBank.deleteQuestionBank`: Delete a question bank

### Question Management

- `questionBank.getQuestions`: Get questions with optional filtering
- `questionBank.getQuestion`: Get a specific question by ID
- `questionBank.createQuestion`: Create a new question
- `questionBank.updateQuestion`: Update an existing question
- `questionBank.deleteQuestion`: Delete a question

### Question Usage Tracking

- `questionUsage.recordQuestionUsage`: Record a student's answer to a question
- `questionUsage.getQuestionUsageStats`: Get usage statistics for a question
- `questionUsage.getQuestionUsageHistory`: Get usage history for a question
- `questionUsage.getQuestionClassUsage`: Get class usage for a question
- `questionUsage.getClassQuestionUsage`: Get questions used in a class
- `questionUsage.getMostUsedQuestions`: Get most used questions in a question bank

## Components

The Question Bank feature includes the following key React components:

### Management Components

- `QuestionBankList`: Displays a list of question banks
- `QuestionBankDetail`: Displays details of a question bank
- `QuestionBankForm`: Form for creating/editing question banks
- `QuestionList`: Displays a list of questions
- `QuestionDetail`: Displays details of a question
- `QuestionForm`: Form for creating/editing questions

### Integration Components

- `QuestionBankSelector`: Component for selecting questions from the question bank
- `QuestionUsageAnalytics`: Displays analytics for question usage
- `QuestionClassUsage`: Displays class usage for a question

## Services

The Question Bank feature includes the following services:

### QuestionBankService

Handles business logic for question bank management.

### QuestionService

Handles business logic for question management.

### QuestionUsageService

Handles business logic for tracking and analyzing question usage.

## Integration Points

The Question Bank feature integrates with the following parts of the application:

### Activity Creation

Teachers can select questions from the question bank when creating activities.

### Activity Completion

When students complete activities, their answers are recorded for question usage tracking.

### Analytics

Question usage data is used for analytics and reporting.

## Database Schema

The Question Bank feature uses the following database schema:

```prisma
model QuestionBank {
  id            String             @id @default(cuid())
  name          String
  description   String?
  institutionId String
  createdById   String
  updatedById   String?
  status        SystemStatus       @default(ACTIVE)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  partitionKey  String
  
  // Relations
  createdBy     User               @relation("CreatedQuestionBanks", fields: [createdById], references: [id])
  institution   Institution        @relation(fields: [institutionId], references: [id])
  updatedBy     User?              @relation("UpdatedQuestionBanks", fields: [updatedById], references: [id])
  categories    QuestionCategory[]
  questions     Question[]
}

model Question {
  id              String                    @id @default(cuid())
  questionBankId  String
  title           String
  questionType    QuestionType
  difficulty      DifficultyLevel           @default(MEDIUM)
  content         Json
  metadata        Json?
  status          SystemStatus              @default(ACTIVE)
  courseId        String?
  subjectId       String
  topicId         String?
  gradeLevel      Int?
  sourceId        String?
  sourceReference String?
  year            Int?
  createdById     String
  updatedById     String?
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt
  partitionKey    String
  
  // Relations
  categories      QuestionCategoryMapping[]
  usageStats      QuestionUsageStats?
  // Other relations...
}

model QuestionUsageStats {
  id               String    @id @default(cuid())
  questionId       String    @unique
  usageCount       Int       @default(0)
  correctCount     Int       @default(0)
  incorrectCount   Int       @default(0)
  partialCount     Int       @default(0)
  averageTime      Float?
  difficultyRating Float?
  lastUsedAt       DateTime?
  updatedAt        DateTime  @updatedAt
  
  // Relations
  question         Question  @relation(fields: [questionId], references: [id])
}

// New models for enhanced usage tracking
model QuestionUsageInstance {
  id            String    @id @default(cuid())
  questionId    String
  activityId    String
  studentId     String
  classId       String?
  wasCorrect    Boolean
  timeToAnswer  Float     // Time in seconds
  answeredAt    DateTime  @default(now())
  
  // Relations
  question      Question  @relation(fields: [questionId], references: [id])
  activity      Activity  @relation(fields: [activityId], references: [id])
  student       User      @relation(fields: [studentId], references: [id])
  class         Class?    @relation(fields: [classId], references: [id])
}

model QuestionClassUsage {
  id              String    @id @default(cuid())
  questionId      String
  classId         String
  usageCount      Int       @default(0)
  correctCount    Int       @default(0)
  incorrectCount  Int       @default(0)
  lastUsedAt      DateTime  @default(now())
  
  // Relations
  question        Question  @relation(fields: [questionId], references: [id])
  class           Class     @relation(fields: [classId], references: [id])
  
  // Unique constraint
  @@unique([questionId, classId], name: "questionId_classId")
}

model QuestionActivityUsage {
  id              String    @id @default(cuid())
  questionId      String
  activityId      String
  classId         String
  activityTitle   String
  usageCount      Int       @default(0)
  correctCount    Int       @default(0)
  incorrectCount  Int       @default(0)
  lastUsedAt      DateTime  @default(now())
  
  // Relations
  question        Question  @relation(fields: [questionId], references: [id])
  activity        Activity  @relation(fields: [activityId], references: [id])
  class           Class     @relation(fields: [classId], references: [id])
  
  // Unique constraint
  @@unique([questionId, activityId, classId], name: "questionId_activityId_classId")
}
```
