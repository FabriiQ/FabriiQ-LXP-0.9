# Campus Principal Portal - Technical Documentation

## Overview

The Campus Principal Portal is a specialized analytics dashboard designed for school principals to monitor and analyze campus-wide performance metrics. This portal reuses existing components and APIs from the Coordinator Portal while providing a focused view tailored to the principal's role.

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── principal/              # Principal Portal Routes
│   │   │   ├── page.tsx            # Main Dashboard
│   │   │   ├── analytics/          # Analytics Pages
│   │   │   │   ├── programs/       # Program Analytics
│   │   │   │   ├── courses/        # Course Analytics
│   │   │   │   ├── teachers/       # Teacher Analytics
│   │   │   │   └── students/       # Student Analytics
│   │   │   ├── leaderboard/        # Leaderboard Pages
│   │   │   │   ├── teachers/       # Teacher Leaderboard
│   │   │   │   └── students/       # Student Leaderboard
│   │   │   ├── reports/            # Reports Generation
│   │   │   └── settings/           # Principal Settings
├── components/
│   ├── principal/                  # Principal-specific Components
│   │   ├── PrincipalDashboardClient.tsx
│   │   ├── dashboard/              # Dashboard Components
│   │   │   └── PrincipalDashboardCore.tsx
├── docs/
│   ├── principal-portal/           # Documentation
│   │   ├── TECHNICAL.md            # Technical Documentation
│   │   └── USER.md                 # User Documentation
```

### Component Hierarchy

1. **Page Components**
   - `app/admin/principal/page.tsx` - Main dashboard page
   - `app/admin/principal/analytics/*` - Analytics pages
   - `app/admin/principal/leaderboard/*` - Leaderboard pages
   - `app/admin/principal/reports/page.tsx` - Reports page
   - `app/admin/principal/settings/page.tsx` - Settings page

2. **Client Components**
   - `components/principal/PrincipalDashboardClient.tsx` - Main dashboard client component
   - `components/principal/dashboard/PrincipalDashboardCore.tsx` - Core dashboard component

3. **Reused Components**
   - `components/coordinator/analytics/CourseAnalyticsDashboard.tsx` - Course analytics
   - `components/coordinator/leaderboard/StudentLeaderboardView.tsx` - Student leaderboard
   - `components/coordinator/leaderboard/TeacherLeaderboardView.tsx` - Teacher leaderboard
   - `components/coordinator/ProgramAnalyticsDashboard.tsx` - Program analytics

### API Integration

The Principal Portal reuses existing API endpoints from the Coordinator Portal:

1. **Leaderboard APIs**
   - `unifiedLeaderboard.getLeaderboard` - Get leaderboard data for any entity
   - `unifiedLeaderboard.getStudentPosition` - Get student position in leaderboard
   - `leaderboard.getClassLeaderboard` - Get class-specific leaderboard
   - `teacherLeaderboard.getTeacherLeaderboard` - Get teacher leaderboard

2. **Analytics APIs**
   - `analytics.getTimeTrackingAnalytics` - Get time tracking analytics
   - `analytics.getLeaderboardCorrelation` - Get correlation analysis
   - `teacherAnalytics.getTeacherMetrics` - Get teacher performance metrics
   - `courseAnalytics.getCoordinatorCourseAnalytics` - Get course analytics
   - `programAnalytics.getEnrollmentAnalytics` - Get enrollment analytics
   - `programAnalytics.getPerformanceAnalytics` - Get performance analytics

3. **Reports APIs**
   - `reports.generateReport` - Generate custom reports
   - `reports.getReportHistory` - Get report history
   - `reports.downloadReport` - Download generated reports

## Implementation Details

### Navigation

The Principal Portal is integrated into the admin navigation system through the `role-based-nav-items.tsx` file. The navigation items are defined in the `campusPrincipalNavItems` array and are accessible to users with the `CAMPUS_PRINCIPAL` role.

```typescript
export const campusPrincipalNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/principal',
    icon: <Home className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  },
  // Other navigation items...
];
```

### Dashboard Implementation

The Principal Dashboard is implemented as a client component that uses tabs to organize different views:

```typescript
<Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="teachers">Teachers</TabsTrigger>
    <TabsTrigger value="students">Students</TabsTrigger>
    <TabsTrigger value="courses">Courses</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    <PrincipalDashboardCore />
    {/* Other components */}
  </TabsContent>
  
  {/* Other tab contents */}
