# Analytics & Reports Components Analysis

## Overview

This document analyzes the current state of analytics and report-related components across different portals in the application and proposes a unified component structure to improve code reusability, maintainability, and consistency.

## Current Components

### System Admin Portal

1. **SystemAdminDashboardContent**
   - Location: `src/components/dashboard/SystemAdminDashboardContent.tsx`
   - Purpose: Display system-wide analytics dashboard
   - Features:
     - User activity metrics
     - User distribution by role
     - Campus performance comparison
     - Institution performance metrics
     - System health monitoring
     - Error rate tracking
     - API response time analytics

2. **SystemAnalyticsRouter**
   - Location: `src/server/api/routers/system-analytics.ts`
   - Purpose: Provide API endpoints for system analytics
   - Features:
     - User activity data
     - User distribution data
     - Campus performance data
     - Institution performance data
     - System resources data
     - System health data
     - API response time data

### Campus Admin Portal

1. **CampusAttendanceContent** (Analytics Section)
   - Location: `src/components/admin/campus/CampusAttendanceContent.tsx`
   - Purpose: Display attendance analytics
   - Features:
     - Attendance analytics dashboard
     - Course attendance analytics
     - Class-specific attendance metrics
     - Student-specific attendance metrics

2. **CampusCoursesContent** (Analytics Section)
   - Location: `src/app/admin/campus/courses/CampusCoursesContent.tsx`
   - Purpose: Display course analytics
   - Features:
     - Student count per course
     - Class count per course
     - Performance metrics

3. **CampusReportsPage**
   - Location: `src/app/admin/campus/reports/page.tsx`
   - Purpose: Provide access to various reports
   - Features:
     - Attendance reports
     - Performance reports
     - Enrollment reports
     - Teacher reports
     - Export options

### Coordinator Portal

1. **ProgramAnalyticsDashboard**
   - Location: `src/components/coordinator/ProgramAnalyticsDashboard.tsx`
   - Purpose: Display program analytics
   - Features:
     - Enrollment trend data
     - Enrollment by campus
     - Enrollment by gender
     - Grade distribution
     - Course performance
     - Course pass rates

2. **CoordinatorAnalyticsPage**
   - Location: `src/app/admin/coordinator/analytics/page.tsx`
   - Purpose: Provide access to various analytics views
   - Features:
     - Class performance analytics
     - Teacher performance analytics
     - Student performance analytics
     - Program analytics

3. **ClassReportsPage**
   - Location: `src/app/admin/campus/classes/[id]/reports/page.tsx`
   - Purpose: Display reports for a specific class
   - Features:
     - Performance reports
     - Attendance reports
     - Summary reports
     - Export options

### Shared Analytics Components

1. **LineChart**
   - Purpose: Display line chart visualizations
   - Features:
     - Time series data visualization
     - Multiple series support
     - Customizable appearance
     - Responsive design

2. **BarChart**
   - Purpose: Display bar chart visualizations
   - Features:
     - Categorical data visualization
     - Multiple series support
     - Customizable appearance
     - Responsive design

3. **PieChart**
   - Purpose: Display pie chart visualizations
   - Features:
     - Distribution data visualization
     - Legend support
     - Customizable appearance
     - Responsive design

## Redundancies and Duplications

1. **Dashboard Components**:
   - `SystemAdminDashboardContent` (System Admin)
   - `ProgramAnalyticsDashboard` (Coordinator)
   - Similar dashboard layouts but with different data and metrics

2. **Analytics Views**:
   - Various analytics sections across different portals
   - Similar visualization components but with different data sources

3. **Reports Access**:
   - `CampusReportsPage` (Campus Admin)
   - `ClassReportsPage` (Class-specific)
   - Similar report listing but at different levels of granularity

## Proposed Unified Component Structure

### Core Components

1. **`AnalyticsDashboard`**
   - Purpose: Display analytics dashboard with configurable metrics
   - Props:
     - `dashboardType`: 'system' | 'campus' | 'program' | 'class' | 'teacher' | 'student'
     - `entityId`: ID of the entity to display analytics for
     - `userRole`: UserRole enum
     - `metrics`: Array of metrics to display
     - `timeRange`: Time range for metrics
   - Behavior:
     - Shows appropriate metrics based on dashboard type and user role
     - Adapts layout based on available space and data

