# Teacher Portal UI/UX Revamp - Implementation Progress

**Current Status: Phase 1 Completed, Moving to Phase 2**

Last Updated: May 2023

---

# UI/UX Guidelines for Implementation

## Design System Guidelines

### Color Scheme
- **Primary Green:** #1F504B
- **Medium Teal:** #5A8A84
- **Light Mint:** #D8E3E0
- Use primary green for primary actions and key UI elements
- Use medium teal for secondary elements and hover states
- Use light mint for backgrounds and subtle UI elements

### Typography
- **Font Family:** Inter
- **Headings:** Inter Semi-Bold/Bold
- **Body Text:** Inter Regular/Medium
- **Font Sizes:**
  - Heading 1: 2rem (32px)
  - Heading 2: 1.5rem (24px)
  - Heading 3: 1.25rem (20px)
  - Body: 0.875rem (14px)
  - Small: 0.75rem (12px)

### Spacing
- Follow consistent spacing scale: 4px, 8px, 16px, 24px, 32px, 48px
- Use 16px padding for mobile containers
- Use 24px padding for desktop containers
- Maintain consistent spacing between related elements

### Components
- **Buttons:** 6px border radius, 40px height (48px on mobile)
- **Cards:** 8px border radius, 16px padding (mobile), 24px padding (desktop)
- **Forms:** 6px border radius, 40px input height (48px on mobile)
- **Navigation:** Fixed position, consistent active/hover states

## UX Writing Guidelines

### Voice and Tone
- **Engaging:** Capture attention with clear, interesting language
- **Pleasant:** Create a positive, enjoyable experience
- **Ethical:** Communicate honestly and transparently
- **Smooth:** Provide a seamless, friction-free experience

### Content Guidelines
- Use sentence case for all headings (capitalize first word only)
- Keep button text short and action-oriented
- Provide clear, helpful error messages
- Use consistent terminology throughout the application

### Educational Context
- Break complex tasks into manageable steps
- Provide clear feedback and next steps
- Use supportive, encouraging language
- Focus on growth and improvement

## Mobile-First Implementation

- Design for mobile screens first, then enhance for larger screens
- Ensure touch targets are at least 44px × 44px
- Use bottom navigation for primary actions on mobile
- Implement responsive layouts that adapt to different screen sizes

## Accessibility Considerations

- Maintain a minimum contrast ratio of 4.5:1 for text
- Provide alternative text for images
- Ensure keyboard navigability
- Support screen readers with proper ARIA attributes
- Design for different types of color blindness

---

# Phase 1 Implementation Plan (COMPLETED)

## Phase 1: Core Navigation Structure

This phase focuses on implementing the new navigation structure with a dashboard-centric approach, removing the sidebar, and implementing a mobile-first design.

### UX Guidelines for Phase 1

