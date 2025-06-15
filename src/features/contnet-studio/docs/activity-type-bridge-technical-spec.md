# Activity Type Bridge System - Technical Specification

## Overview

The Activity Type Bridge System is a critical component of the AI Studio that ensures AI-generated content correctly maps to specific activity type editors and previews. This document provides a detailed technical specification for implementing this system.

## Problem Statement

When an activity type is selected and AI generates content, the system often fails to correctly load the specific activity type editor or preview component. This issue stems from several root causes:

1. Inconsistent mapping between high-level activity types and specific activity type IDs
2. Lazy loading challenges with activity type components
3. Component registration timing issues
4. Missing activity type information in generated content

## System Components

### 1. TypeMapper

The TypeMapper provides a centralized mapping between high-level activity types (e.g., SELF_STUDY, QUIZ) and specific activity type IDs (e.g., 'multiple-choice', 'fill-in-the-blanks').

#### API Contract

```typescript
/**
 * Maps a high-level activity type to a specific activity type ID
 * @param activityType The high-level activity type (e.g., SELF_STUDY, QUIZ)
 * @param purpose The purpose of the activity (LEARNING or ASSESSMENT)
 * @returns The specific activity type ID (e.g., 'multiple-choice', 'fill-in-the-blanks')
 */
function mapActivityTypeToId(activityType: string, purpose: ActivityPurpose): string;

/**
 * Gets the display name for an activity type
 * @param activityType The activity type ID or high-level type
 * @returns The display name for the activity type
 */
function getActivityTypeDisplayName(activityType: string): string;

/**
 * Gets the purpose for an activity type
 * @param activityType The activity type ID
 * @returns The purpose of the activity (LEARNING or ASSESSMENT)
 */
function getActivityTypePurpose(activityType: string): ActivityPurpose;
```

### 2. ComponentLoader

The ComponentLoader ensures that activity type components are preloaded before they are needed.

#### API Contract

```typescript
/**
 * Preloads components for a specific activity type
 * @param activityType The high-level activity type
 * @param purpose The purpose of the activity
 */
function preloadActivityTypeComponents(activityType: string, purpose: ActivityPurpose): void;

/**
 * Gets the editor component for an activity type
 * @param activityTypeId The specific activity type ID
 * @returns The editor component for the activity type
 */
function getActivityEditor(activityTypeId: string): React.ComponentType<any> | null;

/**
 * Gets the viewer component for an activity type
 * @param activityTypeId The specific activity type ID
 * @returns The viewer component for the activity type
 */
function getActivityViewer(activityTypeId: string): React.ComponentType<any> | null;
```

### 3. ContentTransformer

The ContentTransformer ensures that AI-generated content has the correct structure for the specific activity type.

#### API Contract

```typescript
/**
 * Transforms AI-generated content to match the expected structure for an activity type
 * @param content The AI-generated content
 * @param activityType The high-level activity type
 * @param purpose The purpose of the activity
 * @returns The transformed content
 */
function transformContent(content: any, activityType: string, purpose: ActivityPurpose): any;

/**
 * Validates that content has all required properties for an activity type
 * @param content The content to validate
 * @param activityTypeId The specific activity type ID
 * @returns Whether the content is valid
 */
function validateContent(content: any, activityTypeId: string): boolean;
```

### 4. FallbackProvider

The FallbackProvider provides fallback components when specific ones aren't available.

#### API Contract

```typescript
/**
 * Gets a fallback component for an activity type
 * @param activityType The activity type ID
 * @param componentType The type of component (editor or viewer)
 * @returns The fallback component
 */
function getFallbackComponent(activityType: string, componentType: 'editor' | 'viewer'): React.ComponentType<any>;

/**
 * Registers a fallback component for an activity type
 * @param activityType The activity type ID
 * @param componentType The type of component (editor or viewer)
 * @param component The fallback component
 */
function registerFallbackComponent(activityType: string, componentType: 'editor' | 'viewer', component: React.ComponentType<any>): void;
```

## Data Flow

### Activity Type Selection Flow

