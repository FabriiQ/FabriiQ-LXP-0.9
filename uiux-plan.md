# UI/UX Implementation Plan

## 1. Design System

### 1.1 Color Palette

# Digital UI Brand Kit

![Brand Header](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/color-8YsUKfp17NPcsocgqkmcbQbSIN6TrE.png)

## Table of Contents

- [Introduction](#introduction)
- [Brand Colors](#brand-colors)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [UI Components](#ui-components)
  - [Search Bars](#search-bars)
  - [Cards](#cards)
  - [Tags & Pills](#tags--pills)
  - [Buttons](#buttons)
  - [Numbered Sections](#numbered-sections)
- [Implementation Guidelines](#implementation-guidelines)
- [Accessibility Standards](#accessibility-standards)
- [CSS Variables](#css-variables)
- [Usage Examples](#usage-examples)

## Introduction

This brand kit defines the visual language and UI components for our digital products. It ensures consistency across all platforms and provides developers and designers with the necessary tools to create cohesive user experiences.

## Brand Colors

### Primary Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| Primary Green | #1F504B | rgb(31, 80, 75) | Primary actions, headers, key UI elements |
| Medium Teal | #5A8A84 | rgb(90, 138, 132) | Secondary elements, hover states |
| Light Mint | #D8E3E0 | rgb(216, 227, 224) | Backgrounds, cards, subtle highlights |

### Neutral Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| White | #FFFFFF | rgb(255, 255, 255) | Backgrounds, cards, text on dark colors |
| Light Gray | #F5F5F5 | rgb(245, 245, 245) | Backgrounds, disabled states |
| Medium Gray | #E0E0E0 | rgb(224, 224, 224) | Borders, dividers |
| Dark Gray | #757575 | rgb(117, 117, 117) | Secondary text |
| Black | #212121 | rgb(33, 33, 33) | Primary text |

### State Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| Red | #D92632 | rgb(217, 38, 50) | Error states, critical actions |
| Orange | #FF9852 | rgb(255, 152, 82) | Notifications, attention |
| Purple | #6126AE | rgb(97, 38, 174) | Premium features |
| Dark Blue | #004EB2 | rgb(0, 78, 178) | Links, interactive elements |
| Light Blue | #2F96F4 | rgb(47, 150, 244) | Secondary actions |

## Typography

### Font Family

**Inter** is our primary typeface with various weights used throughout the interface.

| Weight | Usage | Example |
|--------|-------|---------|
| Inter SemiBold (600) | Headings, buttons, emphasis | **Inter SemiBold** |
| Inter Medium (500) | Subheadings, important text | **Inter Medium** |
| Inter Regular (400) | Body text, general content | Inter Regular |
| Inter Light (300) | Subtle text, captions | Inter Light |

### Font Sizes

| Element | Size | Line Height | Weight | Usage |
|---------|------|-------------|--------|-------|
| H1 | 48px | 56px | SemiBold | Main page headings |
| H2 | 36px | 44px | SemiBold | Section headings |
| H3 | 24px | 32px | SemiBold | Subsection headings |
| H4 | 20px | 28px | SemiBold | Card headings |
| Body Large | 18px | 28px | Regular | Featured content |
| Body | 16px | 24px | Regular | Main content |
| Body Small | 14px | 20px | Regular | Secondary content |
| Caption | 12px | 16px | Regular | Labels, metadata |

## Spacing & Layout

### Spacing Scale

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Minimal spacing, icons |
| sm | 8px | Tight spacing, compact elements |
| md | 16px | Standard spacing, most elements |
| lg | 24px | Generous spacing, section separation |
| xl | 32px | Major section separation |
| xxl | 48px | Page section separation |

### Container Widths

| Size | Width | Usage |
|------|-------|-------|
| Small | 640px | Focused content, forms |
| Medium | 960px | Standard content |
| Large | 1280px | Full-width content |

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | 4px | Buttons, input fields |
| Medium | 8px | Cards, modals |
| Large | 12px | Featured elements |
| Round | 50% | Avatars, circular elements |

## UI Components

### Search Bars


```

### 1.1 Component Library (shadcn/ui)
```typescript
// Base component configuration
export const componentConfig = {
  theme: {
    extend: {
      colors: {
        primary: { /* Custom colors */ },
        secondary: { /* Custom colors */ },
        accent: { /* Custom colors */ },
      },
      spacing: {
        // Custom spacing scale
      },
      borderRadius: {
        // Custom border radius scale
      },
    },
  },
};
```

### 1.2 Design Tokens
```typescript
// Design tokens configuration
export const tokens = {
  colors: {
    // Role-specific theme colors
    systemAdmin: { /* colors */ },
    campusAdmin: { /* colors */ },
    teacher: { /* colors */ },
    student: { /* colors */ },
  },
  typography: {
    // Typography scale
    fontSizes: { /* sizes */ },
    lineHeights: { /* heights */ },
    fontWeights: { /* weights */ },
  },
  spacing: {
    // Spacing scale
  },
};
```

## 2. Mobile-First Approach

### 2.1 Responsive Design Strategy
```scss
// Base mobile styles
.component {
  // Mobile-first styles
  
  // Tablet styles
  @media (min-width: 768px) {
    // Tablet-specific styles
  }
  
  // Desktop styles
  @media (min-width: 1024px) {
    // Desktop-specific styles
  }
}
```

### 2.2 Touch-Optimized Interactions
- Minimum touch target size: 44x44px
- Touch-friendly navigation
- Swipe gestures for common actions
- Bottom navigation for mobile
- Floating action buttons

## 3. Component Architecture

### 3.1 Atomic Design Structure
```
components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   └── Typography/
├── molecules/
│   ├── FormField/
│   ├── Card/
│   └── Navigation/
├── organisms/
│   ├── DataTable/
│   ├── Calendar/
│   └── Dashboard/
└── templates/
    ├── Layout/
    └── Page/
```

### 3.2 Reusable Components
```typescript
// Example reusable component
interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  sorting?: SortingConfig;
  filtering?: FilterConfig;
  pagination?: PaginationConfig;
  responsive?: ResponsiveConfig;
}

export const DataTable = <T,>({
  data,
  columns,
  sorting,
  filtering,
  pagination,
  responsive,
}: DataTableProps<T>) => {
  // Component implementation
};
```

## 4. Role-Based Portal Design

### 4.1 System Admin Portal
```typescript
// System admin layout configuration
const systemAdminLayout = {
  navigation: {
    primary: [
      { title: 'Dashboard', path: '/system-admin/dashboard' },
      { title: 'Institutions', path: '/system-admin/institutions' },
      { title: 'Users', path: '/system-admin/users' },
      { title: 'Settings', path: '/system-admin/settings' },
    ],
    secondary: [
      // Secondary navigation items
    ],
  },
  features: [
    // Feature components
  ],
};
```

### 4.2 Campus Admin Portal
```typescript
// Campus admin layout configuration
const campusAdminLayout = {
  navigation: {
    primary: [
      { title: 'Dashboard', path: '/campus-admin/dashboard' },
      { title: 'Programs', path: '/campus-admin/programs' },
      { title: 'Faculty', path: '/campus-admin/faculty' },
      { title: 'Students', path: '/campus-admin/students' },
    ],
  },
  features: [
    // Feature components
  ],
};
```

### 4.3 Teacher Portal
```typescript
// Teacher layout configuration
const teacherLayout = {
  navigation: {
    primary: [
      { title: 'Dashboard', path: '/teacher/dashboard' },
      { title: 'Classes', path: '/teacher/classes' },
      { title: 'Assessments', path: '/teacher/assessments' },
      { title: 'Calendar', path: '/teacher/calendar' },
    ],
  },
  features: [
    // Feature components
  ],
};
```

### 4.4 Student Portal
```typescript
// Student layout configuration
const studentLayout = {
  navigation: {
    primary: [
      { title: 'Dashboard', path: '/student/dashboard' },
      { title: 'Courses', path: '/student/courses' },
      { title: 'Assignments', path: '/student/assignments' },
      { title: 'Progress', path: '/student/progress' },
    ],
  },
  features: [
    // Feature components
  ],
};
```

## 5. Performance Optimization

### 5.1 Code Splitting
```typescript
// Dynamic imports for role-based portals
const SystemAdminPortal = dynamic(() => import('./SystemAdminPortal'));
const CampusAdminPortal = dynamic(() => import('./CampusAdminPortal'));
const TeacherPortal = dynamic(() => import('./TeacherPortal'));
const StudentPortal = dynamic(() => import('./StudentPortal'));
```

### 5.2 Image Optimization
```typescript
// Image optimization configuration
const imageConfig = {
  formats: ['webp', 'avif'],
  sizes: {
    thumbnail: { width: 100, height: 100 },
    preview: { width: 300, height: 300 },
    full: { width: 1200, height: 1200 },
  },
  loading: 'lazy',
};
```

## 6. Accessibility Implementation

### 6.1 ARIA Roles and States
```typescript
// Example accessible component
const AccessibleMenu = () => {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Navigation items */}
    </nav>
  );
};
```

### 6.2 Keyboard Navigation
```typescript
// Keyboard navigation handler
const handleKeyboardNav = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Tab':
      // Handle tab navigation
      break;
    case 'Enter':
      // Handle enter key
      break;
    // Other key handlers
  }
};
```

## 7. Animation and Transitions

### 7.1 Motion Design
```typescript
// Animation configuration
const motionConfig = {
  transitions: {
    default: {
      type: 'tween',
      duration: 0.3,
    },
    page: {
      type: 'spring',
      stiffness: 100,
    },
  },
  variants: {
    // Animation variants
  },
};
```

### 7.2 Loading States
```typescript
// Loading state components
const LoadingStates = {
  Skeleton: () => (
    // Skeleton loader implementation
  ),
  Spinner: () => (
    // Spinner implementation
  ),
  Placeholder: () => (
    // Content placeholder implementation
  ),
};
```

## 8. Error Handling

### 8.1 Error Boundaries
```typescript
// Error boundary component
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // Error handling logic
  }

  componentDidCatch(error, errorInfo) {
    // Error logging
  }

  render() {
    // Error UI
  }
}
```

### 8.2 Error States
```typescript
// Error state components
const ErrorStates = {
  NotFound: () => (
    // 404 error page
  ),
  Forbidden: () => (
    // 403 error page
  ),
  ServerError: () => (
    // 500 error page
  ),
};
```

## 9. Testing Strategy

### 9.1 Component Testing
```typescript
// Example component test
describe('DataTable', () => {
  it('should render with data', () => {
    // Test implementation
  });

  it('should handle sorting', () => {
    // Test implementation
  });
});
```

### 9.2 Integration Testing
```typescript
// Example integration test
describe('UserPortal', () => {
  it('should load user data', () => {
    // Test implementation
  });

  it('should handle navigation', () => {
    // Test implementation
  });
});
```

## 10. Documentation

### 10.1 Component Documentation
```typescript
// Example component documentation
/**
 * @component DataTable
 * @description A reusable data table component with sorting, filtering, and pagination
 * @example
 * <DataTable
 *   data={data}
 *   columns={columns}
 *   sorting={sortingConfig}
 * />
 */
```

### 10.2 Style Guide
- Color usage guidelines
- Typography rules
- Spacing conventions
- Component usage examples
- Accessibility requirements
- Responsive design patterns 

## 2. Component Architecture

### 2.1 Core Components
```typescript
// Base button component with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  intent: 'none' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  icon?: ReactNode;
}

// Data table with sorting and filtering
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sorting?: SortingState;
  filtering?: FilterState;
  pagination?: PaginationState;
  rowActions?: RowAction<T>[];
}

// Form components with validation
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helper?: string;
  validation?: ValidationRule[];
}
```

### 2.2 Layout Components
```typescript
// Role-based layout wrapper
interface DashboardLayoutProps {
  role: UserType;
  navigation: NavigationItem[];
  actions: ActionItem[];
  notifications: Notification[];
}

// Page layout with breadcrumbs
interface PageLayoutProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  actions?: ActionItem[];
  filters?: FilterConfig[];
}
```

## 3. Portal-Specific Components

### 3.1 Academic Components
```typescript
// Course management components
interface CourseCardProps {
  course: {
    code: string;
    name: string;
    description: string;
    credits: number;
    prerequisites: string[];
  };
  actions: CourseAction[];
}

