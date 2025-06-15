# Question Bank System Design

## Overview

The Question Bank is a centralized repository for storing, managing, and retrieving questions that can be used across various activities and assessments in the aivy-lxp platform. This document outlines the design of a scalable, database-partitioned question bank system capable of handling millions of questions across 12 levels of classes.

## Current Question Types

The system currently supports the following question types:

1. **Multiple Choice**
   - Single correct answer from multiple options
   - Properties: question text, options array, correct option, explanation, hint, points

2. **True/False**
   - Binary choice questions
   - Properties: question text, correct answer (true/false), explanation, hint, points

3. **Multiple Response**
   - Multiple correct answers from a set of options
   - Properties: question text, options array, correct options, explanation, hint, points, partial credit settings

4. **Fill in the Blanks**
   - Text with missing words/phrases to be completed
   - Properties: question text with placeholders, correct answers for each blank, case sensitivity, partial credit settings

5. **Matching**
   - Pairs of items to be matched correctly
   - Properties: question text, pairs of items, explanation, hint, points, partial credit settings

6. **Drag and Drop**
   - Items to be dragged to correct zones/positions
   - Properties: question text, draggable items, drop zones, correct mappings, background image

7. **Drag the Words**
   - Words to be dragged into correct positions within text
   - Properties: question text, draggable words, correct positions

8. **Numeric**
   - Questions requiring numeric answers
   - Properties: question text, correct answer, acceptable range, unit, explanation, hint, points

9. **Sequence**
   - Items to be arranged in the correct order
   - Properties: question text, sequence items, correct order, explanation, hint, points

10. **Flash Cards**
    - Two-sided cards with question/answer pairs
    - Properties: front text, back text, hint, media

11. **Reading**
    - Text passages with associated questions
    - Properties: passage text, associated questions of various types

12. **Video**
    - Video content with associated questions
    - Properties: video URL, associated questions, timestamps

13. **Short Answer**
    - Short answer questions
    - Properties: question text, correct answer, case sensitivity, points

14. **Essay**
    - Long-form essay questions
    - Properties: question text, word count limits, grading rubric

## Question Bank Database Design

### Core Models

#### 1. Question Bank

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
```

#### 2. Question

```prisma
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
  @@index([sourceId])
}
```

#### 3. Question Categories

```prisma
model QuestionCategory {
  id                String                    @id @default(cuid())
  name              String
  description       String?
  questionBankId    String
  parentId          String?
  status            SystemStatus              @default(ACTIVE)
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  // Relations
  questionBank      QuestionBank              @relation(fields: [questionBankId], references: [id])
  parent            QuestionCategory?         @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children          QuestionCategory[]        @relation("CategoryHierarchy")
  questions         QuestionCategoryMapping[]

  // Indexes
  @@index([questionBankId, status])
  @@index([parentId])
}
```

#### 4. Question Category Mapping

```prisma
model QuestionCategoryMapping {
  id                String              @id @default(cuid())
  questionId        String
  categoryId        String
  createdAt         DateTime            @default(now())

  // Relations
  question          Question            @relation(fields: [questionId], references: [id])
  category          QuestionCategory    @relation(fields: [categoryId], references: [id])

  // Indexes
  @@index([questionId])
  @@index([categoryId])
  @@unique([questionId, categoryId])
}
```

#### 5. Question Usage Statistics

```prisma
model QuestionUsageStats {
  id                String              @id @default(cuid())
  questionId        String              @unique
  usageCount        Int                 @default(0)
  correctCount      Int                 @default(0)
  incorrectCount    Int                 @default(0)
  partialCount      Int                 @default(0)
  averageTime       Float?              // Average time in seconds to answer
  difficultyRating  Float?              // Calculated difficulty based on performance
  lastUsedAt        DateTime?
  updatedAt         DateTime            @updatedAt

  // Relations
  question          Question            @relation(fields: [questionId], references: [id])

  // Indexes
  @@index([questionId])
  @@index([usageCount])
  @@index([difficultyRating])
}
```

#### 6. Question Source

```prisma
model QuestionSource {
  id                String              @id @default(cuid())
  name              String
  description       String?
  type              QuestionSourceType  // TEXTBOOK, PAST_PAPER, CUSTOM, etc.
  metadata          Json?               // Additional metadata about the source
  institutionId     String
  status            SystemStatus        @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  // Relations
  institution       Institution         @relation(fields: [institutionId], references: [id])

  // Indexes
  @@index([institutionId, status])
}
```

### Enums

```prisma
enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  MULTIPLE_RESPONSE
  FILL_IN_THE_BLANKS
  MATCHING
  DRAG_AND_DROP
  DRAG_THE_WORDS
  NUMERIC
  SEQUENCE
  FLASH_CARDS
  READING
  VIDEO
  ESSAY
  SHORT_ANSWER
  HOTSPOT
  LIKERT_SCALE
}

