# Question Bank Architecture

## Overview

The Question Bank is a centralized repository for storing, managing, and retrieving questions that can be used across various activities and assessments in the aivy-lxp platform. This document outlines the architecture of the question bank system.

## System Architecture

The Question Bank follows a layered architecture with the following components:

```
question-bank/
├── api/                  # API layer (tRPC routers and procedures)
├── components/           # UI components
│   ├── admin/            # Admin interface components
│   ├── editor/           # Question editor components
│   ├── viewer/           # Question viewer components
│   └── shared/           # Shared components
├── hooks/                # React hooks for question bank functionality
├── models/               # Data models and type definitions
├── services/             # Business logic services
├── utils/                # Utility functions
└── persistence/          # Database access layer
```

## Component Descriptions

### API Layer

The API layer is implemented using tRPC and provides endpoints for managing questions and question banks.

```typescript
// src/server/api/routers/question-bank.ts
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { QuestionBankService } from "@/features/question-bank/services/question-bank.service";

export const questionBankRouter = createTRPCRouter({
  // Question bank procedures
  createQuestionBank: protectedProcedure
    .input(createQuestionBankSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.createQuestionBank(input, ctx.session.user.id);
    }),

  // Question procedures
  createQuestion: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.createQuestion(input, ctx.session.user.id);
    }),

  // Bulk operations
  bulkUploadQuestions: protectedProcedure
    .input(bulkUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.bulkUploadQuestions(input, ctx.session.user.id);
    }),

  // Query operations
  getQuestions: protectedProcedure
    .input(getQuestionsSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.getQuestions(input);
    }),
});
```

### Data Models

The data models define the structure of questions and related entities.

```typescript
// src/features/question-bank/models/types.ts
import { QuestionType, DifficultyLevel } from "@prisma/client";

export interface Question {
  id: string;
  title: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  content: QuestionContent;
  subjectId: string;
  courseId?: string;
  topicId?: string;
  gradeLevel?: number;
  metadata?: Record<string, any>;
}

export type QuestionContent =
  | MultipleChoiceContent
  | TrueFalseContent
  | MultipleResponseContent
  | FillInTheBlanksContent
  | MatchingContent
  | DragAndDropContent
  | NumericContent
  | ShortAnswerContent
  | EssayContent;

export interface MultipleChoiceContent {
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }[];
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

// Additional content type definitions...
```

### Services

The services layer contains the business logic for the question bank.

```typescript
// src/features/question-bank/services/question-bank.service.ts
import { PrismaClient, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  CreateQuestionInput,
  BulkUploadInput,
  GetQuestionsInput
} from "../models/types";

export class QuestionBankService {
  constructor(private prisma: PrismaClient) {}

  async createQuestionBank(input, userId) {
    // Implementation
  }

  async createQuestion(input: CreateQuestionInput, userId: string) {
    // Implementation
  }

  async bulkUploadQuestions(input: BulkUploadInput, userId: string) {
    // Implementation
  }

  async getQuestions(input: GetQuestionsInput) {
    // Implementation
  }

  // Additional methods...
}
```

### UI Components

The UI components provide the user interface for interacting with the question bank.

#### Admin Components

```typescript
// src/features/question-bank/components/admin/QuestionBankManager.tsx
import { useState } from "react";
import { api } from "@/utils/api";
import { QuestionBankList } from "./QuestionBankList";
import { QuestionBankForm } from "./QuestionBankForm";

export const QuestionBankManager = () => {
  // Implementation
};
```

#### Editor Components

```typescript
// src/features/question-bank/components/editor/QuestionEditor.tsx
import { useState } from "react";
import { api } from "@/utils/api";
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { TrueFalseEditor } from "./TrueFalseEditor";
import { MultipleResponseEditor } from "./MultipleResponseEditor";
import { FillInTheBlanksEditor } from "./FillInTheBlanksEditor";
// Import other editors...

export const QuestionEditor = ({
  initialQuestion,
  questionBankId,
  onSave,
  onCancel
}) => {
  // Renders the appropriate editor based on question type
  // Handles form submission and validation
  // Manages question metadata and content
};
```

The question bank editor components reuse UI components from the activities feature:

