# Class Components

This directory contains shared class-related components that can be used across all roles in the system (System Admin, Campus Admin, Coordinator, Teacher, and Student).

## Components

### Phase 1 Components (Implemented)

- **ClassCard**: Displays class information in a card format with role-specific rendering.
- **ClassActions**: Provides action buttons for class management with role-specific visibility.

### Phase 2 Components (Implemented)

- **ClassList**: Displays a list of classes with filtering, pagination, and sorting.
- **ClassFilters**: Filter controls for class lists with role-specific filter visibility.

### Phase 3 Components (Implemented)

- **ClassDetail**: Displays detailed class information with tabs and role-specific rendering.
- **ClassTabs**: Tab container for class detail views with role-specific tab visibility.

### Phase 4 Components (Implemented)

- **ClassForm**: Form for creating and editing classes with role-specific field visibility.
- **ClassDashboard**: Displays class dashboard with key metrics and data visualization.
- **ClassStudentList**: Displays students in a class with multiple view modes and role-specific actions.

### Phase 5 Components (Implemented)

- **AttendanceRecorder**: Records and manages attendance for a specific date.
- **AttendanceGrid**: Displays attendance records in a grid format with date navigation.
- **AttendanceStats**: Shows attendance statistics and trends with visualizations.
- **AttendanceFilters**: Filter controls for attendance records with date range selection.

### Phase 6 Components (Implemented)

- **ScheduleCalendar**: Displays class schedule in calendar format with day, week, and month views.
- **ScheduleList**: Displays class schedule items in list format with multiple view modes.
- **ScheduleForm**: Form for creating and editing schedule items with role-specific field visibility.
- **ScheduleFilters**: Filter controls for schedule items with date range selection.

### Future Components (Planned)

- **ClassAssessments**: Components for assessment management.
- **ClassGradebook**: Components for gradebook management.

## Usage

### ClassCard

```tsx
import { ClassCard, UserRole, ClassAction } from '@/components/shared/entities/classes';

// Example usage
<ClassCard
  classData={classData}
  viewMode="full" // 'full' | 'compact' | 'mobile'
  userRole={UserRole.TEACHER}
  actions={[ClassAction.VIEW, ClassAction.TAKE_ATTENDANCE]}
  onClick={(classData) => console.log('Class clicked:', classData)}
/>
```

### ClassActions

```tsx
import { ClassActions, UserRole, ClassAction } from '@/components/shared/entities/classes';

// Example usage
<ClassActions
  classData={classData}
  userRole={UserRole.CAMPUS_ADMIN}
  enabledActions={[
    ClassAction.VIEW,
    ClassAction.EDIT,
    ClassAction.ARCHIVE,
    ClassAction.ASSIGN_TEACHER,
    ClassAction.ENROLL_STUDENTS
  ]}
  placement="header" // 'header' | 'card' | 'detail' | 'list'
  onAction={(action, classData) => console.log('Action:', action, 'Class:', classData)}
/>
```

### ClassList

```tsx
import { ClassList, UserRole, ClassAction } from '@/components/shared/entities/classes';

// Example usage
<ClassList
  classes={classes}
  userRole={UserRole.TEACHER}
  viewMode="grid" // 'grid' | 'table' | 'mobile'
  onAction={(action, classData) => console.log('Action:', action, 'Class:', classData)}
  pagination={{
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalItems: 50,
    onPageChange: handlePageChange
  }}
  sorting={{
    column: 'name',
    direction: 'asc',
    onSortChange: handleSortChange
  }}
  actions={[ClassAction.VIEW, ClassAction.TAKE_ATTENDANCE]}
/>
```

### ClassFilters

```tsx
import { ClassFilters, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ClassFilters
  filters={filters}
  userRole={UserRole.TEACHER}
  availableFilters={{
    terms: [{ id: 'term-1', name: 'Fall 2023' }],
    courses: [{ id: 'course-1', name: 'Programming Fundamentals' }]
  }}
  onFilterChange={handleFilterChange}
  layout="horizontal" // 'horizontal' | 'vertical' | 'dropdown'
/>
```

### ClassDetail

```tsx
import { ClassDetail, UserRole, ClassAction } from '@/components/shared/entities/classes';
import { TabsContent } from '@/components/ui/tabs';

// Example usage
<ClassDetail
  classData={classData}
  userRole={UserRole.TEACHER}
  tabs={['overview', 'students', 'attendance']}
  actions={[ClassAction.EDIT, ClassAction.TAKE_ATTENDANCE]}
  onTabChange={handleTabChange}
  onAction={handleAction}
>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="students">Students content</TabsContent>
  <TabsContent value="attendance">Attendance content</TabsContent>
</ClassDetail>
```

### ClassTabs

```tsx
import { ClassTabs, UserRole } from '@/components/shared/entities/classes';
import { TabsContent } from '@/components/ui/tabs';

// Example usage
<ClassTabs
  classData={classData}
  userRole={UserRole.TEACHER}
  enabledTabs={['overview', 'students', 'attendance']}
  activeTab="overview"
  onTabChange={handleTabChange}
>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="students">Students content</TabsContent>
  <TabsContent value="attendance">Attendance content</TabsContent>
</ClassTabs>
```

### ClassForm

