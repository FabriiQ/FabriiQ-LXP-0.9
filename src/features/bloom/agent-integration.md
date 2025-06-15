# Agent Integration for Bloom's Taxonomy and Rubrics

This document outlines how to integrate Bloom's Taxonomy and Rubrics with our existing agentic orchestration system.

## Overview of Agent Integration

Our existing agentic orchestration system provides a powerful foundation for implementing AI-enhanced Bloom's Taxonomy and Rubrics functionality. By extending our current agents and creating specialized new ones, we can create a comprehensive system that supports educators in creating, managing, and evaluating curriculum-aligned assessments with Bloom's Taxonomy and rubrics.

The integration will follow our curriculum-first approach, where Bloom's Taxonomy is integrated at the curriculum level through learning outcomes, flows through lesson plans, and is ultimately reflected in activities and assessments with aligned rubrics.

## Agent Types and Responsibilities

### 1. CurriculumBloomsAgent

**Purpose**: Specialized agent for working with Bloom's Taxonomy at the curriculum level.

**Responsibilities**:
- Create learning outcomes aligned with specific Bloom's levels
- Generate appropriate action verbs for learning outcomes
- Recommend Bloom's distribution for subjects and topics
- Validate alignment between curriculum elements and educational standards
- Suggest improvements to curriculum cognitive balance

### 2. BloomsTaxonomyAgent

**Purpose**: Specialized agent for classifying, generating, and validating content according to Bloom's Taxonomy levels.

**Responsibilities**:
- Classify questions and learning activities by Bloom's level
- Generate appropriate action verbs for specific cognitive levels
- Validate alignment between content and intended Bloom's levels
- Suggest modifications to better align content with target cognitive levels

**Integration Points**:
- Extends the base `AgentState` with specialized tools
- Registered with the `AgentRegistry`
- Accessible through the `AgentOrchestrator`

**Implementation**:

```typescript
// src/features/agents/specialized/BloomsTaxonomyAgent.ts
import { AgentState, AgentType, createSpecializedAgent } from '@/features/agents/core';
import { BloomsTaxonomyLevel, bloomsActionVerbs } from '@/features/bloom/types';

export function createBloomsTaxonomyAgent(baseState: AgentState): AgentState {
  return createSpecializedAgent({
    ...baseState,
    type: AgentType.BLOOMS_TAXONOMY,
    tools: [
      {
        name: 'classifyByBloomsLevel',
        description: 'Classifies content according to Bloom\'s Taxonomy levels',
        parameters: {
          content: 'string',
          context: 'object?'
        },
        handler: async (params) => {
          // Implementation for classifying content
          return {
            level: BloomsTaxonomyLevel.ANALYZE, // Example result
            confidence: 0.85,
            actionVerbs: ['analyze', 'compare', 'contrast'],
            explanation: 'This content requires students to break down information...'
          };
        }
      },
      {
        name: 'suggestActionVerbs',
        description: 'Suggests appropriate action verbs for a Bloom\'s level',
        parameters: {
          bloomsLevel: 'string',
          count: 'number?'
        },
        handler: async (params) => {
          const level = params.bloomsLevel as BloomsTaxonomyLevel;
          const count = params.count || 5;
          const verbs = bloomsActionVerbs[level] || [];
          return {
            actionVerbs: verbs.slice(0, count),
            bloomsLevel: level
          };
        }
      },
      // Additional tools...
    ]
  });
}
```