enum DifficultyLevel {
  VERY_EASY
  EASY
  MEDIUM
  HARD
  VERY_HARD
}

enum QuestionSourceType {
  TEXTBOOK
  PAST_PAPER
  CUSTOM
  GENERATED
  IMPORTED
  THIRD_PARTY
}
```

## Database Partitioning Strategy

To handle millions of questions efficiently, the question bank implements a multi-level partitioning strategy:

### 1. Horizontal Partitioning (Sharding)

Questions are partitioned based on several key dimensions:

#### Institution-Based Partitioning
- Each institution's questions are stored in separate logical partitions
- Partition key format: `inst_{INSTITUTION_ID}`

#### Grade Level Partitioning
- Questions are further partitioned by grade level
- Partition key format: `inst_{INSTITUTION_ID}_grade_{GRADE_LEVEL}`

#### Subject-Based Partitioning
- Within each grade level, questions are partitioned by subject
- Partition key format: `inst_{INSTITUTION_ID}_grade_{GRADE_LEVEL}_subj_{SUBJECT_ID}`

### 2. Time-Based Partitioning

For historical questions and analytics:

- Recent questions (last 2 years): Stored in active partitions
- Older questions: Archived in historical partitions
- Partition key includes year: `inst_{INSTITUTION_ID}_grade_{GRADE_LEVEL}_subj_{SUBJECT_ID}_year_{YEAR}`

### 3. Partition Implementation

The partitioning is implemented through:

1. **Partition Keys**: Each question record includes a partition key field
2. **Database Indexes**: Optimized indexes on partition keys
3. **Query Routing**: Application logic to route queries to appropriate partitions
4. **Partition Management**: Background jobs to manage partition lifecycle

## Question Content Structure

Each question type has a standardized JSON structure stored in the `content` field:

### Multiple Choice Example

```json
{
  "text": "What is the capital of France?",
  "options": [
    { "id": "a", "text": "London", "isCorrect": false },
    { "id": "b", "text": "Paris", "isCorrect": true },
    { "id": "c", "text": "Berlin", "isCorrect": false },
    { "id": "d", "text": "Rome", "isCorrect": false }
  ],
  "explanation": "Paris is the capital and most populous city of France.",
  "hint": "Think about the Eiffel Tower.",
  "points": 1,
  "media": {
    "type": "image",
    "url": "https://example.com/paris.jpg",
    "alt": "Paris skyline with Eiffel Tower",
    "caption": "The Paris skyline"
  }
}
```

## Question Bank API

The Question Bank provides a comprehensive API for managing and retrieving questions. The API is implemented using tRPC to ensure type safety and efficient client-server communication.

### tRPC Router Implementation

The Question Bank API is implemented as a tRPC router with the following structure:

```typescript
// src/server/api/routers/question-bank.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, QuestionType, DifficultyLevel } from "@prisma/client";

