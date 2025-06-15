# Auth.js Migration: Breaking Changes

This document outlines the breaking changes introduced by the migration from our custom authentication system to Auth.js (formerly NextAuth.js). Please review these changes carefully to ensure a smooth transition.

## Core Changes

1. **Session Management**
   - Sessions are now managed by Auth.js instead of our custom SessionManager
   - Session data is stored in JWT tokens instead of the database
   - Session cookies are HTTP-only and managed by Auth.js

2. **Authentication Flow**
   - Login is now handled by Auth.js's `signIn` function
   - Logout is now handled by Auth.js's `signOut` function
   - Session retrieval is now handled by Auth.js's `useSession` hook or `getServerSession` function

3. **CSRF Protection**
   - CSRF protection is now handled automatically by Auth.js
   - The `csrf.ts` utility has been removed
   - No need to include CSRF tokens in forms

## API Changes

### Removed Files

The following files have been removed:

- `server/api/auth/authRouter.ts`
- `server/api/auth/login.ts`
- `utils/csrf.ts`
- `utils/session.ts`
- `components/auth/LoginForm.tsx` (replaced with Auth.js version)
- `middleware.ts` (replaced with Auth.js version)

### Updated APIs

1. **Authentication API**
   - `POST /api/auth/login` → `POST /api/auth/signin`
   - `POST /api/auth/logout` → `POST /api/auth/signout`
   - `GET /api/auth/session` → `GET /api/auth/session`

2. **TRPC Authentication**
   - `authRouter.login` has been removed (use Auth.js `signIn` instead)
   - `authRouter.logout` has been removed (use Auth.js `signOut` instead)
   - `authRouter.getSession` now uses Auth.js's `getServerSession`

## Client-Side Changes

### Hooks

1. **useAuth Hook**
   - Now uses Auth.js's `useSession` internally
   - API has changed slightly:
     - `isAuthenticated` instead of `authenticated`
     - `user` instead of `userData`
     - `isLoading` instead of `loading`

2. **Session Access**
   - Old: `const { authenticated, userData } = useAuth()`
   - New: `const { isAuthenticated, user } = useAuth()`

### Components

1. **LoginForm**
   - Now uses Auth.js's `signIn` function
   - No longer requires CSRF token

2. **ProtectedRoute**
   - Now uses Auth.js for authentication
   - Props have changed:
     - Removed `isAuthenticated` prop (handled internally)
     - Removed `userType` prop (handled internally)
     - Removed `accessScope` prop (handled internally)
     - Removed `userPermissions` prop (handled internally)

3. **AccessControl**
   - Now uses Auth.js for authentication
   - Props have changed:
     - Removed `userType` prop (handled internally)
     - Removed `accessScope` prop (handled internally)
     - Removed `userPermissions` prop (handled internally)

## Server-Side Changes

### Middleware

1. **Route Protection**
   - Now uses Auth.js's middleware
   - Configuration is in `middleware.ts`

2. **Session Access**
   - Old: `import { getSession } from '@/utils/session'`
   - New: `import { getServerSession } from 'next-auth/next'`

### TRPC Context

1. **Session Access**
   - Old: `ctx.session.userId`
   - New: `ctx.session.user.id`
   - Old: `ctx.session.userType`
   - New: `ctx.session.user.userType`

## Migration Steps for Developers

1. **Update Imports**
   - Replace `import { useAuth } from '@/hooks/useAuth'` with the new version
   - Replace `import { getSession } from '@/utils/session'` with `import { getServerSession } from 'next-auth/next'`

2. **Update Component Props**
   - Remove `isAuthenticated`, `userType`, `accessScope`, and `userPermissions` props from `ProtectedRoute` and `AccessControl`

3. **Update API Calls**
   - Replace direct calls to `/api/auth/login` with Auth.js's `signIn` function
   - Replace direct calls to `/api/auth/logout` with Auth.js's `signOut` function

4. **Update Session Access**
   - Replace `session.userId` with `session.user.id`
   - Replace `session.userType` with `session.user.userType`

5. **Update TRPC Procedures**
   - Use `protectedProcedure` for authenticated routes
   - Use `roleProtectedProcedure` for role-based routes

## Testing

1. **Mocking Auth.js Session**
   ```tsx
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

## Support

If you encounter any issues during the migration, please contact the development team for assistance. 