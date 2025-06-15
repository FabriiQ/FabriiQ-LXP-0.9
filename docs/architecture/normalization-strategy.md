# Activity Data Normalization Strategy

This document outlines the strategy for normalizing activity data between different parts of the system.

## Goals

1. **Consistency**: Ensure data has a consistent structure regardless of source
2. **Type Safety**: Eliminate use of `any` types and unsafe type assertions
3. **Backward Compatibility**: Support existing data formats
4. **Performance**: Minimize performance impact of normalization
5. **Maintainability**: Make the system easier to understand and maintain

## Normalization Approach

### 1. Standardized Data Model

We will use the interfaces defined in `src/features/activities/types/activity-data.ts` as the canonical data model. All components should work with this model.

### 2. Bidirectional Normalization

Normalization will work in both directions:

- **Inbound Normalization**: Convert from external formats (AI, storage) to the standardized model
- **Outbound Normalization**: Convert from the standardized model to external formats when needed

### 3. Layered Architecture

The normalization system will have three layers:

1. **Core Normalization Layer**: Generic functions that work for all activity types
2. **Activity Type Adapters**: Type-specific adapters for each activity type
3. **Component Integration**: Integration with AI Studio, editors, and viewers

## Normalization Functions

### Core Normalization Functions

```typescript
// Convert any activity data to the standardized format
function normalizeActivityData<T>(data: any): ActivityData<T>;

// Extract activity-specific data from a normalized activity
function extractActivitySpecificData<T>(activity: ActivityData<T>): T;

// Merge activity-specific data into a normalized activity
function mergeActivitySpecificData<T>(activity: ActivityData, specificData: T): ActivityData<T>;

// Validate activity data against its schema
function validateActivityData<T>(activity: ActivityData<T>, schema: z.ZodSchema): boolean;
```

### Activity Type Adapters

Each activity type will have an adapter with these functions:

```typescript
// Interface for activity type adapters
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

## Handling Specific Issues

### 1. Multiple Data Locations

To handle data that might exist in multiple locations:

```typescript
function findQuestions(data: any): any[] {
  // Check all possible locations in order of preference
  return data.questions || 
         data.content?.questions || 
         data.config?.questions || 
         data.content?.config?.questions || 
         [];
}
```

### 2. Inconsistent Data Structures

For inconsistent data structures, we'll use type guards and converters:

```typescript
// Type guard for option format
function isStringOption(option: any): option is string {
  return typeof option === 'string';
}

// Convert string options to object options
function convertStringOptions(options: string[]): MultipleChoiceOption[] {
  return options.map((text, index) => ({
    id: `option-${index}`,
    text,
    isCorrect: false
  }));
}
```

### 3. Backward Compatibility

To maintain backward compatibility:

```typescript
function normalizeWithBackwardCompatibility<T>(data: any): ActivityData<T> {
  // Normalize to the standardized format
  const normalized = normalizeActivityData<T>(data);
  
  // Ensure backward compatibility by copying data to legacy locations
  normalized.content = {
    ...normalized.content,
    activityType: normalized.activityType,
    questions: normalized.questions,
    // Other activity-specific properties
  };
  
  normalized.config = {
    ...normalized.config,
    questions: normalized.questions,
    // Other configuration properties
  };
  
  return normalized;
}
```

## Implementation Strategy

### Phase 1: Core Normalization Layer

1. Implement the core normalization functions
2. Add comprehensive type guards
3. Create test fixtures for different data formats

### Phase 2: Activity Type Adapters

1. Create adapters for each activity type
2. Start with Multiple Choice (highest priority)
3. Implement bidirectional conversion
4. Add validation against schemas

### Phase 3: Component Integration

1. Update AI Studio components to use normalization
2. Update editor components to use normalized data
3. Add comprehensive logging for debugging

## Testing Strategy

1. **Unit Tests**: Test each normalization function with various inputs
2. **Integration Tests**: Test the end-to-end flow with real data
3. **Edge Cases**: Test with malformed or incomplete data
4. **Performance Tests**: Measure the performance impact of normalization

## Monitoring and Logging

1. **Performance Monitoring**: Track normalization time
2. **Error Logging**: Log normalization errors with detailed information
3. **Data Transformation Logging**: Log before/after states for debugging
