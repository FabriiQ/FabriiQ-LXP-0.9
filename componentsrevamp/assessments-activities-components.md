# Assessments & Activities Components Analysis

## Overview

This document analyzes the current state of assessment and activity-related components across different portals in the application and proposes a unified component structure to improve code reusability, maintainability, and consistency.

## Current Components

### Campus Admin Portal

1. **CampusAssessmentsContent**
   - Location: `src/components/admin/campus/CampusAssessmentsContent.tsx`
   - Purpose: Display and manage assessments at campus level
   - Features:
     - Search functionality
     - Program and class filtering
     - Assessment list with details
     - Status indicators

2. **AssessmentsList**
   - Location: `src/components/admin/assessments/AssessmentsList.tsx`
   - Purpose: Display list of assessments
   - Features:
     - Assessment details
     - Status indicators
     - Due dates
     - Completion rates
     - Actions

3. **AssessmentDetail**
   - Location: `src/components/admin/assessments/AssessmentDetail.tsx`
   - Purpose: Display detailed assessment information
   - Features:
     - Assessment information
     - Questions and answers
     - Student submissions
     - Grading status
     - Analytics

### Coordinator Portal

1. **CoordinatorAssessmentsClient**
   - Location: `src/components/coordinator/CoordinatorAssessmentsClient.tsx`
   - Purpose: Display assessments for coordinator's programs
   - Features:
     - Program and class filtering
     - Assessment list
     - Status indicators
     - Create assessment button

2. **AssessmentForm**
   - Location: `src/components/coordinator/AssessmentForm.tsx`
   - Purpose: Create and edit assessments
   - Features:
     - Assessment details form
     - Question creation
     - Grading options
     - Due date setting
     - Submission settings

3. **AssessmentReview**
   - Location: `src/components/coordinator/AssessmentReview.tsx`
   - Purpose: Review assessment results
   - Features:
     - Performance statistics
     - Student results
     - Question analysis
     - Feedback options

### Teacher Portal

1. **AssessmentCreator**
   - Location: `src/components/teacher/AssessmentCreator.tsx`
   - Purpose: Create and edit assessments
   - Features:
     - Assessment details form
     - Question creation
     - Grading options
     - Due date setting
     - Submission settings

2. **GradingInterface**
   - Location: `src/components/teacher/GradingInterface.tsx`
   - Purpose: Grade student submissions
   - Features:
     - Student list
     - Submission viewer
     - Grading tools
     - Feedback input
     - Batch grading options

3. **ResultsViewer**
   - Location: `src/components/teacher/ResultsViewer.tsx`
   - Purpose: View assessment results
   - Features:
     - Performance statistics
     - Student results
     - Question analysis
     - Export options

### Activity Components

1. **ActivityViewer**
   - Location: `src/features/activities/components/ActivityViewer.tsx`
   - Purpose: View interactive activities
   - Features:
     - Activity content display
     - Interactive elements
     - Progress tracking
     - Submission handling

2. **ActivityCreators**
   - Location: `src/features/activities/components/activity-creators/`
   - Purpose: Create different types of activities
   - Features:
     - Multiple activity type creators:
       - MultipleChoiceActivityCreator
       - MultipleResponseActivityCreator
       - TrueFalseActivityCreator
       - FillInTheBlanksActivityCreator
       - MatchingActivityCreator
       - SequenceActivityCreator
       - DragAndDropActivityCreator
       - DragTheWordsActivityCreator
       - NumericActivityCreator

3. **Activity Type Components**
   - Location: `src/features/activities/types/`
   - Purpose: Implement different activity types
   - Features:
     - Quiz activities
     - Video activities
     - Interactive content
     - Submission handling
     - Grading capabilities

## Redundancies and Duplications

1. **Assessment Creation**:
   - `AssessmentForm` (Coordinator)
   - `AssessmentCreator` (Teacher)
   - Both provide forms for creating/editing assessments with similar fields

2. **Assessment Results View**:
   - `AssessmentReview` (Coordinator)
   - `ResultsViewer` (Teacher)
   - Both display assessment results with similar visualizations

3. **Assessment List**:
   - `CampusAssessmentsContent` (Campus Admin)
   - `CoordinatorAssessmentsClient` (Coordinator)
   - Similar assessment listing functionality with different filtering options

## Proposed Unified Component Structure

### Core Components

1. **`AssessmentCard`**
   - Purpose: Display assessment information in a card format
   - Props:
     - `assessment`: Assessment data
     - `viewMode`: 'full' | 'compact' | 'mobile'
     - `userRole`: UserRole enum
     - `actions`: Array of allowed actions
   - Behavior:
     - System Admin: Show all information, administrative actions
     - Campus Admin: Show campus-relevant info, monitoring actions
     - Coordinator: Show program-relevant info, review actions
     - Teacher: Show class-relevant info, grading actions