```
User selects activity type
↓
handleActivityTypeSelection is called
↓
Activity type is stored in state
↓
preloadActivityTypeComponents is called
↓
mapActivityTypeToId maps to specific activity type ID
↓
Activity registry is imported
↓
prefetchActivityType is called for the specific activity type ID
↓
Activity type components are loaded
```

### Content Generation Flow

```
User initiates content generation
↓
generateContent is called with parameters
↓
mapActivityTypeToId maps to specific activity type ID
↓
preloadActivityTypeComponents is called
↓
AI agent generates content
↓
transformContent transforms content to match expected structure
↓
Content is returned to the UI
```

### Content Preview Flow

```
Content is passed to ActivityPreview component
↓
renderActivityPreview is called
↓
activityTypeId is extracted from content or mapped from type
↓
getActivityViewer is called to get the viewer component
↓
If component not found, getFallbackComponent is called
↓
Component is rendered with the content
```

## Component Interfaces

### ActivityTypeBridge

```typescript
interface ActivityTypeBridgeProps {
  children: React.ReactNode;
}

function ActivityTypeBridge({ children }: ActivityTypeBridgeProps) {
  // Provide context for activity type mapping and loading
  return (
    <ActivityTypeBridgeContext.Provider value={...}>
      {children}
    </ActivityTypeBridgeContext.Provider>
  );
}
```

### useActivityTypeBridge Hook

```typescript
interface ActivityTypeBridgeContext {
  mapActivityTypeToId: (activityType: string, purpose: ActivityPurpose) => string;
  preloadActivityTypeComponents: (activityType: string, purpose: ActivityPurpose) => void;
  transformContent: (content: any, activityType: string, purpose: ActivityPurpose) => any;
  getActivityEditor: (activityTypeId: string) => React.ComponentType<any> | null;
  getActivityViewer: (activityTypeId: string) => React.ComponentType<any> | null;
  getFallbackComponent: (activityType: string, componentType: 'editor' | 'viewer') => React.ComponentType<any>;
}

function useActivityTypeBridge(): ActivityTypeBridgeContext {
  const context = React.useContext(ActivityTypeBridgeContext);
  if (!context) {
    throw new Error('useActivityTypeBridge must be used within an ActivityTypeBridge provider');
  }
  return context;
}
```

## Success Criteria

The Activity Type Bridge System will be considered successful if:

1. **Correct Mapping**: All high-level activity types correctly map to specific activity type IDs
2. **Component Loading**: Activity type components are successfully loaded before they are needed
3. **Content Structure**: AI-generated content has the correct structure for the specific activity type
4. **Fallback Handling**: When specific components aren't available, appropriate fallbacks are used
5. **Error Reduction**: The number of errors related to activity type mapping is reduced by at least 90%
6. **User Experience**: Users can successfully preview and edit AI-generated content for all supported activity types

## Implementation Plan

1. **Phase 1: Core Implementation**
   - Implement TypeMapper
   - Implement ComponentLoader
   - Implement ContentTransformer
   - Implement FallbackProvider

2. **Phase 2: Integration**
   - Integrate with AIStudioDialog
   - Integrate with content generation service
   - Integrate with ActivityPreview

3. **Phase 3: Testing and Refinement**
   - Test with all supported activity types
   - Refine based on test results
   - Implement monitoring and metrics

4. **Phase 4: Rollout**
   - Roll out to a subset of activity types
   - Monitor and address issues
   - Roll out to all activity types

## Dependencies

- Activity Registry
- AI Content Generation Service
- Activity Preview Component
- Activity Editor Component

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Activity registry changes | High | Medium | Create adapter layer to handle changes |
| New activity types | Medium | High | Design system to be extensible |
| Performance impact | Medium | Low | Implement efficient caching and preloading |
| Browser compatibility | Medium | Low | Test across browsers and implement polyfills |
| Server-side rendering | High | Medium | Design system to work with SSR |

## Conclusion

The Activity Type Bridge System is a critical component of the AI Studio that will ensure AI-generated content correctly maps to specific activity type editors and previews. By implementing this system, we will address a fundamental issue in the current implementation and provide a solid foundation for the rest of the AI Studio architecture.
