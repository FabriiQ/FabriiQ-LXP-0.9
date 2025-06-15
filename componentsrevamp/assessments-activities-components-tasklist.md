# Assessments & Activities Components Task List

This document outlines the tasks required to implement the unified assessment and activity-related components as proposed in the Assessments & Activities Components Analysis document. The goal is to create a set of shared, role-based components that can be used across all portals in the application.

#use ui components in D:\Learning Q2\LXP 14-04-25 backup\LXP 14-04-25 backup\src\components\ui\core if neded create new components in this directory

## Component Structure

```
/src/components/shared/entities/assessments/
├── AssessmentCard.tsx
├── AssessmentList.tsx
├── AssessmentDetail.tsx
├── AssessmentForm.tsx
├── AssessmentTabs.tsx
├── AssessmentActions.tsx
├── AssessmentFilters.tsx
├── GradingInterface.tsx
├── ResultsAnalytics.tsx
├── QuestionEditor.tsx
├── __tests__/
│   ├── AssessmentCard.test.tsx
│   ├── AssessmentList.test.tsx
│   ├── AssessmentDetail.test.tsx
│   ├── AssessmentForm.test.tsx
│   ├── AssessmentTabs.test.tsx
│   ├── AssessmentActions.test.tsx
│   ├── AssessmentFilters.test.tsx
│   ├── GradingInterface.test.tsx
│   ├── ResultsAnalytics.test.tsx
│   └── QuestionEditor.test.tsx
└── types.ts

/src/components/shared/entities/activities/
├── ActivityViewer.tsx
├── ActivityCreator.tsx
├── activity-types/
│   ├── QuizActivity.tsx
│   ├── VideoActivity.tsx
│   └── ...
├── activity-creators/
│   ├── MultipleChoiceCreator.tsx
│   ├── MatchingCreator.tsx
│   └── ...
├── __tests__/
│   ├── ActivityViewer.test.tsx
│   ├── ActivityCreator.test.tsx
│   ├── activity-types/
│   │   ├── QuizActivity.test.tsx
│   │   ├── VideoActivity.test.tsx
│   │   └── ...
│   └── activity-creators/
│       ├── MultipleChoiceCreator.test.tsx
│       ├── MatchingCreator.test.tsx
│       └── ...
└── types.ts
```

## Design Principles

- **Mobile-First**: All components should be designed with mobile-first approach
- **Role-Based Rendering**: Components should adapt based on user role
- **Performance Optimized**: Components should be optimized for fast loading and rendering
- **Accessibility**: Components should follow accessibility best practices
- **Consistent UI/UX**: Components should follow the design system

## Tasks

### 1. Setup and Types (Estimated time: 6 hours)

- [ ] Create the folder structure for assessment and activity components
- [ ] Create assessment `types.ts` with necessary type definitions:
  - [ ] `AssessmentData` interface
  - [ ] `AssessmentAction` enum
  - [ ] `AssessmentTab` enum
  - [ ] `AssessmentFilter` interface
  - [ ] `AssessmentFormData` interface
  - [ ] `QuestionData` interface
  - [ ] `SubmissionData` interface
- [ ] Create activity `types.ts` with necessary type definitions:
  - [ ] `ActivityData` interface
  - [ ] `ActivityType` enum
  - [ ] `ActivityAction` enum
  - [ ] `ActivityFormData` interface

### 2. Assessment Components (Estimated time: 40 hours)

#### 2.1 AssessmentCard Component (8 hours)

- [ ] Create `AssessmentCard.tsx` component:
  - [ ] Implement mobile-first design
  - [ ] Add role-based rendering (Campus Admin, Coordinator, Teacher)
  - [ ] Add support for different view modes (full, compact, mobile)
  - [ ] Implement action buttons integration
  - [ ] Add status indicators
  - [ ] Display class and subject information
  - [ ] Show completion rates
  - [ ] Optimize for performance
  - [ ] Add accessibility features
  - [ ] Create tests in `__tests__/AssessmentCard.test.tsx`

#### 2.2 AssessmentActions Component (6 hours)

- [ ] Create `AssessmentActions.tsx` component:
  - [ ] Implement role-based action buttons
  - [ ] Add support for different action types (view, edit, delete, grade, etc.)
  - [ ] Implement confirmation dialogs for destructive actions
  - [ ] Add tooltips for action buttons
  - [ ] Optimize for mobile view
  - [ ] Create tests in `__tests__/AssessmentActions.test.tsx`