```typescript
// src/features/agents/specialized/CurriculumBloomsAgent.ts
import { AgentState, AgentType, createSpecializedAgent } from '@/features/agents/core';
import { BloomsTaxonomyLevel, bloomsActionVerbs } from '@/features/bloom/types';

export function createCurriculumBloomsAgent(baseState: AgentState): AgentState {
  return createSpecializedAgent({
    ...baseState,
    type: AgentType.CURRICULUM_BLOOMS,
    tools: [
      {
        name: 'generateLearningOutcome',
        description: 'Generates learning outcomes for a specific Bloom\'s level',
        parameters: {
          subject: 'string',
          topic: 'string',
          bloomsLevel: 'string',
          count: 'number?'
        },
        handler: async (params) => {
          // Implementation for generating learning outcomes
          return {
            learningOutcomes: [
              {
                statement: `Analyze the causes and effects of ${params.topic} in ${params.subject}`,
                bloomsLevel: params.bloomsLevel,
                actionVerbs: ['analyze', 'examine', 'investigate']
              }
              // Additional outcomes...
            ]
          };
        }
      },
      {
        name: 'recommendBloomsDistribution',
        description: 'Recommends Bloom\'s distribution for a subject or topic',
        parameters: {
          subject: 'string',
          topic: 'string?',
          gradeLevel: 'string?'
        },
        handler: async (params) => {
          // Implementation for recommending distribution
          return {
            distribution: {
              REMEMBER: 15,
              UNDERSTAND: 25,
              APPLY: 30,
              ANALYZE: 15,
              EVALUATE: 10,
              CREATE: 5
            },
            explanation: 'This distribution provides a balanced approach...'
          };
        }
      },
      // Additional tools...
    ]
  });
}
```

### 3. RubricGenerationAgent

**Purpose**: Specialized agent for creating and refining assessment rubrics.

**Responsibilities**:
- Generate rubrics based on learning outcomes and assessment type
- Create performance level descriptors aligned with Bloom's Taxonomy
- Suggest appropriate criteria weights based on importance
- Refine existing rubrics for clarity and alignment
- Link rubric criteria to specific learning outcomes

**Integration Points**:
- Extends the base `AgentState` with specialized tools
- Registered with the `AgentRegistry`
- Accessible through the `AgentOrchestrator`

**Implementation**:

```typescript
// src/features/agents/specialized/RubricGenerationAgent.ts
import { AgentState, AgentType, createSpecializedAgent } from '@/features/agents/core';
import { RubricType, RubricCriterion, PerformanceLevel } from '@/features/bloom/types';

export function createRubricGenerationAgent(baseState: AgentState): AgentState {
  return createSpecializedAgent({
    ...baseState,
    type: AgentType.RUBRIC_GENERATION,
    tools: [
      {
        name: 'generateRubric',
        description: 'Generates a complete rubric based on learning outcomes',
        parameters: {
          learningOutcomeIds: 'array',
          assessmentType: 'string',
          rubricType: 'string',
          maxScore: 'number',
          lessonPlanId: 'string?'
        },
        handler: async (params) => {
          // Implementation for generating rubrics
          return {
            title: 'Essay Assessment Rubric',
            type: RubricType.ANALYTIC,
            learningOutcomeIds: params.learningOutcomeIds,
            criteria: [
              // Example criteria
              {
                title: 'Content Understanding',
                description: 'Demonstrates understanding of key concepts',
                bloomsLevel: 'UNDERSTAND',
                weight: 30,
                learningOutcomeId: params.learningOutcomeIds[0],
                performanceLevels: [
                  {
                    title: 'Excellent',
                    description: 'Demonstrates comprehensive understanding of all key concepts',
                    score: 30
                  },
                  {
                    title: 'Good',
                    description: 'Demonstrates good understanding of most key concepts',
                    score: 24
                  },
                  {
                    title: 'Satisfactory',
                    description: 'Demonstrates basic understanding of some key concepts',
                    score: 18
                  },
                  {
                    title: 'Needs Improvement',
                    description: 'Demonstrates limited understanding of key concepts',
                    score: 12
                  }
                ]
              },
              // Additional criteria...
            ]
          };
        }
      },
      {
        name: 'generateRubricFromLessonPlan',
        description: 'Generates a rubric based on a lesson plan',
        parameters: {
          lessonPlanId: 'string',
          assessmentType: 'string',
          rubricType: 'string',
          maxScore: 'number'
        },
        handler: async (params) => {
          // Implementation for generating rubrics from lesson plans
          // This would fetch the lesson plan, extract learning outcomes,
          // and generate an appropriate rubric
          return {
            title: 'Lesson Assessment Rubric',
            type: RubricType.ANALYTIC,
            // Rubric details...
          };
        }
      },
      // Additional tools...
    ]
  });
}
```

### 4. Enhanced AssessmentAgent

**Purpose**: Extend the existing AssessmentAgent to incorporate Bloom's Taxonomy and Rubrics.

