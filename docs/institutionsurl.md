# Institution-Based URL Structure Implementation Impact Analysis

## Overview
This document outlines the necessary changes to implement institution-based URL routing across the application. The goal is to restructure URLs to follow the pattern `/{institutionId}/...` for all routes, ensuring proper multi-tenancy support.

## Current State
- Routes are currently organized without institution context in the URL
- Institution context is managed through user sessions and database queries
- App router structure is flat without institution-level grouping
- Authentication and authorization don't enforce institution-level URL access

## Required Changes

### 1. App Router Structure Changes
**Impact Level: High**
- Create new directory structure:
  ```
  /src/app
    /[institutionId]
      /(auth)
        /login
        /register
      /(dashboard)
        /page.tsx
      /admin
        /system
        /campus
      /teacher
        /dashboard
      /student
        /dashboard
      /parent
        /dashboard
      /profile
      /layout.tsx (institution context wrapper)
  ```

**Files to Modify:**
- All existing route files in `/src/app/*`
- New institution layout wrapper needed
- Update all page components to use institution context

### 2. Authentication System Changes
**Impact Level: High**
**Files to Modify:**
- `/src/app/api/auth/[...nextauth]/route.ts`
- `/src/lib/auth.ts`
- `/src/hooks/useAuth.ts`

**Changes Required:**
- Update redirect logic to include institution context
- Modify session handling to validate institution access
- Update login/register flows to handle institution routing
- Implement institution access validation middleware

**Additional Changes Required:**
- Update Auth.js callbacks to handle institution-based redirects
- Modify session token to include institution context
- Update middleware to validate institution access before Auth.js checks
- Integrate with existing RBAC system for institution-level permissions
- Handle institution switching in session management
- Update JWT token structure to include institution data

### 3. API Route Changes
**Impact Level: High**
**Files to Modify:**
- All files in `/src/app/api/*`
- `/src/server/api/trpc.ts`
- All tRPC routers

**Changes Required:**
- Update API routes to validate institution context
- Modify tRPC context to include institution from URL
- Add institution validation middleware
- Update API documentation

**Additional Considerations:**
- Implement caching strategy for institution validation
- Add institution context to all API error responses
- Update rate limiting to consider institution context
- Ensure backward compatibility for existing API clients

### 4. Navigation Components
**Impact Level: Medium**
**Files to Modify:**
- `/src/components/layout/navigation.tsx`
- `/src/components/layout/sidebar.tsx`
- All components using Link or navigation

**Changes Required:**
- Update all navigation links to include institution context
- Create institution-aware Link component wrapper
- Modify breadcrumbs to show institution context
- Update menu structures

**Additional Components to Update:**
- Institution selector component for multi-institution users
- Error boundaries for institution access issues
- Loading states for institution validation
- Institution context indicators in UI

### 5. Client-Side Changes
**Impact Level: Medium**
**Files to Modify:**
- `/src/hooks/*`
- `/src/components/*`
- Client-side utility functions

**Changes Required:**
- Create useInstitution hook
- Update existing hooks to use institution context
- Modify client-side data fetching
- Update form submissions and API calls

**Additional Client-Side Considerations:**
- Implement client-side institution caching
- Update error handling for institution-specific errors
- Add institution context to analytics events
- Ensure proper state management during institution switching

### 6. Database and Schema Impact
**Impact Level: Low**
**Current Schema Support:**
- Institution model already exists
- User-Institution relationships are established
- No schema changes required

**Additional Considerations:**
- Ensure URL structure respects institution-campus hierarchy
- Update campus access validation in UserCampusAccess
- Maintain institution-specific business rules
- Consider impact on academic cycle and term routing
- Review data access patterns for institution-scoped queries
- Evaluate performance impact on frequently accessed queries
- Consider adding institution-specific indexes if needed

### 7. Testing Requirements
**Impact Level: High**
**Areas to Test:**
- URL routing with institution context
- Authentication flows
- Authorization and access control
- Navigation and linking
- API endpoints
- Institution switching
- Error handling for invalid institutions

**Additional Testing Considerations:**
- Create institution-specific test fixtures
- Test institution isolation (data leakage prevention)
- Performance testing with multiple institutions
- Test institution switching edge cases
- Validate URL structure across all user types
- Test deep linking with institution context

### 8. Security Considerations
- Implement institution-level access validation
- Prevent unauthorized institution access
- Handle institution switching securely
- Validate API requests against institution context

