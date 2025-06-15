# Institution-Based URL Implementation Task List

This document provides a detailed, step-by-step task list for implementing institution-based URLs in the application. Following these tasks in order will ensure a smooth transition to the new URL structure without conflicts or errors.

## Phase 1: Foundation (Weeks 1-2)

### 1. Create Institution Context Provider
- [ ] **Task 1.1:** Create `InstitutionProvider` component
  ```typescript
  // src/providers/InstitutionProvider.tsx
  'use client';
  
  import { createContext, useContext, ReactNode } from 'react';
  
  interface InstitutionContextType {
    institutionId: string;
    isLoading: boolean;
  }
  
  const InstitutionContext = createContext<InstitutionContextType | null>(null);
  
  export function InstitutionProvider({
    institutionId,
    children,
  }: {
    institutionId: string;
    children: ReactNode;
  }) {
    return (
      <InstitutionContext.Provider value={{ institutionId, isLoading: false }}>
        {children}
      </InstitutionContext.Provider>
    );
  }
  
  export function useInstitution() {
    const context = useContext(InstitutionContext);
    if (!context) {
      throw new Error('useInstitution must be used within an InstitutionProvider');
    }
    return context;
  }
  ```

- [ ] **Task 1.2:** Create institution validation utility
  ```typescript
  // src/lib/institution.ts
  import { prisma } from '@/lib/prisma';
  import { cache } from 'react';
  
  export const getInstitution = cache(async (institutionId: string) => {
    return prisma.institution.findUnique({
      where: { id: institutionId, status: 'ACTIVE' },
    });
  });
  
  export async function validateInstitutionAccess(institutionId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { institutionId: true, userType: true },
    });
    
    return user?.institutionId === institutionId || user?.userType === 'SYSTEM_ADMIN';
  }
  ```

### 2. Create Institution Layout Wrapper
- [ ] **Task 2.1:** Create institution layout file
  ```typescript
  // src/app/[institutionId]/layout.tsx
  import { InstitutionProvider } from '@/providers/InstitutionProvider';
  import { getInstitution } from '@/lib/institution';
  import { notFound } from 'next/navigation';
  
  export default async function InstitutionLayout({
    params: { institutionId },
    children,
  }: {
    params: { institutionId: string };
    children: React.ReactNode;
  }) {
    // Verify institution exists and is active
    const institution = await getInstitution(institutionId);
    
    if (!institution) {
      notFound();
    }
    
    return (
      <InstitutionProvider institutionId={institutionId}>
        {children}
      </InstitutionProvider>
    );
  }
  ```

### 3. Create Institution-Aware Components
- [ ] **Task 3.1:** Create institution-aware Link component
  ```typescript
  // src/components/ui/institution-link.tsx
  'use client';
  
  import Link from 'next/link';
  import { useInstitution } from '@/providers/InstitutionProvider';
  import { LinkProps } from 'next/link';
  
  export function InstitutionLink({
    href,
    children,
    ...props
  }: LinkProps & { href: string; children: React.ReactNode }) {
    const { institutionId } = useInstitution();
    
    // Only prepend institutionId if href starts with / and doesn't already include institutionId
    const finalHref = href.startsWith('/') && !href.startsWith(`/${institutionId}`)
      ? `/${institutionId}${href}`
      : href;
    
    return (
      <Link href={finalHref} {...props}>
        {children}
      </Link>
    );
  }
  ```

- [ ] **Task 3.2:** Create institution selector component
  ```typescript
  // src/components/ui/institution-selector.tsx
  'use client';
  
  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { useSession } from 'next-auth/react';
  import { useInstitution } from '@/providers/InstitutionProvider';
  import { Select } from '@/components/ui/select';
  
  export function InstitutionSelector() {
    const { data: session } = useSession();
    const { institutionId } = useInstitution();
    const router = useRouter();
    const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
    
    useEffect(() => {
      // Fetch user's accessible institutions
      if (session?.user) {
        fetch('/api/institutions/accessible')
          .then(res => res.json())
          .then(data => setInstitutions(data));
      }
    }, [session]);
    
    const handleInstitutionChange = (value: string) => {
      // Get current path without institutionId
      const currentPath = window.location.pathname;
      const pathWithoutInstitution = currentPath.replace(`/${institutionId}`, '');
      
      // Navigate to same path but with new institution
      router.push(`/${value}${pathWithoutInstitution || '/'}`);
    };
    
    if (institutions.length <= 1) return null;
    
    return (
      <Select
        value={institutionId}
        onValueChange={handleInstitutionChange}
        items={institutions.map(inst => ({
          value: inst.id,
          label: inst.name,
        }))}
      />
    );
  }
  ```

