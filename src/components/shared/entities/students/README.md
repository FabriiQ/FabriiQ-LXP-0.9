# Student Components

This directory contains a set of unified, role-based student components for the LXP platform. These components are designed to be mobile-first, performance-optimized, and follow the UI/UX patterns of the existing system.

## Components Overview

### StudentCard

A component for displaying student information in a card format.

**Features:**
- Role-based rendering
- Multiple view modes (full, compact, mobile)
- Status indicators
- Performance metrics

### StudentActions

A component for displaying and handling student-related actions.

**Features:**
- Role-based action visibility
- Compact mode for mobile
- Confirmation dialogs for destructive actions

### StudentList

A component for displaying a list of students.

**Features:**
- Role-based rendering
- Multiple view modes (grid, table, mobile)
- Filtering and searching
- Pagination

### StudentFilters

A component for filtering students.

**Features:**
- Status filter
- Program filter
- Class filter
- Campus filter
- Date range filter
- Performance range filter
- Attendance range filter

### StudentForm

A component for creating and editing student information.

**Features:**
- Role-based field visibility
- Validation
- Date picker
- Multi-select for classes

### StudentProfileView

A component for displaying detailed student information.

**Features:**
- Role-based rendering
- Tabbed interface for different sections
- Student information display
- Performance metrics

### StudentTabs

A component for displaying tabbed content for a student.

**Features:**
- Role-based tab visibility
- Customizable tab content
- Loading and error states
- Mobile-friendly design

### StudentPerformanceView

A component for displaying student performance metrics and visualizations.

**Features:**
- Performance metrics display
- Charts and visualizations
- Time range selection
- Role-based metric visibility

## Usage Examples

### StudentCard

```tsx
import { StudentCard, UserRole, StudentAction } from '@/components/shared/entities/students';

// Example usage
<StudentCard
  student={student}
  viewMode="full"
  userRole={UserRole.TEACHER}
  actions={[StudentAction.VIEW, StudentAction.EDIT]}
  onAction={handleAction}
/>
```

### StudentList

```tsx
import { StudentList, UserRole } from '@/components/shared/entities/students';

// Example usage
<StudentList
  students={students}
  userRole={UserRole.TEACHER}
  actions={[StudentAction.VIEW, StudentAction.EDIT]}
  onAction={handleAction}
/>
```

### StudentProfileView

```tsx
import { StudentProfileView, UserRole, StudentTab } from '@/components/shared/entities/students';

// Example usage
<StudentProfileView
  student={student}
  userRole={UserRole.TEACHER}
  tabs={[StudentTab.OVERVIEW, StudentTab.ATTENDANCE, StudentTab.PERFORMANCE]}
  defaultTab={StudentTab.OVERVIEW}
  onAction={handleAction}
  overviewContent={<StudentOverview student={student} />}
  attendanceContent={<StudentAttendance student={student} />}
/>
```

### StudentTabs

```tsx
import { StudentTabs, UserRole, StudentTab } from '@/components/shared/entities/students';

// Example usage
<StudentTabs
  student={student}
  userRole={UserRole.TEACHER}
  title="Student Profile"
  description="View student information"
  enabledTabs={[StudentTab.OVERVIEW, StudentTab.CLASSES, StudentTab.ATTENDANCE]}
  defaultTab={StudentTab.OVERVIEW}
  onTabChange={handleTabChange}
  overviewContent={<StudentOverview student={student} />}
  classesContent={<StudentClasses student={student} />}
  attendanceContent={<StudentAttendance student={student} />}
/>
```

### StudentPerformanceView

```tsx
import { StudentPerformanceView, UserRole } from '@/components/shared/entities/students';

// Example usage
<StudentPerformanceView
  student={student}
  userRole={UserRole.TEACHER}
  timeRange="last30days"
  onExport={handleExport}
  onTimeRangeChange={handleTimeRangeChange}
/>
```

## Design Principles

1. **Mobile-First**: All components are designed to work well on mobile devices first, then scale up to larger screens.
2. **Performance-Optimized**: Components are optimized for fast loading and rendering.
3. **Role-Based**: Components adapt their UI and functionality based on the user's role.
4. **Consistent UI/UX**: Components follow the UI/UX patterns of the existing system.
5. **Reusable**: Components are designed to be reusable across different parts of the application.

## Dependencies

- UI Core Components: Button, Card, Input, etc.
- Lucide React: For icons
- date-fns: For date manipulation
