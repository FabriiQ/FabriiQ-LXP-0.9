# Entity Components Implementation Plan

## Overview

This document outlines the implementation plan for creating unified, role-based entity components across the application. The goal is to replace the current duplicated components with a set of shared components that adapt based on the user's role, improving code reusability, maintainability, and consistency.

## Current State

The application currently has multiple implementations of similar components across different portals:

- **System Admin Portal**: Components prefixed with "System" (e.g., SystemTeacherForm)
- **Campus Admin Portal**: Components prefixed with "Campus" (e.g., CampusStudentsContent)
- **Coordinator Portal**: Components prefixed with "Coordinator" (e.g., CoordinatorClassList)
- **Teacher Portal**: Components specific to teachers (e.g., ClassDetailView)
- **Student Portal**: Components specific to students (e.g., StudentDashboard)

This duplication leads to:
- Inconsistent user experience
- Maintenance challenges
- Code bloat
- Slower development

## Target State

We will create a unified component library with shared entity components that:

1. **Adapt based on user role**: Components will show different information and actions based on the user's role
2. **Follow mobile-first design**: All components will be optimized for mobile devices first
3. **Maintain consistent UI/UX**: Components will follow the design system
4. **Optimize for performance**: Components will be efficient and fast-loading
5. **Support accessibility**: Components will follow accessibility best practices

## Implementation Approach

### Component Structure

For each entity type (Teachers, Students, Classes, etc.), we will create a set of components following this pattern:

```
/src/components/shared/entities/{entity-type}/
├── {Entity}Card.tsx         # Card display of entity
├── {Entity}List.tsx         # List of entities with filtering
├── {Entity}Detail.tsx       # Detailed entity view
├── {Entity}Form.tsx         # Create/edit entity form
├── {Entity}Tabs.tsx         # Tab container for entity detail
├── {Entity}Actions.tsx      # Action buttons for entity
├── {Entity}Filters.tsx      # Filter controls for entity list
├── __tests__/               # Test files
└── types.ts                 # Type definitions
```

### Role-Based Rendering

Components will adapt based on the user's role:

```tsx
const TeacherCard = ({ teacher, userRole, ...props }) => {
  return (
    <Card>
      {/* Common information for all roles */}
      <CardHeader>
        <Avatar src={teacher.avatar} />
        <CardTitle>{teacher.name}</CardTitle>
      </CardHeader>
      
      {/* Role-specific information */}
      {userRole === 'SYSTEM_ADMIN' && (
        <CardContent>
          <p>Campus: {teacher.campus}</p>
          <p>System ID: {teacher.systemId}</p>
        </CardContent>
      )}
      
      {userRole === 'CAMPUS_ADMIN' && (
        <CardContent>
          <p>Subjects: {teacher.subjects.join(', ')}</p>
          <p>Classes: {teacher.classCount}</p>
        </CardContent>
      )}
      
      {/* Role-specific actions */}
      <CardFooter>
        <TeacherActions 
          teacher={teacher}
          userRole={userRole}
          enabledActions={getEnabledActionsForRole(userRole)}
        />
      </CardFooter>
    </Card>
  );
};
```

### Mobile-First Design

All components will be designed with mobile-first approach:

```tsx
const StudentList = ({ students, userRole, viewMode = 'grid', ...props }) => {
  // Responsive layout based on viewMode
  return (
    <div className="w-full">
      {/* Mobile-optimized filters */}
      <div className="lg:hidden">
        <StudentFilters 
          userRole={userRole}
          compact={true}
        />
      </div>
      
      {/* Desktop filters */}
      <div className="hidden lg:block">
        <StudentFilters 
          userRole={userRole}
          compact={false}
        />
      </div>
      
      {/* Grid or list view based on viewMode */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}>
        {students.map(student => (
          <StudentCard 
            key={student.id}
            student={student}
            userRole={userRole}
            viewMode={viewMode === 'grid' ? (isMobile ? 'compact' : 'full') : 'list'}
          />
        ))}
      </div>
    </div>
  );
};
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- Complete UI component library unification
- Implement Classes components (already in progress)
- Create shared types and utilities

### Phase 2: Core Entities (Weeks 3-6)

- Implement Teachers components
- Implement Students components
- Implement Programs components
- Implement Courses components

### Phase 3: Supporting Entities (Weeks 7-10)

- Implement Assessments & Activities components
- Implement Attendance components
- Begin integration with existing pages

### Phase 4: Analytics and Integration (Weeks 11-14)

- Implement Analytics & Reports components
- Complete integration with existing pages
- Perform testing and optimization
- Create documentation and examples

## Migration Strategy

1. **Create new components**: Implement the new unified components
2. **Integrate with existing pages**: Update pages to use the new components
3. **Test thoroughly**: Ensure functionality is preserved
4. **Remove old components**: Once all pages are migrated, remove the old components

## Testing Strategy

1. **Unit tests**: Test each component in isolation
2. **Integration tests**: Test components working together
3. **Role-based tests**: Test components with different user roles
4. **Mobile testing**: Test on various device sizes
5. **Performance testing**: Measure load time and rendering performance

## Documentation

For each entity type, we will create:
1. **Component documentation**: Props, behavior, examples
2. **Migration guide**: How to replace existing components
3. **Best practices**: Guidelines for using the components

## Resource Requirements

- **2 Senior Frontend Developers**: Lead implementation of core components
- **2 Frontend Developers**: Implement supporting components and tests
- **1 UI/UX Designer**: Ensure consistent design
- **1 QA Engineer**: Test components and integration

## Success Metrics

- **Code Reduction**: Measure reduction in lines of code
- **Component Reuse**: Track usage of shared components
- **Performance**: Measure load time and rendering performance
- **Developer Satisfaction**: Survey developers on component usability
- **User Experience**: Test with end users for consistency and usability

## Detailed Task Lists

For detailed tasks for each entity type, refer to the individual task list documents:

- [Classes Components Task List](./classes-components-tasklist.md)
- [Teachers Components Task List](./teachers-components-tasklist.md)
- [Students Components Task List](./students-components-tasklist.md)
- [Programs Components Task List](./programs-components-tasklist.md)
- [Courses Components Task List](./courses-components-tasklist.md)
- [Assessments & Activities Components Task List](./assessments-activities-components-tasklist.md)
- [Attendance Components Task List](./attendance-components-tasklist.md)
- [Analytics & Reports Components Task List](./analytics-reports-components-tasklist.md)

## Master Task List

For a comprehensive overview of all tasks, refer to the [Entity Components Master Task List](./entity-components-master-tasklist.md).

## Conclusion

By implementing this plan, we will create a unified, consistent component library that improves code reusability, maintainability, and user experience across all portals in the application. The role-based approach will ensure that each user sees the appropriate information and actions for their role, while the mobile-first design will provide a great experience on all devices.
