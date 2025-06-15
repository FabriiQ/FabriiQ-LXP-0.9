# Courses Components Analysis

## Overview

This document analyzes the current state of course-related components across different portals in the application and proposes a unified component structure to improve code reusability, maintainability, and consistency.

## Current Components

### System Admin Portal

1. **CourseGrid**
   - Location: `src/components/admin/courses/CourseGrid.tsx`
   - Purpose: Display courses in a grid layout at system level
   - Features:
     - Course cards with basic info
     - Status badges
     - Program information
     - Click to view details

2. **CourseList**
   - Location: `src/components/admin/courses/CourseList.tsx`
   - Purpose: Display courses in a table layout at system level
   - Features:
     - Sortable columns
     - Search functionality
     - Edit/Delete actions
     - Status indicators

3. **CourseModal**
   - Location: `src/components/admin/courses/CourseModal.tsx`
   - Purpose: Create and edit course information
   - Features:
     - Course details form
     - Program assignment
     - Subject association
     - Status management

### Campus Admin Portal

1. **CampusCoursesContent**
   - Location: `src/components/admin/campus/CampusCoursesContent.tsx`
   - Purpose: Display and manage courses at campus level
   - Features:
     - Search functionality
     - Program and level filtering
     - Course list with details
     - Analytics for each course

2. **CampusCourseDetail**
   - Location: `src/components/admin/campus/CampusCourseDetail.tsx`
   - Purpose: Display detailed course information
   - Features:
     - Course information
     - Classes offered
     - Enrolled students
     - Assigned teachers
     - Performance metrics

3. **CampusCourseForm**
   - Location: `src/components/admin/campus/CampusCourseForm.tsx`
   - Purpose: Create and edit campus-specific course offerings
   - Features:
     - Course selection
     - Campus-specific settings
     - Term assignment
     - Teacher assignment

### Coordinator Portal

1. **CoordinatorCourseGrid**
   - Location: `src/components/coordinator/CoordinatorCourseGrid.tsx`
   - Purpose: Display courses for coordinator's programs
   - Features:
     - Course cards with basic info
     - Program information
     - Status badges
     - Click to view details

2. **CoordinatorProgramCourses**
   - Location: `src/components/coordinator/CoordinatorProgramCourses.tsx`
   - Purpose: Display courses for a specific program
   - Features:
     - Course list grouped by level
     - Course details
     - Status indicators
     - Quick actions

3. **CoordinatorCourseDetail**
   - Location: `src/components/coordinator/CoordinatorCourseDetail.tsx`
   - Purpose: Display detailed course information for coordinators
   - Features:
     - Course information
     - Classes offered
     - Curriculum structure
     - Performance metrics

## Redundancies and Duplications

1. **Course Grid Display**:
   - `CourseGrid` (System Admin)
   - `CoordinatorCourseGrid` (Coordinator)
   - Both display similar course information in a grid layout but with different styling and actions

2. **Course List Display**:
   - `CourseList` (System Admin)
   - Part of `CampusCoursesContent` (Campus Admin)
   - `CoordinatorProgramCourses` (Coordinator)
   - All display lists of courses with similar information but different layouts and filtering options

3. **Course Detail Display**:
   - `CampusCourseDetail` (Campus Admin)
   - `CoordinatorCourseDetail` (Coordinator)
   - Both display detailed course information but with different emphasis based on role

4. **Course Form**:
   - `CourseModal` (System Admin)
   - `CampusCourseForm` (Campus Admin)
   - Both provide forms for creating/editing courses but with different fields based on context

## Proposed Unified Component Structure

### Core Components

1. **`CourseCard`**
   - Purpose: Display course information in a card format
   - Props:
     - `course`: Course data
     - `viewMode`: 'full' | 'compact' | 'mobile'
     - `userRole`: UserRole enum
     - `actions`: Array of allowed actions
   - Behavior:
     - System Admin: Show all information, administrative actions
     - Campus Admin: Show campus-relevant info, class creation actions
     - Coordinator: Show program-relevant info, curriculum actions
     - Teacher: Show teaching-relevant info, content actions

2. **`CourseList`**
   - Purpose: Display a list of courses with filtering
   - Props:
     - `courses`: Array of course data
     - `userRole`: UserRole enum
     - `filters`: Available filters
     - `viewMode`: 'grid' | 'table' | 'mobile'
     - `onAction`: Callback for actions
   - Behavior:
     - Adapts display based on role and viewMode
     - Shows role-appropriate actions and filters

3. **`CourseDetail`**
   - Purpose: Display detailed course information
   - Props:
     - `course`: Course data
     - `userRole`: UserRole enum
     - `tabs`: Array of enabled tabs
     - `actions`: Array of allowed actions
   - Behavior:
     - Shows role-appropriate tabs and actions
     - Adapts detail level based on role

4. **`CourseForm`**
   - Purpose: Create/edit course information
   - Props:
     - `course`: Course data (optional for create)
     - `userRole`: UserRole enum
     - `programs`: Available programs
     - `subjects`: Available subjects
     - `onSubmit`: Submit callback
   - Behavior:
     - Shows role-appropriate fields
     - System Admin: All fields including system-wide settings
     - Campus Admin: Campus-specific fields
     - Coordinator: Limited editing capabilities

### Supporting Components

1. **`CourseTabs`**
   - Purpose: Tab container for course detail
   - Props:
     - `course`: Course data
     - `userRole`: UserRole enum
     - `enabledTabs`: Array of enabled tabs

2. **`CourseActions`**
   - Purpose: Action buttons for course management
   - Props:
     - `course`: Course data
     - `userRole`: UserRole enum
     - `enabledActions`: Array of enabled actions

3. **`CourseFilters`**
   - Purpose: Filter controls for course lists
   - Props:
     - `filters`: Current filter state
     - `userRole`: UserRole enum
     - `availableFilters`: Array of available filters
     - `onFilterChange`: Filter change callback

4. **`CourseAnalytics`**
   - Purpose: Display course analytics
   - Props:
     - `course`: Course data
     - `userRole`: UserRole enum
     - `metrics`: Array of analytics metrics to display
     - `timeRange`: Time range for metrics

## Implementation Recommendations

1. **Create a shared components folder structure**:
   ```
   /src/components/shared/
   ├── entities/
   │   ├── courses/
   │   │   ├── CourseCard.tsx
   │   │   ├── CourseList.tsx
   │   │   ├── CourseDetail.tsx
   │   │   ├── CourseForm.tsx
   │   │   ├── CourseTabs.tsx
   │   │   ├── CourseActions.tsx
   │   │   ├── CourseFilters.tsx
   │   │   └── CourseAnalytics.tsx
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
