# Bloom's Taxonomy Grading Components

This document provides an overview of the grading components in the Bloom's Taxonomy feature, including usage examples and API integration points.

## Overview

The Bloom's Taxonomy grading components provide a comprehensive system for grading student submissions with integration of Bloom's Taxonomy cognitive levels. These components can be used across different parts of the application, including assessments, activities, and class components.

## Components

### 1. RubricGrading

A component for grading submissions based on rubric criteria.

```tsx
import { RubricGrading } from '@/features/bloom/components/grading';

<RubricGrading
  rubricId="rubric-1"
  rubricType={RubricType.ANALYTIC}
  criteria={criteria}
  performanceLevels={performanceLevels}
  maxScore={100}
  initialValues={initialValues}
  onGradeChange={handleGradeChange}
  readOnly={false}
  showBloomsLevels={true}
/>
```

### 2. CognitiveGrading

A component for grading submissions based on Bloom's Taxonomy cognitive levels.

```tsx
import { CognitiveGrading } from '@/features/bloom/components/grading';

<CognitiveGrading
  bloomsLevels={bloomsLevels}
  maxScorePerLevel={maxScorePerLevel}
  initialValues={initialValues}
  onGradeChange={handleGradeChange}
  readOnly={false}
  showAnalysis={true}
/>
```

### 3. GradingInterface

A comprehensive interface for grading student submissions with support for rubric-based grading, cognitive level grading, and simple scoring.

```tsx
import { GradingInterface } from '@/features/bloom/components/grading';

<GradingInterface
  gradingContext={gradingContext}
  contentType={GradableContentType.ASSESSMENT}
  initialValues={initialValues}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  readOnly={false}
  showRubricGrading={true}
  showCognitiveGrading={true}
  showSimpleGrading={true}
/>
```

### 4. GradingForm

A simple form for grading submissions without rubrics or cognitive levels.

```tsx
import { GradingForm } from '@/features/bloom/components/grading';

<GradingForm
  gradingContext={gradingContext}
  initialValues={initialValues}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  showRubricGrading={false}
  showBloomsLevels={false}
  maxScore={100}
/>
```

### 5. FeedbackGenerator

A component for generating AI-assisted feedback based on Bloom's Taxonomy cognitive levels.

```tsx
import { FeedbackGenerator } from '@/features/bloom/components/grading';

<FeedbackGenerator
  bloomsLevels={bloomsLevels}
  studentName="John Doe"
  submissionContent={submissionContent}
  onFeedbackSelect={handleFeedbackSelect}
/>
```

### 6. BatchGrading

A component for grading multiple submissions at once.

```tsx
import { BatchGrading } from '@/features/bloom/components/grading';

<BatchGrading
  entries={entries}
  contentType={GradableContentType.ASSESSMENT}
  onGradeSubmit={handleGradeSubmit}
  onViewSubmission={handleViewSubmission}
  onEditGrading={handleEditGrading}
/>
```

### 7. GradingResult

A component for displaying the results of a grading operation.

```tsx
import { GradingResult } from '@/features/bloom/components/grading';

<GradingResult
  result={result}
  contentType={GradableContentType.ASSESSMENT}
  studentName="John Doe"
  criteria={criteria}
  showBloomsLevels={true}
  onPrint={handlePrint}
  onDownload={handleDownload}
  onShare={handleShare}
/>
```

### 8. BloomsLevelFeedback

A component for providing level-specific feedback templates and suggestions for each Bloom's Taxonomy cognitive level.

```tsx
import { BloomsLevelFeedback } from '@/features/bloom/components/grading';

<BloomsLevelFeedback
  bloomsLevel={BloomsTaxonomyLevel.ANALYZE}
  studentName="John Doe"
  onFeedbackSelect={handleFeedbackSelect}
/>
```

## API Integration

The grading components integrate with the following API endpoints:

### 1. Get Grading Context

```tsx
const { data: gradingContext } = api.bloomGrading.getGradingContext.useQuery({
  submissionId: "submission-1",
  contentType: GradableContentType.ASSESSMENT
});
```

### 2. Submit Grades

```tsx
const submitGrades = api.bloomGrading.submitGrades.useMutation();

const handleSubmit = async (values: GradingFormValues) => {
  await submitGrades.mutateAsync({
    submissionId: "submission-1",
    contentType: GradableContentType.ASSESSMENT,
    score: values.score,
    feedback: values.feedback,
    bloomsLevelScores: values.bloomsLevelScores,
    criteriaResults: values.criteriaResults
  });
};
```

### 3. Get Batch Grading Entries

```tsx
const { data: batchEntries } = api.bloomGrading.getBatchGradingEntries.useQuery({
  classId: "class-1",
  contentType: GradableContentType.ASSESSMENT,
  contentId: "assessment-1"
});
```

### 4. Submit Batch Grades

```tsx
const submitBatchGrades = api.bloomGrading.submitBatchGrades.useMutation();

const handleBatchSubmit = async (entries: BatchGradingEntry[]) => {
  await submitBatchGrades.mutateAsync({
    entries: entries.map(entry => ({
      submissionId: entry.submissionId,
      score: entry.score,
      feedback: entry.feedback,
      status: entry.status
    }))
  });
};
```

### 5. Generate AI Feedback

```tsx
const generateFeedback = api.bloomGrading.generateFeedback.useMutation();

const handleGenerateFeedback = async () => {
  const result = await generateFeedback.mutateAsync({
    submissionContent: "This is a sample submission content.",
    studentName: "John Doe",
    bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND
  });
  
  // Use the generated feedback
  console.log(result.suggestions);
};
```

### 6. Get Grading Result

```tsx
const { data: gradingResult } = api.bloomGrading.getGradingResult.useQuery({
  submissionId: "submission-1",
  contentType: GradableContentType.ASSESSMENT
});
```

## Integration with Existing System

The grading components are designed to integrate seamlessly with the existing system:

1. **Assessment Integration**: Use the `GradingInterface` component to grade assessment submissions.
2. **Activity Integration**: Use the `GradingInterface` component to grade activity submissions.
3. **Class Integration**: Use the `BatchGrading` component to grade multiple submissions for a class.
4. **Teacher Dashboard Integration**: Use the `GradingResult` component to display grading results in the teacher dashboard.

## Error Handling

All components include proper error handling and loading states:

1. **Loading States**: Components display loading indicators when data is being fetched or submitted.
2. **Error States**: Components display error messages when API calls fail.
3. **Validation**: Components validate user input before submission.

## Mobile Responsiveness

All components are designed to be responsive and work well on mobile devices:

1. **Responsive Layout**: Components use responsive layouts that adapt to different screen sizes.
2. **Touch-Friendly**: Components are designed to be touch-friendly for mobile users.
3. **Mobile-First**: Components follow a mobile-first design approach.

## Accessibility

All components are designed to be accessible:

1. **Keyboard Navigation**: Components support keyboard navigation.
2. **Screen Reader Support**: Components include proper ARIA attributes for screen reader support.
3. **Color Contrast**: Components use colors with sufficient contrast for readability.

## Best Practices

When using these components, follow these best practices:

1. **Centralized Usage**: Use the components from the centralized `@/features/bloom/components/grading` import path.
2. **Consistent API**: Use the same API endpoints for all grading operations.
3. **Error Handling**: Always handle errors from API calls.
4. **Loading States**: Always show loading states during API calls.
5. **Validation**: Always validate user input before submission.
