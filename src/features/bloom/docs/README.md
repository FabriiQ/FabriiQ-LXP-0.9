# Bloom's Taxonomy Feature

This document provides an overview of the Bloom's Taxonomy feature, which integrates Bloom's Taxonomy, rubrics, and topic mastery into the learning platform.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Agent Integration](#agent-integration)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [UI Components](#ui-components)
7. [Usage Examples](#usage-examples)
8. [Development Guidelines](#development-guidelines)

## Overview

The Bloom's Taxonomy feature enhances the learning platform by integrating Bloom's Taxonomy cognitive levels into various aspects of the system, including:

- Curriculum design (subjects, topics, learning outcomes)
- Assessment creation and evaluation
- Activity generation
- Student mastery tracking
- Rubric generation and assessment

This integration helps educators create more effective learning experiences by aligning content and assessments with appropriate cognitive levels, and helps students develop higher-order thinking skills.

## Key Components

The Bloom's Taxonomy feature consists of several key components:

### 1. Bloom's Taxonomy Levels

Six cognitive levels based on the revised Bloom's Taxonomy:

- **Remember**: Recall facts and basic concepts
- **Understand**: Explain ideas or concepts
- **Apply**: Use information in new situations
- **Analyze**: Draw connections among ideas
- **Evaluate**: Justify a stand or decision
- **Create**: Produce new or original work

### 2. Topic Mastery Tracking

Tracks student mastery of topics across all Bloom's Taxonomy levels:

- Individual mastery scores for each cognitive level
- Overall mastery score
- Historical progression of mastery
- Recommendations for improvement

### 3. Rubric Generation

Creates assessment rubrics aligned with Bloom's Taxonomy:

- Criteria based on learning outcomes
- Performance levels with descriptors
- Bloom's level distribution visualization
- Customizable scoring

### 4. Activity Generation

Generates learning activities aligned with specific Bloom's levels:

- Activities tailored to target specific cognitive skills
- Instructions and materials
- Optional rubrics for assessment
- Alignment with learning outcomes

## Agent Integration

The Bloom's Taxonomy feature uses AI agents to enhance its capabilities. These agents are integrated with the centralized agent orchestration system in the `features/agents` directory.

### Agent Types

1. **Bloom's Classification Agent**
   - Classifies content according to Bloom's Taxonomy levels
   - Provides suggestions for improvement
   - Generates improved content for a target level

2. **Rubric Generation Agent**
   - Generates rubrics aligned with Bloom's Taxonomy
   - Creates criteria based on learning outcomes
   - Distributes criteria across appropriate cognitive levels

3. **Activity Generation Agent**
   - Creates activities targeting specific Bloom's levels
   - Generates instructions, materials, and assessment criteria
   - Aligns activities with learning outcomes

4. **Topic Mastery Analysis Agent**
   - Analyzes student mastery data
   - Identifies strengths and weaknesses
   - Provides personalized recommendations

### Agent Handlers

Agent handlers are implemented in the `src/features/bloom/agents/handlers` directory:

- `blooms-classification.handler.ts`: Classifies content and suggests improvements
- `rubric-generation.handler.ts`: Generates assessment rubrics
- `activity-generation.handler.ts`: Creates learning activities
- `mastery-analysis.handler.ts`: Analyzes mastery data and provides recommendations

These handlers use both rule-based approaches and LLM capabilities to provide sophisticated results.

### LLM Integration

The Bloom's Taxonomy feature uses LLM capabilities through the `llm-service.ts` utility:

- Content classification
- Content improvement
- Rubric generation
- Activity generation
- Mastery analysis

The LLM service uses Google's Generative AI (Gemini) to enhance the feature's capabilities.

## API Endpoints

The Bloom's Taxonomy feature provides several API endpoints through the tRPC router:

### Bloom Router (`bloom.router.ts`)

- `classifyContent`: Classifies content according to Bloom's Taxonomy levels
- `generateRubric`: Generates a rubric based on learning outcomes
- `generateActivity`: Creates an activity aligned with a specific Bloom's level
- `analyzeMastery`: Analyzes topic mastery data and provides recommendations

### Mastery Router (`mastery.router.ts`)

- `getTopicMastery`: Gets mastery data for a specific topic
- `updateTopicMastery`: Updates mastery data after an assessment
- `getStudentMasteryOverview`: Gets an overview of a student's mastery across topics
- `getClassMasteryOverview`: Gets an overview of a class's mastery across topics
- `getStudentDashboardLeaderboards`: Gets leaderboard data for the student dashboard

## Database Schema

The Bloom's Taxonomy feature extends the database schema with several new models:

- `LearningOutcome`: Statements of what students should know or be able to do
- `TopicMastery`: Tracks student mastery of topics across Bloom's levels
- `Rubric`: Assessment criteria and performance levels
- `Activity`: Learning activities aligned with Bloom's levels

## UI Components

The feature includes several UI components:

- `BloomsTaxonomySelector`: Allows selection of Bloom's levels
- `LearningOutcomeList`: Displays and manages learning outcomes
- `MasteryProgressChart`: Visualizes mastery progress
- `MasteryAnalyticsDashboard`: Displays mastery analytics
- `RubricBuilder`: Interface for creating and editing rubrics
- `ActivityGenerator`: Interface for generating activities

## Usage Examples

### Classifying Content

```typescript
// Classify a learning outcome
const result = await api.bloom.classifyContent.mutate({
  content: "Analyze the causes and effects of climate change",
  contentType: "learning_outcome"
});

console.log(result.classification.bloomsLevel); // ANALYZE
console.log(result.classification.confidence); // 0.92
console.log(result.classification.suggestedVerbs); // ["Analyze", "Examine", "Investigate"]
```

### Generating a Rubric

```typescript
// Generate a rubric for assessing an essay
const rubric = await api.bloom.generateRubric.mutate({
  title: "Climate Change Essay Rubric",
  type: "ANALYTIC",
  bloomsLevels: [BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE],
  learningOutcomeIds: ["outcome1", "outcome2"],
  maxScore: 100,
  criteriaCount: 4,
  performanceLevelCount: 4
});
```

### Tracking Mastery

```typescript
// Get a student's mastery of a topic
const mastery = await api.mastery.getTopicMastery.query({
  studentId: "student1",
  topicId: "topic1"
});

console.log(mastery.overallMastery); // 78
console.log(mastery.bloomsLevels[BloomsTaxonomyLevel.APPLY]); // 85
```

## Development Guidelines

When extending or modifying the Bloom's Taxonomy feature, follow these guidelines:

1. **Agent Integration**:
   - Use the centralized agent orchestration system in `features/agents`
   - Implement handlers in `src/features/bloom/agents/handlers`
   - Register agents in `src/features/bloom/agents/register-agents.ts`

2. **LLM Integration**:
   - Use the `llm-service.ts` utility for LLM capabilities
   - Implement fallback mechanisms for when LLM is unavailable
   - Keep prompts in separate files or constants for easier maintenance

3. **API Endpoints**:
   - Add new endpoints to the appropriate router
   - Use proper input validation with Zod
   - Implement proper error handling
   - Document new endpoints in this README

4. **UI Components**:
   - Follow the existing design patterns
   - Use the Bloom's Taxonomy constants and types
   - Implement responsive design for all screen sizes
   - Add proper accessibility attributes

5. **Testing**:
   - Write unit tests for new functionality
   - Test with and without LLM availability
   - Test edge cases and error handling