**Additional Requirements:**
- Integrate with AccessControl component for institution-based rendering
- Update ProtectedRoute component to handle institution-level access
- Implement institution-specific role checks in middleware
- Add institution-level permission scoping
- Audit logging for institution access attempts
- Implement institution-specific rate limiting
- Consider cross-institution data access policies

### 9. Data Isolation and Access Control

**Institution-Level Separation:**
```typescript
// URL Pattern Structure
/{institutionId}/                     // Institution context
  /admin/                             // Role-based section
    /campus/{campusId}/               // Campus context
      /programs/{programId}/          // Program context
        /courses/{courseId}/          // Course context
  /teacher/
    /classes/{classId}/               // Class context
  /student/
    /enrollments/                     // Student-specific views
```

**Access Control Requirements:**
1. Institution Context
   - All users must belong to the institution in URL
   - Cross-institution access must be explicitly forbidden
   - Institution switching requires re-authentication

2. Campus Access
   - Users must have valid UserCampusAccess for campus operations
   - Multi-campus users need explicit access grants
   - Campus operations must validate institution match

3. Program & Course Access
   - Programs must belong to the URL institution
   - Course access must validate institution and campus context
   - Cross-program operations need special permissions

4. Role-Based Routes
   - Admin routes require institution-level admin permissions
   - Teacher routes require valid teaching assignments
   - Student routes require active enrollments

**Implementation Guidelines:**
1. Middleware Checks:
```typescript
// Institution Validation Middleware
export async function validateInstitutionAccess(
  institutionId: string,
  userId: string
) {
  const userAccess = await prisma.user.findFirst({
    where: {
      id: userId,
      institutionId: institutionId,
      status: 'ACTIVE'
    }
  });
  if (!userAccess) throw new UnauthorizedError();
}

// Campus Access Middleware
export async function validateCampusAccess(
  institutionId: string,
  campusId: string,
  userId: string
) {
  const campusAccess = await prisma.userCampusAccess.findFirst({
    where: {
      userId,
      campus: {
        id: campusId,
        institutionId
      },
      status: 'ACTIVE'
    }
  });
  if (!campusAccess) throw new UnauthorizedError();
}
```

2. Route Protection:
```typescript
// Example Route Handler
export async function GET(
  req: Request,
  { params: { institutionId, campusId } }
) {
  await validateInstitutionAccess(institutionId, req.user.id);
  if (campusId) {
    await validateCampusAccess(institutionId, campusId, req.user.id);
  }
  // Proceed with route logic
}
```

## Implementation Strategy

### Phase 1: Foundation
1. Create institution layout wrapper
2. Implement basic URL structure
3. Update authentication system
4. Create institution context provider

### Phase 2: Core Updates
1. Modify API routes and tRPC
2. Update navigation components
3. Implement client-side changes
4. Update RBAC integration

### Phase 3: Migration
1. Move existing routes to new structure
2. Update all internal links
3. Implement testing
4. Update academic structure integration

### Phase 4: Validation
1. Security audit
2. Performance testing
3. User acceptance testing
4. Cross-institution data isolation testing

## Risks and Mitigation

### Risks:
1. Breaking existing deep links
2. Performance impact from additional validation
3. Session handling complexity
4. Migration complexity
5. Institution switching edge cases
6. Data isolation failures
7. Authentication flow disruption

### Mitigation:
1. Implement URL migration strategy
2. Cache institution validation
3. Comprehensive testing suite
4. Gradual rollout plan
5. Implement institution fallback mechanism
6. Create detailed migration documentation
7. Develop institution validation middleware

## Dependencies
- Next.js App Router
- tRPC
- NextAuth.js/Auth.js
- Prisma Schema
- RBAC System
- Academic Structure

## Timeline Estimate
- Phase 1: 1-2 weeks
- Phase 2: 2-3 weeks
- Phase 3: 2-3 weeks
- Phase 4: 1-2 weeks

Total: 6-10 weeks depending on complexity and team size

## Recommendations
1. Start with a new feature branch
2. Implement changes incrementally
3. Maintain backward compatibility during migration
4. Comprehensive testing at each phase
5. Document all changes for team reference
6. Consider implementing feature flags for gradual rollout
7. Create institution switching utility for testing
8. Develop institution validation middleware first
9. Update authentication system before route changes
10. Implement automated tests for institution isolation 