# Manual Grading Implementation with Bloom's Taxonomy and Rubrics

This document provides an overview of the manual grading implementation for activities and assessments using Bloom's Taxonomy and rubrics.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Integration with Teacher Activity Grading](#integration-with-teacher-activity-grading)
4. [Usage Examples](#usage-examples)
5. [API Integration](#api-integration)
6. [Future Enhancements](#future-enhancements)

## Overview

The manual grading implementation allows teachers to create and grade activities and assessments using Bloom's Taxonomy and rubrics. The implementation consists of several components that work together to provide a comprehensive grading experience.

### Key Features

- Creation of manual grading activities with Bloom's Taxonomy integration
- Creation of class assessments with Bloom's Taxonomy distribution
- Grading of activities and assessments using rubrics
- Integration with existing grading components from the Bloom's feature
- Support for different submission types (text, file, link)
- Visualization of Bloom's Taxonomy distribution

## Components

### Manual Grading Activity

#### Models

- `ManualGradingActivity`: Represents a manual grading activity with Bloom's Taxonomy integration
- `ManualGradingAttachment`: Represents an attachment to a manual grading activity
- `ManualGradingSubmission`: Represents a student's submission for a manual grading activity

#### Components

- `ManualGradingCreator`: Component for creating manual grading activities
- `ManualGradingViewer`: Component for viewing and submitting manual grading activities
- `ManualGradingGrader`: Component for grading manual grading activities

### Class Assessment

#### Components

- `ClassAssessmentCreator`: Component for creating class assessments with Bloom's Taxonomy distribution
- `AssessmentGrading`: Component for grading class assessments

### Bloom's Taxonomy Integration

The implementation reuses the following components from the Bloom's feature:

- `RubricGrading`: Component for grading using rubrics
- `CognitiveGrading`: Component for grading using Bloom's Taxonomy levels
- `BloomsTaxonomySelector`: Component for selecting Bloom's Taxonomy levels
- `ActionVerbSuggestions`: Component for suggesting action verbs based on Bloom's Taxonomy levels

## Integration with Teacher Activity Grading

The manual grading implementation integrates with the existing teacher activity grading workflow as follows:

1. **Activity Creation**: Teachers create manual grading activities using the `ManualGradingCreator` component, specifying the Bloom's Taxonomy level, rubric, and submission requirements.

2. **Student Submission**: Students submit their work using the `ManualGradingViewer` component, which supports text, file, and link submissions.

3. **Teacher Grading**: Teachers grade submissions using the `ManualGradingGrader` component, which provides a comprehensive grading interface with rubric and cognitive grading options.

4. **Assessment Creation and Grading**: Teachers create and grade class assessments using the `ClassAssessmentCreator` and `AssessmentGrading` components, which provide similar functionality for assessments.

### Workflow Diagram

```
Teacher                                 Student
┌─────────────────┐                    ┌─────────────────┐
│ Create Activity │                    │ View Activity   │
│ or Assessment   │                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ Specify Bloom's │                    │ Submit Work     │
│ Level & Rubric  │                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      │
┌─────────────────┐                             │
│ Assign to       │                             │
│ Students        │                             │
└────────┬────────┘                             │
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ Grade           │◄───────────────────┤ Submission      │
│ Submissions     │                    │ Stored          │
└─────────────────┘                    └─────────────────┘
```

## Usage Examples

### Creating a Manual Grading Activity

```tsx
import { ManualGradingCreator } from '@/features/activties/components/activity-creators/ManualGradingCreator';

// In your component
return (
  <ManualGradingCreator
    onSave={(activity) => {
      // Save the activity to the database
      console.log('Activity saved:', activity);
    }}
    onCancel={() => {
      // Handle cancel
    }}
  />
);
```

### Grading a Manual Grading Activity

```tsx
import { ManualGradingGrader } from '@/features/activties/components/grading/ManualGradingGrader';

// In your component
return (
  <ManualGradingGrader
    activity={activity}
    studentId={studentId}
    submissionId={submissionId}
    onGraded={() => {
      // Handle graded event
      console.log('Activity graded');
    }}
  />
);
```

### Creating a Class Assessment

```tsx
import { ClassAssessmentCreator } from '@/features/assessments/components/ClassAssessmentCreator';

// In your component
return (
  <ClassAssessmentCreator
    onSave={async (values) => {
      // Save the assessment to the database
      console.log('Assessment saved:', values);
    }}
    onCancel={() => {
      // Handle cancel
    }}
  />
);
```

## API Integration

The implementation integrates with the following API endpoints:

- `api.activityGrade.get`: Get a student's submission for an activity
- `api.activityGrade.update`: Update a student's grade for an activity
- `api.assessment.getById`: Get an assessment by ID
- `api.assessment.getSubmission`: Get a student's submission for an assessment
- `api.assessment.gradeSubmission`: Grade a student's submission for an assessment
- `api.rubric.getById`: Get a rubric by ID
- `api.user.getById`: Get a user by ID

## Future Enhancements

- **Batch Grading**: Add support for grading multiple submissions at once
- **Feedback Templates**: Add support for reusable feedback templates
- **AI-Assisted Grading**: Integrate with AI to provide grading suggestions
- **Peer Review**: Add support for peer review of submissions
- **Mobile Support**: Enhance mobile support for grading on tablets and phones