```typescript
// src/features/question-bank/components/editor/MultipleChoiceEditor.tsx
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';

export const MultipleChoiceEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing multiple choice questions
  // Manages options, correct answers, explanations, and media
};

// src/features/question-bank/components/editor/TrueFalseEditor.tsx
export const TrueFalseEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing true/false questions
  // Manages statement, correct answer, explanations, and media
};

// src/features/question-bank/components/editor/MultipleResponseEditor.tsx
export const MultipleResponseEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing multiple response questions
  // Manages options, correct answers, partial credit, explanations, and media
};

// src/features/question-bank/components/editor/FillInTheBlanksEditor.tsx
export const FillInTheBlanksEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing fill in the blanks questions
  // Manages text with blanks, correct answers, case sensitivity, and media
};

// src/features/question-bank/components/editor/MatchingEditor.tsx
export const MatchingEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing matching questions
  // Manages matching pairs, drag and drop reordering, explanations, and media
};

// src/features/question-bank/components/editor/DragAndDropEditor.tsx
export const DragAndDropEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing drag and drop questions
  // Manages draggable items, drop zones, background image, and explanations
};

// src/features/question-bank/components/editor/DragTheWordsEditor.tsx
export const DragTheWordsEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing drag the words questions
  // Manages text with placeholders, draggable words, explanations, and media
};

// src/features/question-bank/components/editor/NumericEditor.tsx
export const NumericEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing numeric questions
  // Manages correct answer, acceptable range, unit, explanations, and media
};

// src/features/question-bank/components/editor/SequenceEditor.tsx
export const SequenceEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing sequence questions
  // Manages sequence items, drag and drop reordering, explanations, and media
};

// src/features/question-bank/components/editor/FlashCardsEditor.tsx
export const FlashCardsEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing flash cards questions
  // Manages card front/back sides, card navigation, explanations, and media
};

// src/features/question-bank/components/editor/ReadingEditor.tsx
export const ReadingEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing reading questions
  // Manages passage text, sub-questions, explanations, and media
};

// src/features/question-bank/components/editor/VideoEditor.tsx
export const VideoEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing video questions
  // Manages video URL, timestamped questions, explanations, and hints
};

// src/features/question-bank/components/editor/ShortAnswerEditor.tsx
export const ShortAnswerEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing short answer questions
  // Manages question text, correct answers, case sensitivity, explanations, and media
};

// src/features/question-bank/components/editor/EssayEditor.tsx
export const EssayEditor = ({
  content,
  onChange
}) => {
  // Provides interface for editing essay questions
  // Manages question text, word count limits, rubrics, explanations, and media
};
```

#### Viewer Components

```typescript
// src/features/question-bank/components/viewer/QuestionViewer.tsx
export const QuestionViewer = ({
  question,
  className
}) => {
  // Displays a question in read-only mode
  // Shows question title, type, difficulty, and content
};

// src/features/question-bank/components/viewer/QuestionList.tsx
export const QuestionList = ({
  questions,
  onView,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  // Displays a list of questions with basic information
  // Provides action buttons for viewing, editing, duplicating, and deleting
};

// src/features/question-bank/components/viewer/QuestionDetail.tsx
export const QuestionDetail = ({
  question,
  onBack,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  // Displays detailed information about a question
  // Shows question content, metadata, and provides action buttons
};
```

### Hooks

Custom React hooks for question bank functionality.

```typescript
// src/features/question-bank/hooks/useQuestionBank.ts
import { useState } from "react";
import { api } from "@/utils/api";

export const useQuestionBank = (questionBankId: string) => {
  // Implementation
};
```

## Database Schema

The question bank uses the following database schema:

