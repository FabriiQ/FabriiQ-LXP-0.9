# Student Grid and Profile Components

This document describes the enhanced Student Grid and Profile components for the Coordinator Portal.

## Overview

The Student Grid and Profile components provide a comprehensive interface for coordinators to view and manage student information. These components have been enhanced with visual progress indicators, contextual filtering options, and comprehensive student profiles.

## Components

### StudentGrid

The `StudentGrid` component displays a grid of student cards with visual progress indicators and provides advanced filtering options.

#### Features

- **Responsive Design**: Adapts to different screen sizes
- **Visual Progress Indicators**: Color-coded progress bars for academic performance, attendance, and participation
- **Contextual Filtering**: Filter students by program, course, status, and performance metrics
- **Sorting Options**: Sort students by name, academic score, attendance, participation, or leaderboard position
- **Status Badges**: Visual indicators for student status (active, inactive, suspended, etc.)
- **Leaderboard Integration**: Shows student ranking and rank changes

#### Usage

```tsx
<StudentGrid
  students={students}
  isLoading={isLoading}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onSearch={handleSearch}
  isOffline={!isOnline}
  programs={programs}
  courses={courses}
  onFilter={handleFilter}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| students | Student[] | Array of student objects |
| isLoading | boolean | Loading state |
| searchQuery | string | Current search query |
| onSearchChange | (value: string) => void | Search input change handler |
| onSearch | (e: React.FormEvent) => void | Search form submit handler |
| isOffline | boolean | Offline mode indicator |
| programs | Array<{ id: string; name: string }> | Available programs for filtering |
| courses | Array<{ id: string; name: string }> | Available courses for filtering |
| onFilter | (filters: FilterOptions) => void | Filter change handler |

### StudentProfileView

The `StudentProfileView` component displays detailed information about a student, including academic performance, attendance, and feedback.

#### Features

- **Comprehensive Profile**: Shows all relevant student information
- **Performance Metrics**: Visual indicators for academic performance, attendance, and participation
- **Tabbed Interface**: Organizes information into Overview, Academic, Attendance, and Feedback tabs
- **Action Buttons**: Common actions like sending messages, editing profiles, and viewing grades
- **Feedback Management**: Add, view, and respond to feedback
- **Leaderboard Rankings**: Shows student ranking across different categories

#### Usage

```tsx
<StudentProfileView
  student={student}
  leaderboard={leaderboard}
  performance={performance}
  onAction={handleAction}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| student | any | Student data object |
| leaderboard | LeaderboardData | Student's leaderboard data |
| performance | PerformanceData | Student's performance metrics |
| onAction | (action: string, studentId: string) => void | Action button handler |

## Data Structures

### Student

```typescript
interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentNumber: string;
  currentGrade?: string;
  academicScore?: number;
  attendanceRate?: number;
  participationRate?: number;
  classCount: number;
  programName?: string;
  courseName?: string;
  leaderboardPosition?: number;
  leaderboardChange?: number;
  status?: string;
  lastActive?: Date;
  improvementRate?: number;
  completionRate?: number;
  tags?: string[];
  recentActivity?: {
    type: string;
    name: string;
    date: Date;
    score?: number;
  };
}
```

### LeaderboardData

```typescript
interface LeaderboardData {
  position: number;
  change: number;
  classRank: number;
  programRank: number;
  history: Array<{
    date: Date;
    position: number;
  }>;
}
```

### PerformanceData

```typescript
interface PerformanceData {
  academic: number;
  attendance: number;
  participation: number;
  improvement: number;
  strengths: string[];
  weaknesses: string[];
  recentGrades: Array<{
    id: string;
    subject: string;
    score: number;
    letterGrade: string;
    date: Date;
  }>;
  completionRate?: number;
  submissionRate?: number;
  improvementTrend?: Array<{
    date: Date;
    value: number;
  }>;
}
```

## Best Practices

1. **Performance Optimization**: Use virtualization for large student lists
2. **Offline Support**: Implement caching for offline access
3. **Responsive Design**: Ensure components work well on all device sizes
4. **Accessibility**: Use proper ARIA attributes and keyboard navigation
5. **Error Handling**: Provide meaningful error messages and fallbacks
