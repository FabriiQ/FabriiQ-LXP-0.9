# Bloom's Taxonomy Agent Handlers

This document provides detailed information about the agent handlers used in the Bloom's Taxonomy feature.

## Overview

The Bloom's Taxonomy feature uses several specialized agent handlers to provide AI-enhanced functionality. These handlers are integrated with the centralized agent orchestration system and use both rule-based approaches and LLM capabilities to provide sophisticated results.

## Agent Handlers

### 1. Bloom's Classification Handler

**File**: `src/features/bloom/agents/handlers/blooms-classification.handler.ts`

**Purpose**: Classifies content according to Bloom's Taxonomy levels and provides suggestions for improvement.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| agent | AgentState | The agent state object |
| params.content | string | The content to classify |
| params.contentType | string | The type of content (learning_outcome, question, activity, assessment) |
| params.targetLevel | BloomsTaxonomyLevel | Optional target level for content improvement |

**Return Value**:

```typescript
{
  classification: {
    bloomsLevel: BloomsTaxonomyLevel;
    confidence: number;
    suggestedVerbs: string[];
    explanation: string;
    suggestedImprovements: string[];
  };
  suggestions: string[];
  improvedContent: string;
  improvementExplanation: string;
}
```

**Implementation Details**:

- Uses LLM to analyze content and determine the Bloom's level
- Generates suggestions for improvement
- If a target level is specified, generates improved content
- Includes fallback to rule-based classification if LLM is unavailable

**Example Usage**:

```typescript
const result = await handleBloomsClassification(agent, {
  content: "Explain the water cycle",
  contentType: "learning_outcome",
  targetLevel: BloomsTaxonomyLevel.ANALYZE
});
```

### 2. Rubric Generation Handler

**File**: `src/features/bloom/agents/handlers/rubric-generation.handler.ts`

**Purpose**: Generates rubrics aligned with Bloom's Taxonomy based on learning outcomes.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| agent | AgentState | The agent state object |
| params.request | RubricGenerationRequest | The rubric generation request |
| params.learningOutcomes | Array | Learning outcomes to base the rubric on |
| params.existingRubrics | Array | Optional existing rubrics for reference |

**Return Value**:

```typescript
{
  rubric: Rubric;
  explanation: string;
}
```

**Implementation Details**:

- Generates a rubric based on the request and learning outcomes
- Creates criteria aligned with Bloom's Taxonomy levels
- Generates performance levels with appropriate descriptors
- Calculates Bloom's distribution across criteria
- Provides an explanation of the generated rubric

**Example Usage**:

```typescript
const result = await handleRubricGeneration(agent, {
  request: {
    title: "Essay Rubric",
    type: RubricType.ANALYTIC,
    bloomsLevels: [BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE],
    maxScore: 100,
    criteriaCount: 4,
    performanceLevelCount: 4
  },
  learningOutcomes: [
    { id: "1", statement: "Analyze the causes of climate change", bloomsLevel: BloomsTaxonomyLevel.ANALYZE },
    { id: "2", statement: "Evaluate potential solutions", bloomsLevel: BloomsTaxonomyLevel.EVALUATE }
  ]
});
```

### 3. Activity Generation Handler

**File**: `src/features/bloom/agents/handlers/activity-generation.handler.ts`

**Purpose**: Generates activities aligned with Bloom's Taxonomy levels based on learning outcomes.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| agent | AgentState | The agent state object |
| params.request | ActivityGenerationRequest | The activity generation request |
| params.learningOutcomes | Array | Learning outcomes to base the activity on |
| params.existingActivities | Array | Optional existing activities for reference |

**Return Value**:

```typescript
{
  activity: Activity;
  rubric?: Rubric;
  explanation: string;
}
```

**Implementation Details**:

- Generates an activity based on the request and learning outcomes
- Creates title, description, materials, and instructions
- If requested, generates a rubric for assessing the activity
- Provides an explanation of the generated activity

**Example Usage**:

```typescript
const result = await handleActivityGeneration(agent, {
  request: {
    title: "Climate Change Analysis",
    bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
    learningOutcomeIds: ["1", "2"],
    type: "interactive",
    setting: "classroom",
    duration: 45,
    groupSize: 3,
    includeRubric: true
  },
  learningOutcomes: [
    { id: "1", statement: "Analyze the causes of climate change", bloomsLevel: BloomsTaxonomyLevel.ANALYZE },
    { id: "2", statement: "Evaluate potential solutions", bloomsLevel: BloomsTaxonomyLevel.EVALUATE }
  ]
});
```

### 4. Mastery Analysis Handler

**File**: `src/features/bloom/agents/handlers/mastery-analysis.handler.ts`

