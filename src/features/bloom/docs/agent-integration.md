# Agent Integration

This document explains how Bloom's Taxonomy, rubrics, and topic mastery are integrated with the central agent orchestration system.

## Overview

The Bloom's Taxonomy feature integrates with the central agent orchestration system to provide AI-powered capabilities for content classification, rubric generation, activity creation, and mastery analysis. This integration follows a modular approach, where agent definitions are registered with the central agent registry.

## Agent Definitions

The following agent definitions are provided:

1. **Bloom's Taxonomy Classification Agent**: Classifies content according to Bloom's Taxonomy levels and provides suggestions for improvement
2. **Rubric Generation Agent**: Generates rubrics aligned with Bloom's Taxonomy levels based on learning outcomes and assessment criteria
3. **Activity Generation Agent**: Generates activities aligned with Bloom's Taxonomy levels based on learning outcomes
4. **Topic Mastery Analysis Agent**: Analyzes topic mastery data and provides recommendations for improving student performance

## Integration Architecture

The integration follows these principles:

1. **Centralized Orchestration**: All agents are registered with the central agent orchestration system
2. **Modular Definitions**: Agent definitions are defined in a modular way, separate from their implementation
3. **Automatic Registration**: Agents are automatically registered when the Bloom's Taxonomy feature is imported
4. **Standardized Interfaces**: Agents follow standardized input and output schemas

## Registration Process

The agent registration process works as follows:

1. Agent definitions are defined in `agent-definitions.ts`
2. The `registerBloomsAgents` function in `register-agents.ts` registers these definitions with the central agent registry
3. The `registerBloomsAgents` function is called when the Bloom's Taxonomy feature is imported

## Agent Definition Structure

Each agent definition includes:

- **Type**: A unique identifier for the agent
- **Name**: A human-readable name for the agent
- **Description**: A description of what the agent does
- **Input Schema**: A JSON schema defining the expected input
- **Output Schema**: A JSON schema defining the expected output
- **Prompt Template**: A template for generating the prompt to send to the LLM

## Usage Examples

### Classifying Content with Bloom's Taxonomy

```typescript
import { AgentOrchestrator } from '@/features/agents/core/AgentOrchestrator';

// Create an instance of the agent orchestrator
const orchestrator = new AgentOrchestrator();

// Classify content with Bloom's Taxonomy
const result = await orchestrator.executeAgent('blooms-classification', {
  content: 'Analyze the causes and effects of climate change on global ecosystems.',
  contentType: 'learning_outcome',
  targetLevel: BloomsTaxonomyLevel.ANALYZE
});

// Use the classification result
console.log(`Classified as ${result.classification.bloomsLevel} level`);
console.log(`Confidence: ${result.classification.confidence}`);
console.log(`Suggested verbs: ${result.classification.suggestedVerbs.join(', ')}`);
console.log(`Suggestions: ${result.suggestions.join('\n')}`);
```

### Generating a Rubric

```typescript
import { AgentOrchestrator } from '@/features/agents/core/AgentOrchestrator';

// Create an instance of the agent orchestrator
const orchestrator = new AgentOrchestrator();

// Generate a rubric
const result = await orchestrator.executeAgent('rubric-generation', {
  request: {
    title: 'Climate Change Analysis Rubric',
    type: RubricType.ANALYTIC,
    bloomsLevels: [BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE],
    learningOutcomeIds: ['outcome-1', 'outcome-2'],
    maxScore: 100,
    criteriaCount: 4,
    performanceLevelCount: 4,
    subject: 'Environmental Science',
    topic: 'Climate Change',
    gradeLevel: 'High School'
  },
  learningOutcomes: [
    {
      id: 'outcome-1',
      statement: 'Analyze the causes and effects of climate change on global ecosystems.',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE
    },
    {
      id: 'outcome-2',
      statement: 'Evaluate the effectiveness of various climate change mitigation strategies.',
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE
    }
  ]
});

// Use the generated rubric
console.log(`Generated rubric: ${result.rubric.title}`);
console.log(`Criteria: ${result.rubric.criteria.length}`);
console.log(`Performance levels: ${result.rubric.performanceLevels.length}`);
```

### Analyzing Topic Mastery

```typescript
import { AgentOrchestrator } from '@/features/agents/core/AgentOrchestrator';

// Create an instance of the agent orchestrator
const orchestrator = new AgentOrchestrator();

// Analyze topic mastery
const result = await orchestrator.executeAgent('topic-mastery-analysis', {
  studentId: 'student-123',
  studentName: 'John Doe',
  topicId: 'topic-456',
  topicName: 'Climate Change',
  subjectId: 'subject-789',
  subjectName: 'Environmental Science',
  masteryData: {
    overallMastery: 75,
    bloomsLevels: {
      REMEMBER: 85,
      UNDERSTAND: 80,
      APPLY: 75,
      ANALYZE: 70,
      EVALUATE: 65,
      CREATE: 60
    },
    assessmentHistory: [
      {
        completedAt: '2023-01-15',
        percentage: 70
      },
      {
        completedAt: '2023-02-15',
        percentage: 75
      }
    ]
  },
  learningOutcomes: [
    {
      id: 'outcome-1',
      statement: 'Analyze the causes and effects of climate change on global ecosystems.',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE
    },
    {
      id: 'outcome-2',
      statement: 'Evaluate the effectiveness of various climate change mitigation strategies.',
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE
    }
  ]
});

// Use the analysis result
console.log(`Strengths: ${result.analysis.strengths.join(', ')}`);
console.log(`Weaknesses: ${result.analysis.weaknesses.join(', ')}`);
console.log(`Recommendations: ${result.recommendations.length}`);
```

## Extending the Integration

To add a new agent for Bloom's Taxonomy:

1. Define the agent in `agent-definitions.ts`
2. Update the `bloomsAgentDefinitions` array to include the new agent
3. The agent will be automatically registered when the Bloom's Taxonomy feature is imported

## Implementation Details

### Agent Definition File

The agent definitions are defined in `src/features/bloom/agents/agent-definitions.ts`:

```typescript
export const bloomsClassificationAgentDefinition: AgentDefinition = {
  type: 'blooms-classification',
  name: 'Bloom\'s Taxonomy Classification',
  description: 'Classifies content according to Bloom\'s Taxonomy levels',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  promptTemplate: `/* ... */`
};
```

### Agent Registration File

The agent registration is handled in `src/features/bloom/agents/register-agents.ts`:

```typescript
export function registerBloomsAgents() {
  bloomsAgentDefinitions.forEach(agentDefinition => {
    AgentRegistry.registerAgentDefinition(agentDefinition);
  });
}
```

### Feature Index File

The agent registration is triggered in `src/features/bloom/index.ts`:

```typescript
// Register Bloom's agents with the agent registry
import { registerBloomsAgents } from './agents';

// Register agents when this module is imported
registerBloomsAgents();
```
