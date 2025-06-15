# Specialized UI Components

This directory contains specialized components that are domain-specific and built on top of core, extended, and composite components.

## Overview

Specialized components are organized by domain and follow these principles:

- Address specific domain needs
- Maintain consistency with the overall design system
- Are responsive and mobile-friendly
- Support role-based theming

## Analytics Components

### NivoBarChart

The `NivoBarChart` component provides a bar chart visualization using Nivo:

```tsx
import { NivoBarChart } from '@/components/ui';

// Basic usage
<NivoBarChart
  data={[
    { month: 'Jan', value1: 12, value2: 8 },
    { month: 'Feb', value1: 19, value2: 10 },
    { month: 'Mar', value1: 3, value2: 5 },
  ]}
  keys={['value1', 'value2']}
  indexBy="month"
  title="Monthly Data"
  role="teacher"
/>

// Horizontal bar chart
<NivoBarChart
  data={data}
  keys={keys}
  indexBy="name"
  horizontal
  stacked
  showValues
  role="student"
/>
```

### NivoLineChart

The `NivoLineChart` component provides a line chart visualization using Nivo:

```tsx
import { NivoLineChart } from '@/components/ui';

// Basic usage
<NivoLineChart
  data={[
    {
      id: 'series1',
      data: [
        { x: 'Jan', y: 12 },
        { x: 'Feb', y: 19 },
        { x: 'Mar', y: 3 },
      ]
    }
  ]}
  title="Monthly Trends"
  role="teacher"
/>

// With area fill and smooth curves
<NivoLineChart
  data={data}
  curve="monotoneX"
  enableArea
  showPoints
  role="student"
/>
```

### NivoPieChart

The `NivoPieChart` component provides a pie chart visualization using Nivo:

```tsx
import { NivoPieChart } from '@/components/ui';

// Basic usage
<NivoPieChart
  data={[
    { id: 'A', label: 'A', value: 40 },
    { id: 'B', label: 'B', value: 30 },
    { id: 'C', label: 'C', value: 20 },
    { id: 'D', label: 'D', value: 10 },
  ]}
  title="Distribution"
  role="teacher"
/>

// Donut chart
<NivoPieChart
  data={data}
  innerRadius={0.6}
  padAngle={0.5}
  cornerRadius={3}
  role="student"
/>
```

## Dashboard Components

### StatCard

The `StatCard` component displays dashboard metrics:

```tsx
import { StatCard } from '@/components/ui';
import { Users } from 'lucide-react';

// Basic usage
<StatCard
  title="Total Users"
  value={1234}
  icon={<Users size={24} />}
  role="teacher"
/>

// With trend indicator
<StatCard
  title="Revenue"
  value="$5,678"
  previousValue="$4,500"
  percentChange={26.2}
  showTrendIcon
  showTrendArrow
  role="systemAdmin"
/>

// With description and footer
<StatCard
  title="Completion Rate"
  value="78%"
  description="Course completion rate"
  footer={<span>5% increase from last month</span>}
  role="student"
/>
```

### ActivityFeed

The `ActivityFeed` component displays activity timelines:

```tsx
import { ActivityFeed } from '@/components/ui';

// Basic usage
<ActivityFeed
  items={[
    {
      id: '1',
      title: 'User logged in',
      timestamp: new Date(),
      user: {
        id: '1',
        name: 'John Doe',
        avatar: '/avatars/john.jpg',
      },
      type: 'success',
    }
  ]}
  title="Recent Activity"
  role="teacher"
/>

// With grouping by date
<ActivityFeed
  items={activityItems}
  title="Activity Log"
  showTimeAgo
  groupByDate
  showViewMore
  role="systemAdmin"
/>
```

### DashboardLayout

The `DashboardLayout` component provides a responsive dashboard layout:

```tsx
import { DashboardLayout, DashboardSection, DashboardGrid, StatCard } from '@/components/ui';

// Basic usage
<DashboardLayout
  sidebar={<Sidebar />}
  header={<Header />}
  footer={<Footer />}
  role="teacher"
>
  <DashboardSection title="Overview">
    <DashboardGrid columns={3}>
      <StatCard title="Users" value={1234} />
      <StatCard title="Revenue" value="$5,678" />
      <StatCard title="Orders" value={90} />
    </DashboardGrid>
  </DashboardSection>
  
  <DashboardSection title="Recent Activity">
    <ActivityFeed items={activityItems} />
  </DashboardSection>
</DashboardLayout>
```

## Role-Based Components

### SystemAdminShell

The `SystemAdminShell` component provides a shell for system administrator portals:

```tsx
import { SystemAdminShell } from '@/components/ui';

// Basic usage
<SystemAdminShell
  user={{ name: 'Admin User', email: 'admin@example.com' }}
  title="Admin Portal"
  onNavigate={(path) => router.push(path)}
  currentPath={router.pathname}
>
  <div>Content goes here</div>
</SystemAdminShell>
```

### TeacherShell

The `TeacherShell` component provides a shell for teacher portals:

```tsx
import { TeacherShell } from '@/components/ui';

// Basic usage
<TeacherShell
  user={{ name: 'Teacher Name', email: 'teacher@example.com' }}
  title="Teacher Portal"
  onNavigate={(path) => router.push(path)}
  currentPath={router.pathname}
  notifications={3}
>
  <div>Content goes here</div>
</TeacherShell>
```

### StudentShell

The `StudentShell` component provides a shell for student portals:

```tsx
import { StudentShell } from '@/components/ui';

// Basic usage
<StudentShell
  user={{ name: 'Student Name', email: 'student@example.com' }}
  title="Student Portal"
  onNavigate={(path) => router.push(path)}
  currentPath={router.pathname}
  notifications={2}
>
  <div>Content goes here</div>
</StudentShell>
```

## Mobile-First Design

All specialized components follow a mobile-first design approach:

- Start with mobile layouts and progressively enhance for larger screens
- Use the `useResponsive` hook for conditional rendering
- Implement touch-friendly interactions (minimum 44x44px touch targets)
- Optimize performance for mobile devices
- Provide mobile-specific variants where needed

## Role-Based Theming

All specialized components support role-based theming through the `role` prop:

- `systemAdmin` - Green theme
- `campusAdmin` - Blue theme
- `teacher` - Teal theme
- `student` - Light blue theme
- `parent` - Purple theme

```tsx
import { NivoBarChart, StatCard, ActivityFeed, SystemAdminShell } from '@/components/ui';

// System Admin theme
<NivoBarChart data={data} keys={keys} indexBy="name" role="systemAdmin" />
<StatCard title="Users" value={1234} role="systemAdmin" />
<ActivityFeed items={items} role="systemAdmin" />
<SystemAdminShell user={user} role="systemAdmin">Content</SystemAdminShell>

// Teacher theme
<NivoBarChart data={data} keys={keys} indexBy="name" role="teacher" />
<StatCard title="Students" value={45} role="teacher" />
<ActivityFeed items={items} role="teacher" />
<TeacherShell user={user} role="teacher">Content</TeacherShell>

// Student theme
<NivoBarChart data={data} keys={keys} indexBy="name" role="student" />
<StatCard title="Assignments" value={12} role="student" />
<ActivityFeed items={items} role="student" />
<StudentShell user={user} role="student">Content</StudentShell>
```
