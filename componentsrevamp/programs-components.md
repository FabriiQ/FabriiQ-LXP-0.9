# Programs Components Analysis

## Overview

This document analyzes the current state of program-related components across different portals in the application and proposes a unified component structure to improve code reusability, maintainability, and consistency.

## Current Components

### System Admin Portal

1. **SystemProgramsContent**
   - Location: `src/app/admin/system/programs/SystemProgramsContent.tsx`
   - Purpose: Display list of programs at system level
   - Features:
     - Search functionality
     - Filter by institution
     - Program cards with basic info
     - Create/Edit/Delete actions

2. **ProgramForm**
   - Location: `src/components/admin/programs/ProgramForm.tsx`
   - Purpose: Create and edit program information
   - Features:
     - Program details form
     - Institution assignment
     - Level and duration settings
     - Status management

3. **ProgramDetail**
   - Location: `src/components/admin/programs/ProgramDetail.tsx`
   - Purpose: Display detailed program information
   - Features:
     - Program information
     - Courses in program
     - Campus offerings
     - Enrollment statistics

### Campus Admin Portal

1. **CampusProgramsContent**
   - Location: `src/components/admin/campus/CampusProgramsContent.tsx`
   - Purpose: Display and manage programs at campus level
   - Features:
     - Search functionality
     - Filter by level and status
     - Program list with details
     - Enrollment statistics

2. **CampusProgramDetail**
   - Location: `src/components/admin/campus/CampusProgramDetail.tsx`
   - Purpose: Display detailed program information for a campus
   - Features:
     - Program information
     - Courses offered
     - Enrolled students
     - Assigned coordinators
     - Performance metrics

3. **ProgramCampusForm**
   - Location: `src/components/admin/programs/ProgramCampusForm.tsx`
   - Purpose: Configure program settings for a specific campus
   - Features:
     - Campus-specific program settings
     - Term configuration
     - Coordinator assignment
     - Enrollment settings

### Coordinator Portal

1. **CoordinatorProgramsClient**
   - Location: `src/components/coordinator/CoordinatorProgramsClient.tsx`
   - Purpose: Display programs for a coordinator
   - Features:
     - Program cards with basic info
     - Student count
     - Course count
     - Performance metrics

2. **ProgramDashboard**
   - Location: `src/components/coordinator/ProgramDashboard.tsx`
   - Purpose: Display program dashboard for coordinators
   - Features:
     - Enrollment statistics
     - Performance metrics
     - Course completion rates
     - Student progress

3. **ProgramAnalyticsDashboard**
   - Location: `src/components/coordinator/ProgramAnalyticsDashboard.tsx`
   - Purpose: Display program analytics
   - Features:
     - Enrollment trends
     - Performance metrics
     - Completion rates
     - Comparison across campuses

## Redundancies and Duplications

1. **Program List Display**:
   - `SystemProgramsContent` (System Admin)
   - `CampusProgramsContent` (Campus Admin)
   - `CoordinatorProgramsClient` (Coordinator)
   - All display lists of programs with similar information but different layouts and filtering options

2. **Program Detail Display**:
   - `ProgramDetail` (System Admin)
   - `CampusProgramDetail` (Campus Admin)
   - Similar program information but with different emphasis based on role

3. **Program Analytics**:
   - Analytics sections in `CampusProgramDetail` (Campus Admin)
   - `ProgramAnalyticsDashboard` (Coordinator)
   - Similar analytics but with different visualizations and metrics

## Proposed Unified Component Structure

### Core Components

1. **`ProgramCard`**
   - Purpose: Display program information in a card format
   - Props:
     - `program`: Program data
     - `viewMode`: 'full' | 'compact' | 'mobile'
     - `userRole`: UserRole enum
     - `actions`: Array of allowed actions
   - Behavior:
     - System Admin: Show all information, administrative actions
     - Campus Admin: Show campus-relevant info, management actions
     - Coordinator: Show coordinator-relevant info, monitoring actions

2. **`ProgramList`**
   - Purpose: Display a list of programs with filtering
   - Props:
     - `programs`: Array of program data
     - `userRole`: UserRole enum
     - `filters`: Available filters
     - `viewMode`: 'grid' | 'table' | 'mobile'
     - `onAction`: Callback for actions
   - Behavior:
     - Adapts display based on role and viewMode
     - Shows role-appropriate actions and filters

3. **`ProgramDetail`**
   - Purpose: Display detailed program information
   - Props:
     - `program`: Program data
     - `userRole`: UserRole enum
     - `tabs`: Array of enabled tabs
     - `actions`: Array of allowed actions
   - Behavior:
     - Shows role-appropriate tabs and actions
     - Adapts detail level based on role

4. **`ProgramForm`**
   - Purpose: Create/edit program information
   - Props:
     - `program`: Program data (optional for create)
     - `userRole`: UserRole enum
     - `institutions`: Available institutions
     - `campuses`: Available campuses
     - `onSubmit`: Submit callback
   - Behavior:
     - Shows role-appropriate fields
     - System Admin: All fields including system-wide settings
     - Campus Admin: Campus-specific fields
     - Coordinator: Limited editing capabilities

### Supporting Components

1. **`ProgramTabs`**
   - Purpose: Tab container for program detail
   - Props:
     - `program`: Program data
     - `userRole`: UserRole enum
     - `enabledTabs`: Array of enabled tabs

2. **`ProgramActions`**
   - Purpose: Action buttons for program management
   - Props:
     - `program`: Program data
     - `userRole`: UserRole enum
     - `enabledActions`: Array of enabled actions

3. **`ProgramFilters`**
   - Purpose: Filter controls for program lists
   - Props:
     - `filters`: Current filter state
     - `userRole`: UserRole enum
     - `availableFilters`: Array of available filters
     - `onFilterChange`: Filter change callback

4. **`ProgramAnalytics`**
   - Purpose: Display program analytics
   - Props:
     - `program`: Program data
     - `userRole`: UserRole enum
     - `metrics`: Array of analytics metrics to display
     - `timeRange`: Time range for metrics

5. **`ProgramCourseList`**
   - Purpose: Display courses in a program
   - Props:
     - `program`: Program data
     - `courses`: Array of course data
     - `userRole`: UserRole enum
     - `actions`: Array of allowed actions
     - `viewMode`: 'table' | 'grid' | 'mobile'

## Implementation Recommendations

1. **Create a shared components folder structure**:
   ```
   /src/components/shared/
   ├── entities/
   │   ├── programs/
   │   │   ├── ProgramCard.tsx
   │   │   ├── ProgramList.tsx
   │   │   ├── ProgramDetail.tsx
   │   │   ├── ProgramForm.tsx
   │   │   ├── ProgramTabs.tsx
   │   │   ├── ProgramActions.tsx
   │   │   ├── ProgramFilters.tsx
   │   │   ├── ProgramAnalytics.tsx
   │   │   └── ProgramCourseList.tsx
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
