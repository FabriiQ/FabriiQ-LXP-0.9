# Auth.js Migration Documentation

This document outlines the migration from our custom authentication system to Auth.js (formerly NextAuth.js).

## Overview

We've migrated from a custom session-based authentication system to Auth.js, which provides a more robust, secure, and maintainable authentication solution for Next.js applications.

## Benefits of Auth.js

1. **Simplified Authentication**: Auth.js handles session management, CSRF protection, and JWT handling out of the box.
2. **Improved Security**: Better cookie handling and CSRF protection.
3. **Role-Based Access Control**: Easier implementation of role-based permissions.
4. **Better Error Handling**: Improved error messages and handling.
5. **Reduced Database Load**: More efficient session management.
6. **Maintainable Code**: Clearer separation of concerns and better organization.

## Key Components

### 1. Auth.js Configuration

The core Auth.js configuration is located in:
```
src/app/api/auth/[...nextauth]/route.ts
```

This file sets up:
- Credentials provider for username/password authentication
- JWT session strategy
- Custom callbacks for user type and role-based access

### 2. Type Definitions

Extended Auth.js types are defined in:
```
src/types/next-auth.d.ts
```

These types extend the default Auth.js types to include our custom user properties like `userType`.

### 3. Auth Provider

The Auth Provider component wraps the application to provide authentication context:
```
src/providers/AuthProvider.tsx
```

### 4. Authentication Hook

The `useAuth` hook provides a consistent API for authentication:
```
src/hooks/useAuth.ts
```

### 5. Role-Based Components

Components for conditional rendering based on user roles:
```
src/components/auth/RoleBasedComponent.tsx
src/components/auth/AccessControl.tsx
src/components/auth/ProtectedRoute.tsx
```

### 6. Middleware

The middleware protects routes based on user roles:
```
src/middleware.ts
```

## Usage Examples

### 1. Checking Authentication Status

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.name}!</div>;
}
```

### 2. Role-Based Access Control

```tsx
import RoleBasedComponent from '@/components/auth/RoleBasedComponent';
import { UserType } from '@prisma/client';

export default function AdminPage() {
  return (
    <RoleBasedComponent 
      allowedRoles={[UserType.SYSTEM_ADMIN, UserType.ADMINISTRATOR]}
      fallback={<div>Access denied</div>}
    >
      <div>Admin content</div>
    </RoleBasedComponent>
  );
}
```

### 3. Protected Routes

```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserType } from '@prisma/client';

export default function TeacherDashboard() {
  return (
    <ProtectedRoute 
      allowedUserTypes={[UserType.TEACHER, UserType.CAMPUS_TEACHER]}
      loginRedirect="/login"
      unauthorizedRedirect="/unauthorized"
    >
      <div>Teacher dashboard content</div>
    </ProtectedRoute>
  );
}
```

### 4. Conditional Rendering with AccessControl

```tsx
import AccessControl from '@/components/auth/AccessControl';
import { UserType } from '@prisma/client';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Content visible to all users */}
      <div>Common content</div>
      
      {/* Content visible only to admins */}
      <AccessControl allowedUserTypes={[UserType.SYSTEM_ADMIN, UserType.ADMINISTRATOR]}>
        <div>Admin-only content</div>
      </AccessControl>
      
      {/* Content visible only to teachers */}
      <AccessControl allowedUserTypes={[UserType.TEACHER, UserType.CAMPUS_TEACHER]}>
        <div>Teacher-only content</div>
      </AccessControl>
    </div>
  );
}
```

### 5. Server-Side Authentication Check

```tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

## TRPC Integration

Auth.js is integrated with TRPC to provide authenticated API routes:

```typescript
// src/server/api/trpc.ts

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

export const roleProtectedProcedure = (allowedRoles: UserType[]) => 
  protectedProcedure.use(({ ctx, next }) => {
    const userType = ctx.session.user.userType;
    
    if (!allowedRoles.includes(userType)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    return next({ ctx });
  });
```

## Testing

When testing components that use Auth.js, you can mock the session:

```tsx
// In your test file
import { SessionProvider } from 'next-auth/react';

const mockSession = {
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    userType: 'SYSTEM_ADMIN'
  }
};

// Wrap your component with SessionProvider
const wrapper = ({ children }) => (
  <SessionProvider session={mockSession}>
    {children}
  </SessionProvider>
);

// Use the wrapper in your tests
render(<YourComponent />, { wrapper });
```

## Troubleshooting

### 1. Session Not Persisting

If the session is not persisting between page refreshes, check:
- The `NEXTAUTH_SECRET` environment variable is set
- The `NEXTAUTH_URL` environment variable is set in production
- Cookies are being properly set (check browser dev tools)

### 2. Role-Based Access Not Working

If role-based access is not working correctly:
- Verify the user's role is correctly set in the JWT token
- Check the `jwt` callback in the Auth.js configuration
- Ensure the `session` callback is correctly adding the role to the session

### 3. API Routes Not Authenticating

If API routes are not authenticating:
- Check that the TRPC context is correctly getting the session
- Verify that protected procedures are being used for protected routes
- Check for any CORS issues if calling from a different domain 