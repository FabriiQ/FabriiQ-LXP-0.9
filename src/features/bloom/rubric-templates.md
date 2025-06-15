# Rubric Templates for Bloom's Taxonomy-Aligned Activities

This document provides detailed rubric templates for assessing activities aligned with each level of Bloom's Taxonomy.

## Rubric Structure

Each rubric template follows a consistent structure:

```typescript
export interface RubricTemplate {
  id: string;
  title: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  activityTypes: LearningActivityType[];
  criteria: RubricCriterion[];
  performanceLevels?: PerformanceLevel[]; // Global performance levels (optional)
  maxScore: number;
  passingScore: number;
}
```

## Remembering Level Rubric Templates

### 1. Fact Recall Rubric

**Purpose**: Assess activities focused on recalling facts, terms, and basic concepts.

```typescript
export const factRecallRubric: RubricTemplate = {
  id: 'fact-recall-rubric',
  title: 'Fact Recall Rubric',
  description: 'Assesses the ability to recall facts, terms, and basic concepts',
  bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
  activityTypes: [
    LearningActivityType.MULTIPLE_CHOICE,
    LearningActivityType.FILL_IN_THE_BLANKS,
    LearningActivityType.MATCHING,
    LearningActivityType.TRUE_FALSE,
    LearningActivityType.FLASHCARDS
  ],
  criteria: [
    {
      id: 'accuracy',
      title: 'Accuracy',
      description: 'Correctness of recalled information',
      weight: 50,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: '90-100% of information recalled correctly',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: '75-89% of information recalled correctly',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: '60-74% of information recalled correctly',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Less than 60% of information recalled correctly',
          score: 1
        }
      ]
    },
    {
      id: 'completeness',
      title: 'Completeness',
      description: 'Extent to which all required information is recalled',
      weight: 30,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'All required information is recalled',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Most required information is recalled',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Some required information is recalled',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Little required information is recalled',
          score: 1
        }
      ]
    },
    {
      id: 'speed',
      title: 'Speed',
      description: 'Efficiency of recall within time constraints',
      weight: 20,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Rapid recall with all tasks completed within time limit',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Efficient recall with most tasks completed within time limit',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Adequate recall with some tasks completed within time limit',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Slow recall with few tasks completed within time limit',
          score: 1
        }
      ]
    }
  ],
  maxScore: 100,
  passingScore: 60
};
```

### 2. Terminology Recognition Rubric

**Purpose**: Assess activities focused on recognizing and identifying terminology.

```typescript
export const terminologyRecognitionRubric: RubricTemplate = {
  id: 'terminology-recognition-rubric',
  title: 'Terminology Recognition Rubric',
  description: 'Assesses the ability to recognize and identify terminology correctly',
  bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
  activityTypes: [
    LearningActivityType.MATCHING,
    LearningActivityType.MULTIPLE_CHOICE,
    LearningActivityType.FLASHCARDS
  ],
  criteria: [
    {
      id: 'correct-identification',
      title: 'Correct Identification',
      description: 'Accuracy in identifying terms and their meanings',
      weight: 60,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Correctly identifies 90-100% of terms and their meanings',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Correctly identifies 75-89% of terms and their meanings',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Correctly identifies 60-74% of terms and their meanings',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Correctly identifies less than 60% of terms and their meanings',
          score: 1
        }
      ]
    },
    {
      id: 'consistency',
      title: 'Consistency',
      description: 'Consistency in correctly identifying terms across different contexts',
      weight: 40,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Consistently identifies terms correctly across all contexts',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Usually identifies terms correctly across most contexts',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Sometimes identifies terms correctly across some contexts',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Rarely identifies terms correctly across contexts',
          score: 1
        }
      ]
    }
  ],
  maxScore: 100,
  passingScore: 60
};
```

## Understanding Level Rubric Templates

### 1. Concept Explanation Rubric

**Purpose**: Assess activities focused on explaining ideas or concepts.