**Responsibilities**:
- Generate assessment questions targeting specific Bloom's levels
- Create assessments with balanced cognitive level distribution
- Align questions with learning outcomes and rubric criteria
- Generate feedback based on rubric performance
- Ensure assessments align with lesson plan objectives

**Integration Points**:
- Enhances the existing `AssessmentAgent`
- Adds new tools for Bloom's Taxonomy integration
- Updates existing question generation to include cognitive levels

**Implementation**:

```typescript
// src/features/agents/specialized/EnhancedAssessmentAgent.ts
import { AgentState, createAssessmentAgent } from '@/features/agents';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

export function createEnhancedAssessmentAgent(baseState: AgentState): AgentState {
  const assessmentAgent = createAssessmentAgent(baseState);

  // Add Bloom's Taxonomy specific tools
  assessmentAgent.tools.push({
    name: 'generateQuestionsByBloomsLevel',
    description: 'Generates questions targeting specific Bloom\'s Taxonomy levels',
    parameters: {
      subject: 'string',
      topic: 'string',
      bloomsLevel: 'string',
      count: 'number',
      difficultyLevel: 'string?',
      learningOutcomeId: 'string?'
    },
    handler: async (params) => {
      // Implementation for generating questions by Bloom's level
      return {
        questions: [
          {
            text: 'Analyze the causes of World War I and explain how they interconnected.',
            bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
            type: 'ESSAY',
            learningOutcomeId: params.learningOutcomeId,
            actionVerbs: ['analyze', 'explain', 'interconnect'],
            difficultyLevel: params.difficultyLevel || 'medium'
            // Additional question properties...
          },
          // Additional questions...
        ]
      };
    }
  });

  assessmentAgent.tools.push({
    name: 'generateAssessmentFromLessonPlan',
    description: 'Generates an assessment aligned with a lesson plan',
    parameters: {
      lessonPlanId: 'string',
      assessmentType: 'string',
      questionCount: 'number',
      includeRubric: 'boolean?'
    },
    handler: async (params) => {
      // Implementation for generating assessment from lesson plan
      // This would fetch the lesson plan, extract learning outcomes,
      // and generate questions aligned with those outcomes
      return {
        title: 'Lesson Assessment',
        description: 'Assessment based on lesson plan',
        learningOutcomeIds: ['outcome1', 'outcome2'],
        bloomsDistribution: {
          REMEMBER: 20,
          UNDERSTAND: 30,
          APPLY: 30,
          ANALYZE: 20,
          EVALUATE: 0,
          CREATE: 0
        },
        questions: [
          // Questions aligned with learning outcomes...
        ],
        rubricId: params.includeRubric ? 'generated-rubric-id' : undefined
      };
    }
  });

  return assessmentAgent;
}
```

## Agent Orchestration

### 1. Registering Bloom's Taxonomy Agents

```typescript
// src/features/agents/core/AgentRegistry.ts
import { AgentType } from './types';
import { createBloomsTaxonomyAgent } from '../specialized/BloomsTaxonomyAgent';
import { createCurriculumBloomsAgent } from '../specialized/CurriculumBloomsAgent';
import { createRubricGenerationAgent } from '../specialized/RubricGenerationAgent';
import { createEnhancedAssessmentAgent } from '../specialized/EnhancedAssessmentAgent';
import { createLessonPlanAgent } from '../specialized/LessonPlanAgent';

// Add new agent types
export enum AgentType {
  // Existing types...
  CURRICULUM_BLOOMS = 'curriculum_blooms',
  BLOOMS_TAXONOMY = 'blooms_taxonomy',
  RUBRIC_GENERATION = 'rubric_generation',
  LESSON_PLAN = 'lesson_plan'
}

// Register agent creators
AgentRegistry.registerCreator(AgentType.CURRICULUM_BLOOMS, createCurriculumBloomsAgent);
AgentRegistry.registerCreator(AgentType.BLOOMS_TAXONOMY, createBloomsTaxonomyAgent);
AgentRegistry.registerCreator(AgentType.RUBRIC_GENERATION, createRubricGenerationAgent);
AgentRegistry.registerCreator(AgentType.LESSON_PLAN, createLessonPlanAgent);
AgentRegistry.registerCreator(AgentType.ASSESSMENT, createEnhancedAssessmentAgent); // Replace existing
```