// Input validation schemas
const createQuestionSchema = z.object({
  questionBankId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(DifficultyLevel).optional().default("MEDIUM"),
  content: z.record(z.any()),
  subjectId: z.string(),
  courseId: z.string().optional(),
  topicId: z.string().optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  sourceId: z.string().optional(),
  sourceReference: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const bulkUploadSchema = z.object({
  questionBankId: z.string(),
  questions: z.array(createQuestionSchema),
  validateOnly: z.boolean().optional().default(false),
});

export const questionBankRouter = createTRPCRouter({
  // Create a new question bank
  createQuestionBank: protectedProcedure
    .input(z.object({
      name: z.string().min(3, "Name must be at least 3 characters"),
      description: z.string().optional(),
      institutionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation details...
    }),

  // Create a new question
  createQuestion: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details...
    }),

  // Bulk upload questions
  bulkUploadQuestions: protectedProcedure
    .input(bulkUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { questionBankId, questions, validateOnly } = input;
      const results = {
        total: questions.length,
        successful: 0,
        failed: 0,
        errors: [] as { index: number; message: string }[],
      };

      // Validate question bank exists
      const questionBank = await ctx.prisma.questionBank.findUnique({
        where: { id: questionBankId, status: SystemStatus.ACTIVE },
      });

      if (!questionBank) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question bank not found",
        });
      }

      // Process questions in batches for better performance
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < questions.length; i += batchSize) {
        batches.push(questions.slice(i, i + batchSize));
      }

      // Process each batch
      for (const [batchIndex, batch] of batches.entries()) {
        try {
          // If validateOnly is true, just validate without saving
          if (!validateOnly) {
            await ctx.prisma.$transaction(async (tx) => {
              for (const [index, question] of batch.entries()) {
                const globalIndex = batchIndex * batchSize + index;

                try {
                  // Generate partition key
                  const partitionKey = `inst_${questionBank.institutionId}_grade_${question.gradeLevel || 0}_subj_${question.subjectId}`;

                  // Create the question
                  const createdQuestion = await tx.question.create({
                    data: {
                      questionBankId,
                      title: question.title,
                      questionType: question.questionType,
                      difficulty: question.difficulty,
                      content: question.content,
                      subjectId: question.subjectId,
                      courseId: question.courseId,
                      topicId: question.topicId,
                      gradeLevel: question.gradeLevel,
                      sourceId: question.sourceId,
                      sourceReference: question.sourceReference,
                      metadata: question.metadata,
                      status: SystemStatus.ACTIVE,
                      partitionKey,
                      createdById: ctx.session.user.id,
                    },
                  });

                  // Create category mappings if provided
                  if (question.categoryIds && question.categoryIds.length > 0) {
                    await Promise.all(
                      question.categoryIds.map((categoryId) =>
                        tx.questionCategoryMapping.create({
                          data: {
                            questionId: createdQuestion.id,
                            categoryId,
                          },
                        })
                      )
                    );
                  }

                  // Initialize usage stats
                  await tx.questionUsageStats.create({
                    data: {
                      questionId: createdQuestion.id,
                    },
                  });

                  results.successful++;
                } catch (error) {
                  results.failed++;
                  results.errors.push({
                    index: globalIndex,
                    message: error instanceof Error ? error.message : String(error),
                  });
                }
              }
            });
          } else {
            // Just count as successful for validation
            results.successful += batch.length;
          }
        } catch (error) {
          // If a batch fails, mark all questions in the batch as failed
          results.failed += batch.length;
          results.successful -= batch.length;

          for (let i = 0; i < batch.length; i++) {
            const globalIndex = batchIndex * batchSize + i;
            results.errors.push({
              index: globalIndex,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      return results;
    }),

  // Get questions with filtering and pagination
  getQuestions: protectedProcedure
    .input(z.object({
      questionBankId: z.string(),
      filters: z.object({
        questionType: z.nativeEnum(QuestionType).optional(),
        difficulty: z.nativeEnum(DifficultyLevel).optional(),
        subjectId: z.string().optional(),
        courseId: z.string().optional(),
        topicId: z.string().optional(),
        gradeLevel: z.number().int().min(1).max(12).optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        status: z.nativeEnum(SystemStatus).optional().default("ACTIVE"),
      }).optional(),
      pagination: z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }).optional(),
      sorting: z.object({
        field: z.enum(["title", "createdAt", "updatedAt", "difficulty"]).default("createdAt"),
        direction: z.enum(["asc", "desc"]).default("desc"),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation details...
    }),

  // Additional procedures...
});
```

### Core Endpoints

1. **Create Question**
   - `POST /api/question-bank/{bankId}/questions`
   - Creates a new question in the specified bank

2. **Batch Create Questions**
   - `POST /api/question-bank/{bankId}/questions/batch`
   - Creates multiple questions in a single operation

3. **Update Question**
   - `PUT /api/question-bank/questions/{questionId}`
   - Updates an existing question

4. **Get Question**
   - `GET /api/question-bank/questions/{questionId}`
   - Retrieves a specific question by ID

5. **Search Questions**
   - `GET /api/question-bank/{bankId}/questions/search`
   - Searches for questions based on various criteria

6. **List Questions by Category**
   - `GET /api/question-bank/{bankId}/categories/{categoryId}/questions`
   - Lists all questions in a specific category

7. **Import Questions**
   - `POST /api/question-bank/{bankId}/import`
   - Imports questions from external sources

8. **Export Questions**
   - `GET /api/question-bank/{bankId}/export`
   - Exports questions to various formats

9. **Bulk Upload Questions**
   - `POST /api/question-bank/{bankId}/bulk-upload`
   - Uploads multiple questions from CSV, Excel, or JSON files
   - Supports validation, error reporting, and transaction rollback

### Bulk Upload Formats

The question bank supports multiple formats for bulk uploading questions:

#### CSV Format

```csv
QuestionType,Title,Difficulty,SubjectId,TopicId,GradeLevel,Content
MULTIPLE_CHOICE,"What is the capital of France?",EASY,subj_123,topic_456,5,"{""text"":""What is the capital of France?"",""options"":[{""id"":""a"",""text"":""London"",""isCorrect"":false},{""id"":""b"",""text"":""Paris"",""isCorrect"":true},{""id"":""c"",""text"":""Berlin"",""isCorrect"":false},{""id"":""d"",""text"":""Rome"",""isCorrect"":false}],""explanation"":""Paris is the capital of France.""}"
TRUE_FALSE,"The Earth is flat.",EASY,subj_123,topic_457,5,"{""text"":""The Earth is flat."",""isTrue"":false,""explanation"":""The Earth is approximately spherical in shape.""}"
```

#### Excel Format

The Excel format follows the same structure as the CSV format but allows for better formatting and multiple sheets for different question types.

#### JSON Format

```json
{
  "questions": [
    {
      "questionType": "MULTIPLE_CHOICE",
      "title": "What is the capital of France?",
      "difficulty": "EASY",
      "subjectId": "subj_123",
      "topicId": "topic_456",
      "gradeLevel": 5,
      "content": {
        "text": "What is the capital of France?",
        "options": [
          { "id": "a", "text": "London", "isCorrect": false },
          { "id": "b", "text": "Paris", "isCorrect": true },
          { "id": "c", "text": "Berlin", "isCorrect": false },
          { "id": "d", "text": "Rome", "isCorrect": false }
        ],
        "explanation": "Paris is the capital of France."
      }
    },
    {
      "questionType": "TRUE_FALSE",
      "title": "The Earth is flat.",
      "difficulty": "EASY",
      "subjectId": "subj_123",
      "topicId": "topic_457",
      "gradeLevel": 5,
      "content": {
        "text": "The Earth is flat.",
        "isTrue": false,
        "explanation": "The Earth is approximately spherical in shape."
      }
    }
  ]
}
```

### Advanced Endpoints

1. **Question Analytics**
   - `GET /api/question-bank/questions/{questionId}/analytics`
   - Retrieves usage and performance analytics for a question

2. **Similar Questions**
   - `GET /api/question-bank/questions/{questionId}/similar`
   - Finds questions similar to a given question

3. **Random Questions**
   - `GET /api/question-bank/{bankId}/random`
   - Retrieves random questions based on criteria

4. **Question Difficulty Analysis**
   - `GET /api/question-bank/{bankId}/difficulty-analysis`
   - Analyzes question difficulty based on student performance

## Integration with Activities and Assessments

The Question Bank integrates seamlessly with the existing activity and assessment systems using tRPC APIs:

### Activity Integration

1. **Question Selection**
   - Activities can select questions from the question bank
   - Questions can be filtered by type, difficulty, category, etc.
   - Integration with the activity editor UI:

   ```typescript
   // src/components/activities/editor/QuestionBankSelector.tsx
   import { api } from "@/utils/api";

   export const QuestionBankSelector = ({
     subjectId,
     topicId,
     questionType,
     onSelectQuestions
   }) => {
     const [search, setSearch] = useState("");
     const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

     // Fetch questions from the question bank
     const { data, isLoading } = api.questionBank.getQuestions.useQuery({
       questionBankId: "default", // Or selected bank
       filters: {
         subjectId,
         topicId,
         questionType,
         search: search || undefined,
       },
       pagination: { page: 1, pageSize: 20 },
     });

     // Handle question selection
     const handleSelectQuestion = (questionId: string) => {
       if (selectedQuestions.includes(questionId)) {
         setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
       } else {
         setSelectedQuestions([...selectedQuestions, questionId]);
       }
     };

     // Add selected questions to activity
     const handleAddQuestions = () => {
       if (selectedQuestions.length > 0) {
         onSelectQuestions(selectedQuestions);
       }
     };

     return (
       <div className="question-bank-selector">
         {/* UI implementation */}
       </div>
     );
   };
   ```

2. **Question Reuse**
   - The same question can be used in multiple activities
   - Usage statistics are tracked across all instances
   - Implementation in the activity service:

   ```typescript
   // src/server/api/services/activity.service.ts

   async createActivityWithBankQuestions(input: CreateActivityInput, questionIds: string[]) {
     // Create the activity
     const activity = await this.prisma.activity.create({
       data: {
         // Activity data
       },
     });

     // Fetch questions from the bank
     const questions = await this.prisma.question.findMany({
       where: {
         id: { in: questionIds },
         status: SystemStatus.ACTIVE,
       },
     });

     // Update the activity content with the questions
     const content = {
       ...input.content,
       questions: questions.map(q => ({
         id: q.id,
         questionBankRef: q.id, // Reference to the original question
         ...q.content,
       })),
     };

     // Update the activity with the questions
     await this.prisma.activity.update({
       where: { id: activity.id },
       data: { content },
     });

     // Update usage statistics for each question
     await Promise.all(
       questionIds.map(qId =>
         this.prisma.questionUsageStats.update({
           where: { questionId: qId },
           data: {
             usageCount: { increment: 1 },
             lastUsedAt: new Date(),
           },
         })
       )
     );

     return activity;
   }
   ```

3. **Question Versioning**
   - Questions can be versioned to track changes over time
   - Activities can reference specific versions of questions
   - Implementation in the question bank service:

   ```typescript
   // When updating a question, create a version record
   async updateQuestion(id: string, data: UpdateQuestionInput) {
     // Get the current question
     const currentQuestion = await this.prisma.question.findUnique({
       where: { id },
     });

     if (!currentQuestion) {
       throw new Error("Question not found");
     }

     // Create a version record
     await this.prisma.questionVersion.create({
       data: {
         questionId: id,
         versionNumber: await this.getNextVersionNumber(id),
         content: currentQuestion.content,
         metadata: currentQuestion.metadata,
         createdById: currentQuestion.createdById,
       },
     });

     // Update the question
     return this.prisma.question.update({
       where: { id },
       data,
     });
   }
   ```

### Assessment Integration

1. **Assessment Generation**
   - Assessments can be automatically generated from the question bank
   - Rules can be defined for question selection based on difficulty, category, etc.
   - Implementation in the assessment service:

   ```typescript
   // src/server/api/services/assessment.service.ts

   async generateAssessment(input: GenerateAssessmentInput) {
     const {
       title,
       subjectId,
       classId,
       topicId,
       difficultyDistribution,
       questionTypeDistribution,
       totalQuestions,
     } = input;

     // Calculate how many questions of each difficulty
     const difficultyCount = this.calculateDistribution(
       totalQuestions,
       difficultyDistribution
     );

     // Calculate how many questions of each type
     const typeCount = this.calculateDistribution(
       totalQuestions,
       questionTypeDistribution
     );

     // Query questions based on the criteria
     const questions = await this.questionBankService.getQuestionsForAssessment({
       subjectId,
       topicId,
       difficultyCount,
       typeCount,
     });

     // Create the assessment
     return this.prisma.assessment.create({
       data: {
         title,
         subjectId,
         classId,
         topicId,
         content: {
           questions: questions.map(q => ({
             id: q.id,
             questionBankRef: q.id,
             ...q.content,
           })),
         },
         // Other assessment data
       },
     });
   }
   ```

2. **Question Pools**
   - Assessments can define pools of questions from which random selections are made
   - Ensures variety in assessment content
   - Implementation in the assessment router:

   ```typescript
   // src/server/api/routers/assessment.ts

   createQuestionPool: protectedProcedure
     .input(z.object({
       assessmentId: z.string(),
       name: z.string(),
       description: z.string().optional(),
       filters: z.object({
         subjectId: z.string(),
         topicId: z.string().optional(),
         difficulty: z.nativeEnum(DifficultyLevel).optional(),
         questionType: z.nativeEnum(QuestionType).optional(),
         categoryIds: z.array(z.string()).optional(),
       }),
       selectionRules: z.object({
         count: z.number().int().min(1),
         randomize: z.boolean().default(true),
       }),
     }))
     .mutation(async ({ ctx, input }) => {
       // Implementation details...
     }),
   ```

3. **Performance Tracking**
   - Student performance on questions is tracked back to the question bank
   - Helps refine question difficulty and quality
   - Implementation in the activity submission handler:

   ```typescript
   // src/server/api/services/activity-submission.service.ts

   async processSubmission(submission: ActivitySubmission) {
     // Process the submission and grade it
     const gradingResult = await this.gradeSubmission(submission);

     // Update question usage statistics
     for (const answer of gradingResult.answers) {
       if (answer.questionBankRef) {
         // Update the question stats based on correctness
         await this.prisma.questionUsageStats.update({
           where: { questionId: answer.questionBankRef },
           data: {
             correctCount: answer.isCorrect
               ? { increment: 1 }
               : undefined,
             incorrectCount: !answer.isCorrect && !answer.isPartiallyCorrect
               ? { increment: 1 }
               : undefined,
             partialCount: answer.isPartiallyCorrect
               ? { increment: 1 }
               : undefined,
           },
         });
       }
     }

     // Return the grading result
     return gradingResult;
   }
   ```

## Scalability Considerations

To handle millions of questions and high query loads, the system implements:

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

5. **Content Delivery Network (CDN)**
   - Media assets associated with questions are served through a CDN
   - Reduces load on the application servers

## Background Jobs

Several background jobs maintain the question bank's performance and data integrity:

1. **Usage Statistics Aggregation**
   - Aggregates question usage statistics periodically
   - Updates difficulty ratings based on student performance

2. **Partition Management**
   - Creates new partitions as needed
   - Archives old or unused partitions

3. **Search Index Maintenance**
   - Updates search indexes for efficient question discovery
   - Rebuilds indexes periodically for optimal performance

4. **Data Validation**
   - Validates question data integrity
   - Fixes inconsistencies in question metadata

## Security and Access Control

The question bank implements a comprehensive security model:

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

## Future Enhancements

1. **AI-Powered Question Generation**
   - Automatic generation of questions based on learning materials
   - AI-assisted question improvement suggestions

2. **Advanced Analytics**
   - Question effectiveness analysis
   - Learning gap identification through question performance

3. **Collaborative Editing**
   - Real-time collaborative question editing
   - Version control and change tracking

4. **Question Quality Scoring**
   - Automated quality assessment of questions
   - Suggestions for improving low-quality questions

5. **Cross-Platform Integration**
   - Integration with third-party learning platforms
   - Question import/export in standard formats (QTI, etc.)

## Conclusion

The Question Bank system provides a scalable, efficient solution for managing millions of questions across multiple institutions, grade levels, and subjects. By implementing proper database partitioning, caching strategies, and background processing, the system can handle high loads while maintaining performance and data integrity.

The modular design allows for easy extension with new question types and integration with existing and future platform components. The comprehensive API enables seamless integration with activities, assessments, and external systems.
