# Bloom's Taxonomy and Rubrics Schema Design

This document outlines the schema changes and additions needed to integrate Bloom's Taxonomy and Rubrics into our assessment system.

## Curriculum-Level Integration

### 1. Bloom's Taxonomy Levels Enum

```prisma
enum BloomsTaxonomyLevel {
  REMEMBER
  UNDERSTAND
  APPLY
  ANALYZE
  EVALUATE
  CREATE
}
```

### 2. Subject and Topic Schema Updates

```prisma
model Subject {
  id                          String   @id @default(cuid())
  name                        String
  // Existing fields...

  recommendedBloomsDistribution Json?   // Distribution across Bloom's levels

  // Relationships
  topics                      Topic[]
  learningOutcomes            LearningOutcome[]
  // Other relationships...
}

model Topic {
  id                          String   @id @default(cuid())
  name                        String
  subjectId                   String
  // Existing fields...

  recommendedBloomsDistribution Json?   // Distribution across Bloom's levels

  // Relationships
  subject                     Subject  @relation(fields: [subjectId], references: [id])
  learningOutcomes            LearningOutcome[]
  // Other relationships...
}
```

### 3. Learning Outcome Schema (Curriculum Level)

```typescript
export interface LearningOutcome {
  id: string;
  statement: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[]; // Suggested action verbs for this outcome
  subjectId: string;
  topicId?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Bloom's Taxonomy Action Verbs

```typescript
export const bloomsActionVerbs: Record<BloomsTaxonomyLevel, string[]> = {
  REMEMBER: [
    'cite', 'define', 'describe', 'identify', 'list', 'name', 'outline',
    'quote', 'recall', 'recite', 'recognize', 'record', 'repeat', 'reproduce', 'state'
  ],
  UNDERSTAND: [
    'classify', 'compare', 'contrast', 'demonstrate', 'discuss', 'explain',
    'express', 'identify', 'indicate', 'interpret', 'locate', 'recognize',
    'report', 'restate', 'review', 'select', 'summarize', 'translate'
  ],
  APPLY: [
    'apply', 'calculate', 'complete', 'demonstrate', 'dramatize', 'employ',
    'examine', 'illustrate', 'interpret', 'operate', 'practice', 'schedule',
    'sketch', 'solve', 'use', 'write'
  ],
  ANALYZE: [
    'analyze', 'appraise', 'categorize', 'compare', 'contrast', 'criticize',
    'differentiate', 'discriminate', 'distinguish', 'examine', 'experiment',
    'question', 'test'
  ],
  EVALUATE: [
    'appraise', 'argue', 'assess', 'choose', 'compare', 'conclude', 'contrast',
    'criticize', 'critique', 'decide', 'defend', 'evaluate', 'judge', 'justify',
    'predict', 'prioritize', 'rate', 'select', 'support', 'value'
  ],
  CREATE: [
    'arrange', 'assemble', 'collect', 'compose', 'construct', 'create', 'design',
    'develop', 'formulate', 'generate', 'integrate', 'invent', 'make', 'organize',
    'plan', 'prepare', 'produce', 'propose', 'set up', 'synthesize'
  ]
};
```

## Lesson Plan Integration

### 1. Lesson Plan Schema Updates

```prisma
model LessonPlan {
  id                String              @id @default(cuid())
  title             String
  description       String?
  // Existing fields...

  learningOutcomeIds String[]           // References to curriculum learning outcomes
  bloomsDistribution Json?              // Distribution across Bloom's levels

  // Relationships
  activities        Activity[]
  assessments       Assessment[]
  // Other relationships...
}
```

```typescript
export interface LessonPlanWithBloomsTaxonomy extends LessonPlan {
  learningOutcomes: LearningOutcome[];
  bloomsDistribution: BloomsDistribution;
  cognitiveBalanceAnalysis?: {
    isBalanced: boolean;
    recommendations?: string[];
    missingLevels?: BloomsTaxonomyLevel[];
  };
}
```

## Rubric Schema

### 1. Rubric Types Enum

```prisma
enum RubricType {
  HOLISTIC
  ANALYTIC
}
```

### 2. Rubric Schema

```typescript
export interface Rubric {
  id: string;
  title: string;
  description?: string;
  type: RubricType;
  criteria: RubricCriterion[];
  maxScore: number;
  learningOutcomeIds?: string[];      // References to curriculum learning outcomes
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  weight: number; // Percentage weight of this criterion
  performanceLevels: PerformanceLevel[];
  learningOutcomeId?: string;        // Reference to specific learning outcome
}

