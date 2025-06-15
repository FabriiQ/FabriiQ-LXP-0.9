# Aivy LXP Frontend Development Tasklist

This document outlines a comprehensive, phased approach to developing the frontend for the Aivy Learning Experience Platform (LXP). Each phase focuses on specific functional areas, with detailed tasks and implementation guidelines aligned with the system's administrative hierarchy.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Phase 1: Core Functionality](#phase-1-core-functionality)
3. [Phase 2: Core UI Components](#phase-2-core-ui-components)
4. [Phase 3: Central Institution Admin Portal](#phase-3-central-institution-admin-portal)
5. [Phase 4: Campus Admin Portal](#phase-4-campus-admin-portal)
6. [Phase 5: Campus Coordinator Portal](#phase-5-campus-coordinator-portal)
7. [Phase 6: Teacher Portal](#phase-6-teacher-portal)
8. [Phase 7: Student Portal](#phase-7-student-portal)
9. [Phase 8: Cross-Portal Features](#phase-8-cross-portal-features)
10. [Phase 9: Performance Optimization](#phase-9-performance-optimization)
11. [Phase 10: Testing & Quality Assurance](#phase-10-testing--quality-assurance)

## Development Environment Setup

### Task 1: Project Configuration ✅ (COMPLETED)
- Set up Next.js project with TypeScript
- Configure ESLint and Prettier
- Set up directory structure following atomic design principles
- Configure build and deployment pipelines

### Task 2: Design System Implementation ✅ (COMPLETED)
- Implement design tokens based on UI/UX guidelines
- Set up CSS variables for colors, typography, spacing
- Configure shadcn/ui component library with custom theme
- Create typography components (headings, body text, etc.)

### Task 3: API Integration Setup ✅ (COMPLETED)
- Configure tRPC client for type-safe API calls
- Set up API utility functions for error handling
- Implement request/response interceptors
- Create API hooks for common operations

## Phase 1: Core Functionality

### Task 1: Authentication System ✅ (COMPLETED)
- Implement user registration, login, and logout functionality
- Create password reset and email verification flows
- Implement role-based access control (admin, instructor, student)
- Integrate with backend authentication API
- Add session management and token handling

### Task 2: User Profile Management ✅ (COMPLETED)
- Create profile viewing and editing interfaces
- Implement password change functionality
- Add profile picture upload and management
- Create notification preferences settings
- Implement account settings page
- Connect to user profile API endpoints

### Task 3: Role-Based Access Control ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement role-based routing and access control based on UserType and AccessScope.
- **Components**:
  - Protected route wrapper with scope checking ✅
  - Role-based navigation ✅
  - Permission-based UI elements ⚠️ (Partially implemented)
  - Access scope indicators ❌
- **Folder Structure**:
  - Role-specific dashboards in dedicated directories:
    - `/admin/system`: System Admin dashboard ✅
    - `/admin/campus`: Campus Admin dashboard ✅
    - `/admin/coordinator`: Coordinator dashboard ❌
    - `/teacher/dashboard`: Teacher dashboard ⚠️ (Basic implementation)
    - `/student/dashboard`: Student dashboard ⚠️ (Basic implementation)
    - `/parent/dashboard`: Parent dashboard ❌
  - Central dashboard at `/dashboard` for role-based routing ✅
  - Shared settings in `/app/(dashboard)/settings` ✅
- **API Integration**:
  - Connect to `permission.getUserPermissions` endpoint to fetch user permissions ✅
  - Connect to `permission.checkPermission` endpoint for permission verification ✅
  - Use session data from `auth.getProfile` to determine user type and access scope ✅
- **Error Handling**:
  - Redirect unauthorized users to login page ✅
  - Display appropriate messages for insufficient permissions ⚠️ (Basic implementation)
  - Implement graceful handling of permission changes during session ❌
- **Backend Implementation Details**:
  - User types are defined in the UserType enum (SYSTEM_ADMIN, SYSTEM_MANAGER, CAMPUS_ADMIN, CAMPUS_COORDINATOR, CAMPUS_TEACHER, CAMPUS_STUDENT, CAMPUS_PARENT) ✅
  - Access scopes are defined in the AccessScope enum (SINGLE_CAMPUS, MULTI_CAMPUS, ALL_CAMPUSES) ✅
  - Permissions are stored in the database and linked to users ✅
  - Protected routes use the enforceUserIsAuthed middleware ✅
  - Permission checking is handled by the PermissionService ✅
  - Users can have multiple campus roles through the UserCampusAccess model ✅
- **Backend Reference Files**:
  - Permission Router: `src/server/api/routers/permission.ts` - Contains permission endpoints ✅
  - Permission Service: `src/server/api/services/permission.service.ts` - Implements permission logic ✅
  - Auth Router: `src/server/api/routers/auth.ts` - Contains session and profile endpoints ✅
  - TRPC Config: `src/server/api/trpc.ts` - Contains protected procedure middleware ✅
  - Constants: `src/server/api/constants.ts` - Contains UserType and AccessScope enums ✅

### Task 4: User Preferences ✅ (COMPLETED)
- **Description**: Implement user preference settings.
- **Components**:
  - Preferences form
  - Theme selector (light/dark mode)
  - Notification settings
  - Display settings
  - Accessibility options
- **API Integration**:
  - Connect to `user.updatePreferences` endpoint to save user preferences
  - Connect to `user.getPreferences` endpoint to fetch current preferences
  - Implement local storage fallback for preferences
- **Validation**:
  - Validate preference settings format
  - Ensure preferences are compatible with user's role and permissions
- **Error Handling**:
  - Handle preference save failures with retry mechanism
  - Implement graceful degradation for unavailable preferences
  - Provide feedback for preference update status
- **Backend Implementation Details**:
  - User preferences are stored in the database as JSON in the user.preferences field
  - Preferences include UI settings, notification preferences, and accessibility options
  - Default preferences are provided based on user role
  - Preferences are scoped to specific contexts (global, campus-specific)
  - The UserService handles preference management
  - Client-side preferences can be synchronized across devices
- **Backend Reference Files**:
  - User Router: `src/server/api/routers/user.ts` - Contains user preference endpoints
  - User Service: `src/server/api/services/user.service.ts` - Implements user preference logic
  - Auth Router: `src/server/api/routers/auth.ts` - Contains session validation
  - Constants: `src/server/api/constants.ts` - Contains default preference settings

## Phase 2: Core UI Components

### Task 1: Layout Components ✅ (COMPLETED)
- **Description**: Implement core layout components used across the application.
- **Components**:
  - Main layout with responsive sidebar
  - Page header with breadcrumbs
  - Content containers
  - Footer
- **Responsive Design**:
  - Mobile-first approach
  - Collapsible sidebar for mobile
  - Responsive typography and spacing
- **Accessibility**:
  - Keyboard navigation
  - ARIA attributes
  - Focus management
- **Implementation Guidelines**:
  - Create reusable layout components in `src/components/layout/`
  - Implement responsive breakpoints using Tailwind CSS
  - Use shadcn/ui components as base building blocks
  - Ensure layouts adapt to different user roles and permissions
- **Backend Integration**:
  - Use session data from `auth.getProfile` to customize layouts based on user role
  - Fetch navigation items based on user permissions
  - Implement dynamic breadcrumbs based on application routes

### Task 2: Data Display Components ✅ (COMPLETED)
- **Description**: Implement reusable data display components.
- **Components**:
  - Data table with sorting, filtering, and pagination
  - Data cards for mobile view
  - List views with various layouts
  - Detail views
- **Features**:
  - Responsive design for all screen sizes
  - Sorting and filtering capabilities
  - Pagination controls
- **Accessibility**:
  - Accessible table markup
  - Screen reader support
  - Keyboard navigation for interactive elements
- **Implementation Guidelines**:
  - Create reusable data components in `src/components/data-display/`
  - Implement table components using TanStack Table (React Table)
  - Create card components with consistent styling and behavior
  - Develop list components with various display options
  - Ensure all components work with the tRPC data fetching pattern
- **Backend Integration**:
  - Implement pagination, sorting, and filtering to work with backend API parameters
  - Handle loading, error, and empty states consistently
  - Support real-time data updates where applicable

### Task 3: Form Components ✅ (COMPLETED)
- **Description**: Implement reusable form components with validation.
- **Components**:
  - Text inputs (single line, multi-line)
  - Select inputs (dropdown, multi-select)
  - Date and time pickers
  - Checkbox and radio inputs
  - File uploads
- **Features**:
  - Form validation with error messages
  - Field-level and form-level validation
  - Accessible error states
- **Accessibility**:
  - Label associations
  - Error message announcements
  - Keyboard navigation
- **Implementation Guidelines**:
  - Create reusable form components in `src/components/forms/`
  - Use React Hook Form for form state management
  - Implement Zod for schema validation to match backend validation
  - Create consistent styling for form elements using shadcn/ui
  - Develop custom form hooks for common validation patterns
- **Backend Integration**:
  - Align client-side validation with server-side validation schemas
  - Handle form submission errors from the API gracefully
  - Implement file upload progress indicators for large files

### Task 4: Feedback Components ✅ (COMPLETED)
- **Description**: Implement user feedback components.
- **Components**:
  - Toast notifications
  - Alert dialogs
  - Loading indicators
  - Empty states
  - Error states
- **Features**:
  - Configurable duration for notifications
  - Different severity levels (info, success, warning, error)
  - Animated transitions (subtle)
- **Accessibility**:
  - ARIA live regions for notifications
  - Focus management for dialogs
- **Implementation Guidelines**:
  - Create reusable feedback components in `src/components/feedback/`
  - Implement toast notifications using Sonner or React-Hot-Toast
  - Create consistent alert dialogs using shadcn/ui Dialog
  - Develop loading indicators with consistent styling
  - Design empty and error states with helpful actions
- **Backend Integration**:
  - Connect toast notifications to API response status
  - Implement global error handling for API errors
  - Create consistent loading states for async operations

### Task 5: Navigation Components ✅ (COMPLETED)
- **Description**: Implement navigation components.
- **Components**:
  - Main navigation (sidebar)
  - Breadcrumbs
  - Tabs
  - Pagination
  - Mobile bottom navigation
- **Features**:
  - Active state indicators
  - Responsive design
  - Role-based visibility based on UserType and AccessScope
- **Accessibility**:
  - Keyboard navigation
  - ARIA attributes for current state
- **Implementation Guidelines**:
  - Create reusable navigation components in `src/components/navigation/`
  - Implement sidebar navigation with collapsible sections
  - Create breadcrumb component with automatic path generation
  - Develop tab components for content organization
  - Design mobile-specific navigation components
- **Backend Integration**:
  - Fetch navigation items based on user permissions from `permission.getUserPermissions`
  - Implement dynamic navigation based on user role and access scope
  - Create navigation context provider for global navigation state

## Phase 3: Central Institution Admin Portal

### Task 1: Dashboard ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement the central institution admin dashboard (SYSTEM_ADMIN/SYSTEM_MANAGER).
- **Components**:
  - Multi-institution metrics overview ⚠️ (Basic implementation)
  - System health indicators ❌
  - Recent activity feed ✅
  - Quick action cards ✅
  - User activity analytics ⚠️ (Basic implementation)
  - System performance metrics ❌
- **Implementation Path**:
  - Create dashboard at `/admin/system/page.tsx` ✅
  - Implement shared components in `/components/dashboard/` ✅
- **API Integration**:
  - Connect to `analyticsEvent` and `analyticsMetric` endpoints for real-time metrics ⚠️ (Basic implementation)
  - Implement filtering by `analyticsEvent.eventType` and `analyticsEvent.entityType` ❌
  - Utilize `analyticsMetric.dimensions` for multi-dimensional analysis ❌
  - Implement time-series analysis using `analyticsMetric.timestamp` ❌
- **Features**:
  - Data visualization with charts ⚠️ (Basic implementation)
  - Filterable activity feed ❌
  - Real-time system monitoring ❌
  - Cross-institution comparative analytics ❌
- **Implementation Guidelines**:
  - Create dashboard components in `src/components/dashboard/` ✅
  - Implement data visualization using Recharts or Chart.js ✅
  - Create responsive dashboard layout with grid system ✅
  - Implement real-time updates using SWR or React Query ⚠️ (Basic implementation)
  - Design mobile-friendly dashboard views ✅
- **Backend Reference Files**:
  - Analytics Router: `src/server/api/routers/analytics.ts` - Contains analytics endpoints ✅
  - Analytics Service: `src/server/api/services/analytics.service.ts` - Implements analytics logic ✅
  - Institution Router: `src/server/api/routers/institution.ts` - Contains institution data endpoints ✅
  - User Router: `src/server/api/routers/user.ts` - Contains user activity endpoints ✅

### Task 2: Institution Management ✅ (COMPLETED)
- **Description**: Implement institution management functionality.
- **Components**:
  - Institution list view
  - Institution detail view
  - Institution creation/edit form
  - Institution settings
  - Institution branding management
  - Institution-wide configuration
- **Implementation Path**:
  - Create institution management at `/admin/system/institutions/page.tsx`
  - Create institution detail at `/admin/system/institutions/[id]/page.tsx`
- **API Integration**:
  - Connect to `institution` endpoints
- **Validation**:
  - Required fields (name, code)
  - Email and phone format validation
  - Code uniqueness validation
- **Error Handling**:
  - Display specific error messages for validation failures
  - Handle duplicate institution codes
- **Seed Data**:
  - Create sample institutions

### Task 3: Campus Management ✅ (COMPLETED)
- **Description**: Implement campus management functionality.
- **Components**:
  - Campus list view
  - Campus detail view
  - Campus creation/edit form
  - Campus settings
  - Campus feature activation
  - Campus administrator assignment
- **Implementation Path**:
  - Create campus management at `/admin/system/campuses/page.tsx`
  - Create campus detail at `/admin/system/campuses/[id]/page.tsx`
- **API Integration**:
  - Connect to `campus` endpoints
  - Connect to `campusFeature` endpoints
  - Connect to `userCampusAccess` endpoints for admin assignment
- **Validation**:
  - Required fields (name, code, institution)
  - Address validation
  - Contact information validation
- **Error Handling**:
  - Display specific error messages for validation failures
  - Handle duplicate campus codes
- **Seed Data**:
  - Create sample campuses for each institution

### Task 4: Academic Structure Management ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement comprehensive academic structure management aligned with the updated academic cycle model.
- **Components**:
  - Academic Cycle Management
    - Cycle creation/edit form ✅
    - Cycle type configuration (ANNUAL, SEMESTER, TRIMESTER, QUARTER, CUSTOM) ✅
    - Cycle duration calculation ✅
  - Term Management
    - Term creation/edit form ✅
    - Term type configuration (SEMESTER, TRIMESTER, QUARTER, THEME_BASED, CUSTOM) ✅
    - Term period configuration (FALL, SPRING, SUMMER, etc.) ✅
  - Calendar Management
    - Holiday definition ⚠️ (Basic implementation)
    - Academic event management ⚠️ (Basic implementation)
    - Schedule pattern configuration ⚠️ (Basic implementation)
  - Program Management
    - Program creation/edit form ✅
    - Program curriculum builder ⚠️ (Basic implementation)
    - Program requirements configuration ❌
  - Course Management
    - Course creation/edit form ✅
    - Course prerequisite configuration ⚠️ (Basic implementation)
    - Course credit management ✅
  - Subject Management
    - Subject creation/edit form ✅
    - Subject content structure ⚠️ (Basic implementation)
    - Subject learning objectives ❌
- **Implementation Path**:
  - Create academic cycle management at `/admin/system/academic-cycles/page.tsx` ✅
  - Create academic cycle detail at `/admin/system/academic-cycles/[id]/page.tsx` ✅
  - Create term management at `/admin/system/academic-cycles/[id]/terms/page.tsx` ✅
  - Create term creation at `/admin/system/academic-cycles/[id]/terms/create/page.tsx` ✅
  - Create calendar management at `/admin/system/calendar/page.tsx` ✅
- **API Integration**:
  - Connect to `academicCycle` endpoints ✅
  - Connect to `term` endpoints ✅
  - Connect to `calendarEvent` endpoints ⚠️ (Basic implementation)
  - Connect to `holiday` endpoints ⚠️ (Basic implementation)
  - Connect to `schedulePattern` endpoints ⚠️ (Basic implementation)
  - Connect to `program`, `course`, and `subject` endpoints ✅
  - Connect to `coursePrerequisite` endpoints ⚠️ (Basic implementation)
- **Validation**:
  - Required fields ✅
  - Date range validation ✅
  - Type validation for academic cycles and terms ✅
  - Code uniqueness ✅
  - Prerequisite circular reference prevention ⚠️ (Basic implementation)
  - Credit validation ✅
  - Term period compatibility with term type ✅
- **Error Handling**:
  - Display specific error messages for validation failures ✅
  - Handle date range conflicts ✅
  - Handle prerequisite conflicts ⚠️ (Basic implementation)
  - Prevent overlapping academic cycles ✅
- **Seed Data**:
  - Create sample academic cycles with different types ✅
  - Create sample terms with appropriate term types and periods ✅
  - Create sample holidays and academic events ⚠️ (Basic implementation)
  - Create sample schedule patterns ⚠️ (Basic implementation)

### Task 5: Assessment System Management
- **Description**: Implement comprehensive assessment system management.
- **Components**:
  - Assessment template management
    - Template creation/edit form
    - Template categorization
  - Grading scale management
    - Scale creation/edit form
    - Grade point configuration
  - Rubric management
    - Rubric creation/edit form
    - Criteria configuration
  - Assessment policy configuration
    - Policy creation/edit form
    - Rule configuration
- **API Integration**:
  - Connect to `assessmentTemplate` endpoints
- **Validation**:
  - Required fields
  - Score and weight validation
  - Grading scale consistency
- **Error Handling**:
  - Display specific error messages for validation failures
- **Seed Data**:
  - Create sample assessment templates and grading scales

### Task 6: User Management
- **Description**: Implement comprehensive user management functionality.
- **Components**:
  - User list view with advanced filtering
  - User detail view with profile data
  - User creation/edit form
  - Role assignment
  - Access scope configuration
  - Bulk user import/export
  - User account status management
- **API Integration**:
  - Connect to `user` endpoints
- **Validation**:
  - Email format
  - Required fields
  - Password strength
  - Username uniqueness
  - Role compatibility with access scope
- **Error Handling**:
  - Display specific error messages for validation failures
  - Handle duplicate email/username
- **Seed Data**:
  - Create sample users with various roles

### Task 7: Permission Management
- **Description**: Implement comprehensive permission management functionality.
- **Components**:
  - Permission list view
  - Permission creation/edit form
  - Role-based permission assignment
  - User-specific permission overrides
  - Permission inheritance configuration
  - Permission audit view
- **API Integration**:
  - Connect to `permission` and `userPermission` endpoints
- **Features**:
  - Hierarchical permission display
  - Bulk permission updates
  - Permission template creation
  - Permission impact analysis
- **Error Handling**:
  - Display specific error messages for permission errors
  - Prevent security-critical permission removal
- **Seed Data**:
  - Create sample permission sets

### Task 8: System Configuration
- **Description**: Implement system-wide configuration management.
- **Components**:
  - General settings management
  - Security settings configuration
  - Integration settings management
  - Email template configuration
  - Notification template management
  - System defaults configuration
- **API Integration**:
  - Connect to system configuration endpoints
- **Validation**:
  - Setting-specific validation rules
  - Security policy compliance
- **Error Handling**:
  - Display specific error messages for configuration errors
  - Prevent security-critical misconfigurations
- **Seed Data**:
  - Create default system configurations

### Task 9: Audit and Compliance
- **Description**: Implement audit and compliance management.
- **Components**:
  - Audit log viewer
  - User activity tracking
  - System change history
  - Compliance report generation
  - Data retention policy management
- **API Integration**:
  - Connect to `auditLog` endpoints
- **Features**:
  - Advanced filtering of audit logs
  - Export audit data
  - Compliance dashboard
- **Seed Data**:
  - Create sample audit logs

### Task 10: Analytics and Reporting
- **Description**: Implement system-wide analytics and reporting.
- **Components**:
  - Analytics dashboard
  - Report template management
  - Report generation interface
  - Data export functionality
  - Scheduled report configuration
- **API Integration**:
  - Connect to `analyticsEvent` and `analyticsMetric` endpoints
  - Implement filtering by `analyticsEvent.eventType` and `analyticsEvent.entityType`
  - Utilize `analyticsMetric.dimensions` for multi-dimensional analysis
  - Implement time-series analysis using `analyticsMetric.timestamp`
- **Features**:
  - Custom report builder
  - Data visualization options
  - Export in multiple formats (PDF, Excel, CSV)
- **Seed Data**:
  - Create sample analytics data and report templates

### Task 11: Calendar Management ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement comprehensive calendar management functionality integrated with the academic structure.
- **Components**:
  - Calendar Views
    - Year view for academic planning ❌
    - Month view for detailed planning ❌
    - Week view for scheduling ❌
    - Day view for detailed scheduling ❌
  - Holiday Management
    - Holiday creation/edit form ⚠️ (Basic implementation)
    - Holiday categorization (national, religious, institutional) ✅
    - Campus-specific holiday configuration ⚠️ (Basic implementation)
  - Academic Event Management
    - Event creation/edit form ⚠️ (Basic implementation)
    - Event categorization (registration, exams, orientation, etc.) ✅
    - Campus-specific event configuration ⚠️ (Basic implementation)
  - Schedule Pattern Management
    - Pattern creation/edit form ⚠️ (Basic implementation)
    - Recurring schedule definition ⚠️ (Basic implementation)
    - Exception handling ❌
  - Timetable Integration
    - Timetable visualization in calendar ❌
    - Conflict detection ❌
    - Resource scheduling ❌
- **Implementation Path**:
  - Create calendar management at `/admin/system/calendar/page.tsx` ✅
  - Create holiday management at `/admin/system/calendar/holidays/page.tsx` ❌
  - Create academic event management at `/admin/system/calendar/events/page.tsx` ❌
  - Create schedule pattern management at `/admin/system/calendar/patterns/page.tsx` ❌
- **API Integration**:
  - Connect to `holiday` endpoints ⚠️ (Basic implementation)
  - Connect to `academicCalendarEvent` endpoints ⚠️ (Basic implementation)
  - Connect to `schedulePattern` endpoints ⚠️ (Basic implementation)
  - Connect to `scheduleException` endpoints ❌
  - Connect to `timetable` and `timetablePeriod` endpoints ❌
- **Validation**:
  - Date range validation ⚠️ (Basic implementation)
  - Overlap prevention ❌
  - Required fields ✅
  - Type validation ✅
- **Error Handling**:
  - Display specific error messages for validation failures ✅
  - Handle scheduling conflicts ❌
  - Prevent invalid date configurations ⚠️ (Basic implementation)
- **Features**:
  - Role-based calendar views ❌
  - Export calendar to standard formats ❌
  - Calendar sharing ❌
  - Notification integration ❌
- **Seed Data**:
  - Create sample holidays ❌
  - Create sample academic events ❌
  - Create sample schedule patterns ❌

## Phase 4: Campus Admin Portal

### Task 1: Dashboard ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement the campus admin dashboard (CAMPUS_ADMIN).
- **Components**:
  - Campus metrics overview ⚠️ (Basic implementation)
  - Program and course statistics ⚠️ (Basic implementation)
  - Student and teacher counts ✅
  - Recent activity feed ✅
  - Quick action cards ✅
- **Implementation Path**:
  - Create dashboard at `/admin/campus/page.tsx` ✅
- **API Integration**:
  - Connect to campus-specific analytics endpoints ⚠️ (Basic implementation)

### Task 2: Program Implementation
- **Description**: Implement program implementation functionality.
- **Components**:
  - Available programs view
  - Program implementation form
  - Program status tracking
- **Implementation Path**:
  - Create program management at `/admin/campus/programs/page.tsx`
  - Create program detail at `/admin/campus/programs/[id]/page.tsx`
- **API Integration**:
  - Connect to `programCampus` endpoints
- **Validation**:
  - Date range validation
  - Required fields
- **Error Handling**:
  - Display specific error messages for validation failures
- **Seed Data**:
  - Create sample program implementations

### Task 3: Course Implementation
- **Description**: Implement course implementation functionality.
- **Components**:
  - Available courses view
  - Course implementation form
  - Course status tracking
- **API Integration**:
  - Connect to `courseCampus` endpoints
- **Validation**:
  - Required fields
  - Date range validation
- **Error Handling**:
  - Display specific error messages for validation failures
- **Seed Data**:
  - Create sample course implementations

### Task 4: Facility Management
- **Description**: Implement facility management functionality.
- **Components**:
  - Facility list view
  - Facility detail view
  - Facility creation/edit form
  - Resource assignment
- **API Integration**:
  - Connect to `facility` endpoints
- **Validation**:
  - Required fields
  - Capacity validation
- **Error Handling**:
  - Display specific error messages for validation failures
- **Seed Data**:
  - Create sample facilities

### Task 5: Staff Management
- **Description**: Implement staff management functionality.
- **Components**:
  - Staff list view
  - Staff detail view
  - Staff assignment to campus
  - Role assignment
- **API Integration**:
  - Connect to `userCampusAccess` endpoints
- **Validation**:
  - Role compatibility
  - Date range validation
- **Error Handling**:
  - Display specific error messages for assignment conflicts
- **Seed Data**:
  - Create sample staff assignments

### Task 6: Campus Feature Management
- **Description**: Implement campus feature management.
- **Components**:
  - Feature list view
  - Feature configuration
  - Feature activation/deactivation
- **API Integration**:
  - Connect to `campusFeature` endpoints
- **Validation**:
  - Configuration validation
- **Error Handling**:
  - Display specific error messages for configuration issues
- **Seed Data**:
  - Create sample campus features

## Phase 5: Campus Coordinator Portal

### Task 1: Dashboard ❌ (PENDING)
- **Description**: Implement the campus coordinator dashboard (CAMPUS_COORDINATOR).
- **Components**:
  - Academic program overview
  - Class statistics
  - Teacher performance metrics
  - Student performance metrics
- **Implementation Path**:
  - Create dashboard at `/admin/coordinator/page.tsx`
  - Implement shared components in `/components/dashboard/`
- **API Integration**:
  - Connect to coordinator dashboard endpoints
  - Utilize `analyticsMetric` filtered by relevant program and class dimensions
  - Track academic performance metrics with appropriate `analyticsEvent.entityType`
- **Features**:
  - Filterable by academic period and program
  - Data visualization with charts
- **Seed Data**:
  - Create sample coordinator dashboard data

### Task 2: Class Management
- **Description**: Implement class management functionality.
- **Components**:
  - Class list view
  - Class detail view
  - Class creation/edit form
  - Student enrollment management
- **Implementation Path**:
  - Create class management at `/admin/coordinator/classes/page.tsx`
  - Create class detail at `/admin/coordinator/classes/[id]/page.tsx`
- **API Integration**:
  - Connect to `class` endpoints
- **Validation**:
  - Required fields
  - Capacity validation
- **Error Handling**:
  - Display specific error messages for validation failures
- **Seed Data**:
  - Create sample classes

## Phase 6: Teacher Portal

### Task 1: Dashboard ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement the teacher dashboard (TEACHER/CAMPUS_TEACHER).
- **Components**:
  - Class overview ✅
  - Upcoming schedule ⚠️ (Basic implementation)
  - Recent assessments ❌
  - Student performance metrics ❌
- **Implementation Path**:
  - Create dashboard at `/teacher/dashboard/page.tsx` ✅

### Task 2: Class Management ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement class management for teachers.
- **Components**:
  - Class list view ✅
  - Class detail view ✅
  - Attendance tracking ❌
  - Activity management ❌
  - Resource sharing ❌

### Task 3: Assessment Management ❌ (PENDING)
- **Description**: Implement assessment management for teachers.
- **Components**:
  - Assessment creation
  - Grading interface
  - Feedback provision
  - Grade book

## Phase 7: Student Portal

### Task 1: Dashboard ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement the student dashboard (STUDENT/CAMPUS_STUDENT).
- **Components**:
  - Class overview ✅
  - Upcoming schedule ⚠️ (Basic implementation)
  - Recent assessments ❌
  - Academic progress ❌
- **Implementation Path**:
  - Create dashboard at `/student/dashboard/page.tsx` ✅

### Task 2: Class View ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement class view for students.
- **Components**:
  - Class list view ✅
  - Class detail view ✅
  - Activity tracking ❌
  - Resource access ❌

### Task 3: Assessment View ❌ (PENDING)
- **Description**: Implement assessment view for students.
- **Components**:
  - Assessment list
  - Submission interface
  - Grade view
  - Feedback review

## Phase 8: Cross-Portal Features

### Task 1: Calendar Management ❌ (PENDING)
- **Description**: Implement user-facing calendar management functionality.
- **Components**:
  - Personal calendar view (month, week, day)
  - Event filtering by type
  - Calendar subscription options
  - Personal event creation
  - Schedule visualization
  - Integration with academic cycles and terms
- **Implementation Path**:
  - Create calendar view at `/calendar/page.tsx`
  - Create personal event management at `/calendar/events/page.tsx`
- **API Integration**:
  - Connect to `holiday` endpoints
  - Connect to `academicCalendarEvent` endpoints
  - Connect to `personalEvent` endpoints
  - Connect to `timetable` endpoints
- **Features**:
  - Customizable views
  - Event color coding
  - Calendar sharing
  - Export to standard formats
  - Mobile-responsive design

### Task 2: Notification System ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement notification system.
- **Components**:
  - Notification center ✅
  - Real-time notifications ❌
  - Notification preferences ✅
  - Email notifications ❌

### Task 3: Messaging System ❌ (PENDING)
- **Description**: Implement messaging system.
- **Components**:
  - Conversation list
  - Message thread view
  - Message composition
  - File sharing

## Phase 9: Performance Optimization

### Task 1: Code Splitting ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement code splitting for better performance.
- **Techniques**:
  - Route-based code splitting ✅
  - Component-level code splitting ⚠️ (Basic implementation)
  - Dynamic imports ✅

### Task 2: Caching Strategy ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement caching for better performance.
- **Techniques**:
  - API response caching ✅
  - Static generation where appropriate ✅
  - Revalidation strategies ⚠️ (Basic implementation)

### Task 3: Image Optimization ✅ (COMPLETED)
- **Description**: Implement image optimization.
- **Techniques**:
  - Responsive images
  - Image compression
  - Lazy loading
  - Next.js Image component usage

## Phase 10: Testing & Quality Assurance

### Task 1: Unit Testing ⚠️ (PARTIALLY COMPLETED)
- **Description**: Implement unit tests for components and utilities.
- **Coverage**:
  - Core UI components ✅
  - Utility functions ✅
  - Hooks ⚠️ (Basic implementation)
  - Form validation ⚠️ (Basic implementation)

### Task 2: Integration Testing ❌ (PENDING)
- **Description**: Implement integration tests.
- **Coverage**:
  - API integration
  - Form submission flows
  - Authentication flows
  - Navigation flows

### Task 3: End-to-End Testing ❌ (PENDING)
- **Description**: Implement end-to-end tests.
- **Coverage**:
  - Critical user journeys
  - Cross-browser compatibility
  - Responsive design testing
  - Performance benchmarks