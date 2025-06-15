# Authentication System Revamp Plan

## Current System Analysis

The current authentication system has several issues:

1. **Overly Complex**: The system uses a custom implementation with separate session and CSRF token handling, making it error-prone and difficult to maintain.
2. **Connection Issues**: The system experiences ECONNRESET errors during login attempts.
3. **Cookie Handling Problems**: There are issues with setting cookies properly, particularly with CSRF tokens.
4. **Inconsistent Implementation**: The middleware and API routes don't seem to be in sync.
5. **Multiple Database Queries**: The login process involves multiple database operations, making it inefficient.
6. **Poor Error Handling**: Errors during authentication aren't properly caught and handled.
7. **TypeScript Errors**: There are multiple TypeScript errors in the authentication-related files.

## Files to Remove

The following files should be removed as part of the revamp:

1. `server/api/auth/authRouter.ts`
2. `server/api/auth/login.ts`
3. `utils/csrf.ts`
4. `utils/session.ts`
5. `components/auth/LoginForm.tsx`
6. `middleware.ts` (to be replaced with a new version)

## New Authentication System with Auth.js

We'll implement a new authentication system using Auth.js (formerly NextAuth.js), which is specifically designed for Next.js applications and handles most of the complexity for us.

### Benefits of Auth.js

1. **Simplified Implementation**: Auth.js handles session management, CSRF protection, and JWT handling out of the box.
2. **Built-in Security**: Secure by default with proper cookie handling and CSRF protection.
3. **Role-Based Access Control**: Easy implementation of role-based permissions.
4. **Better Error Handling**: Improved error messages and handling.
5. **Reduced Database Load**: More efficient session management.
6. **Maintainable Code**: Clearer separation of concerns and better organization.

## Implementation Plan

### Step 1: Install Dependencies

```bash
npm install next-auth@latest @auth/prisma-adapter
```

### Step 2: Create Auth.js Configuration

Create the following files:

#### 1. Auth API Route

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { UserType } from "@prisma/client";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            password: true,
            userType: true,
            status: true
          }
        });

        if (!user || user.status !== "ACTIVE") {
          console.log("[AUTH] User not found or inactive:", credentials.username);
          return null;
        }

        // In development, skip password check for mock users
        const isValidPassword = process.env.NODE_ENV === "development"
          ? true
          : await compare(credentials.password, user.password);

        if (!isValidPassword) {
          console.log("[AUTH] Invalid password for user:", credentials.username);
          return null;
        }

        // Update last login time in background
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(err => console.error("Failed to update last login time:", err));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          userType: user.userType
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user type to JWT token
      if (user) {
        token.userType = user.userType;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user type to session
      if (session.user) {
        session.user.id = token.sub;
        session.user.userType = token.userType;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  debug: process.env.NODE_ENV === "development"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 2. Auth Types

```typescript
// types/next-auth.d.ts
import "next-auth";
import { UserType } from "@prisma/client";

declare module "next-auth" {
  interface User {
    userType: UserType;
    username: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      userType: UserType;
      username: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: UserType;
    username: string;
  }
}
```

#### 3. Auth Provider

```typescript
// providers/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

#### 4. Login Form Component

```typescript
// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/dashboard");
        router.refresh(); // Refresh to update server components
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h1>Login</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
```

#### 5. Login Page

```typescript
// app/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Check if user is already logged in
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }
  
  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
}
```

#### 6. Middleware for Route Protection

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { UserType } from "@prisma/client";

// Define protected routes and their required user types
const protectedRoutes = [
  { path: "/dashboard", allowedTypes: ["SYSTEM_ADMIN", "ADMINISTRATOR", "CAMPUS_ADMIN", "TEACHER", "STUDENT"] },
  { path: "/admin", allowedTypes: ["SYSTEM_ADMIN", "ADMINISTRATOR"] },
  { path: "/system", allowedTypes: ["SYSTEM_ADMIN"] }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route.path)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Get the token
  const token = await getToken({ req: request });
  
  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check user type for specific routes
  const matchedRoute = protectedRoutes.find(route => 
    pathname.startsWith(route.path)
  );
  
  if (matchedRoute && !matchedRoute.allowedTypes.includes(token.userType as string)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/system/:path*",
    "/profile/:path*"
  ]
};
```

#### 7. Auth Utility Hooks

```typescript
// hooks/useAuth.ts
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserType } from "@prisma/client";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;
  
  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };
  
  const hasPermission = (requiredTypes: UserType[]) => {
    if (!isAuthenticated || !user) return false;
    return requiredTypes.includes(user.userType as UserType);
  };
  
  return {
    isAuthenticated,
    isLoading,
    user,
    logout,
    hasPermission
  };
}
```

#### 8. Role-Based Component