2. **`MetricsCard`**
   - Purpose: Display a single metric or related group of metrics
   - Props:
     - `title`: Card title
     - `description`: Card description
     - `metric`: Metric data
     - `visualization`: Visualization type
     - `comparison`: Comparison data (optional)
     - `trend`: Trend data (optional)
   - Behavior:
     - Shows appropriate visualization based on data type
     - Displays comparison and trend if available

3. **`ReportsList`**
   - Purpose: Display a list of available reports
   - Props:
     - `reportType`: 'system' | 'campus' | 'program' | 'class' | 'teacher' | 'student'
     - `entityId`: ID of the entity to display reports for
     - `userRole`: UserRole enum
     - `categories`: Array of report categories to include
   - Behavior:
     - Shows appropriate reports based on type and user role
     - Groups reports by category

4. **`ReportViewer`**
   - Purpose: Display a specific report
   - Props:
     - `report`: Report data
     - `userRole`: UserRole enum
     - `exportOptions`: Array of export options
     - `filters`: Report filters
   - Behavior:
     - Shows report content with appropriate visualizations
     - Provides export functionality based on options

### Visualization Components

1. **`DataChart`**
   - Purpose: Unified chart component that adapts to data
   - Props:
     - `data`: Chart data
     - `type`: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar'
     - `xAxisKey`: Key for x-axis data
     - `series`: Array of data series configurations
     - `options`: Chart options
   - Behavior:
     - Renders appropriate chart type based on data and type
     - Handles responsive sizing
     - Provides consistent styling

2. **`DataTable`**
   - Purpose: Display tabular data with sorting and filtering
   - Props:
     - `data`: Table data
     - `columns`: Column configurations
     - `pagination`: Pagination options
     - `sorting`: Sorting options
     - `filtering`: Filtering options
   - Behavior:
     - Renders tabular data with appropriate formatting
     - Provides sorting, filtering, and pagination
     - Exports data in various formats

3. **`MetricDisplay`**
   - Purpose: Display a single metric with visual indicators
   - Props:
     - `value`: Metric value
     - `label`: Metric label
     - `format`: Value format
     - `trend`: Trend indicator
     - `comparison`: Comparison value
     - `icon`: Optional icon
   - Behavior:
     - Displays metric with appropriate formatting
     - Shows trend and comparison indicators
     - Adapts size based on available space

### Supporting Components

1. **`AnalyticsFilters`**
   - Purpose: Filter controls for analytics views
   - Props:
     - `filters`: Current filter state
     - `userRole`: UserRole enum
     - `availableFilters`: Array of available filters
     - `onFilterChange`: Filter change callback

2. **`DateRangeSelector`**
   - Purpose: Select date range for analytics
   - Props:
     - `range`: Current date range
     - `presets`: Array of preset ranges
     - `onChange`: Change callback

3. **`ExportOptions`**
   - Purpose: Export controls for reports and analytics
   - Props:
     - `formats`: Array of available export formats
     - `onExport`: Export callback
     - `filename`: Default filename

4. **`ComparisonSelector`**
   - Purpose: Select entities for comparison
   - Props:
     - `entityType`: Type of entities to compare
     - `availableEntities`: Array of available entities
     - `selectedEntities`: Array of selected entities
     - `onChange`: Change callback

## Implementation Recommendations

1. **Create a shared components folder structure**:
   ```
   /src/components/shared/
   ├── analytics/
   │   ├── AnalyticsDashboard.tsx
   │   ├── MetricsCard.tsx
   │   ├── AnalyticsFilters.tsx
   │   ├── DateRangeSelector.tsx
   │   ├── ComparisonSelector.tsx
   │   └── MetricDisplay.tsx
   ├── reports/
   │   ├── ReportsList.tsx
   │   ├── ReportViewer.tsx
   │   └── ExportOptions.tsx
   ├── visualizations/
   │   ├── DataChart.tsx
   │   ├── DataTable.tsx
   │   ├── chart-types/
   │   │   ├── LineChart.tsx
   │   │   ├── BarChart.tsx
   │   │   ├── PieChart.tsx
   │   │   └── ...
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
6. **Consistent data visualization**: Uniform look and feel for all charts and graphs