2. **`AssessmentList`**
   - Purpose: Display a list of assessments with filtering
   - Props:
     - `assessments`: Array of assessment data
     - `userRole`: UserRole enum
     - `filters`: Available filters
     - `viewMode`: 'grid' | 'table' | 'mobile'
     - `onAction`: Callback for actions
   - Behavior:
     - Adapts display based on role and viewMode
     - Shows role-appropriate actions and filters

3. **`AssessmentDetail`**
   - Purpose: Display detailed assessment information
   - Props:
     - `assessment`: Assessment data
     - `userRole`: UserRole enum
     - `tabs`: Array of enabled tabs
     - `actions`: Array of allowed actions
   - Behavior:
     - Shows role-appropriate tabs and actions
     - Adapts detail level based on role

4. **`AssessmentForm`**
   - Purpose: Create/edit assessment information
   - Props:
     - `assessment`: Assessment data (optional for create)
     - `userRole`: UserRole enum
     - `classes`: Available classes
     - `subjects`: Available subjects
     - `onSubmit`: Submit callback
   - Behavior:
     - Shows role-appropriate fields
     - Coordinator: Program-specific options
     - Teacher: Class-specific options

5. **`ActivityViewer`**
   - Purpose: View and interact with activities
   - Props:
     - `activity`: Activity data
     - `userRole`: UserRole enum
     - `mode`: 'preview' | 'student' | 'review'
     - `submission`: Submission data (optional)
     - `onSubmit`: Submit callback
   - Behavior:
     - Adapts display based on mode and role
     - Shows appropriate interactions based on activity type

6. **`ActivityCreator`**
   - Purpose: Create/edit activities
   - Props:
     - `activity`: Activity data (optional for create)
     - `activityType`: Activity type
     - `userRole`: UserRole enum
     - `onSubmit`: Submit callback
   - Behavior:
     - Shows appropriate editor based on activity type
     - Adapts options based on user role

### Supporting Components

1. **`AssessmentTabs`**
   - Purpose: Tab container for assessment detail
   - Props:
     - `assessment`: Assessment data
     - `userRole`: UserRole enum
     - `enabledTabs`: Array of enabled tabs

2. **`AssessmentActions`**
   - Purpose: Action buttons for assessment management
   - Props:
     - `assessment`: Assessment data
     - `userRole`: UserRole enum
     - `enabledActions`: Array of enabled actions

3. **`AssessmentFilters`**
   - Purpose: Filter controls for assessment lists
   - Props:
     - `filters`: Current filter state
     - `userRole`: UserRole enum
     - `availableFilters`: Array of available filters
     - `onFilterChange`: Filter change callback

4. **`GradingInterface`**
   - Purpose: Grade student submissions
   - Props:
     - `assessment`: Assessment data
     - `submissions`: Array of submission data
     - `userRole`: UserRole enum
     - `onGrade`: Grading callback

5. **`ResultsAnalytics`**
   - Purpose: Display assessment results analytics
   - Props:
     - `assessment`: Assessment data
     - `submissions`: Array of submission data
     - `userRole`: UserRole enum
     - `metrics`: Array of analytics metrics to display

6. **`QuestionEditor`**
   - Purpose: Edit assessment questions
   - Props:
     - `question`: Question data
     - `questionType`: Question type
     - `onChange`: Change callback

## Implementation Recommendations

1. **Create a shared components folder structure**:
   ```
   /src/components/shared/
   ├── entities/
   │   ├── assessments/
   │   │   ├── AssessmentCard.tsx
   │   │   ├── AssessmentList.tsx
   │   │   ├── AssessmentDetail.tsx
   │   │   ├── AssessmentForm.tsx
   │   │   ├── AssessmentTabs.tsx
   │   │   ├── AssessmentActions.tsx
   │   │   ├── AssessmentFilters.tsx
   │   │   ├── GradingInterface.tsx
   │   │   ├── ResultsAnalytics.tsx
   │   │   └── QuestionEditor.tsx
   │   ├── activities/
   │   │   ├── ActivityViewer.tsx
   │   │   ├── ActivityCreator.tsx
   │   │   ├── activity-types/
   │   │   │   ├── QuizActivity.tsx
   │   │   │   ├── VideoActivity.tsx
   │   │   │   └── ...
   │   │   └── activity-creators/
   │   │       ├── MultipleChoiceCreator.tsx
   │   │       ├── MatchingCreator.tsx
   │   │       └── ...
   ```

2. **Implement role-based rendering**:
   - Use the `userRole` prop to conditionally render appropriate content
   - Create role-specific configurations for each component
   - Use composition to build complex components from simpler ones

3. **Migration strategy**:
   - Create new unified components
   - Replace existing components one at a time
   - Start with the most frequently used components
   - Test thoroughly after each replacement

## Benefits of Unification

1. **Reduced code duplication**: Single source of truth for each component type
2. **Consistent user experience**: Same component behavior across different portals
3. **Easier maintenance**: Changes only need to be made in one place
4. **Better testability**: Fewer components to test
5. **Faster development**: Reuse existing components for new features
