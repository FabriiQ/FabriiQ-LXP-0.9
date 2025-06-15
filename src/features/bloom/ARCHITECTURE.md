# Bloom's Taxonomy Architecture and AI Generation System

## Overview

This document outlines the architecture of the Bloom's Taxonomy implementation and AI generation system for learning outcomes. The system integrates Bloom's Taxonomy principles with AI-powered generation capabilities to assist educators in creating high-quality learning outcomes aligned with cognitive levels.

## Core Components

### 1. Bloom's Taxonomy Framework

The system implements Bloom's Taxonomy with six cognitive levels:

- **Remember**: Recall facts and basic concepts
- **Understand**: Explain ideas or concepts
- **Apply**: Use information in new situations
- **Analyze**: Draw connections among ideas
- **Evaluate**: Justify a stand or decision
- **Create**: Produce new or original work

Each level is associated with:
- Specific action verbs
- Color coding for visual identification
- Descriptions and examples
- Recommended distribution percentages

### 2. AI Generation System

#### Agent Architecture

The AI generation system uses a multi-agent architecture:

1. **Orchestrator Agent**: Coordinates the generation process and manages requests
2. **Taxonomy Agent**: Specializes in Bloom's Taxonomy knowledge and ensures proper alignment
3. **Learning Outcome Agent**: Generates learning outcomes based on context and taxonomy level
4. **Action Verb Agent**: Suggests and validates appropriate action verbs for each taxonomy level

#### Generation Flow

```
User Request → Orchestrator → Taxonomy Agent → Learning Outcome Agent → Action Verb Agent → Final Output
```

### 3. Data Models

Key data models in the system:

- **BloomsTaxonomyLevel**: Enum representing the six cognitive levels
- **ActionVerb**: Associated with specific taxonomy levels
- **LearningOutcome**: Contains statement, description, taxonomy level, and action verbs
- **BloomsDistribution**: Tracks the distribution of learning outcomes across taxonomy levels

### 4. UI Components

The system includes specialized UI components:

- **BloomsTaxonomySelector**: For selecting taxonomy levels
- **ActionVerbSuggestions**: For suggesting appropriate action verbs
- **BloomsDistributionChart**: For visualizing the distribution of learning outcomes
- **LearningOutcomeGenerationDialog**: For generating learning outcomes with AI
- **LearningOutcomeForm**: For creating and editing learning outcomes

### 5. API Layer

The API layer includes:

- **bloom.router.ts**: Handles Bloom's Taxonomy-specific API endpoints
- **learning-outcome.router.ts**: Manages learning outcome CRUD operations
- **agent-service.ts**: Interfaces with the AI agents for generation

## Integration Points

### Curriculum Integration

- Subject and topic creation with Bloom's Taxonomy distribution settings
- Learning outcome management at the curriculum level
- Taxonomy distribution visualization and validation

### Lesson Plan Integration

- Cognitive balance analysis for lesson plans
- Activity organization by cognitive level
- Templates with taxonomy-aligned components

### Assessment Integration

- Rubric-based grading aligned with taxonomy levels
- Assessment creation with cognitive level distribution
- Feedback generation based on taxonomy levels

## AI Agent Implementation

### Agent Communication

Agents communicate through a structured protocol:

1. **Request Format**: JSON structure with context, constraints, and requirements
2. **Response Format**: Standardized output with metadata and generated content
3. **Validation Layer**: Ensures outputs meet quality standards and taxonomy alignment

### Context Management

The system maintains context through:

- Subject and topic information
- Previously generated outcomes
- User preferences and constraints
- Educational level and domain knowledge

### Prompt Engineering

Specialized prompts are designed for:

- Different taxonomy levels
- Various subject domains
- Educational contexts (K-12, higher education, etc.)
- Action verb selection and integration

## Scalability and Extension

The architecture supports:

- Adding new taxonomy frameworks beyond Bloom's
- Extending to affective and psychomotor domains
- Integration with additional educational frameworks
- Custom distribution targets for different educational contexts

## Data Flow

1. User selects subject/topic context
2. User chooses taxonomy level(s) for generation
3. Optional: User selects preferred action verbs
4. System generates contextually relevant learning outcomes
5. User can edit, save, or regenerate outcomes
6. System updates distribution statistics and visualizations

## Technical Implementation

The system is implemented using:

- React components for UI
- tRPC for API communication
- Prisma for database interactions
- AI services for generation capabilities
- TypeScript for type safety throughout the system
