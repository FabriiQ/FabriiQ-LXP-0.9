# Centralized Grading Components Implementation Plan

This document outlines the plan for implementing centralized grading components within the Bloom's Taxonomy feature that can be reused across assessments, activities, and class components.

## Overview

Currently, grading components are scattered across different features (assessments, activities, class), leading to duplication and inconsistency. By centralizing these components in the Bloom's Taxonomy feature, we can:

1. Ensure consistent grading experiences across the platform
2. Integrate Bloom's Taxonomy cognitive levels into all grading workflows
3. Reduce code duplication and maintenance overhead
4. Provide a unified API for grading that works with different content types

## Component Structure

```
src/features/bloom/
├── components/
│   ├── grading/
│   │   ├── index.ts                      # Exports all grading components
│   │   ├── RubricGrading.tsx             # Rubric-based grading component
│   │   ├── CognitiveGrading.tsx          # Bloom's level-specific grading
│   │   ├── FeedbackGenerator.tsx         # AI-assisted feedback generation
│   │   ├── BatchGrading.tsx              # Batch grading interface
│   │   ├── GradingInterface.tsx          # Main grading interface
│   │   ├── GradingForm.tsx               # Reusable grading form
│   │   ├── GradingResult.tsx             # Displays grading results
│   │   └── BloomsLevelFeedback.tsx       # Level-specific feedback component
```

## Implementation Steps

### Phase 1: Core Grading Components

1. **Create Base Types and Interfaces**
   - Define common grading interfaces in `src/features/bloom/types/grading.ts`
   - Ensure compatibility with existing assessment and activity types

2. **Implement Core Grading Components**
   - Create `RubricGrading.tsx` for rubric-based assessment
   - Create `GradingForm.tsx` as a reusable form component
   - Create `GradingInterface.tsx` as the main container component

3. **Implement Bloom's Taxonomy Integration**
   - Create `CognitiveGrading.tsx` for Bloom's level-specific grading
   - Create `BloomsLevelFeedback.tsx` for cognitive level feedback

### Phase 2: Advanced Grading Features

1. **Implement Feedback Generation**
   - Create `FeedbackGenerator.tsx` with AI-assisted feedback
   - Integrate with Bloom's Taxonomy levels for targeted feedback

2. **Implement Batch Grading**
   - Create `BatchGrading.tsx` for grading multiple submissions
   - Ensure compatibility with different content types

3. **Implement Results Visualization**
   - Create `GradingResult.tsx` for displaying grading outcomes
   - Include Bloom's Taxonomy distribution visualization

### Phase 3: Integration with Existing Features

1. **Update Assessment Feature**
   - Refactor assessment grading to use centralized components
   - Ensure backward compatibility

2. **Update Activities Feature**
   - Refactor activity grading to use centralized components
   - Maintain existing functionality

3. **Update Class Components**
   - Integrate centralized grading into class dashboards
   - Update teacher interfaces

## Component Details

### RubricGrading.tsx

This component will provide a comprehensive rubric-based grading interface:

- Display rubric criteria organized by Bloom's Taxonomy levels
- Allow selection of performance levels for each criterion
- Calculate scores based on rubric weights
- Generate feedback based on selected performance levels
- Support both analytic and holistic rubrics

### CognitiveGrading.tsx

This component will focus on grading based on Bloom's Taxonomy levels:

- Provide level-specific grading criteria
- Visualize student performance across cognitive levels
- Suggest improvements based on cognitive gaps
- Support differentiated scoring based on cognitive complexity

### FeedbackGenerator.tsx

This component will assist teachers in providing quality feedback:

- Generate feedback suggestions based on performance
- Tailor feedback to specific Bloom's Taxonomy levels
- Support customization and editing of suggestions
- Include actionable improvement recommendations

### BatchGrading.tsx

This component will enable efficient grading of multiple submissions:

- Display submissions in a tabular format
- Allow quick scoring and feedback entry
- Support filtering and sorting by various criteria
- Provide cognitive level distribution for the batch

### GradingInterface.tsx

This main container component will:

- Coordinate between different grading components
- Handle submission loading and saving
- Manage grading workflow states
- Provide a consistent user experience

## API Design

The grading components will expose a consistent API:

```tsx
// Example usage
<BloomsGradingInterface
  submissionId="submission-123"
  contentType="assessment" // or "activity"
  rubricId="rubric-456"
  bloomsLevels={[BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE]}
  onGradeSubmit={handleGradeSubmit}
  showCognitiveAnalysis={true}
/>
```

## Integration Strategy

To ensure smooth adoption:

1. Create the new components without disrupting existing functionality
2. Provide adapter components for backward compatibility
3. Update documentation with migration guides
4. Implement feature flags for gradual rollout

## Next Steps

1. Create the base types and interfaces
2. Implement the core RubricGrading component
3. Develop the GradingForm and GradingInterface components
4. Test with existing assessment and activity data
5. Begin integration with assessment feature