### 4. Update Authentication System
- [ ] **Task 4.1:** Update Auth.js configuration
  ```typescript
  // src/app/api/auth/[...nextauth]/route.ts
  import { NextAuthOptions } from 'next-auth';
  import { prisma } from '@/lib/prisma';
  
  export const authOptions: NextAuthOptions = {
    // ... existing config
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.institutionId = user.institutionId;
          token.userType = user.userType;
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.institutionId = token.institutionId as string;
          session.user.userType = token.userType as string;
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        // Handle internal URLs
        if (url.startsWith('/')) {
          const token = await fetch(`${baseUrl}/api/auth/session`).then(res => res.json());
          const institutionId = token?.user?.institutionId;
          
          // If we have an institution ID and the URL doesn't already include it
          if (institutionId && !url.startsWith(`/${institutionId}`)) {
            return `${baseUrl}/${institutionId}${url}`;
          }
        }
        
        // Default behavior for external URLs
        if (url.startsWith('http')) return url;
        return baseUrl;
      },
    },
    // ... rest of config
  };
  ```

- [ ] **Task 4.2:** Create institution middleware
  ```typescript
  // src/middleware.ts
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';
  import { getToken } from 'next-auth/jwt';
  
  export async function middleware(request: NextRequest) {
    // Get the pathname from the URL
    const pathname = request.nextUrl.pathname;
    
    // Skip middleware for API routes, public assets, etc.
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static')
    ) {
      return NextResponse.next();
    }
    
    // Get the institution ID from the URL
    const institutionId = pathname.split('/')[1];
    
    // If no institution ID, redirect to default institution
    if (!institutionId) {
      const defaultInstitution = process.env.DEFAULT_INSTITUTION || 'main';
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultInstitution}${pathname}`;
      return NextResponse.redirect(url);
    }
    
    // Get the user's session
    const token = await getToken({ req: request });
    
    // If user is authenticated, check if they have access to this institution
    if (token) {
      const userInstitutionId = token.institutionId as string;
      const userType = token.userType as string;
      
      // Allow system admins to access any institution
      if (userType !== 'SYSTEM_ADMIN' && userInstitutionId !== institutionId) {
        // Redirect to user's institution
        const url = request.nextUrl.clone();
        url.pathname = `/${userInstitutionId}/unauthorized`;
        return NextResponse.redirect(url);
      }
    }
    
    return NextResponse.next();
  }
  
  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  };
  ```

## Phase 2: Core Updates (Weeks 3-5)

### 5. Update tRPC Context and Routers
- [ ] **Task 5.1:** Update tRPC context
  ```typescript
  // src/server/api/trpc.ts
  import { getServerSession } from 'next-auth';
  import { authOptions } from '@/app/api/auth/[...nextauth]/route';
  
  export const createTRPCContext = async (opts: CreateNextContextOptions) => {
    const { req, res } = opts;
    const session = await getServerSession(req, res, authOptions);
    
    // Extract institutionId from URL
    // URL pattern: /{institutionId}/api/trpc/...
    const urlParts = req.url?.split('/') || [];
    const institutionId = urlParts.length > 1 ? urlParts[1] : null;
    
    return {
      prisma,
      session,
      institutionId,
      req,
      res,
    };
  };
  
  // Create middleware to validate institution access
  const enforceInstitutionAccess = t.middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    // Skip validation for system admins
    if (ctx.session.user.userType === 'SYSTEM_ADMIN') {
      return next();
    }
    
    // Validate institution access
    if (ctx.session.user.institutionId !== ctx.institutionId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this institution',
      });
    }
    
    return next();
  });
  
  export const protectedProcedure = t.procedure
    .use(isAuthed)
    .use(enforceInstitutionAccess);
  ```

- [ ] **Task 5.2:** Update API routes
  ```typescript
  // src/app/api/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { getServerSession } from 'next-auth';
  import { authOptions } from '@/app/api/auth/[...nextauth]/route';
  import { validateInstitutionAccess } from '@/lib/institution';
  
  export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract institutionId from URL
    const pathname = req.nextUrl.pathname;
    const institutionId = pathname.split('/')[1];
    
    // Validate institution access
    const hasAccess = await validateInstitutionAccess(
      institutionId,
      session.user.id
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this institution' },
        { status: 403 }
      );
    }
    
    // Continue with API logic
    // ...
  }
  ```

### 6. Update Navigation Components
- [ ] **Task 6.1:** Update main navigation
  ```typescript
  // src/components/layout/navigation.tsx
  'use client';
  
  import { useSession } from 'next-auth/react';
  import { useInstitution } from '@/providers/InstitutionProvider';
  import { InstitutionLink } from '@/components/ui/institution-link';
  
  export function Navigation() {
    const { data: session } = useSession();
    const { institutionId } = useInstitution();
    const userType = session?.user?.userType;
    
    // Define navigation items based on user type
    const getNavigationItems = () => {
      switch (userType) {
        case 'SYSTEM_ADMIN':
          return [
            { href: '/admin/system', label: 'Dashboard' },
            { href: '/admin/institutions', label: 'Institutions' },
            // ...other items
          ];
        case 'CAMPUS_ADMIN':
          return [
            { href: '/admin/campus', label: 'Dashboard' },
            // ...other items
          ];
        case 'TEACHER':
          return [
            { href: '/teacher/dashboard', label: 'Dashboard' },
            // ...other items
          ];
        // ...other user types
        default:
          return [];
      }
    };
    
    const navigationItems = getNavigationItems();
    
    return (
      <nav>
        <ul className="flex space-x-4">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <InstitutionLink href={item.href}>
                {item.label}
              </InstitutionLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  ```

- [ ] **Task 6.2:** Update sidebar
  ```typescript
  // src/components/layout/sidebar.tsx
  'use client';
  
  import { useInstitution } from '@/providers/InstitutionProvider';
  import { InstitutionLink } from '@/components/ui/institution-link';
  import { InstitutionSelector } from '@/components/ui/institution-selector';
  
  export function Sidebar() {
    const { institutionId } = useInstitution();
    
    return (
      <div className="sidebar">
        <div className="p-4">
          <InstitutionSelector />
        </div>
        
        {/* Rest of sidebar content */}
        {/* Use InstitutionLink for all links */}
      </div>
    );
  }
  ```

## Phase 3: Migration (Weeks 6-8)

### 7. Create New Route Structure
- [ ] **Task 7.1:** Create base institution routes
  ```
  /src/app/[institutionId]/page.tsx
  /src/app/[institutionId]/layout.tsx
  ```

- [ ] **Task 7.2:** Create auth routes
  ```
  /src/app/[institutionId]/(auth)/login/page.tsx
  /src/app/[institutionId]/(auth)/register/page.tsx
  /src/app/[institutionId]/(auth)/layout.tsx
  ```

- [ ] **Task 7.3:** Create dashboard routes
  ```
  /src/app/[institutionId]/(dashboard)/page.tsx
  /src/app/[institutionId]/(dashboard)/layout.tsx
  ```

- [ ] **Task 7.4:** Create admin routes
  ```
  /src/app/[institutionId]/admin/system/page.tsx
  /src/app/[institutionId]/admin/campus/page.tsx
  /src/app/[institutionId]/admin/layout.tsx
  ```

- [ ] **Task 7.5:** Create teacher routes
  ```
  /src/app/[institutionId]/teacher/dashboard/page.tsx
  /src/app/[institutionId]/teacher/layout.tsx
  ```

- [ ] **Task 7.6:** Create student routes
  ```
  /src/app/[institutionId]/student/dashboard/page.tsx
  /src/app/[institutionId]/student/layout.tsx
  ```

### 8. Migrate Existing Components
- [ ] **Task 8.1:** Update page components to use institution context
  - For each page component, update to use the institution context
  - Replace direct API calls with institution-aware calls
  - Update form submissions to include institution context

- [ ] **Task 8.2:** Update data fetching in server components
  ```typescript
  // Example server component with institution context
  // src/app/[institutionId]/admin/campus/page.tsx
  import { getInstitution } from '@/lib/institution';
  import { prisma } from '@/lib/prisma';
  
  export default async function CampusAdminPage({
    params: { institutionId },
  }: {
    params: { institutionId: string };
  }) {
    // Fetch data with institution context
    const campuses = await prisma.campus.findMany({
      where: { institutionId },
    });
    
    return (
      <div>
        <h1>Campus Administration</h1>
        {/* Render campuses */}
      </div>
    );
  }
  ```

### 9. Update RBAC Integration
- [ ] **Task 9.1:** Update ProtectedRoute component
  ```typescript
  // src/components/auth/protected-route.tsx
  'use client';
  
  import { useSession } from 'next-auth/react';
  import { useRouter } from 'next/navigation';
  import { useInstitution } from '@/providers/InstitutionProvider';
  
  export function ProtectedRoute({
    children,
    requiredPermissions = [],
    requiredUserTypes = [],
  }: {
    children: React.ReactNode;
    requiredPermissions?: string[];
    requiredUserTypes?: string[];
  }) {
    const { data: session, status } = useSession();
    const { institutionId } = useInstitution();
    const router = useRouter();
    
    // Check if user is authenticated
    if (status === 'loading') {
      return <div>Loading...</div>;
    }
    
    if (!session) {
      router.push(`/${institutionId}/login`);
      return null;
    }
    
    // Check if user has access to this institution
    if (session.user.institutionId !== institutionId && session.user.userType !== 'SYSTEM_ADMIN') {
      router.push(`/${session.user.institutionId}/unauthorized`);
      return null;
    }
    
    // Check user type
    if (requiredUserTypes.length > 0 && !requiredUserTypes.includes(session.user.userType)) {
      router.push(`/${institutionId}/unauthorized`);
      return null;
    }
    
    // Check permissions (would need to fetch from API or session)
    // ...
    
    return <>{children}</>;
  }
  ```

- [ ] **Task 9.2:** Update AccessControl component
  ```typescript
  // src/components/auth/access-control.tsx
  'use client';
  
  import { useSession } from 'next-auth/react';
  import { useInstitution } from '@/providers/InstitutionProvider';
  
  export function AccessControl({
    children,
    requiredPermissions = [],
    requiredUserTypes = [],
    fallback = null,
  }: {
    children: React.ReactNode;
    requiredPermissions?: string[];
    requiredUserTypes?: string[];
    fallback?: React.ReactNode;
  }) {
    const { data: session } = useSession();
    const { institutionId } = useInstitution();
    
    if (!session) {
      return fallback;
    }
    
    // Check if user has access to this institution
    if (session.user.institutionId !== institutionId && session.user.userType !== 'SYSTEM_ADMIN') {
      return fallback;
    }
    
    // Check user type
    if (requiredUserTypes.length > 0 && !requiredUserTypes.includes(session.user.userType)) {
      return fallback;
    }
    
    // Check permissions (would need to fetch from API or session)
    // ...
    
    return <>{children}</>;
  }
  ```

## Phase 4: Validation and Testing (Weeks 9-10)

### 10. Create Test Suite
- [ ] **Task 10.1:** Create institution validation tests
  ```typescript
  // src/__tests__/institution-validation.test.ts
  import { validateInstitutionAccess } from '@/lib/institution';
  import { prisma } from '@/lib/prisma';
  
  // Mock prisma
  jest.mock('@/lib/prisma', () => ({
    prisma: {
      user: {
        findUnique: jest.fn(),
      },
    },
  }));
  
  describe('Institution Validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should allow access when user belongs to institution', async () => {
      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        institutionId: 'inst-1',
        userType: 'TEACHER',
      });
      
      const result = await validateInstitutionAccess('inst-1', 'user-1');
      expect(result).toBe(true);
    });
    
    it('should deny access when user does not belong to institution', async () => {
      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        institutionId: 'inst-2',
        userType: 'TEACHER',
      });
      
      const result = await validateInstitutionAccess('inst-1', 'user-1');
      expect(result).toBe(false);
    });
    
    it('should allow access for system admins regardless of institution', async () => {
      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        institutionId: 'inst-2',
        userType: 'SYSTEM_ADMIN',
      });
      
      const result = await validateInstitutionAccess('inst-1', 'user-1');
      expect(result).toBe(true);
    });
  });
  ```

- [ ] **Task 10.2:** Create URL routing tests
  ```typescript
  // src/__tests__/institution-routing.test.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { middleware } from '@/middleware';
  import { getToken } from 'next-auth/jwt';
  
  // Mock next-auth
  jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
  }));
  
  describe('Institution Middleware', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should redirect to default institution when no institution in URL', async () => {
      // Mock request
      const req = {
        nextUrl: {
          pathname: '/dashboard',
          clone: () => ({
            pathname: '/main/dashboard',
          }),
        },
      } as unknown as NextRequest;
      
      // Mock response
      const mockRedirect = jest.fn();
      NextResponse.redirect = mockRedirect;
      NextResponse.next = jest.fn();
      
      // Mock token
      (getToken as jest.Mock).mockResolvedValue(null);
      
      await middleware(req);
      
      expect(mockRedirect).toHaveBeenCalled();
    });
    
    // Add more tests for different scenarios
  });
  ```

### 11. Security Audit
- [ ] **Task 11.1:** Implement institution-specific rate limiting
  ```typescript
  // src/lib/rate-limit.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { Redis } from '@upstash/redis';
  
  const redis = new Redis({
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
  });
  
  export async function rateLimit(req: NextRequest, institutionId: string) {
    const ip = req.ip || '';
    const key = `rate-limit:${institutionId}:${ip}`;
    
    const current = await redis.get(key);
    const count = current ? parseInt(current as string) : 0;
    
    // Set different limits based on institution tier
    const limit = institutionId === 'premium' ? 100 : 50;
    
    if (count >= limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    await redis.set(key, count + 1, { ex: 60 });
    return null;
  }
  ```

- [ ] **Task 11.2:** Implement audit logging for institution access
  ```typescript
  // src/lib/audit.ts
  import { prisma } from '@/lib/prisma';
  
  export async function logInstitutionAccess(
    userId: string,
    institutionId: string,
    action: string,
    success: boolean
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        institutionId,
        action,
        success,
        metadata: {
          timestamp: new Date().toISOString(),
          ip: 'IP_ADDRESS', // Get from request
        },
      },
    });
  }
  ```

### 12. Performance Optimization
- [ ] **Task 12.1:** Implement institution data caching
  ```typescript
  // src/lib/institution-cache.ts
  import { Redis } from '@upstash/redis';
  import { prisma } from '@/lib/prisma';
  
  const redis = new Redis({
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
  });
  
  export async function getCachedInstitution(institutionId: string) {
    const cacheKey = `institution:${institutionId}`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
    
    // Get from database
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });
    
    if (institution) {
      // Cache for 5 minutes
      await redis.set(cacheKey, JSON.stringify(institution), { ex: 300 });
    }
    
    return institution;
  }
  ```

## Final Steps

### 13. Documentation Updates
- [ ] **Task 13.1:** Update API documentation
- [ ] **Task 13.2:** Create institution URL migration guide
- [ ] **Task 13.3:** Update developer documentation

### 14. Deployment Strategy
- [ ] **Task 14.1:** Create feature flag for institution URLs
- [ ] **Task 14.2:** Plan phased rollout
- [ ] **Task 14.3:** Create rollback plan

## Implementation Checklist

### Core Components
- [ ] Institution context provider
- [ ] Institution layout wrapper
- [ ] Institution-aware Link component
- [ ] Institution selector component

### Authentication
- [ ] Updated Auth.js configuration
- [ ] Institution middleware
- [ ] Session handling with institution context

### Routing
- [ ] New route structure
- [ ] Updated navigation components
- [ ] Updated RBAC components

### API and Data
- [ ] Updated tRPC context
- [ ] Institution validation utilities
- [ ] Updated API routes

### Testing and Validation
- [ ] Institution validation tests
- [ ] URL routing tests
- [ ] Security audit implementation
- [ ] Performance optimization

## Troubleshooting Guide

### Common Issues and Solutions

1. **Institution not found in URL**
   - Check middleware implementation
   - Verify default institution configuration

2. **Authentication redirects not working**
   - Check Auth.js callback implementation
   - Verify session token includes institution data

3. **API calls failing with institution context**
   - Verify tRPC context includes institution ID
   - Check API route validation

4. **Navigation links not including institution**
   - Ensure all links use InstitutionLink component
   - Check navigation component implementation

5. **Performance issues with institution validation**
   - Implement caching for institution data
   - Optimize database queries with proper indexes 