```typescript
// components/RoleBasedComponent.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { UserType } from "@prisma/client";

interface RoleBasedComponentProps {
  allowedRoles: UserType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleBasedComponent({
  allowedRoles,
  children,
  fallback = null
}: RoleBasedComponentProps) {
  const { hasPermission, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!hasPermission(allowedRoles)) {
    return fallback;
  }
  
  return <>{children}</>;
}
```

#### 9. Update Root Layout

```typescript
// app/layout.tsx
import { AuthProvider } from "@/providers/AuthProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Step 3: Update Dashboard and Sidebar Components

#### 1. Dashboard Component

```typescript
// components/Dashboard/Dashboard.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardContent from "@/components/Dashboard/DashboardContent";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }
  
  return (
    <div className="dashboard-container">
      <Sidebar userType={session.user.userType} />
      <div className="main-content">
        <DashboardHeader user={session.user} />
        <DashboardContent userType={session.user.userType} />
      </div>
    </div>
  );
}
```

#### 2. Sidebar Component

```typescript
// components/Sidebar.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { UserType } from "@prisma/client";

// Define menu items with role-based access
const menuItems = [
  { 
    label: "Dashboard", 
    path: "/dashboard", 
    roles: [
      "SYSTEM_ADMIN", 
      "SYSTEM_MANAGER", 
      "ADMINISTRATOR", 
      "CAMPUS_ADMIN", 
      "CAMPUS_COORDINATOR", 
      "COORDINATOR", 
      "TEACHER", 
      "CAMPUS_TEACHER", 
      "STUDENT", 
      "CAMPUS_STUDENT"
    ] as UserType[]
  },
  { 
    label: "User Management", 
    path: "/admin/users", 
    roles: ["SYSTEM_ADMIN", "ADMINISTRATOR", "CAMPUS_ADMIN"] as UserType[]
  },
  { 
    label: "System Settings", 
    path: "/system/settings", 
    roles: ["SYSTEM_ADMIN"] as UserType[]
  },
  { 
    label: "Profile", 
    path: "/profile", 
    roles: [
      "SYSTEM_ADMIN", 
      "SYSTEM_MANAGER", 
      "ADMINISTRATOR", 
      "CAMPUS_ADMIN", 
      "CAMPUS_COORDINATOR", 
      "COORDINATOR", 
      "TEACHER", 
      "CAMPUS_TEACHER", 
      "STUDENT", 
      "CAMPUS_STUDENT"
    ] as UserType[]
  }
];

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="sidebar">
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.userType}</p>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            hasPermission(item.roles) && (
              <li key={item.path}>
                <Link href={item.path}>{item.label}</Link>
              </li>
            )
          ))}
        </ul>
      </nav>
    </div>
  );
}
```

### Step 4: Create Prisma Client Instance

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Step 5: Create Unauthorized Page

```typescript
// app/unauthorized/page.tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link href="/dashboard">
        Return to Dashboard
      </Link>
    </div>
  );
}
```

## Migration Tasks

1. **Backup Current Code**: Make a backup of all authentication-related files before making changes.
2. **Install Dependencies**: Install Auth.js and the Prisma adapter.
3. **Create New Files**: Create all the files outlined in the implementation plan.
4. **Update Imports**: Update imports in existing files that reference the old authentication system.
5. **Test Authentication Flow**: Test the login, session management, and role-based access control.
6. **Remove Old Files**: Once the new system is working, remove the old authentication files.

## Testing Plan

1. **Login Flow**: Test successful login and failed login scenarios.
2. **Session Management**: Verify that sessions persist correctly and expire as expected.
3. **Role-Based Access**: Test that different user types can only access their permitted routes.
4. **Error Handling**: Verify that authentication errors are handled gracefully.
5. **Logout Flow**: Test that logout works correctly and clears the session.

## Rollback Plan

In case of issues with the new authentication system:

1. **Restore Backup**: Restore the backed-up authentication files.
2. **Revert Dependencies**: Remove Auth.js and related dependencies.
3. **Revert Imports**: Restore original imports in affected files.

## Important Notes

1. **TRPC Integration**: 
   - Current implementation uses TRPC-based authentication
   - Need to update TRPC routes to work with Auth.js
   - Update error handling to match Auth.js patterns

2. **Role-Based Access**:
   - Current RBAC system needs to be adapted to work with Auth.js
   - Update `src/components/auth/RBAC_DOCUMENTATION.md`
   - Migrate existing role checks to Auth.js session-based checks

3. **Development Mode**:
   - Remove custom dev authentication mode
   - Use Auth.js development features instead
   - Update `scripts/dev-auth.js` or remove if unnecessary

4. **Testing Updates**:
   - Update test suites to use Auth.js mocking
   - Add new tests for Auth.js specific features

## Conclusion

This authentication revamp will significantly simplify the login process, improve security, and make the codebase more maintainable. By leveraging Auth.js, we'll benefit from a battle-tested authentication solution that handles most of the complexity for us, allowing us to focus on building the application's core features. 