#### Visual Design
- Implement the new color scheme with Primary Green (#1F504B), Medium Teal (#5A8A84), and Light Mint (#D8E3E0)
- Use Inter font family for all text elements with appropriate font weights
- Apply consistent spacing using the defined spacing scale
- Use subtle shadows and borders to create depth and separation
- Ensure proper contrast between text and background colors

#### Navigation Experience
- Design for mobile-first, then enhance for larger screens
- Keep navigation items to 5 or fewer in bottom navigation
- Use clear, recognizable icons paired with short labels
- Highlight the active navigation item with the primary color
- Ensure touch targets are at least 44px × 44px for all interactive elements

#### Header Components
- Keep header height consistent across all pages (56px on mobile, 64px on desktop)
- Use clear visual hierarchy with the page title as the focal point
- Place class selector and profile menu in easily accessible positions
- Ensure header is always visible and fixed at the top of the viewport
- Implement smooth transitions for dropdown menus

#### Accessibility
- Ensure all navigation items have proper ARIA labels
- Implement keyboard navigation for all interactive elements
- Provide sufficient color contrast for all text elements
- Ensure focus states are clearly visible
- Test navigation with screen readers

### 1.1 Create New Dashboard Layout

#### Components to Create/Modify:

1. **TeacherDashboardHeader**
   - Replace sidebar with header containing class selector and profile menu
   - File: `src/components/teacher/dashboard/TeacherDashboardHeader.tsx`

2. **ClassSelector**
   - Dropdown/modal for selecting classes
   - File: `src/components/teacher/dashboard/ClassSelector.tsx`

3. **ProfileMenu**
   - Dropdown with theme selector, profile link, and sign out
   - File: `src/components/teacher/dashboard/ProfileMenu.tsx`

4. **TeacherDashboardLayout**
   - New layout component without sidebar
   - File: `src/app/teacher/dashboard/layout.tsx` (modify existing)

#### Implementation Steps:

1. Create the `ProfileMenu` component:
   - Implement dropdown with user avatar
   - Add theme selector toggle
   - Add profile and sign out links

2. Create the `ClassSelector` component:
   - Implement dropdown/modal for class selection
   - Show grid of class cards when opened
   - Include search functionality

3. Create the `TeacherDashboardHeader` component:
   - Combine class selector and profile menu
   - Add responsive styling for mobile/desktop

4. Update the `TeacherDashboardLayout`:
   - Remove sidebar dependency
   - Use the new header component
   - Ensure responsive layout

### 1.2 Implement Bottom Navigation for Mobile

#### Components to Create/Modify:

1. **TeacherBottomNav**
   - Bottom navigation for mobile view
   - File: `src/components/teacher/navigation/TeacherBottomNav.tsx`

2. **ClassBottomNav**
   - Bottom navigation for class pages on mobile
   - File: `src/components/teacher/navigation/ClassBottomNav.tsx`

#### Implementation Steps:

1. Create the `TeacherBottomNav` component:
   - Use existing `MobileNav` component
   - Define navigation items for teacher dashboard
   - Show only on mobile devices

2. Create the `ClassBottomNav` component:
   - Adapt from existing `ClassNav` component
   - Convert to bottom navigation on mobile
   - Maintain sidebar on desktop

3. Update class layout to use the new navigation:
   - Modify `src/app/teacher/classes/[classId]/layout.tsx`
   - Implement responsive switching between bottom nav and sidebar

### 1.3 Update Routing Structure

#### Files to Modify:

1. **Teacher Layout**
   - Update main teacher layout
   - File: `src/app/teacher/layout.tsx`

2. **Class Layout**
   - Update class page layout
   - File: `src/app/teacher/classes/[classId]/layout.tsx`

#### Implementation Steps:

1. Update the main teacher layout:
   - Remove sidebar component
   - Add `TeacherBottomNav` for mobile
   - Ensure proper routing

2. Update the class layout:
   - Replace `ClassNav` with `ClassBottomNav`
   - Ensure proper routing between class pages

## Code Examples

### TeacherDashboardHeader Component

```tsx
'use client';

import React from 'react';
import { ClassSelector } from './ClassSelector';
import { ProfileMenu } from './ProfileMenu';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface TeacherDashboardHeaderProps {
  teacherId: string;
  userName: string;
  userEmail?: string;
}

export function TeacherDashboardHeader({
  teacherId,
  userName,
  userEmail,
}: TeacherDashboardHeaderProps) {
  const { isMobile } = useResponsive();

  return (
    <header className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          {!isMobile && <ClassSelector teacherId={teacherId} />}
        </div>
        <ProfileMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
```

### TeacherBottomNav Component

```tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MobileNav, MobileNavItem } from '@/components/ui/composite/mobile-nav';
import { Home, Users, BookOpen, Calendar, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TeacherBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: MobileNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      onClick: () => router.push('/teacher/dashboard')
    },
    {
      id: 'classes',
      label: 'Classes',
      icon: <BookOpen size={20} />,
      onClick: () => router.push('/teacher/classes')
    },
    {
      id: 'students',
      label: 'Students',
      icon: <Users size={20} />,
      onClick: () => router.push('/teacher/students')
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Calendar size={20} />,
      onClick: () => router.push('/teacher/schedule')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      onClick: () => router.push('/teacher/settings')
    },
  ];

  // Determine active item based on pathname
  const getActiveItemId = () => {
    if (pathname.startsWith('/teacher/dashboard')) return 'dashboard';
    if (pathname.startsWith('/teacher/classes')) return 'classes';
    if (pathname.startsWith('/teacher/students')) return 'students';
    if (pathname.startsWith('/teacher/schedule')) return 'schedule';
    if (pathname.startsWith('/teacher/settings')) return 'settings';
    return '';
  };

  return (
    <MobileNav
      items={navItems}
      activeItemId={getActiveItemId()}
      role="teacher"
      variant="default"
    />
  );
}
```

## Next Steps

# Teacher Portal UI/UX Revamp - Phase 2 Implementation Plan

## Phase 2: Class Pages Redesign

This phase focuses on redesigning the class-specific pages to align with the new navigation structure and improve the mobile experience.

### UX Guidelines for Phase 2

#### Visual Design
- Apply the color scheme consistently across all class pages
- Use Primary Green (#1F504B) for primary actions and key UI elements
- Use Medium Teal (#5A8A84) for secondary elements and hover states
- Use Light Mint (#D8E3E0) for backgrounds and subtle UI elements
- Maintain consistent typography with Inter font family
- Follow the spacing scale for consistent layout

#### Mobile Experience
- Ensure all class pages are fully responsive and mobile-friendly
- Use larger touch targets (minimum 44px × 44px) for interactive elements
- Implement swipe gestures where appropriate (e.g., navigating between tabs)
- Optimize layout for portrait orientation on mobile devices

#### Content and Messaging
- Use clear, concise headings that describe the content
- Write button text that clearly describes the action
- Provide helpful empty states when no data is available
- Use supportive language for feedback and error messages
- Maintain consistent terminology across all class pages

#### Accessibility
- Ensure sufficient color contrast for all text elements
- Provide alternative text for all images and icons
- Implement proper heading hierarchy for screen readers
- Ensure keyboard navigability for all interactive elements
- Test with screen readers to verify accessibility

### 2.1 Class Overview Page

#### Components to Create/Modify:

1. **ClassOverviewPage**
   - Redesigned class overview page
   - File: `src/app/teacher/classes/[classId]/page.tsx` (modify existing)

2. **ClassMetricsGrid**
   - Grid of key class metrics
   - File: `src/components/teacher/classes/ClassMetricsGrid.tsx`

3. **ClassQuickActions**
   - Quick access buttons for common actions
   - File: `src/components/teacher/classes/ClassQuickActions.tsx`

#### Implementation Steps:

1. Create the `ClassMetricsGrid` component:
   - Display attendance rate, activity completion, assessment performance
   - Implement responsive grid layout
   - Add visual indicators for metrics

2. Create the `ClassQuickActions` component:
   - Add buttons for taking attendance, creating activities, etc.
   - Implement responsive layout for mobile/desktop

3. Update the `ClassOverviewPage`:
   - Use the new components
   - Implement mobile-first layout
   - Ensure proper data fetching

### 2.2 Students Page

#### Components to Create/Modify:

1. **ClassStudentsPage**
   - Redesigned students page
   - File: `src/app/teacher/classes/[classId]/students/page.tsx` (modify existing)

2. **EnhancedStudentGrid**
   - Grid view of students with enhanced metrics
   - File: `src/components/teacher/classes/EnhancedStudentGrid.tsx`

3. **StudentProfileButton**
   - Button to view student profile
   - File: `src/components/teacher/classes/StudentProfileButton.tsx`

#### Implementation Steps:

1. Create the `EnhancedStudentGrid` component:
   - Display student cards with attendance rate
   - Add activities completion rate column
   - Remove present/absent/late actions
   - Add view profile button

2. Create the `StudentProfileButton` component:
   - Button that links to student profile
   - Include visual indicators

3. Update the `ClassStudentsPage`:
   - Use the new components
   - Implement mobile-first layout
   - Ensure proper data fetching

### 2.3 Activities Page

#### Components to Create/Modify:

1. **ClassActivitiesPage**
   - Redesigned activities page
   - File: `src/app/teacher/classes/[classId]/activities/page.tsx` (modify existing)

2. **ActivityGrid**
   - Grid of activity cards with performance metrics
   - File: `src/components/teacher/classes/ActivityGrid.tsx`

3. **ActivityCard**
   - Enhanced activity card with completion rates and score trends
   - File: `src/components/teacher/classes/ActivityCard.tsx`

4. **LessonPlanFilter**
   - Filter activities by lesson plan
   - File: `src/components/teacher/classes/LessonPlanFilter.tsx`

5. **DateRangeSelector**
   - Select date range for activities
   - File: `src/components/teacher/classes/DateRangeSelector.tsx`

#### Implementation Steps:

1. Create the `ActivityCard` component:
   - Display activity name, type, and completion rate
   - Add score trends visualization
   - Implement responsive design

2. Create the `ActivityGrid` component:
   - Display grid of activity cards
   - Implement responsive layout
   - Add sorting and filtering options

3. Create the `LessonPlanFilter` component:
   - Allow filtering activities by lesson plan
   - Implement dropdown/select component

4. Create the `DateRangeSelector` component:
   - Allow selecting date range for activities
   - Implement calendar picker

5. Update the `ClassActivitiesPage`:
   - Use the new components
   - Implement mobile-first layout
   - Ensure proper data fetching

### 2.4 Assessments Page

#### Components to Create/Modify:

1. **ClassAssessmentsPage**
   - Redesigned assessments page
   - File: `src/app/teacher/classes/[classId]/assessments/page.tsx` (modify existing)

2. **AssessmentGrid**
   - Grid of assessment cards
   - File: `src/components/teacher/classes/AssessmentGrid.tsx`

3. **AssessmentCard**
   - Enhanced assessment card
   - File: `src/components/teacher/classes/AssessmentCard.tsx`

4. **AssessmentAnalytics**
   - Term-wise assessment analytics
   - File: `src/components/teacher/classes/AssessmentAnalytics.tsx`

#### Implementation Steps:

1. Create the `AssessmentCard` component:
   - Display assessment name, date, and status
   - Add completion rate and average score
   - Implement responsive design

2. Create the `AssessmentGrid` component:
   - Display grid of assessment cards
   - Implement responsive layout
   - Add sorting and filtering options

3. Create the `AssessmentAnalytics` component:
   - Display term-wise assessment analytics
   - Add visualizations for performance trends
   - Implement responsive design

4. Update the `ClassAssessmentsPage`:
   - Use the new components
   - Implement mobile-first layout
   - Ensure proper data fetching

## Code Examples

### EnhancedStudentGrid Component

```tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { StudentProfileButton } from './StudentProfileButton';

interface Student {
  id: string;
  name: string;
  email: string;
  attendanceRate: number;
  activitiesCompletionRate: number;
  averageGrade?: number;
}

interface EnhancedStudentGridProps {
  students: Student[];
  classId: string;
}

export function EnhancedStudentGrid({ students, classId }: EnhancedStudentGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No students found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <Card key={student.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${student.name}`} alt={student.name} />
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Attendance Rate</span>
                      <span className="font-medium">{student.attendanceRate}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${student.attendanceRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Activities Completion</span>
                      <span className="font-medium">{student.activitiesCompletionRate}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${student.activitiesCompletionRate}%` }}
                      />
                    </div>
                  </div>

                  {student.averageGrade !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Grade</span>
                        <span className="font-medium">{student.averageGrade}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${student.averageGrade}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <StudentProfileButton
                    studentId={student.id}
                    classId={classId}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### ActivityCard Component

```tsx
'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ActivityCardProps {
  id: string;
  classId: string;
  title: string;
  type: string;
  dueDate: Date;
  completionRate: number;
  averageScore?: number;
  submissionCount: number;
  totalStudents: number;
}

export function ActivityCard({
  id,
  classId,
  title,
  type,
  dueDate,
  completionRate,
  averageScore,
  submissionCount,
  totalStudents,
}: ActivityCardProps) {
  // Format the due date
  const formattedDueDate = format(dueDate, 'MMM d, yyyy');

  // Determine status based on due date
  const isPast = dueDate < new Date();
  const status = isPast ? 'Past' : 'Upcoming';

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1">{title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{type}</Badge>
              <Badge
                variant={isPast ? "secondary" : "default"}
              >
                {status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Due: {formattedDueDate}</span>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completion</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{submissionCount}/{totalStudents} submissions</span>
            </div>

            {averageScore !== undefined && (
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-1" />
                <span>Avg: {averageScore}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/teacher/classes/${classId}/activities/${id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

# Teacher Portal UI/UX Revamp - Phases 3 & 4 Implementation Plan

## Phase 3: Profile and Settings

This phase focuses on implementing the profile menu and settings pages to complete the user experience.

### UX Guidelines for Phase 3

#### Visual Design
- Apply the same color scheme and typography as in previous phases
- Use consistent styling for form elements and settings controls
- Implement clear visual hierarchy for settings categories
- Use appropriate iconography to enhance understanding
- Ensure proper spacing between form elements

#### User Experience
- Group related settings together in logical categories
- Provide immediate feedback for user actions (e.g., saving settings)
- Implement progressive disclosure for complex settings
- Ensure all forms have proper validation with helpful error messages
- Provide clear success/error states for all actions

#### Content and Messaging
- Use clear, descriptive labels for all settings
- Provide helpful descriptions for complex settings
- Use consistent terminology throughout settings pages
- Write concise, action-oriented button text
- Use friendly, supportive tone in all messaging

#### Accessibility
- Ensure all form controls are properly labeled
- Implement proper focus states for keyboard navigation
- Group related form elements with fieldsets and legends
- Provide error messages that are announced by screen readers
- Test all forms with keyboard-only navigation

### 3.1 Profile Menu

#### Components to Create/Modify:

1. **ProfileMenu**
   - Enhanced dropdown menu for user profile
   - File: `src/components/teacher/profile/ProfileMenu.tsx`

2. **ThemeSelector**
   - Component for selecting theme
   - File: `src/components/teacher/profile/ThemeSelector.tsx`

#### Implementation Steps:

1. Create the `ThemeSelector` component:
   - Implement theme toggle (light/dark)
   - Add visual indicators for current theme
   - Save preference to local storage

2. Enhance the `ProfileMenu` component:
   - Add user avatar and name
   - Include theme selector
   - Add links to profile and settings
   - Add sign out functionality

### 3.2 User Settings Page

#### Components to Create/Modify:

1. **TeacherSettingsPage**
   - Settings page for teacher
   - File: `src/app/teacher/settings/page.tsx`

2. **SettingsForm**
   - Form for updating settings
   - File: `src/components/teacher/settings/SettingsForm.tsx`

3. **NotificationSettings**
   - Settings for notifications
   - File: `src/components/teacher/settings/NotificationSettings.tsx`

#### Implementation Steps:

1. Create the `NotificationSettings` component:
   - Add toggles for different notification types
   - Implement save functionality
   - Add visual feedback

2. Create the `SettingsForm` component:
   - Add form fields for user settings
   - Implement validation
   - Add save functionality

3. Create the `TeacherSettingsPage`:
   - Use the new components
   - Implement mobile-first layout
   - Ensure proper data fetching and saving

## Phase 4: Testing and Optimization

This phase focuses on testing the new UI/UX and optimizing performance.

### UX Guidelines for Phase 4

#### Testing Approach
- Test with real users from the target audience when possible
- Include teachers with varying levels of technical proficiency
- Test on actual devices rather than just emulators
- Observe users completing common tasks without guidance
- Collect both quantitative and qualitative feedback

#### Performance Metrics
- Aim for Time to Interactive (TTI) under 3 seconds on average connections
- Ensure Largest Contentful Paint (LCP) under 2.5 seconds
- Keep Cumulative Layout Shift (CLS) below 0.1
- Maintain First Input Delay (FID) under 100ms
- Optimize for low-end devices and slower connections

#### Optimization Priorities
- Prioritize critical rendering path optimization
- Implement code splitting for non-essential components
- Optimize image loading with proper sizing and formats
- Reduce JavaScript bundle size through tree shaking
- Implement proper caching strategies for API responses

#### Accessibility Compliance
- Test against WCAG 2.1 AA standards
- Verify screen reader compatibility with NVDA and VoiceOver
- Ensure keyboard navigability throughout the application
- Test color contrast for all text elements
- Verify that all interactive elements have accessible names

### 4.1 Cross-browser Testing

#### Testing Steps:

1. **Desktop Browsers**:
   - Test on Chrome, Firefox, Safari, and Edge
   - Verify layout and functionality
   - Fix any browser-specific issues

2. **Mobile Browsers**:
   - Test on iOS Safari and Android Chrome
   - Verify touch interactions
   - Fix any mobile-specific issues

3. **Responsive Testing**:
   - Test at various screen sizes
   - Verify breakpoints work correctly
   - Fix any responsive layout issues

### 4.2 Performance Optimization

#### Optimization Steps:

1. **Component Optimization**:
   - Implement React.memo for pure components
   - Use useMemo and useCallback for expensive operations
   - Optimize re-renders

2. **Code Splitting**:
   - Implement dynamic imports for large components
   - Use Next.js built-in code splitting
   - Lazy load non-critical components

3. **Asset Optimization**:
   - Optimize images with next/image
   - Implement responsive images
   - Lazy load off-screen images

4. **State Management**:
   - Optimize context usage
   - Implement local state where appropriate
   - Reduce unnecessary re-renders

## Code Examples

### ThemeSelector Component

```tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### ProfileMenu Component

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ThemeSelector } from './ThemeSelector';
import { LogOut, Settings, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface ProfileMenuProps {
  userName: string;
  userEmail?: string;
  userImage?: string;
}

export function ProfileMenu({ userName, userEmail, userImage }: ProfileMenuProps) {
  const router = useRouter();

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="flex items-center gap-2">
      <ThemeSelector />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userImage || `https://avatar.vercel.sh/${userName}`} alt={userName} />
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              {userEmail && (
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/teacher/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/teacher/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### NotificationSettings Component

```tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface NotificationSettingsProps {
  teacherId: string;
  initialSettings?: NotificationSetting[];
}

export function NotificationSettings({
  teacherId,
  initialSettings = []
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings.length > 0
    ? initialSettings
    : [
        {
          id: 'class_updates',
          label: 'Class Updates',
          description: 'Receive notifications about class changes and announcements',
          enabled: true,
        },
        {
          id: 'student_submissions',
          label: 'Student Submissions',
          description: 'Get notified when students submit assignments',
          enabled: true,
        },
        {
          id: 'assessment_reminders',
          label: 'Assessment Reminders',
          description: 'Receive reminders about upcoming assessments',
          enabled: true,
        },
        {
          id: 'system_announcements',
          label: 'System Announcements',
          description: 'Get important system-wide announcements',
          enabled: true,
        },
      ]
  );

  const updateNotificationSettings = api.teacher.updateNotificationSettings.useMutation({
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your notification settings have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Toggle a setting
  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  // Save settings
  const saveSettings = () => {
    updateNotificationSettings.mutate({
      teacherId,
      settings: settings.map(s => ({ id: s.id, enabled: s.enabled })),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map(setting => (
          <div key={setting.id} className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor={setting.id}>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>
            <Switch
              id={setting.id}
              checked={setting.enabled}
              onCheckedChange={() => toggleSetting(setting.id)}
            />
          </div>
        ))}

        <Button
          onClick={saveSettings}
          disabled={updateNotificationSettings.isLoading}
          className="mt-4"
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Final Implementation Checklist

### Phase 1: Core Navigation Structure ✅ COMPLETED
- [x] Create ProfileMenu component
- [x] Create ClassSelector component
- [x] Create TeacherHeader component
- [x] Create TeacherLayout component
- [x] Create TeacherBottomNav component
- [x] Create ClassNav component
- [x] Update routing structure

### Phase 2: Class Pages Redesign
- [ ] Create ClassMetricsGrid component
- [ ] Create ClassQuickActions component
- [ ] Update ClassOverviewPage
- [ ] Create EnhancedStudentGrid component
- [ ] Create StudentProfileButton component
- [ ] Update ClassStudentsPage
- [ ] Create ActivityCard component
- [ ] Create ActivityGrid component
- [ ] Create LessonPlanFilter component
- [ ] Create DateRangeSelector component
- [ ] Update ClassActivitiesPage
- [ ] Create AssessmentCard component
- [ ] Create AssessmentGrid component
- [ ] Create AssessmentAnalytics component
- [ ] Update ClassAssessmentsPage

### Phase 3: Profile and Settings
- [ ] Create ThemeSelector component
- [ ] Enhance ProfileMenu component
- [ ] Create NotificationSettings component
- [ ] Create SettingsForm component
- [ ] Create TeacherSettingsPage

### Phase 4: Testing and Optimization
- [ ] Test on desktop browsers
- [ ] Test on mobile browsers
- [ ] Test responsive layouts
- [ ] Optimize components
- [ ] Implement code splitting
- [ ] Optimize assets
- [ ] Optimize state management

