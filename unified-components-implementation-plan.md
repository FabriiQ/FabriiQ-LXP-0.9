# Unified Components Implementation Plan

## Introduction

This document outlines the detailed implementation plan for creating a unified component library that can be used across all portals in our application. The goal is to reduce code duplication, improve maintainability, and ensure a consistent user experience.

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Create Component Architecture

**Directory Structure:**
```
/src/components/shared/
├── core/
│   ├── RoleBasedComponent.tsx
│   ├── PermissionGuard.tsx
│   ├── ResponsiveWrapper.tsx
│   └── EntityContext.tsx
├── hooks/
│   ├── useRolePermissions.tsx
│   ├── useEntityData.tsx
│   └── useResponsiveLayout.tsx
└── types/
    ├── roles.ts
    ├── permissions.ts
    └── entities.ts
```

**Key Components:**

1. `RoleBasedComponent.tsx`:
   ```typescript
   interface RoleBasedComponentProps {
     children: React.ReactNode;
     allowedRoles: UserRole[];
     fallback?: React.ReactNode;
   }
   
   export function RoleBasedComponent({ 
     children, 
     allowedRoles, 
     fallback = null 
   }: RoleBasedComponentProps) {
     const { userRole } = useUserRole();
     
     if (allowedRoles.includes(userRole)) {
       return <>{children}</>;
     }
     
     return <>{fallback}</>;
   }
   ```

2. `PermissionGuard.tsx`:
   ```typescript
   interface PermissionGuardProps {
     children: React.ReactNode;
     requiredPermissions: Permission[];
     entity?: Entity;
     fallback?: React.ReactNode;
   }
   
   export function PermissionGuard({
     children,
     requiredPermissions,
     entity,
     fallback = null
   }: PermissionGuardProps) {
     const { hasPermissions } = usePermissions(entity);
     
     if (hasPermissions(requiredPermissions)) {
       return <>{children}</>;
     }
     
     return <>{fallback}</>;
   }
   ```

#### 1.2 Create Base Entity Components

For each entity type (Teacher, Student, Class, etc.), create base components:

1. `EntityCard.tsx`:
   ```typescript
   interface EntityCardProps<T> {
     data: T;
     userRole: UserRole;
     viewMode?: 'full' | 'compact' | 'mobile';
     actions?: Action[];
     onAction?: (action: Action, data: T) => void;
   }
   
   export function EntityCard<T>({
     data,
     userRole,
     viewMode = 'full',
     actions = [],
     onAction
   }: EntityCardProps<T>) {
     // Implementation
   }
   ```

2. `EntityList.tsx`:
   ```typescript
   interface EntityListProps<T> {
     data: T[];
     userRole: UserRole;
     viewMode?: 'table' | 'grid' | 'mobile';
     columns: Column[];
     filters?: Filter[];
     onFilterChange?: (filters: Filter[]) => void;
     onAction?: (action: Action, item: T) => void;
   }
   
   export function EntityList<T>({
     data,
     userRole,
     viewMode = 'table',
     columns,
     filters = [],
     onFilterChange,
     onAction
   }: EntityListProps<T>) {
     // Implementation
   }
   ```

### Phase 2: Entity-Specific Components (Weeks 3-6)

#### 2.1 Teacher Components

1. `TeacherCard.tsx`:
   ```typescript
   import { EntityCard } from '../core/EntityCard';
   
   interface TeacherCardProps {
     teacher: Teacher;
     userRole: UserRole;
     viewMode?: 'full' | 'compact' | 'mobile';
     actions?: TeacherAction[];
     onAction?: (action: TeacherAction, teacher: Teacher) => void;
   }
   
   export function TeacherCard({
     teacher,
     userRole,
     viewMode = 'full',
     actions = [],
     onAction
   }: TeacherCardProps) {
     // Get role-specific configuration
     const config = getTeacherCardConfig(userRole);
     
     return (
       <EntityCard
         data={teacher}
         userRole={userRole}
         viewMode={viewMode}
         actions={filterActionsByRole(actions, userRole)}
         onAction={onAction}
         renderContent={(teacher) => (
           <>
             {/* Role-specific teacher card content */}
             <RoleBasedComponent allowedRoles={['SYSTEM_ADMIN', 'CAMPUS_ADMIN']}>
               {/* Admin-only content */}
             </RoleBasedComponent>
             
             {/* Common content for all roles */}
           </>
         )}
       />
     );
   }
   ```