### 2. Agent Collaboration for Assessment Creation

```typescript
// src/features/contnet-studio/services/bloom-assessment-generator.service.ts
import { AgentRegistry, AgentType, AgentState } from '@/features/agents';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

export async function generateBloomsAlignedAssessment(params: {
  title: string;
  subject: string;
  topic: string;
  learningOutcomeIds: string[];
  lessonPlanId?: string;
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  includeRubric: boolean;
}): Promise<any> {
  // Create the necessary agents
  const registry = AgentRegistry.getInstance();
  const assessmentAgent = registry.createAgent(AgentType.ASSESSMENT);
  const bloomsAgent = registry.createAgent(AgentType.BLOOMS_TAXONOMY);
  const rubricAgent = registry.createAgent(AgentType.RUBRIC_GENERATION);

  // If we have a lesson plan, use it to generate the assessment
  if (params.lessonPlanId) {
    const assessment = await assessmentAgent.executeTool('generateAssessmentFromLessonPlan', {
      lessonPlanId: params.lessonPlanId,
      assessmentType: 'QUIZ',
      questionCount: 10,
      includeRubric: params.includeRubric
    });

    return assessment;
  }

  // Otherwise, use learning outcomes and Bloom's distribution

  // Step 1: Validate learning outcomes with Bloom's agent
  const validatedOutcomes = await bloomsAgent.executeTool('validateLearningOutcomes', {
    learningOutcomeIds: params.learningOutcomeIds
  });

  // Step 2: Generate questions with appropriate Bloom's distribution
  const questions = [];

  // If bloomsDistribution is provided, use it
  if (params.bloomsDistribution) {
    for (const [level, percentage] of Object.entries(params.bloomsDistribution)) {
      if (percentage > 0) {
        // Find learning outcomes that match this Bloom's level
        const matchingOutcomes = validatedOutcomes.filter(
          outcome => outcome.bloomsLevel === level
        );

        // Generate questions for each matching outcome
        for (const outcome of matchingOutcomes) {
          const levelQuestions = await assessmentAgent.executeTool('generateQuestionsByBloomsLevel', {
            subject: params.subject,
            topic: params.topic,
            bloomsLevel: level,
            count: Math.ceil((percentage / 100) * 10 / matchingOutcomes.length), // Distribute questions
            difficultyLevel: 'medium',
            learningOutcomeId: outcome.id
          });
          questions.push(...levelQuestions.questions);
        }
      }
    }
  } else {
    // If no distribution provided, generate questions based on learning outcomes
    for (const outcome of validatedOutcomes) {
      const levelQuestions = await assessmentAgent.executeTool('generateQuestionsByBloomsLevel', {
        subject: params.subject,
        topic: params.topic,
        bloomsLevel: outcome.bloomsLevel,
        count: 2, // Default 2 questions per outcome
        difficultyLevel: 'medium',
        learningOutcomeId: outcome.id
      });
      questions.push(...levelQuestions.questions);
    }
  }

  // Step 3: Generate rubric if requested
  let rubric = null;
  if (params.includeRubric) {
    rubric = await rubricAgent.executeTool('generateRubric', {
      learningOutcomeIds: params.learningOutcomeIds,
      assessmentType: 'QUIZ',
      rubricType: 'ANALYTIC',
      maxScore: 100
    });
  }

  // Step 4: Calculate actual Bloom's distribution based on generated questions
  const actualDistribution = questions.reduce((dist, q) => {
    const level = q.bloomsLevel;
    dist[level] = (dist[level] || 0) + 1;
    return dist;
  }, {});

  // Convert to percentages
  const totalQuestions = questions.length;
  Object.keys(actualDistribution).forEach(level => {
    actualDistribution[level] = Math.round((actualDistribution[level] / totalQuestions) * 100);
  });

  // Step 5: Assemble the complete assessment
  return {
    title: params.title,
    subject: params.subject,
    topic: params.topic,
    learningOutcomeIds: params.learningOutcomeIds,
    questions,
    rubric,
    bloomsDistribution: actualDistribution
  };
}
```

