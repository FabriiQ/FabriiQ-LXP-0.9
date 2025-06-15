# Question Bank Data Models

This document provides detailed information about the data models used in the Question Bank feature.

## Core Models

### QuestionBank

The `QuestionBank` model represents a collection of questions, typically organized by subject or course.

```typescript
interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  createdById: string;
  updatedById?: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string;
  
  // Relations
  createdBy: User;
  institution: Institution;
  updatedBy?: User;
  categories: QuestionCategory[];
  questions: Question[];
}
```

### Question

The `Question` model represents an individual assessment question with various properties.

```typescript
interface Question {
  id: string;
  questionBankId: string;
  title: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  content: any; // JSON structure depends on question type
  metadata?: any; // Additional metadata
  status: SystemStatus;
  courseId?: string;
  subjectId: string;
  topicId?: string;
  gradeLevel?: number;
  sourceId?: string;
  sourceReference?: string;
  year?: number;
  createdById: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string;
  
  // Relations
  questionBank: QuestionBank;
  course?: Course;
  subject: Subject;
  topic?: SubjectTopic;
  source?: QuestionSource;
  createdBy: User;
  updatedBy?: User;
  categories: QuestionCategoryMapping[];
  usageStats?: QuestionUsageStats;
  versions: QuestionVersion[];
}
```

### QuestionType

The `QuestionType` enum represents the different types of questions available.

```typescript
enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  MULTIPLE_RESPONSE = 'MULTIPLE_RESPONSE',
  FILL_IN_THE_BLANKS = 'FILL_IN_THE_BLANKS',
  MATCHING = 'MATCHING',
  DRAG_AND_DROP = 'DRAG_AND_DROP',
  DRAG_THE_WORDS = 'DRAG_THE_WORDS',
  NUMERIC = 'NUMERIC',
  SEQUENCE = 'SEQUENCE',
  FLASH_CARDS = 'FLASH_CARDS',
  READING = 'READING',
  VIDEO = 'VIDEO',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  HOTSPOT = 'HOTSPOT',
  LIKERT_SCALE = 'LIKERT_SCALE'
}
```

### DifficultyLevel

The `DifficultyLevel` enum represents the difficulty levels for questions.

```typescript
enum DifficultyLevel {
  VERY_EASY = 'VERY_EASY',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY_HARD'
}
```

## Question Content Models

The content of a question varies based on its type. Here are some examples:

### MultipleChoiceContent

```typescript
interface MultipleChoiceContent {
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }[];
  explanation?: string;
  hint?: string;
}
```

### TrueFalseContent

```typescript
interface TrueFalseContent {
  text: string;
  isTrue: boolean;
  explanation?: string;
  hint?: string;
}
```

### FillInTheBlanksContent

```typescript
interface FillInTheBlanksContent {
  text: string;
  blanks: {
    id: string;
    correctAnswers: string[];
    caseSensitive: boolean;
    feedback?: string;
  }[];
  explanation?: string;
  hint?: string;
}
```

## Usage Tracking Models

### QuestionUsageStats

The `QuestionUsageStats` model tracks overall usage statistics for a question.

```typescript
interface QuestionUsageStats {
  id: string;
  questionId: string;
  usageCount: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  averageTime?: number;
  difficultyRating?: number;
  lastUsedAt?: Date;
  updatedAt: Date;
  
  // Relations
  question: Question;
}
```

### QuestionUsageInstance

The `QuestionUsageInstance` model tracks individual instances of question usage.

```typescript
interface QuestionUsageInstance {
  id: string;
  questionId: string;
  activityId: string;
  studentId: string;
  classId?: string;
  wasCorrect: boolean;
  timeToAnswer: number; // Time in seconds
  answeredAt: Date;
  
  // Relations
  question: Question;
  activity: Activity;
  student: User;
  class?: Class;
}
```

### QuestionClassUsage

The `QuestionClassUsage` model tracks how questions are used within specific classes.

```typescript
interface QuestionClassUsage {
  id: string;
  questionId: string;
  classId: string;
  usageCount: number;
  correctCount: number;
  incorrectCount: number;
  lastUsedAt: Date;
  
  // Relations
  question: Question;
  class: Class;
}
```

### QuestionActivityUsage

The `QuestionActivityUsage` model tracks how questions are used within specific activities in classes.

```typescript
interface QuestionActivityUsage {
  id: string;
  questionId: string;
  activityId: string;
  classId: string;
  activityTitle: string;
  usageCount: number;
  correctCount: number;
  incorrectCount: number;
  lastUsedAt: Date;
  
  // Relations
  question: Question;
  activity: Activity;
  class: Class;
}
```

## Auxiliary Models

### QuestionCategory

The `QuestionCategory` model represents categories for organizing questions within a question bank.

```typescript
interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  questionBankId: string;
  parentCategoryId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  questionBank: QuestionBank;
  parentCategory?: QuestionCategory;
  childCategories: QuestionCategory[];
  questions: QuestionCategoryMapping[];
}
```

### QuestionCategoryMapping

The `QuestionCategoryMapping` model maps questions to categories.

```typescript
interface QuestionCategoryMapping {
  id: string;
  questionId: string;
  categoryId: string;
  
  // Relations
  question: Question;
  category: QuestionCategory;
}
```

### QuestionVersion

The `QuestionVersion` model tracks versions of questions for audit and history purposes.

```typescript
interface QuestionVersion {
  id: string;
  questionId: string;
  versionNumber: number;
  content: any;
  metadata?: any;
  createdById: string;
  createdAt: Date;
  
  // Relations
  question: Question;
  createdBy: User;
}
```

### QuestionSource

The `QuestionSource` model represents sources of questions, such as textbooks or past papers.

```typescript
interface QuestionSource {
  id: string;
  name: string;
  description?: string;
  type: QuestionSourceType;
  metadata?: any;
  institutionId: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  institution: Institution;
  questions: Question[];
}
```

### QuestionSourceType

The `QuestionSourceType` enum represents the types of question sources.

```typescript
enum QuestionSourceType {
  TEXTBOOK = 'TEXTBOOK',
  PAST_PAPER = 'PAST_PAPER',
  CUSTOM = 'CUSTOM',
  EXTERNAL = 'EXTERNAL',
  OTHER = 'OTHER'
}
```