**Purpose**: Analyzes topic mastery data and provides recommendations for improvement.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| agent | AgentState | The agent state object |
| params.studentId | string | The student ID |
| params.studentName | string | The student name |
| params.topicId | string | The topic ID |
| params.topicName | string | The topic name |
| params.subjectId | string | The subject ID |
| params.subjectName | string | The subject name |
| params.masteryData | TopicMasteryData | The mastery data to analyze |
| params.learningOutcomes | Array | Learning outcomes for the topic |
| params.assessmentHistory | Array | Optional assessment history |

**Return Value**:

```typescript
{
  analysis: {
    strengths: string[];
    weaknesses: string[];
    bloomsLevelAnalysis: Record<BloomsTaxonomyLevel, {
      level: number;
      status: 'strong' | 'moderate' | 'weak';
      comments: string;
    }>;
  };
  recommendations: Array<{
    type: 'practice' | 'activity' | 'review';
    description: string;
    bloomsLevel: BloomsTaxonomyLevel;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

**Implementation Details**:

- Analyzes mastery data to identify strengths and weaknesses
- Generates recommendations for improvement
- Prioritizes recommendations based on mastery levels
- Provides detailed analysis for each Bloom's level

**Example Usage**:

```typescript
const result = await handleMasteryAnalysis(agent, {
  studentId: "student1",
  studentName: "John Doe",
  topicId: "topic1",
  topicName: "Climate Change",
  subjectId: "subject1",
  subjectName: "Science",
  masteryData: {
    overallMastery: 75,
    bloomsLevels: {
      [BloomsTaxonomyLevel.REMEMBER]: 90,
      [BloomsTaxonomyLevel.UNDERSTAND]: 85,
      [BloomsTaxonomyLevel.APPLY]: 80,
      [BloomsTaxonomyLevel.ANALYZE]: 70,
      [BloomsTaxonomyLevel.EVALUATE]: 60,
      [BloomsTaxonomyLevel.CREATE]: 50
    }
  },
  learningOutcomes: [
    { id: "1", statement: "Recall key facts about climate change", bloomsLevel: BloomsTaxonomyLevel.REMEMBER },
    { id: "2", statement: "Analyze the causes of climate change", bloomsLevel: BloomsTaxonomyLevel.ANALYZE }
  ]
});
```

## LLM Service

**File**: `src/features/bloom/utils/llm-service.ts`

The LLM service provides utilities for interacting with Large Language Models to enhance the Bloom's Taxonomy feature with AI capabilities.

### Functions

#### `generateLLMResponse(prompt: string, options?: LLMRequestOptions): Promise<string>`

Generates a text response from the LLM.

#### `generateStructuredLLMResponse<T>(prompt: string, options?: LLMRequestOptions): Promise<T>`

Generates a structured JSON response from the LLM.

#### `classifyContentWithLLM(content: string, contentType?: string): Promise<{ bloomsLevel: BloomsTaxonomyLevel; confidence: number; suggestedVerbs: string[]; explanation: string; }>`

Classifies content according to Bloom's Taxonomy levels using LLM.

#### `generateImprovedContentWithLLM(content: string, currentLevel: BloomsTaxonomyLevel, targetLevel: BloomsTaxonomyLevel, contentType?: string): Promise<{ improvedContent: string; explanation: string; suggestedVerbs: string[]; }>`

Generates improved content based on a target Bloom's level using LLM.

### Configuration Options

The LLM service provides default configuration options for different types of requests:

```typescript
const DEFAULT_CONFIG = {
  classification: {
    temperature: 0.2, // Lower temperature for more consistent classification
    maxOutputTokens: 500,
    topK: 40,
    topP: 0.95,
  },
  generation: {
    temperature: 0.7, // Higher temperature for more creative generation
    maxOutputTokens: 1000,
    topK: 40,
    topP: 0.95,
  },
  analysis: {
    temperature: 0.4, // Balanced temperature for analysis
    maxOutputTokens: 800,
    topK: 40,
    topP: 0.95,
  }
};
```

## Integration with Agent Orchestration

The agent handlers are integrated with the centralized agent orchestration system through the `register-agents.ts` file. This file registers the agent definitions with the `AgentRegistry` and provides factory functions that use the handlers.

```typescript
registry.registerAgentType({
  type: agentDefinition.type as any,
  name: agentDefinition.name,
  description: agentDefinition.description,
  factory: agentDefinition.handler ? 
    (baseAgent) => {
      return {
        ...baseAgent,
        execute: async (params: any) => {
          return await agentDefinition.handler!(baseAgent, params);
        }
      };
    } : 
    null,
  metadata: {
    inputSchema: agentDefinition.inputSchema,
    outputSchema: agentDefinition.outputSchema,
    promptTemplate: agentDefinition.promptTemplate,
    bloomsSpecific: true
  }
});
```

This integration ensures that the Bloom's Taxonomy agents are properly registered with the centralized agent orchestration system and can be used throughout the application.
