# Attendance Components

This directory contains a set of unified, role-based attendance components for the LXP platform. These components are designed to be mobile-first, performance-optimized, and follow the UI/UX patterns of the existing system.

## Components Overview

### AttendanceRecorder

A component for recording attendance for a class on a specific date.

**Features:**
- Role-specific rendering
- Date selection
- Bulk actions
- Student search
- Comments for absences

### AttendanceGrid

A component for displaying attendance records in a grid format.

**Features:**
- Multiple view modes (day, week, month)
- Date range navigation
- Student search
- Color-coded attendance status

### AttendanceAnalytics

A component for displaying attendance analytics and statistics.

**Features:**
- Overall attendance statistics
- Attendance trend charts
- Attendance by student
- Attendance by weekday

### AttendanceSelector

A component for selecting an entity and date to view attendance.

**Features:**
- Entity selection (campus, program, class, student)
- Date or date range selection
- Search functionality

### AttendanceStatusCell

A component for displaying and editing attendance status.

**Features:**
- Color-coded status display
- Status editing
- Comments display and editing

### StudentAttendanceProfile

A component for displaying a student's attendance profile.

**Features:**
- Overall attendance statistics
- Attendance calendar heatmap
- Attendance by class
- Attendance trend

## Usage Examples

### AttendanceRecorder

```tsx
import { AttendanceRecorder, UserRole, AttendanceStatus } from '@/components/shared/entities/attendance';

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
import { AttendanceGrid, UserRole } from '@/components/shared/entities/attendance';

// Example usage
<AttendanceGrid 
  classData={classData}
  students={students}
  attendance={attendance}
  userRole={UserRole.TEACHER}
  onEdit={handleEdit}
/>
```

### AttendanceAnalytics

```tsx
import { AttendanceAnalytics, UserRole } from '@/components/shared/entities/attendance';

// Example usage
<AttendanceAnalytics 
  title="Class Attendance Analytics"
  data={attendanceStats}
  level="class"
  userRole={UserRole.TEACHER}
  dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 31) }}
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
- Nivo Charts: For data visualization
- Lucide React: For icons
- date-fns: For date manipulation