export interface PerformanceLevel {
  id: string;
  title: string;
  description: string;
  score: number;
}
```

### 3. Holistic Rubric Schema

```typescript
export interface HolisticRubric extends Omit<Rubric, 'criteria'> {
  type: RubricType.HOLISTIC;
  performanceLevels: PerformanceLevel[];
}
```

## Assessment Schema Updates

### 1. Assessment Schema Updates

```typescript
export interface BloomsDistribution {
  REMEMBER: number; // Percentage of questions at this level
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface AssessmentWithBloomsTaxonomy extends Assessment {
  learningOutcomeIds: string[];       // References to curriculum learning outcomes
  rubricId?: string;                  // Reference to rubric
  bloomsDistribution?: BloomsDistribution;
  lessonPlanId?: string;              // Reference to lesson plan

  // Populated relationships
  learningOutcomes?: LearningOutcome[];
  rubric?: Rubric;
  lessonPlan?: LessonPlan;
}
```

### 2. Question Schema Updates

```typescript
export interface QuestionWithBloomsTaxonomy extends Question {
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];              // Action verbs used in this question
  difficultyLevel: 'easy' | 'medium' | 'hard';
  learningOutcomeId?: string;         // Reference to specific learning outcome
}
```

## Database Schema Updates

### 1. Prisma Schema Updates

```prisma
model LearningOutcome {
  id          String              @id @default(cuid())
  statement   String
  description String?
  bloomsLevel BloomsTaxonomyLevel
  actionVerbs String[]
  subjectId   String
  topicId     String?
  createdById String
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  subject     Subject             @relation(fields: [subjectId], references: [id])
  topic       Topic?              @relation(fields: [topicId], references: [id])
  createdBy   User                @relation(fields: [createdById], references: [id])

  lessonPlans LessonPlan[]
  assessments Assessment[]
  questions   Question[]
}

model Rubric {
  id                String     @id @default(cuid())
  title             String
  description       String?
  type              RubricType
  maxScore          Float
  learningOutcomeIds String[]
  createdById       String
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  criteria          Json       // Stored as JSON for flexibility

  createdBy         User       @relation(fields: [createdById], references: [id])
  assessments       Assessment[]
  activities        Activity[]
}

model LessonPlan {
  // Existing fields...

  learningOutcomeIds String[]
  bloomsDistribution Json?

  learningOutcomes   LearningOutcome[]
  activities         Activity[]
  assessments        Assessment[]
}
```

### 2. Assessment Model Updates

```prisma
model Assessment {
  // Existing fields...

  bloomsDistribution Json?
  learningOutcomeIds String[]
  rubricId           String?
  lessonPlanId       String?

  learningOutcomes   LearningOutcome[]
  rubric             Rubric?              @relation(fields: [rubricId], references: [id])
  lessonPlan         LessonPlan?          @relation(fields: [lessonPlanId], references: [id])
}
```

### 3. Activity Model Updates

```prisma
model Activity {
  // Existing fields...

  bloomsLevel        BloomsTaxonomyLevel?
  isInClassActivity  Boolean              @default(true)
  learningOutcomeIds String[]
  rubricId           String?
  lessonPlanId       String?

  learningOutcomes   LearningOutcome[]
  rubric             Rubric?              @relation(fields: [rubricId], references: [id])
  lessonPlan         LessonPlan?          @relation(fields: [lessonPlanId], references: [id])
}
```

## API Schema Updates

### 1. Create Learning Outcome Schema

```typescript
export const createLearningOutcomeSchema = z.object({
  statement: z.string().min(1, "Statement is required"),
  description: z.string().optional(),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  actionVerbs: z.array(z.string()).optional(),
  subjectId: z.string(),
  topicId: z.string().optional()
});
```

### 2. Update Lesson Plan Schema

```typescript
export const updateLessonPlanSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  // Existing fields...

  learningOutcomeIds: z.array(z.string()).optional(),
  bloomsDistribution: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number()).optional()
});
```

### 3. Create Assessment Schema

```typescript
export const createAssessmentSchema = z.object({
  // Existing fields...

  learningOutcomeIds: z.array(z.string()).optional(),
  rubricId: z.string().optional(),
  lessonPlanId: z.string().optional(),
  bloomsDistribution: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number()).optional(),

  // For creating a new rubric during assessment creation
  rubric: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.nativeEnum(RubricType),
    learningOutcomeIds: z.array(z.string()).optional(),
    criteria: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
        learningOutcomeId: z.string().optional(),
        weight: z.number(),
        performanceLevels: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            score: z.number()
          })
        )
      })
    )
  }).optional()
});
```

### 4. Create Activity Schema

```typescript
export const createActivitySchema = z.object({
  // Existing fields...

  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  isInClassActivity: z.boolean().optional().default(true),
  learningOutcomeIds: z.array(z.string()).optional(),
  rubricId: z.string().optional(),
  lessonPlanId: z.string().optional()
});
```

## Migration Strategy

1. Add Bloom's Taxonomy enum to the schema
2. Update Subject and Topic models with Bloom's distribution fields
3. Create new LearningOutcome model at curriculum level
4. Update LessonPlan model with learning outcome relationships
5. Create new Rubric model with learning outcome relationships
6. Update Assessment and Activity models with new fields and relationships
7. Create migrations that preserve existing data
8. Update API schemas to include new fields
9. Implement backward compatibility for existing content

This schema design provides a comprehensive foundation for integrating Bloom's Taxonomy and Rubrics into our assessment system while maintaining compatibility with existing functionality. By starting at the curriculum level and flowing through lesson plans to activities and assessments, we ensure a coherent alignment throughout the educational process.