2. `TeacherList.tsx`:
   ```typescript
   import { EntityList } from '../core/EntityList';
   
   interface TeacherListProps {
     teachers: Teacher[];
     userRole: UserRole;
     viewMode?: 'table' | 'grid' | 'mobile';
     filters?: TeacherFilter[];
     onFilterChange?: (filters: TeacherFilter[]) => void;
     onAction?: (action: TeacherAction, teacher: Teacher) => void;
   }
   
   export function TeacherList({
     teachers,
     userRole,
     viewMode = 'table',
     filters = [],
     onFilterChange,
     onAction
   }: TeacherListProps) {
     // Get role-specific columns
     const columns = getTeacherColumnsForRole(userRole);
     
     return (
       <EntityList
         data={teachers}
         userRole={userRole}
         viewMode={viewMode}
         columns={columns}
         filters={filters}
         onFilterChange={onFilterChange}
         onAction={onAction}
       />
     );
   }
   ```

3. `TeacherProfile.tsx`:
   ```typescript
   interface TeacherProfileProps {
     teacher: Teacher;
     userRole: UserRole;
     activeTab?: string;
     onTabChange?: (tab: string) => void;
   }
   
   export function TeacherProfile({
     teacher,
     userRole,
     activeTab = 'overview',
     onTabChange
   }: TeacherProfileProps) {
     // Get tabs available for this role
     const tabs = getTeacherTabsForRole(userRole);
     
     return (
       <div className="space-y-6">
         <TeacherProfileHeader teacher={teacher} userRole={userRole} />
         
         <Tabs value={activeTab} onValueChange={onTabChange}>
           <TabsList>
             {tabs.map(tab => (
               <TabsTrigger key={tab.id} value={tab.id}>
                 {tab.label}
               </TabsTrigger>
             ))}
           </TabsList>
           
           {tabs.map(tab => (
             <TabsContent key={tab.id} value={tab.id}>
               {tab.content(teacher, userRole)}
             </TabsContent>
           ))}
         </Tabs>
       </div>
     );
   }
   ```

#### 2.2 Student Components

Follow similar patterns as teacher components, adapting for student-specific needs.

#### 2.3 Class Components

Follow similar patterns as teacher components, adapting for class-specific needs.

#### 2.4 Assessment & Activity Components

Follow similar patterns as teacher components, adapting for assessment and activity-specific needs.

#### 2.5 Subject & Curriculum Components

Follow similar patterns as teacher components, adapting for subject and curriculum-specific needs.

### Phase 3: Portal Integration (Weeks 7-10)

#### 3.1 Create Portal-Specific Wrappers

For each portal, create wrapper components that use the shared components but add portal-specific functionality:

```typescript
// Example for Teacher Portal
export function TeacherPortalClassList({ classId }: { classId: string }) {
  const { data: classes, isLoading } = api.teacher.getClasses.useQuery({ classId });
  const { userRole } = useUserRole();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <ClassList
      classes={classes}
      userRole={userRole}
      viewMode="grid"
      onAction={(action, classData) => {
        // Teacher portal specific action handling
      }}
    />
  );
}
```

#### 3.2 Integrate with Existing Pages

Replace existing components in each portal with the new unified components:

```typescript
// Before
import { TeacherGrid } from '@/components/coordinator/TeacherGrid';

// After
import { TeacherList } from '@/components/shared/entities/teachers/TeacherList';
```

#### 3.3 Test and Refine

For each portal:
1. Implement the changes in a feature branch
2. Test thoroughly
3. Address any issues
4. Merge to main branch

