# Role-Based Access Control (RBAC) Documentation

This document provides an overview of the Role-Based Access Control (RBAC) system implemented in the AIVY LXP application. The RBAC system controls access to features, pages, and UI elements based on user roles, permissions, and access scopes.

## Auth.js Integration

The RBAC system now uses Auth.js (formerly NextAuth.js) for authentication and session management. This provides a more secure and maintainable authentication solution.

## Components

The RBAC system consists of the following components:

### 1. AccessControl

`AccessControl` is a component that conditionally renders content based on the user's role, access scope, and permissions. It now uses Auth.js for authentication.

#### Usage

```tsx
'use client';

import { AccessControl } from '@/components/auth/AccessControl';
import { UserType } from '@prisma/client';

// Basic usage
<AccessControl
  allowedUserTypes={[UserType.TEACHER, UserType.COORDINATOR]}
>
  <p>Only teachers and coordinators can see this content</p>
</AccessControl>

// With fallback content
<AccessControl
  allowedUserTypes={[UserType.TEACHER, UserType.COORDINATOR]}
  fallback={<p>You don't have permission to view this content</p>}
>
  <p>Only teachers and coordinators can see this content</p>
</AccessControl>

// With permissions
<AccessControl
  requiredPermissions={['edit_course']}
>
  <button>Edit Course</button>
</AccessControl>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | The content to render if the user has access |
| `allowedUserTypes` | `UserType[]` | The user types that are allowed to access the content |
| `allowedScopes` | `AccessScope[]` | The access scopes that are allowed to access the content |
| `fallback` | `React.ReactNode` | The content to render if the user doesn't have access |
| `requiredPermissions` | `string[]` | Additional permissions to check |
| `showLoading` | `boolean` | Whether to show a loading state while checking authentication |
| `loadingComponent` | `React.ReactNode` | Custom loading component |

### 2. ProtectedRoute

`ProtectedRoute` is a component that protects routes based on authentication and authorization. It now uses Auth.js for authentication.

#### Usage

```tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserType } from '@prisma/client';

// Basic usage
<ProtectedRoute
  allowedUserTypes={[UserType.TEACHER, UserType.COORDINATOR]}
>
  <TeacherDashboard />
</ProtectedRoute>

// With custom redirects
<ProtectedRoute
  allowedUserTypes={[UserType.SYSTEM_ADMIN]}
  loginRedirect="/login"
  unauthorizedRedirect="/unauthorized"
>
  <AdminPanel />
</ProtectedRoute>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | The content to render if the user is authenticated and authorized |
| `allowedUserTypes` | `UserType[]` | The user types that are allowed to access the route |
| `allowedScopes` | `AccessScope[]` | The access scopes that are allowed to access the route |
| `requiredPermissions` | `string[]` | Additional permissions to check |
| `loginRedirect` | `string` | The path to redirect to if the user is not authenticated |
| `unauthorizedRedirect` | `string` | The path to redirect to if the user is authenticated but not authorized |
| `showLoading` | `boolean` | Whether to show a loading state while checking authentication |
| `loadingComponent` | `React.ReactNode` | Custom loading component |

### 3. RoleBasedComponent

`RoleBasedComponent` is a simplified version of `AccessControl` that only checks user roles.

#### Usage

```tsx
'use client';

import RoleBasedComponent from '@/components/auth/RoleBasedComponent';
import { UserType } from '@prisma/client';

<RoleBasedComponent
  allowedRoles={[UserType.SYSTEM_ADMIN, UserType.ADMINISTRATOR]}
  fallback={<div>Access denied</div>}
>
  <div>Admin content</div>
</RoleBasedComponent>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | The content to render if the user has the required role |
| `allowedRoles` | `UserType[]` | The roles that are allowed to access the content |
| `fallback` | `React.ReactNode` | The content to render if the user doesn't have the required role |

### 4. Server-Side Authentication

For server components, you can use the `getServerSession` function from Auth.js:

```tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  // Check role
  if (session.user.userType !== 'SYSTEM_ADMIN') {
    redirect('/unauthorized');
  }
  
  return <div>Protected content</div>;
}
```

### 5. API Route Protection

API routes are protected using TRPC middleware:

```typescript
// Protected procedure - requires authentication
export const protectedProcedure = t.procedure
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

// Role-protected procedure - requires specific role
export const roleProtectedProcedure = (allowedRoles: UserType[]) => 
  protectedProcedure.use(({ ctx, next }) => {
    const userType = ctx.session.user.userType;
    
    if (!allowedRoles.includes(userType)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    return next({ ctx });
  });
```

## User Roles

The application defines the following user roles:

- `SYSTEM_ADMIN`: System administrators with full access to all features
- `SYSTEM_MANAGER`: System managers with access to system-wide settings
- `ADMINISTRATOR`: Institution administrators with access to institution settings
- `CAMPUS_ADMIN`: Campus administrators with access to campus settings
- `CAMPUS_COORDINATOR`: Campus coordinators with access to campus coordination features
- `COORDINATOR`: Coordinators with access to coordination features
- `TEACHER`: Teachers with access to teaching features
- `CAMPUS_TEACHER`: Campus-specific teachers
- `STUDENT`: Students with access to learning features
- `CAMPUS_STUDENT`: Campus-specific students
- `PARENT`: Parents with access to their children's information
- `CAMPUS_PARENT`: Campus-specific parents

## Access Scopes

Access scopes define the breadth of access a user has:

- `SINGLE_CAMPUS`: Access to a single campus
- `MULTI_CAMPUS`: Access to multiple campuses
- `ALL_CAMPUSES`: Access to all campuses

## Permissions

Permissions are fine-grained access controls that define what actions a user can perform. Permissions are stored in the database and associated with user roles.

## Authentication Flow

1. User logs in using Auth.js credentials provider
2. Auth.js creates a JWT token with user information including role
3. The token is stored in a secure HTTP-only cookie
4. On subsequent requests, the token is validated and the user's session is retrieved
5. RBAC components check the user's role and permissions to determine access

## Best Practices

1. Always use the RBAC components for access control
2. For server components, use `getServerSession` to check authentication
3. For API routes, use the protected TRPC procedures
4. Keep the role hierarchy in mind when designing access controls
5. Test access controls thoroughly to ensure they work as expected 