// Class schedule components
interface ScheduleViewProps {
  periods: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    type: PeriodType;
    subject: string;
    teacher: string;
    facility: string;
  }[];
  view: 'day' | 'week' | 'month';
}
```

### 3.2 Assessment Components
```typescript
// Assessment creation form
interface AssessmentFormProps {
  template?: AssessmentTemplate;
  class: Class;
  subject: Subject;
  onSubmit: (data: AssessmentInput) => void;
}

// Grade book component
interface GradeBookProps {
  grades: {
    student: Student;
    assessments: Assessment[];
    finalGrade: number;
    attendance: number;
  }[];
  calculationRules: GradeCalculationRules;
}
```

### 3.3 Feedback Components
```typescript
// Feedback creation dialog
interface FeedbackDialogProps {
  type: FeedbackType;
  recipient: Student | Teacher;
  onSubmit: (feedback: FeedbackInput) => void;
}

// Feedback response component
interface FeedbackResponseProps {
  feedback: Feedback;
  responses: FeedbackResponse[];
  canRespond: boolean;
}
```

## 4. Page Implementations

### 4.1 Dashboard Pages
```typescript
// System admin dashboard
const SystemAdminDashboard = () => {
  return (
    <DashboardLayout role="SYSTEM_ADMIN">
      <MetricsGrid>
        <UserMetrics />
        <InstitutionMetrics />
        <SystemHealthMetrics />
      </MetricsGrid>
      <ActivityFeed />
      <AlertsPanel />
    </DashboardLayout>
  );
};

