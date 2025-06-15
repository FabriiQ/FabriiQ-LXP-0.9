# Courses Components Task List

This document outlines the tasks required to implement the unified course-related components as proposed in the Courses Components Analysis document. The goal is to create a set of shared, role-based components that can be used across all portals in the application.

## Component Structure

```
/src/components/shared/entities/courses/
├── CourseCard.tsx
├── CourseList.tsx
├── CourseDetail.tsx
├── CourseForm.tsx
├── CourseTabs.tsx
├── CourseActions.tsx
├── CourseFilters.tsx
├── CourseAnalytics.tsx
├── __tests__/
│   ├── CourseCard.test.tsx
│   ├── CourseList.test.tsx
│   ├── CourseDetail.test.tsx
│   ├── CourseForm.test.tsx
│   ├── CourseTabs.test.tsx
│   ├── CourseActions.test.tsx
│   ├── CourseFilters.test.tsx
│   └── CourseAnalytics.test.tsx
└── types.ts

#use ui components in D:\Learning Q2\LXP 14-04-25 backup\LXP 14-04-25 backup\src\components\ui\core if neded create new components in this directory

## Design Principles

- **Mobile-First**: All components should be designed with mobile-first approach
- **Role-Based Rendering**: Components should adapt based on user role
- **Performance Optimized**: Components should be optimized for fast loading and rendering
- **Accessibility**: Components should follow accessibility best practices
- **Consistent UI/UX**: Components should follow the design system

## Tasks

### 1. Setup and Types (Estimated time: 4 hours)

- [ ] Create the folder structure for course components
- [ ] Create `types.ts` with necessary type definitions:
  - [ ] `CourseData` interface
  - [ ] `CourseAction` enum
  - [ ] `CourseTab` enum
  - [ ] `CourseFilter` interface
  - [ ] `CourseFormData` interface
  - [ ] `CourseAnalyticsMetric` interface

### 2. CourseCard Component (Estimated time: 8 hours)

- [ ] Create `CourseCard.tsx` component:
  - [ ] Implement mobile-first design
  - [ ] Add role-based rendering (System Admin, Campus Admin, Coordinator, Teacher)
  - [ ] Add support for different view modes (full, compact, mobile)
  - [ ] Implement action buttons integration
  - [ ] Add status indicators
  - [ ] Display program and subject information
  - [ ] Show class and student counts
  - [ ] Optimize for performance
  - [ ] Add accessibility features
  - [ ] Create tests in `__tests__/CourseCard.test.tsx`

### 3. CourseActions Component (Estimated time: 6 hours)

- [ ] Create `CourseActions.tsx` component:
  - [ ] Implement role-based action buttons
  - [ ] Add support for different action types (view, edit, delete, etc.)
  - [ ] Implement confirmation dialogs for destructive actions
  - [ ] Add tooltips for action buttons
  - [ ] Optimize for mobile view
  - [ ] Create tests in `__tests__/CourseActions.test.tsx`

### 4. CourseFilters Component (Estimated time: 8 hours)

- [ ] Create `CourseFilters.tsx` component:
  - [ ] Implement search functionality
  - [ ] Add program filter
  - [ ] Add subject filter
  - [ ] Add status filter
  - [ ] Implement role-based filter visibility
  - [ ] Add responsive design for mobile
  - [ ] Implement filter state management
  - [ ] Create tests in `__tests__/CourseFilters.test.tsx`

### 5. CourseList Component (Estimated time: 10 hours)

- [ ] Create `CourseList.tsx` component:
  - [ ] Implement list/grid view toggle
  - [ ] Add pagination
  - [ ] Integrate with CourseCard component
  - [ ] Integrate with CourseFilters component
  - [ ] Add sorting functionality
  - [ ] Implement role-based list features
  - [ ] Add empty state handling
  - [ ] Optimize for performance with virtualization
  - [ ] Create tests in `__tests__/CourseList.test.tsx`

### 6. CourseTabs Component (Estimated time: 6 hours)

- [ ] Create `CourseTabs.tsx` component:
  - [ ] Implement tab navigation
  - [ ] Add role-based tab visibility
  - [ ] Create Overview tab content
  - [ ] Create Classes tab content
  - [ ] Create Content tab content
  - [ ] Create Analytics tab content
  - [ ] Add responsive design for mobile
  - [ ] Create tests in `__tests__/CourseTabs.test.tsx`

### 7. CourseDetail Component (Estimated time: 10 hours)

- [ ] Create `CourseDetail.tsx` component:
  - [ ] Implement detail header with course info
  - [ ] Integrate with CourseTabs component
  - [ ] Integrate with CourseActions component
  - [ ] Add role-based detail features
  - [ ] Implement responsive design for mobile
  - [ ] Add loading states
  - [ ] Add error handling
  - [ ] Create tests in `__tests__/CourseDetail.test.tsx`

### 8. CourseForm Component (Estimated time: 12 hours)

- [ ] Create `CourseForm.tsx` component:
  - [ ] Implement form fields for course information
  - [ ] Add program and subject selection
  - [ ] Add content management section
  - [ ] Implement form validation
  - [ ] Add role-based field visibility
  - [ ] Implement responsive design for mobile
  - [ ] Add loading and error states
  - [ ] Implement form submission handling
  - [ ] Create tests in `__tests__/CourseForm.test.tsx`

### 9. CourseAnalytics Component (Estimated time: 8 hours)

- [ ] Create `CourseAnalytics.tsx` component:
  - [ ] Implement analytics metrics display
  - [ ] Add charts and visualizations
  - [ ] Implement time range selection
  - [ ] Add role-based metric visibility
  - [ ] Optimize for mobile view
  - [ ] Use Nivo charts for visualizations
  - [ ] Create tests in `__tests__/CourseAnalytics.test.tsx`

### 10. Integration and Documentation (Estimated time: 6 hours)

- [ ] Create example usage documentation
- [ ] Implement integration with existing pages
- [ ] Create migration guide for existing components
- [ ] Add storybook examples (if applicable)
- [ ] Perform final testing and bug fixes

## Total Estimated Time: 78 hours

## Dependencies

- UI component library (Button, Input, Card, etc.)
- Role-based authentication system
- API endpoints for course data
- Nivo charts library for analytics

## Success Criteria

- All components render correctly on mobile and desktop
- Components adapt based on user role
- Performance meets or exceeds existing components
- All tests pass
- Components are accessible
- Existing functionality is preserved
