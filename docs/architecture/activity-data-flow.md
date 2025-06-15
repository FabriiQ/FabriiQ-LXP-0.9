# Activity Data Flow

This document outlines how activity data flows through the system, from AI generation to storage and display.

## Data Flow Diagram

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│                 │     │                   │     │                     │
│  AI Generation  │────▶│  Normalization    │────▶│  Activity Editor    │
│                 │     │  Layer            │     │                     │
└─────────────────┘     └───────────────────┘     └─────────────────────┘
        │                        ▲                          │
        │                        │                          │
        │                        │                          │
        ▼                        │                          ▼
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│                 │     │                   │     │                     │
│  AI Studio      │────▶│  Activity         │◀────│  Activity Storage   │
│  Preview        │     │  Type Adapters    │     │  (Database)         │
│                 │     │                   │     │                     │
└─────────────────┘     └───────────────────┘     └─────────────────────┘
                                 │                          ▲
                                 │                          │
                                 ▼                          │
                        ┌───────────────────┐     ┌─────────────────────┐
                        │                   │     │                     │
                        │  Activity Viewer  │────▶│  Student Responses  │
                        │                   │     │                     │
                        └───────────────────┘     └─────────────────────┘
```

## Data Flow Description

### 1. AI Generation to Normalization Layer

- **Source**: AI Studio generates activity content based on user prompts
- **Format**: AI returns JSON with activity-specific data in various locations
- **Transformation**: The normalization layer standardizes this data
- **Destination**: Normalized data is passed to the Activity Editor or Preview

### 2. Activity Editor to Storage

- **Source**: Teacher edits activity in the Activity Editor
- **Format**: Editor uses normalized data structure
- **Transformation**: Data is prepared for storage
- **Destination**: Activity is saved to the database

### 3. Storage to Activity Viewer

- **Source**: Activity data is retrieved from the database
- **Format**: May have inconsistent structure based on when it was created
- **Transformation**: Activity Type Adapters normalize the data
- **Destination**: Activity Viewer displays the activity to students

### 4. Activity Viewer to Student Responses

- **Source**: Student interacts with the activity
- **Format**: Student responses are captured in a standardized format
- **Transformation**: Responses are validated and scored
- **Destination**: Student responses are saved to the database

### 5. AI Studio Preview

- **Source**: AI-generated content
- **Format**: Raw AI output
- **Transformation**: Normalization Layer and Activity Type Adapters
- **Destination**: Preview component shows how the activity will appear

## Key Data Transformation Points

### Normalization Layer

The normalization layer is responsible for:

1. **Standardizing Structure**: Ensuring data follows the defined interfaces
2. **Resolving Inconsistencies**: Finding data in all possible locations
3. **Type Safety**: Validating data against schemas
4. **Backward Compatibility**: Supporting legacy data formats

### Activity Type Adapters

Activity Type Adapters are responsible for:

1. **Type-Specific Transformations**: Handling unique aspects of each activity type
2. **Bidirectional Conversion**: Converting between storage format and editor/viewer format
3. **Default Values**: Providing sensible defaults for missing properties
4. **Validation**: Ensuring activity-specific data is valid

## Implementation Considerations

1. **Performance**: Minimize unnecessary transformations
2. **Error Handling**: Gracefully handle malformed data
3. **Logging**: Log data transformations for debugging
4. **Caching**: Cache normalized data when appropriate
5. **Versioning**: Support multiple versions of data structures