```prisma
model QuestionBank {
  id                String              @id @default(cuid())
  name              String
  description       String?
  institutionId     String
  createdById       String
  updatedById       String?
  status            SystemStatus        @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  partitionKey      String              // For database partitioning

  // Relations
  institution       Institution         @relation(fields: [institutionId], references: [id])
  createdBy         User                @relation("CreatedQuestionBanks", fields: [createdById], references: [id])
  updatedBy         User?               @relation("UpdatedQuestionBanks", fields: [updatedById], references: [id])
  questions         Question[]
  categories        QuestionCategory[]

  // Indexes
  @@index([institutionId, status])
  @@index([partitionKey])
}

model Question {
  id                String              @id @default(cuid())
  questionBankId    String
  title             String
  questionType      QuestionType
  difficulty        DifficultyLevel     @default(MEDIUM)
  content           Json                // Structured content specific to the question type
  metadata          Json?               // Additional metadata (tags, source, etc.)
  status            SystemStatus        @default(ACTIVE)

  // Academic context
  courseId          String?             // Optional course association
  subjectId         String              // Required subject association
  topicId           String?             // Optional topic association
  gradeLevel        Int?                // Grade/class level (1-12)

  // Source tracking
  sourceId          String?             // Optional reference to question source
  sourceReference   String?             // Reference within the source (e.g., page number)
  year              Int?                // Year of the question (especially for past papers)

  // Audit fields
  createdById       String
  updatedById       String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  partitionKey      String              // For database partitioning

  // Relations
  questionBank      QuestionBank        @relation(fields: [questionBankId], references: [id])
  course            Course?             @relation(fields: [courseId], references: [id])
  subject           Subject             @relation(fields: [subjectId], references: [id])
  topic             SubjectTopic?       @relation(fields: [topicId], references: [id])
  source            QuestionSource?     @relation(fields: [sourceId], references: [id])
  createdBy         User                @relation("CreatedQuestions", fields: [createdById], references: [id])
  updatedBy         User?               @relation("UpdatedQuestions", fields: [updatedById], references: [id])
  categories        QuestionCategoryMapping[]
  usageStats        QuestionUsageStats?

  // Indexes
  @@index([questionBankId, questionType, status])
  @@index([partitionKey])
  @@index([subjectId, status])
  @@index([courseId, status])
  @@index([topicId, status])
  @@index([gradeLevel, status])
  @@index([year])
  @@index([sourceId])
}

// Additional models...
```

## Integration Points

The Question Bank integrates with other system components:

1. **Activities System**
   - Questions can be selected from the question bank for activities
   - Usage statistics are tracked when questions are used in activities

2. **Assessment System**
   - Assessments can be generated from question bank questions
   - Question pools can be created for randomized assessments

3. **Analytics System**
   - Question performance data is analyzed
   - Difficulty ratings are adjusted based on student performance

4. **Content Studio**
   - Questions can be created and managed through the content studio
   - Bulk upload and import/export functionality is available

## Partitioning Strategy

To handle millions of questions efficiently, the question bank implements a multi-level partitioning strategy:

1. **Institution-Based Partitioning**
   - Each institution's questions are stored in separate logical partitions
   - Partition key format: `inst_{INSTITUTION_ID}`

2. **Grade Level Partitioning**
   - Questions are further partitioned by grade level
   - Partition key format: `inst_{INSTITUTION_ID}_grade_{GRADE_LEVEL}`

3. **Subject-Based Partitioning**
   - Within each grade level, questions are partitioned by subject
   - Partition key format: `inst_{INSTITUTION_ID}_grade_{GRADE_LEVEL}_subj_{SUBJECT_ID}`

## Security Considerations

1. **Role-Based Access Control**
   - Different user roles have different access levels
   - Teachers can create and edit questions
   - Administrators can manage question banks

2. **Institution Isolation**
   - Questions are isolated by institution
   - Cross-institution sharing requires explicit permission

3. **Audit Logging**
   - All operations on questions are logged
   - Provides accountability and traceability

4. **Content Validation**
   - Question content is validated before storage
   - Prevents malicious content or code injection

## Performance Optimizations

1. **Caching Strategy**
   - Frequently used questions are cached in memory
   - Category and metadata information is cached separately
   - Redis is used for distributed caching

2. **Read Replicas**
   - Read-heavy operations are directed to database read replicas
   - Write operations go to the primary database

3. **Batch Processing**
   - Bulk operations use efficient batch processing
   - Background jobs handle resource-intensive operations

4. **Query Optimization**
   - Queries are optimized with proper indexing
   - Complex searches use database-specific optimization techniques

## Conclusion

The Question Bank architecture provides a scalable, efficient solution for managing millions of questions across multiple institutions, grade levels, and subjects. By implementing proper database partitioning, caching strategies, and background processing, the system can handle high loads while maintaining performance and data integrity.