```typescript
export const conceptExplanationRubric: RubricTemplate = {
  id: 'concept-explanation-rubric',
  title: 'Concept Explanation Rubric',
  description: 'Assesses the ability to explain ideas or concepts in one\'s own words',
  bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
  activityTypes: [
    LearningActivityType.DISCUSSION,
    LearningActivityType.VIDEO_SUMMARY,
    LearningActivityType.TEXT_ANNOTATION,
    LearningActivityType.CONCEPT_MAP
  ],
  criteria: [
    {
      id: 'clarity',
      title: 'Clarity of Explanation',
      description: 'How clearly the concept is explained',
      weight: 30,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Explanation is exceptionally clear, precise, and easy to understand',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Explanation is clear and generally easy to understand',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Explanation is somewhat clear but may have some confusing elements',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Explanation is unclear and difficult to understand',
          score: 1
        }
      ]
    },
    {
      id: 'accuracy',
      title: 'Accuracy of Interpretation',
      description: 'Correctness of the concept explanation',
      weight: 30,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Interpretation is completely accurate with no misconceptions',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Interpretation is mostly accurate with minor misconceptions',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Interpretation has some accuracy but contains notable misconceptions',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Interpretation is largely inaccurate with major misconceptions',
          score: 1
        }
      ]
    },
    {
      id: 'own-words',
      title: 'Use of Own Words',
      description: 'Extent to which the explanation is in the student\'s own words',
      weight: 20,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Explanation is entirely in student\'s own words, showing personal understanding',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Explanation is mostly in student\'s own words with minimal reliance on source language',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Explanation partially uses student\'s own words but relies heavily on source language',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Explanation mostly repeats source language with little evidence of personal understanding',
          score: 1
        }
      ]
    },
    {
      id: 'examples',
      title: 'Use of Examples',
      description: 'Quality and relevance of examples used to illustrate understanding',
      weight: 20,
      performanceLevels: [
        {
          id: 'excellent',
          title: 'Excellent',
          description: 'Uses highly relevant and original examples that clearly illustrate the concept',
          score: 4
        },
        {
          id: 'good',
          title: 'Good',
          description: 'Uses relevant examples that adequately illustrate the concept',
          score: 3
        },
        {
          id: 'satisfactory',
          title: 'Satisfactory',
          description: 'Uses somewhat relevant examples that partially illustrate the concept',
          score: 2
        },
        {
          id: 'needs-improvement',
          title: 'Needs Improvement',
          description: 'Uses irrelevant examples or no examples to illustrate the concept',
          score: 1
        }
      ]
    }
  ],
  maxScore: 100,
  passingScore: 60
};
```

## Additional Rubric Templates

Similar detailed rubric templates would be created for each level of Bloom's Taxonomy:

### Applying Level Rubrics
- Problem-Solving Rubric
- Application of Concepts Rubric
- Procedure Implementation Rubric

### Analyzing Level Rubrics
- Comparative Analysis Rubric
- Case Study Analysis Rubric
- Evidence Evaluation Rubric

### Evaluating Level Rubrics
- Critical Evaluation Rubric
- Peer Review Rubric
- Argument Assessment Rubric

### Creating Level Rubrics
- Original Design Rubric
- Creative Synthesis Rubric
- Research Project Rubric

Each rubric would include criteria specifically designed to assess the cognitive skills associated with that level of Bloom's Taxonomy, with performance levels that clearly describe what constitutes different levels of achievement.

## Rubric Generation System

To support the implementation of these rubric templates, we'll create a rubric generation system that:

1. **Suggests appropriate rubrics** based on:
   - Selected Bloom's Taxonomy level
   - Activity type
   - Subject area
   - Grade level

2. **Allows customization** of:
   - Criteria and their weights
   - Performance level descriptions
   - Scoring scales

3. **Provides AI assistance** for:
   - Generating criteria aligned with learning objectives
   - Creating clear performance level descriptions
   - Ensuring rubric validity and reliability

This system will integrate with our activity creation workflow, making it easy for teachers to create educationally sound assessments aligned with Bloom's Taxonomy.