#### 2.3 AssessmentFilters Component (6 hours)

- [ ] Create `AssessmentFilters.tsx` component:
  - [ ] Implement search functionality
  - [ ] Add class filter
  - [ ] Add status filter
  - [ ] Add date range filter
  - [ ] Implement role-based filter visibility
  - [ ] Add responsive design for mobile
  - [ ] Implement filter state management
  - [ ] Create tests in `__tests__/AssessmentFilters.test.tsx`

#### 2.4 AssessmentList Component (8 hours)

- [ ] Create `AssessmentList.tsx` component:
  - [ ] Implement list view
  - [ ] Add pagination
  - [ ] Integrate with AssessmentCard component
  - [ ] Integrate with AssessmentFilters component
  - [ ] Add sorting functionality
  - [ ] Implement role-based list features
  - [ ] Add empty state handling
  - [ ] Optimize for performance with virtualization
  - [ ] Create tests in `__tests__/AssessmentList.test.tsx`

#### 2.5 AssessmentDetail, Tabs, and Form (12 hours)

- [ ] Create `AssessmentDetail.tsx`, `AssessmentTabs.tsx`, and `AssessmentForm.tsx` components
- [ ] Implement detail view with tabs for different sections
- [ ] Create form for creating and editing assessments
- [ ] Add role-based features and permissions
- [ ] Implement responsive design for mobile
- [ ] Create corresponding test files

### 3. Activity Components (Estimated time: 36 hours)

#### 3.1 ActivityViewer Component (8 hours)

- [ ] Create `ActivityViewer.tsx` component:
  - [ ] Implement activity content display
  - [ ] Add support for different activity types
  - [ ] Implement interactive elements
  - [ ] Add progress tracking
  - [ ] Implement submission handling
  - [ ] Optimize for mobile view
  - [ ] Create tests in `__tests__/ActivityViewer.test.tsx`

#### 3.2 ActivityCreator Component (8 hours)

- [ ] Create `ActivityCreator.tsx` component:
  - [ ] Implement activity type selection
  - [ ] Add integration with specific activity type creators
  - [ ] Implement form for common activity properties
  - [ ] Add preview functionality
  - [ ] Implement responsive design for mobile
  - [ ] Create tests in `__tests__/ActivityCreator.test.tsx`

#### 3.3 Activity Type Components (20 hours)

- [ ] Create base components for different activity types:
  - [ ] `QuizActivity.tsx`
  - [ ] `VideoActivity.tsx`
  - [ ] `InteractiveContentActivity.tsx`
  - [ ] And others as needed
- [ ] Create corresponding creator components:
  - [ ] `MultipleChoiceCreator.tsx`
  - [ ] `MatchingCreator.tsx`
  - [ ] `FillInTheBlanksCreator.tsx`
  - [ ] And others as needed
- [ ] Implement responsive design for all components
- [ ] Create corresponding test files

### 4. Specialized Components (Estimated time: 20 hours)

#### 4.1 GradingInterface Component (10 hours)

- [ ] Create `GradingInterface.tsx` component:
  - [ ] Implement student submission list
  - [ ] Add submission viewer
  - [ ] Implement grading tools
  - [ ] Add feedback input
  - [ ] Implement batch grading options
  - [ ] Optimize for mobile view
  - [ ] Create tests in `__tests__/GradingInterface.test.tsx`

#### 4.2 ResultsAnalytics Component (10 hours)

- [ ] Create `ResultsAnalytics.tsx` component:
  - [ ] Implement performance statistics display
  - [ ] Add charts and visualizations using Nivo
  - [ ] Add question analysis
  - [ ] Implement export options
  - [ ] Optimize for mobile view
  - [ ] Create tests in `__tests__/ResultsAnalytics.test.tsx`

### 5. Integration and Documentation (Estimated time: 8 hours)

- [ ] Create example usage documentation
- [ ] Implement integration with existing pages
- [ ] Create migration guide for existing components
- [ ] Add storybook examples (if applicable)
- [ ] Perform final testing and bug fixes

## Total Estimated Time: 110 hours

## Dependencies

- UI component library (Button, Input, Card, etc.)
- Role-based authentication system
- API endpoints for assessment and activity data
- Nivo charts library for analytics

## Success Criteria

- All components render correctly on mobile and desktop
- Components adapt based on user role
- Performance meets or exceeds existing components
- All tests pass
- Components are accessible
- Existing functionality is preserved
