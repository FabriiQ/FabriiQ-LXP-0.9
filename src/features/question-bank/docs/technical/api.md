# Question Bank API Documentation

This document provides detailed information about the API endpoints available for the Question Bank feature.

## tRPC Routers

The Question Bank feature exposes its functionality through tRPC routers. These routers provide type-safe API endpoints for interacting with the feature.

## Question Bank Router

The Question Bank Router provides endpoints for managing question banks.

### getQuestionBanks

Get a list of question banks with optional filtering.

```typescript
// Input
interface GetQuestionBanksInput {
  filters?: {
    institutionId?: string;
    status?: SystemStatus;
    search?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// Output
interface GetQuestionBanksOutput {
  items: QuestionBank[];
  total: number;
}
```

### getQuestionBank

Get a specific question bank by ID.

```typescript
// Input
interface GetQuestionBankInput {
  id: string;
}

// Output
type GetQuestionBankOutput = QuestionBank;
```

### createQuestionBank

Create a new question bank.

```typescript
// Input
interface CreateQuestionBankInput {
  name: string;
  description?: string;
  institutionId: string;
}

// Output
type CreateQuestionBankOutput = QuestionBank;
```

### updateQuestionBank

Update an existing question bank.

```typescript
// Input
interface UpdateQuestionBankInput {
  id: string;
  name?: string;
  description?: string;
  status?: SystemStatus;
}

// Output
type UpdateQuestionBankOutput = QuestionBank;
```

### deleteQuestionBank

Delete a question bank.

```typescript
// Input
interface DeleteQuestionBankInput {
  id: string;
}

// Output
interface DeleteQuestionBankOutput {
  success: boolean;
}
```

## Question Router

The Question Router provides endpoints for managing questions.

### getQuestions

Get a list of questions with optional filtering.

```typescript
// Input
interface GetQuestionsInput {
  questionBankId: string;
  filters?: {
    search?: string;
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    courseId?: string;
    subjectId?: string;
    topicId?: string;
    gradeLevel?: number;
    year?: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// Output
interface GetQuestionsOutput {
  items: Question[];
  total: number;
}
```

### getQuestion

Get a specific question by ID.

```typescript
// Input
interface GetQuestionInput {
  id: string;
}

// Output
type GetQuestionOutput = Question;
```

### createQuestion

Create a new question.

```typescript
// Input
interface CreateQuestionInput {
  questionBankId: string;
  title: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  content: any;
  metadata?: any;
  courseId?: string;
  subjectId: string;
  topicId?: string;
  gradeLevel?: number;
  sourceId?: string;
  sourceReference?: string;
  year?: number;
  categoryIds?: string[];
}

// Output
type CreateQuestionOutput = Question;
```

### updateQuestion

Update an existing question.

```typescript
// Input
interface UpdateQuestionInput {
  id: string;
  title?: string;
  difficulty?: DifficultyLevel;
  content?: any;
  metadata?: any;
  status?: SystemStatus;
  courseId?: string;
  subjectId?: string;
  topicId?: string;
  gradeLevel?: number;
  sourceId?: string;
  sourceReference?: string;
  year?: number;
  categoryIds?: string[];
}

// Output
type UpdateQuestionOutput = Question;
```

### deleteQuestion

Delete a question.

```typescript
// Input
interface DeleteQuestionInput {
  id: string;
}

// Output
interface DeleteQuestionOutput {
  success: boolean;
}
```

## Question Usage Router

The Question Usage Router provides endpoints for tracking and analyzing question usage.

### recordQuestionUsage

Record a student's answer to a question.

```typescript
// Input
interface RecordQuestionUsageInput {
  questionId: string;
  wasCorrect: boolean;
  timeToAnswer: number;
  activityId: string;
  studentId: string;
  classId?: string;
}

// Output
interface RecordQuestionUsageOutput {
  success: boolean;
}
```

### getQuestionUsageStats

Get usage statistics for a question.

```typescript
// Input
interface GetQuestionUsageStatsInput {
  questionId: string;
}

// Output
type GetQuestionUsageStatsOutput = QuestionUsageStats;
```

### getQuestionUsageHistory

Get usage history for a question.

```typescript
// Input
interface GetQuestionUsageHistoryInput {
  questionId: string;
  limit?: number;
  offset?: number;
}

// Output
interface GetQuestionUsageHistoryOutput {
  history: QuestionUsageInstance[];
  total: number;
}
```

### getQuestionClassUsage

Get class usage for a question.

```typescript
// Input
interface GetQuestionClassUsageInput {
  questionId: string;
}

// Output
interface GetQuestionClassUsageOutput {
  classes: {
    classId: string;
    className: string;
    courseName: string;
    subjectName: string;
    usageCount: number;
    correctPercentage: number | null;
    activities: {
      activityId: string;
      activityTitle: string;
      lastUsedAt: Date;
      correctPercentage: number | null;
    }[];
  }[];
  reusedInClasses: string[];
  totalUsageCount: number;
}
```

### getClassQuestionUsage

Get questions used in a class.

```typescript
// Input
interface GetClassQuestionUsageInput {
  classId: string;
}

// Output
interface GetClassQuestionUsageOutput {
  usedQuestions: {
    questionId: string;
    usageCount: number;
    lastUsedAt: Date;
    activities: string[];
  }[];
}
```

### getMostUsedQuestions

Get most used questions in a question bank.

```typescript
// Input
interface GetMostUsedQuestionsInput {
  questionBankId: string;
  limit?: number;
}

// Output
type GetMostUsedQuestionsOutput = (Question & {
  usageStats: QuestionUsageStats;
})[];
```

## Error Handling

All API endpoints use tRPC's error handling mechanism. Errors are returned with appropriate HTTP status codes and error messages.

```typescript
// Example error
{
  code: 'NOT_FOUND',
  message: 'Question not found',
  cause: error
}
```

## Authentication and Authorization

All API endpoints require authentication. Authorization is handled based on the user's role and permissions.

- Teachers can access question banks and questions for their subjects
- Coordinators can access question banks and questions for their programs
- Administrators can access all question banks and questions