## Agent Prompts and Training

### 1. Bloom's Taxonomy Classification Prompts

```typescript
// Example system prompt for Bloom's classification
const bloomsClassificationPrompt = `
You are a Bloom's Taxonomy classification expert. Your task is to analyze educational content and determine which level of Bloom's Taxonomy it aligns with.

Bloom's Taxonomy Levels:
1. REMEMBER: Recall facts and basic concepts (e.g., define, list, memorize)
2. UNDERSTAND: Explain ideas or concepts (e.g., classify, describe, explain)
3. APPLY: Use information in new situations (e.g., execute, implement, solve)
4. ANALYZE: Draw connections among ideas (e.g., differentiate, organize, compare)
5. EVALUATE: Justify a stand or decision (e.g., appraise, critique, judge)
6. CREATE: Produce new or original work (e.g., design, develop, formulate)

For each piece of content, provide:
1. The primary Bloom's level
2. Confidence score (0-1)
3. Key action verbs present
4. Brief explanation of your classification

Content to classify: {{content}}
`;
```

### 2. Rubric Generation Prompts

```typescript
// Example system prompt for rubric generation
const rubricGenerationPrompt = `
You are a rubric generation expert. Your task is to create detailed, educationally sound rubrics for assessments based on learning objectives and Bloom's Taxonomy.

For each rubric, create:
1. 3-5 criteria that align with the learning objectives
2. 4 performance levels for each criterion (Excellent, Good, Satisfactory, Needs Improvement)
3. Clear, specific descriptors for each performance level
4. Appropriate point values that sum to the maximum score

Learning Objectives:
{{learningObjectives}}

Assessment Type: {{assessmentType}}
Rubric Type: {{rubricType}}
Maximum Score: {{maxScore}}
`;
```

## Integration with UI Components

### 1. Bloom's Taxonomy Selector with Agent Assistance

```tsx
// src/components/bloom/BloomsTaxonomySelector.tsx
import React, { useState, useEffect } from 'react';
import { AgentRegistry, AgentType } from '@/features/agents';
import { BloomsTaxonomyLevel, bloomsActionVerbs } from '@/features/bloom/types';

export function BloomsTaxonomySelector({
  value,
  onChange,
  content = '' // Optional content to classify
}) {
  const [suggestedLevel, setSuggestedLevel] = useState<BloomsTaxonomyLevel | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Use agent to classify content if provided
  useEffect(() => {
    if (content && content.length > 10) {
      classifyContent(content);
    }
  }, [content]);

  const classifyContent = async (contentToClassify: string) => {
    setIsClassifying(true);
    try {
      const registry = AgentRegistry.getInstance();
      const bloomsAgent = registry.createAgent(AgentType.BLOOMS_TAXONOMY);

      const result = await bloomsAgent.executeTool('classifyByBloomsLevel', {
        content: contentToClassify
      });

      setSuggestedLevel(result.level);
    } catch (error) {
      console.error('Error classifying content:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="blooms-taxonomy-selector">
      <div className="blooms-levels">
        {Object.values(BloomsTaxonomyLevel).map(level => (
          <button
            key={level}
            className={`level-button ${value === level ? 'selected' : ''} ${suggestedLevel === level ? 'suggested' : ''}`}
            onClick={() => onChange(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {suggestedLevel && (
        <div className="suggestion">
          <p>Suggested level: <strong>{suggestedLevel}</strong></p>
          <button onClick={() => onChange(suggestedLevel)}>
            Use Suggestion
          </button>
        </div>
      )}

      {value && (
        <div className="action-verbs">
          <h4>Suggested Action Verbs:</h4>
          <div className="verb-chips">
            {bloomsActionVerbs[value].map(verb => (
              <span key={verb} className="verb-chip">{verb}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Conclusion

By integrating Bloom's Taxonomy and Rubrics with our agentic orchestration system, we can create a powerful, AI-enhanced assessment system that helps educators create more effective, aligned assessments. The specialized agents can handle complex tasks like classification, generation, and validation, while the orchestration layer ensures seamless collaboration between different agent types.

This integration leverages our existing architecture while extending it with new capabilities specifically designed for educational assessment best practices.
