# Learning Outcome Criteria Documentation

## Overview

The Learning Outcome Criteria feature integrates rubric criteria directly with learning outcomes, allowing each learning outcome to have its own associated rubric criteria with performance levels. This creates a centralized approach where rubrics are managed alongside learning outcomes at the subject/topic level.

## Benefits

- **Consistent Assessment**: Ensures assessment criteria are directly aligned with learning outcomes
- **Reduced Duplication**: Eliminates the need to recreate criteria when building assessments
- **Standardized Evaluation**: Provides consistent evaluation criteria across different teachers and classes
- **Better Tracking**: Enables more precise tracking of student progress against specific learning outcomes
- **Bloom's Taxonomy Integration**: Criteria are aligned with Bloom's Taxonomy levels for cognitive depth

## Key Components

### 1. Learning Outcome Criteria

Each learning outcome can have multiple criteria, each with:
- Name and description
- Bloom's Taxonomy level alignment
- Weight (importance factor)
- Performance levels

### 2. Performance Levels

Each criterion has multiple performance levels that define:
- Level name (e.g., "Exceeds Expectations", "Meets Expectations")
- Description of performance at that level
- Score percentage
- Color coding for visual identification

### 3. Default Templates

The system provides default criteria templates for each Bloom's Taxonomy level:

- **Remember Level**:
  - Recall of Facts
  - Recognition of Information

- **Understand Level**:
  - Explanation of Concepts
  - Interpretation of Information

- **Apply Level**:
  - Application of Knowledge
  - Implementation of Procedures

- **Analyze Level**:
  - Analysis of Components
  - Identification of Patterns

- **Evaluate Level**:
  - Critical Evaluation
  - Justification of Decisions

- **Create Level**:
  - Creation of Original Work
  - Synthesis of Ideas

## Using Learning Outcome Criteria

### Creating Learning Outcomes with Criteria

1. Navigate to the Learning Outcomes management page for a subject or topic
2. Click "Add Learning Outcome" to create a new learning outcome
3. Fill in the basic details (statement, Bloom's level, action verbs)
4. Switch to the "Rubric Criteria" tab
5. Enable the "Enable Rubric Criteria" toggle
6. Default criteria will be generated based on the selected Bloom's level
7. Customize criteria and performance levels as needed
8. Save the learning outcome

### Editing Criteria

1. Find the learning outcome in the list
2. Click the "Edit" button
3. Switch to the "Rubric Criteria" tab
4. Modify criteria and performance levels
5. Save changes

### Using Criteria in Assessments

1. When creating an assessment, select learning outcomes
2. The system will show which learning outcomes have associated criteria
3. Import criteria from learning outcomes to build your assessment rubric
4. Customize as needed for the specific assessment

## Technical Implementation

### Data Model

Learning outcomes have been extended with:
- `hasCriteria` (boolean): Indicates if the learning outcome has criteria
- `criteria` (JSON): Stores the criteria data
- `performanceLevels` (JSON): Stores the performance level data

### Components

- **LearningOutcomeCriteriaEditor**: UI for creating and editing criteria
- **LearningOutcomeCriteriaPreview**: Displays criteria in a rubric format
- **LearningOutcomeCriteriaSelector**: Used in assessments to select criteria

### Helper Functions

- `generateDefaultCriteria()`: Creates default criteria based on Bloom's level
- `generateDefaultPerformanceLevels()`: Creates default performance levels
- `convertToRubricCriteria()`: Converts learning outcome criteria to assessment rubric criteria

## Best Practices

1. **Align with Learning Outcomes**: Ensure criteria directly measure the learning outcome
2. **Use Clear Language**: Write criteria descriptions that are specific and measurable
3. **Balance Criteria**: Don't create too many criteria for a single learning outcome
4. **Consistent Performance Levels**: Use consistent performance level descriptions
5. **Appropriate Weights**: Assign weights based on the importance of each criterion

## Integration with Other Features

- **Assessments**: Import criteria when creating assessment rubrics
- **Grading**: Use criteria for consistent grading across different assessments
- **Analytics**: Track student performance against specific criteria
- **Lesson Plans**: Align activities with learning outcome criteria

## Troubleshooting

### Common Issues

1. **Criteria not appearing in assessment**: Ensure the learning outcome has `hasCriteria` set to true
2. **Performance levels not displaying**: Check that performance levels are properly defined
3. **Changes not saving**: Verify you're clicking the Save button after making changes

### Support

For additional help, contact the system administrator or refer to the training materials.