</Tabs>
```

### Analytics Implementation

The analytics pages reuse existing components from the Coordinator Portal while providing a principal-specific interface:

```typescript
<CourseAnalyticsDashboard
  courseId={selectedCourse || undefined}
  programId={selectedProgram || undefined}
  timeframe={selectedTimeframe as any}
/>
```

### Leaderboard Implementation

The leaderboard pages provide a comprehensive view of teacher and student performance:

```typescript
<TeacherLeaderboardView
  campusId={selectedCampus || undefined}
  timeframe={selectedTimeframe as any}
/>
```

### Reports Implementation

The reports page allows principals to generate custom reports with various parameters:

```typescript
<Select value={selectedReportType} onValueChange={setSelectedReportType}>
  <SelectTrigger id="report-type">
    <SelectValue placeholder="Select Report Type" />
  </SelectTrigger>
  <SelectContent>
    {reportTypes.map((type) => (
      <SelectItem key={type.id} value={type.id}>
        {type.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Settings Implementation

The settings page allows principals to customize their portal experience:

```typescript
<Tabs defaultValue="notifications">
  <TabsList>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
    <TabsTrigger value="account">Account</TabsTrigger>
  </TabsList>
  
  {/* Tab contents */}
</Tabs>
```

## Mobile Optimization

The Principal Portal is designed with a mobile-first approach:

1. **Responsive Layout**
   - Fluid grid layouts using CSS Grid and Flexbox
   - Breakpoint-based component rendering
   - Optimized for touch interactions

2. **Performance Optimization**
   - Virtualized lists for large datasets
   - Progressive loading of content
   - Efficient data fetching with React Query
   - Optimistic UI updates

3. **Offline Capabilities**
   - IndexedDB storage for critical data
   - Service worker for offline access
   - Sync mechanisms for reconnection

## Psychological Principles

The Principal Portal is designed with psychological principles in mind:

1. **Information Hierarchy**
   - Most important metrics visible at a glance
   - Drill-down capability for detailed analysis
   - Context-aware navigation
   - Clear visual distinction between data categories

2. **Visual Design**
   - Consistent color coding for performance indicators
   - Accessible contrast ratios
   - Meaningful animations for data changes
   - Clear typography hierarchy

3. **Interaction Design**
   - Minimal interaction cost for common tasks
   - Immediate feedback for user actions
   - Predictable navigation patterns
   - Contextual help and tooltips

## Testing

The Principal Portal should be tested across various devices and scenarios:

1. **Device Testing**
   - Desktop browsers (Chrome, Firefox, Safari, Edge)
   - Tablets (iPad, Android tablets)
   - Mobile phones (iPhone, Android phones)

2. **Functionality Testing**
   - Dashboard loading and rendering
   - Analytics data visualization
   - Leaderboard functionality
   - Report generation and download
   - Settings configuration and persistence

3. **Performance Testing**
   - Load time optimization
   - Memory usage monitoring
   - Network request efficiency
   - Offline functionality

## Future Enhancements

1. **Real-time Updates**
   - Implement WebSocket connections for real-time data updates
   - Add real-time notifications for important events

2. **Advanced Analytics**
   - Implement predictive analytics for student performance
   - Add anomaly detection for attendance and grades
   - Integrate machine learning models for personalized recommendations

3. **Integration with Other Systems**
   - Connect with student information systems
   - Integrate with learning management systems
   - Connect with financial management systems