// Teacher dashboard
const TeacherDashboard = () => {
  return (
    <DashboardLayout role="TEACHER">
      <UpcomingClasses />
      <PendingAssessments />
      <StudentFeedback />
      <TeachingLoad />
    </DashboardLayout>
  );
};
```

### 4.2 Management Pages
```typescript
// Course management page
const CourseManagement = () => {
  return (
    <PageLayout title="Course Management">
      <CourseFilters />
      <CourseList>
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            actions={[
              'edit',
              'archive',
              'view-students',
              'view-assessments'
            ]}
          />
        ))}
      </CourseList>
      <CoursePagination />
    </PageLayout>
  );
};

// Assessment management page
const AssessmentManagement = () => {
  return (
    <PageLayout title="Assessments">
      <AssessmentTemplates />
      <AssessmentList>
        {assessments.map(assessment => (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            actions={[
              'grade',
              'view-submissions',
              'edit',
              'delete'
            ]}
          />
        ))}
      </AssessmentList>
    </PageLayout>
  );
};
```

## 5. Interactive Features

### 5.1 Drag and Drop
```typescript
// Timetable period drag and drop
interface TimetableSlotProps {
  day: DayOfWeek;
  time: string;
  onDrop: (period: Period) => void;
}

// Course prerequisite management
interface PrerequisiteManagerProps {
  available: Course[];
  selected: Course[];
  onOrderChange: (courses: Course[]) => void;
}
```

### 5.2 Real-time Updates
```typescript
// Real-time grade updates
const useGradeUpdates = (classId: string) => {
  const { data, mutate } = useSWR(
    `/api/classes/${classId}/grades`,
    fetcher,
    {
      refreshInterval: 5000
    }
  );
};