### Phase 4: Advanced Features & Optimization (Weeks 11-12)

#### 4.1 Implement Advanced Role-Based Features

1. Create a permission system that allows for fine-grained control:
   ```typescript
   const permissionMatrix = {
     'SYSTEM_ADMIN': {
       'teacher': ['view', 'create', 'edit', 'delete', 'assign'],
       'student': ['view', 'create', 'edit', 'delete', 'enroll'],
       // ...
     },
     'CAMPUS_ADMIN': {
       'teacher': ['view', 'create', 'edit', 'assign'],
       'student': ['view', 'create', 'edit', 'enroll'],
       // ...
     },
     // ...
   };
   ```

2. Implement context-aware rendering:
   ```typescript
   function useContextAwarePermissions(entity: Entity, context?: Context) {
     const { userRole } = useUserRole();
     const basePermissions = permissionMatrix[userRole][entity];
     
     // Modify permissions based on context
     if (context === 'own-class' && userRole === 'TEACHER') {
       return [...basePermissions, 'grade', 'take-attendance'];
     }
     
     return basePermissions;
   }
   ```

#### 4.2 Performance Optimization

1. Implement code splitting for shared components:
   ```typescript
   const TeacherProfile = React.lazy(() => import('@/components/shared/entities/teachers/TeacherProfile'));
   
   function TeacherProfilePage() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <TeacherProfile ... />
       </Suspense>
     );
   }
   ```

2. Optimize data fetching with SWR or React Query:
   ```typescript
   function useTeacherData(teacherId: string, options?: {
     includeClasses?: boolean;
     includeSubjects?: boolean;
   }) {
     const queryKey = ['teacher', teacherId, options];
     
     return useQuery(queryKey, () => 
       api.teacher.getTeacherData.fetch({ 
         teacherId, 
         ...options 
       })
     );
   }
   ```

## Migration Strategy

### 1. Entity-by-Entity Approach

1. Start with one entity type (e.g., Teachers)
2. Create all shared components for that entity
3. Migrate one portal at a time
4. Test thoroughly before moving to the next entity

### 2. Feature Flag Implementation

```typescript
// In component
{featureFlags.useUnifiedTeacherComponents ? (
  <TeacherList ... />
) : (
  <LegacyTeacherGrid ... />
)}

// In configuration
const featureFlags = {
  useUnifiedTeacherComponents: process.env.NEXT_PUBLIC_USE_UNIFIED_TEACHER_COMPONENTS === 'true',
  // ...
};
```

### 3. Documentation

1. Create comprehensive documentation for each shared component
2. Include usage examples for different roles
3. Document migration steps for developers

## Testing Strategy

1. **Unit Tests**: Test each shared component in isolation
2. **Integration Tests**: Test components working together
3. **Role-Based Tests**: Test components with different user roles
4. **Visual Regression Tests**: Ensure UI remains consistent
5. **Performance Tests**: Measure impact on load times and bundle size

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | Foundation | Create component architecture, base components |
| 3-4 | Teacher Components | Implement teacher-specific components |
| 5-6 | Student & Class Components | Implement student and class components |
| 7-8 | Assessment & Subject Components | Implement assessment and subject components |
| 9-10 | Portal Integration | Integrate with Teacher and Coordinator portals |
| 11-12 | Portal Integration | Integrate with Campus and System Admin portals |
| 13-14 | Advanced Features | Implement advanced role-based features |
| 15-16 | Optimization | Performance optimization and final testing |

## Success Metrics

1. **Code Reduction**: Measure reduction in lines of code
2. **Bundle Size**: Monitor impact on bundle size
3. **Development Speed**: Track time to implement new features
4. **Bug Reduction**: Monitor bugs related to UI inconsistencies
5. **Developer Satisfaction**: Survey developers on component usability

## Conclusion

This implementation plan provides a structured approach to creating a unified component library that can be used across all portals. By following this plan, we can reduce code duplication, improve maintainability, and ensure a consistent user experience while respecting the specific needs of each user role.
