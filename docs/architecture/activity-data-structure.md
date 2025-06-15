# Activity Data Structure Architecture

This document provides a comprehensive overview of the activity data structure architecture implemented to solve the AI Studio activity content issue.

## Table of Contents

1. [Introduction](#introduction)
2. [Problem Statement](#problem-statement)
3. [Architecture Overview](#architecture-overview)
4. [Data Model](#data-model)
5. [Normalization Layer](#normalization-layer)
6. [Activity Type Adapters](#activity-type-adapters)
7. [Integration Points](#integration-points)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)

## Introduction

The activity data structure architecture provides a standardized approach to handling activity data throughout the application. It ensures consistency between AI-generated content and activity editors, eliminating the data structure mismatch that previously caused issues.

## Problem Statement

Prior to this architecture, activity data existed in multiple inconsistent formats:

1. **Inconsistent Data Locations**: Activity-specific data could be found in multiple locations:
   - At the top level of the activity object
   - Inside a `content` property
   - Inside a `config` property
   - Inside a nested `content.config` property

2. **Type Safety Issues**: Excessive use of `any` types and unsafe type assertions allowed inconsistent data structures to propagate through the system.

3. **AI-Editor Mismatch**: AI Studio generated content in a format that didn't match what the activity editors expected, requiring manual transformation.

## Architecture Overview

The new architecture consists of three main components:

1. **Standardized Data Model**: Clear interfaces for all activity types
2. **Normalization Layer**: Core utilities for normalizing data between different formats
3. **Activity Type Adapters**: Type-specific adapters for each activity type

The architecture follows these principles:

- **Single Source of Truth**: The standardized interfaces are the canonical data model
- **Bidirectional Normalization**: Data is normalized both when coming in and going out
- **Type Safety**: Strong typing throughout the system
- **Backward Compatibility**: Support for existing data formats

## Data Model

### Base Activity Data Interface

All activities share a common base interface:

```typescript
interface ActivityData<T = Record<string, any>> {
  // Core identification
  id?: string;
  title: string;
  description?: string;
  instructions?: string;
  
  // Type information
  activityType: string;
  purpose: ActivityPurpose;
  
  // Grading information
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  gradingConfig?: {
    autoGrade?: boolean;
    rubric?: any;
  };
  
  // Activity-specific data (will be different for each activity type)
  [key: string]: any;
  
  // For backward compatibility
  content?: Record<string, any>;
  config?: Record<string, any>;
}
```

### Activity Type-Specific Interfaces

Each activity type has its own interface that extends the base interface:

```typescript
interface MultipleChoiceActivityData extends ActivityData {
  questions: MultipleChoiceQuestion[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showFeedbackImmediately?: boolean;
  attemptsAllowed?: number;
}

interface TrueFalseActivityData extends ActivityData {
  questions: TrueFalseQuestion[];
  shuffleQuestions?: boolean;
  showFeedbackImmediately?: boolean;
  attemptsAllowed?: number;
}

interface FillInTheBlanksActivityData extends ActivityData {
  questions: FillInTheBlanksQuestion[];
  shuffleQuestions?: boolean;
  showFeedbackImmediately?: boolean;
  attemptsAllowed?: number;
}
```

## Normalization Layer

The normalization layer provides core utilities for normalizing activity data:

### Key Functions

1. **normalizeActivityData**: Converts any activity data to the standardized format
2. **extractActivitySpecificData**: Extracts activity-specific data from a normalized activity
3. **findActivityType**: Finds the activity type from any activity data
4. **findQuestions**: Finds questions from any activity data
5. **validateActivityData**: Validates activity data against its schema
6. **ensureBackwardCompatibility**: Ensures backward compatibility by copying data to legacy locations

### Example Usage

```typescript
// Normalize activity data
const normalizedActivity = normalizeActivityData(rawActivity);

// Validate against schema
const validationResult = validateActivityData(normalizedActivity, MultipleChoiceActivitySchema);

// Ensure backward compatibility
const backwardCompatibleActivity = ensureBackwardCompatibility(normalizedActivity);
```

## Activity Type Adapters

Activity type adapters provide type-specific normalization for each activity type:

### Adapter Interface

```typescript
interface ActivityTypeAdapter<T> {
  // Convert from any format to the standardized format
  normalize(data: any): ActivityData<T>;
  
  // Extract activity-specific data
  extractSpecificData(activity: ActivityData<T>): T;
  
  // Merge activity-specific data
  mergeSpecificData(activity: ActivityData, specificData: T): ActivityData<T>;
  
  // Validate the activity data
  validate(activity: ActivityData<T>): boolean;
  
  // Create default activity data
  createDefault(): ActivityData<T>;
}
```

### Implemented Adapters

1. **MultipleChoiceAdapter**: Handles multiple-choice activities
2. **TrueFalseAdapter**: Handles true/false activities
3. **FillInTheBlanksAdapter**: Handles fill-in-the-blanks activities

### Example Usage

```typescript
// Normalize using the multiple-choice adapter
const normalizedActivity = multipleChoiceAdapter.normalize(rawActivity);

// Extract specific data
const specificData = multipleChoiceAdapter.extractSpecificData(normalizedActivity);

// Merge specific data
const updatedActivity = multipleChoiceAdapter.mergeSpecificData(activity, specificData);
```

## Integration Points

The architecture is integrated at key points in the application:

### AI Studio Integration

1. **Content Generation Service**: Generates normalized activity data
2. **SimpleActivityPreview**: Normalizes activity data before displaying it
3. **AIStudioDialog**: Normalizes generated content before passing it to the conversation interface

### Editor Integration

1. **BaseActivityEditor**: Normalizes activity data before passing it to specific editors
2. **Multiple Choice Editor**: Uses the adapter for extracting and merging activity-specific data

## Best Practices

When working with activity data, follow these best practices:

1. **Always Use Normalization**: Always normalize activity data before using it
2. **Use Type Guards**: Use type guards to ensure type safety
3. **Handle Errors**: Add proper error handling with fallbacks
4. **Log Transformations**: Log data transformations for debugging
5. **Test Edge Cases**: Test with malformed or incomplete data

### Code Examples

#### Normalizing Activity Data

```typescript
// Import the normalization utilities
import { normalizeActivityData, ensureBackwardCompatibility } from '@/features/activities/utils/data-normalization';
import { multipleChoiceAdapter } from '@/features/activities/types/multiple-choice/adapter';

// Normalize activity data
let normalizedActivity;
try {
  // Use the appropriate adapter based on activity type
  switch (activityType) {
    case 'multiple-choice':
      normalizedActivity = multipleChoiceAdapter.normalize(rawActivity);
      break;
    default:
      normalizedActivity = normalizeActivityData(rawActivity);
  }
  
  // Ensure backward compatibility
  normalizedActivity = ensureBackwardCompatibility(normalizedActivity);
} catch (error) {
  console.error('Error normalizing activity data:', error);
  // Fall back to the original data
  normalizedActivity = rawActivity;
}
```

#### Updating Activity Data

```typescript
// Import the adapter
import { multipleChoiceAdapter } from '@/features/activities/types/multiple-choice/adapter';

// Update activity data
const updateActivity = (updates) => {
  try {
    // Use the adapter to merge the specific data with the activity
    const normalizedUpdatedActivity = multipleChoiceAdapter.mergeSpecificData(
      activity,
      {
        ...updates,
        activityType: 'multiple-choice',
        purpose: activity.purpose || ActivityPurpose.LEARNING
      }
    );
    
    // Update the activity
    onChange(normalizedUpdatedActivity);
  } catch (error) {
    console.error('Error normalizing updated activity data:', error);
    
    // Fall back to the original approach if normalization fails
    onChange({
      ...activity,
      content: updates
    });
  }
};
```

## Migration Guide

To migrate existing code to use the new architecture:

1. **Update Imports**: Import the normalization utilities and adapters
2. **Normalize Input Data**: Normalize activity data before using it
3. **Use Adapters**: Use the appropriate adapter for each activity type
4. **Handle Errors**: Add proper error handling with fallbacks
5. **Test Thoroughly**: Test with various data formats to ensure compatibility

### Example Migration

#### Before

```typescript
const handleActivityData = (activityData) => {
  // Extract questions from various locations
  const questions = activityData.questions || 
                   activityData.content?.questions || 
                   activityData.config?.questions || 
                   [];
  
  // Use the questions
  renderQuestions(questions);
};
```

#### After

```typescript
import { multipleChoiceAdapter } from '@/features/activities/types/multiple-choice/adapter';

const handleActivityData = (activityData) => {
  try {
    // Normalize the activity data
    const normalizedActivity = multipleChoiceAdapter.normalize(activityData);
    
    // Extract the questions
    const { questions } = normalizedActivity;
    
    // Use the questions
    renderQuestions(questions);
  } catch (error) {
    console.error('Error normalizing activity data:', error);
    
    // Fall back to the original approach
    const questions = activityData.questions || 
                     activityData.content?.questions || 
                     activityData.config?.questions || 
                     [];
    
    renderQuestions(questions);
  }
};
```

By following this architecture and these best practices, we ensure consistent activity data throughout the application, eliminating the data structure mismatch that previously caused issues.