// Live attendance tracking
const useAttendanceTracking = (classId: string) => {
  const { data, mutate } = useSWR(
    `/api/classes/${classId}/attendance`,
    fetcher,
    {
      refreshInterval: 1000
    }
  );
};
```

## 6. Form Implementations

### 6.1 Dynamic Forms
```typescript
// Assessment template builder
interface TemplateBuilderProps {
  initialTemplate?: AssessmentTemplate;
  onSave: (template: AssessmentTemplate) => void;
}

// Grade calculation rules builder
interface GradeRulesBuilderProps {
  assessments: Assessment[];
  weights: Record<string, number>;
  onUpdate: (rules: GradeCalculationRules) => void;
}
```

### 6.2 Validation Rules
```typescript
// Assessment validation schema
const assessmentSchema = z.object({
  title: z.string().min(1),
  maxScore: z.number().positive(),
  passingScore: z.number().min(0),
  weightage: z.number().min(0).max(1),
  gradingConfig: z.object({
    type: z.enum(['AUTOMATIC', 'MANUAL', 'HYBRID']),
    scale: z.enum(['PERCENTAGE', 'LETTER_GRADE', 'GPA']),
    rules: z.array(z.object({
      condition: z.string(),
      score: z.number()
    }))
  })
});

// Feedback validation schema
const feedbackSchema = z.object({
  type: z.enum([
    'ACADEMIC_PERFORMANCE',
    'BEHAVIORAL',
    'ATTENDANCE',
    'PARTICIPATION',
    'IMPROVEMENT_AREA',
    'ACHIEVEMENT',
    'DISCIPLINARY'
  ]),
  severity: z.enum([
    'POSITIVE',
    'NEUTRAL',
    'CONCERN',
    'CRITICAL'
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string())
});
```

## 7. State Management

### 7.1 Global State
```typescript
// User context
interface UserState {
  user: User;
  permissions: Permission[];
  campusAccess: CampusAccess[];
  preferences: UserPreferences;
}

// Application state
interface AppState {
  currentTerm: Term;
  activeCampus: Campus;
  theme: ThemeConfig;
  notifications: Notification[];
}
```

### 7.2 Form State
```typescript
// Assessment form state
interface AssessmentFormState {
  template: AssessmentTemplate | null;
  currentStep: number;
  validation: Record<string, boolean>;
  attachments: File[];
}

// Enrollment form state
interface EnrollmentFormState {
  selectedStudents: Student[];
  selectedClass: Class;
  validation: Record<string, boolean>;
  conflicts: ScheduleConflict[];
}
```

## 8. Animation & Transitions

### 8.1 Page Transitions
```typescript
// Page transition variants
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Route change transitions
const routeTransition = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 }
};
```

### 8.2 Component Animations
```typescript
// Notification animation
const notificationVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 }
};

// Grade update animation
const gradeUpdateVariants = {
  initial: { scale: 1 },
  update: { scale: 1.1 },
  final: { scale: 1 }
};
```

## 9. Responsive Design

### 9.1 Breakpoint System
```typescript
// Breakpoint configuration
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Responsive layout hooks
const useResponsiveLayout = () => {
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isTablet = useMediaQuery(
    `(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`
  );
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.md})`);
  
  return { isDesktop, isTablet, isMobile };
};
```

### 9.2 Mobile Adaptations
```typescript
// Mobile navigation
const MobileNavigation = () => {
  return (
    <BottomNavigation>
      <NavItem icon={HomeIcon} label="Dashboard" />
      <NavItem icon={CalendarIcon} label="Schedule" />
      <NavItem icon={BookIcon} label="Courses" />
      <NavItem icon={UserIcon} label="Profile" />
    </BottomNavigation>
  );
};

// Responsive data display
const ResponsiveDataTable = <T,>({ data, columns }: DataTableProps<T>) => {
  const { isMobile } = useResponsiveLayout();
  
  return isMobile ? (
    <DataCards data={data} />
  ) : (
    <DataTable data={data} columns={columns} />
  );
};
``` 