```tsx
import { ClassForm, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ClassForm
  classData={classData} // Optional for create mode
  userRole={UserRole.CAMPUS_ADMIN}
  courses={courses}
  teachers={teachers}
  terms={terms}
  facilities={facilities}
  programs={programs}
  campuses={campuses}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  mode="edit" // 'create' | 'edit'
/>
```

### ClassDashboard

```tsx
import { ClassDashboard, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ClassDashboard
  classData={classData}
  userRole={UserRole.TEACHER}
  metrics={metrics} // Optional custom metrics
  charts={charts} // Optional custom charts
  timeRange="30d" // '7d' | '30d' | '90d' | 'all'
  onTimeRangeChange={handleTimeRangeChange}
/>
```

### ClassStudentList

```tsx
import { ClassStudentList, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ClassStudentList
  classData={classData}
  students={students}
  userRole={UserRole.TEACHER}
  actions={['view', 'message', 'view-grades', 'view-attendance']}
  viewMode="table" // 'table' | 'grid' | 'mobile'
  onAction={handleAction}
  onAddStudent={handleAddStudent} // Optional
/>
```

### AttendanceRecorder

```tsx
import { AttendanceRecorder, UserRole } from '@/components/shared/entities/classes';

// Example usage
<AttendanceRecorder
  classData={classData}
  students={students}
  date={new Date()}
  existingAttendance={existingAttendance}
  userRole={UserRole.TEACHER}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### AttendanceGrid

```tsx
import { AttendanceGrid, UserRole } from '@/components/shared/entities/classes';

// Example usage
<AttendanceGrid
  classData={classData}
  students={students}
  attendance={attendanceRecords}
  dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 7) }}
  userRole={UserRole.TEACHER}
  viewMode="week" // 'day' | 'week' | 'month'
  onEdit={handleEdit}
  onDateRangeChange={handleDateRangeChange}
/>
```

### AttendanceStats

```tsx
import { AttendanceStats, UserRole } from '@/components/shared/entities/classes';

// Example usage
<AttendanceStats
  classData={classData}
  stats={stats}
  userRole={UserRole.TEACHER}
  dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 31) }}
/>
```

### AttendanceFilters

```tsx
import { AttendanceFilters, UserRole } from '@/components/shared/entities/classes';

// Example usage
<AttendanceFilters
  filters={filters}
  userRole={UserRole.TEACHER}
  availableFilters={{
    students: [{ id: 'student-1', name: 'John Doe' }]
  }}
  onFilterChange={handleFilterChange}
  layout="horizontal" // 'horizontal' | 'vertical' | 'dropdown'
/>
```

### ScheduleCalendar

```tsx
import { ScheduleCalendar, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ScheduleCalendar
  classData={classData}
  scheduleItems={scheduleItems}
  userRole={UserRole.TEACHER}
  viewMode="week" // 'day' | 'week' | 'month'
  actions={['view', 'edit', 'delete', 'duplicate']}
  onAction={handleAction}
  onAddScheduleItem={handleAddScheduleItem}
  onViewModeChange={handleViewModeChange}
/>
```

### ScheduleList

```tsx
import { ScheduleList, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ScheduleList
  classData={classData}
  scheduleItems={scheduleItems}
  userRole={UserRole.TEACHER}
  actions={['view', 'edit', 'delete', 'duplicate']}
  viewMode="table" // 'table' | 'grid' | 'mobile'
  onAction={handleAction}
  onAddScheduleItem={handleAddScheduleItem}
/>
```

### ScheduleForm

```tsx
import { ScheduleForm, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ScheduleForm
  classData={classData}
  scheduleItem={scheduleItem} // Optional for create mode
  userRole={UserRole.TEACHER}
  scheduleTypes={scheduleTypes}
  facilities={facilities}
  teachers={teachers}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  mode="create" // 'create' | 'edit'
/>
```

### ScheduleFilters

```tsx
import { ScheduleFilters, UserRole } from '@/components/shared/entities/classes';

// Example usage
<ScheduleFilters
  filters={filters}
  userRole={UserRole.TEACHER}
  availableFilters={{
    types: [{ id: 'lecture', name: 'Lecture' }],
    teachers: [{ id: 'teacher-1', name: 'John Doe' }],
    facilities: [{ id: 'facility-1', name: 'Room 101' }]
  }}
  onFilterChange={handleFilterChange}
  layout="horizontal" // 'horizontal' | 'vertical' | 'dropdown'
/>
```

## Backward Compatibility

For backward compatibility, the components are also exported with their full names:

```tsx
import {
  ClassCardComponent,
  ClassActionsComponent,
  ClassListComponent,
  ClassFiltersComponent,
  ClassDetailComponent,
  ClassTabsComponent,
  ClassFormComponent,
  ClassDashboardComponent,
  ClassStudentListComponent,
  AttendanceRecorderComponent,
  AttendanceGridComponent,
  AttendanceStatsComponent,
  AttendanceFiltersComponent,
  ScheduleCalendarComponent,
  ScheduleListComponent,
  ScheduleFormComponent,
  ScheduleFiltersComponent
} from '@/components/shared/entities/classes';
```

## Design Principles

- **Mobile-first**: All components are designed with mobile-first approach.
- **Role-based rendering**: Components adapt their display based on user role.
- **Accessibility**: Components follow WCAG 2.1 AA guidelines.
- **Performance**: Components are optimized for performance.
- **Reusability**: Components are designed to be reused across the application.

## Testing

Unit tests are available for all components. Run tests with:

```bash
npm test
```
