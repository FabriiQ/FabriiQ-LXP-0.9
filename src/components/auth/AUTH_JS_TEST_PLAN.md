# Auth.js Migration Test Plan

This document outlines the test plan for verifying the successful migration from our custom authentication system to Auth.js.

## Test Environment Setup

1. **Development Environment**
   - Set up a clean development environment with the latest code
   - Configure environment variables for Auth.js:
     - `NEXTAUTH_SECRET`: A random string for JWT encryption
     - `NEXTAUTH_URL`: The base URL of the application (in development: http://localhost:3000)

2. **Test Users**
   - Create test users for each user type:
     - System Admin
     - Administrator
     - Teacher
     - Student
     - Parent

## Functional Tests

### 1. Authentication Flow

#### 1.1 Login

- [ ] Test successful login with valid credentials
- [ ] Test failed login with invalid username
- [ ] Test failed login with invalid password
- [ ] Test login with inactive user
- [ ] Test login with deleted user
- [ ] Test login with expired password
- [ ] Verify session cookie is set correctly
- [ ] Verify JWT token contains correct user information

#### 1.2 Logout

- [ ] Test successful logout
- [ ] Verify session cookie is cleared
- [ ] Verify redirect to login page after logout
- [ ] Test logout from multiple tabs/windows

#### 1.3 Session Management

- [ ] Verify session persistence across page refreshes
- [ ] Verify session expiration after configured time
- [ ] Test session handling across multiple tabs
- [ ] Test session handling after browser restart

### 2. Registration and User Management

#### 2.1 User Registration

- [ ] Test successful user registration
- [ ] Test registration with existing username
- [ ] Test registration with existing email
- [ ] Test registration with invalid data
- [ ] Verify welcome email is sent (if applicable)

#### 2.2 Password Management

- [ ] Test password reset request
- [ ] Test password reset with valid token
- [ ] Test password reset with expired token
- [ ] Test password reset with invalid token
- [ ] Test password change for authenticated user
- [ ] Test password change with incorrect current password

### 3. Authorization and Access Control

#### 3.1 Role-Based Access

- [ ] Test access to pages based on user roles
- [ ] Test UI rendering based on user roles
- [ ] Test API access based on user roles
- [ ] Test redirection for unauthorized access

#### 3.2 Permission-Based Access

- [ ] Test access to features based on user permissions
- [ ] Test UI rendering based on user permissions
- [ ] Test API access based on user permissions

#### 3.3 Access Scope

- [ ] Test access to resources based on user's access scope
- [ ] Test multi-campus access for users with appropriate scope
- [ ] Test single-campus restrictions for limited users

## Integration Tests

### 1. Component Integration

- [ ] Test `ProtectedRoute` component with different user roles
- [ ] Test `AccessControl` component with different user roles and permissions
- [ ] Test `RoleBasedComponent` with different user roles
- [ ] Test navigation components with role-based menu items

### 2. API Integration

- [ ] Test TRPC protected procedures
- [ ] Test TRPC role-protected procedures
- [ ] Test API routes with Auth.js session validation
- [ ] Test error handling for unauthorized API access

### 3. Third-Party Integration

- [ ] Test integration with external systems that rely on authentication
- [ ] Test SSO functionality (if applicable)

## Performance Tests

- [ ] Measure login response time
- [ ] Measure session validation time
- [ ] Compare performance with previous authentication system
- [ ] Test under load (multiple concurrent users)

## Security Tests

- [ ] Verify JWT token security (encryption, expiration)
- [ ] Test CSRF protection
- [ ] Test XSS protection
- [ ] Test session fixation protection
- [ ] Test brute force protection
- [ ] Verify secure cookie settings (HTTP-only, SameSite)

## Browser Compatibility Tests

Test authentication flow in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

## Regression Tests

- [ ] Verify all existing functionality still works
- [ ] Check for any unintended side effects
- [ ] Verify all authentication-dependent features

## Test Reporting

For each test:
1. Document the test case
2. Record the expected result
3. Record the actual result
4. Document any discrepancies
5. Track bug fixes and retest

## Test Automation

Implement automated tests for:
- [ ] Authentication flow (login, logout)
- [ ] Role-based access control
- [ ] API authentication
- [ ] Session management

## Rollback Plan

In case of critical issues:
1. Document the specific issue
2. Determine if a hotfix is possible
3. If not, prepare for rollback to previous authentication system
4. Test rollback procedure in development environment
5. Schedule rollback during low-traffic period

## Sign-off Criteria

The migration will be considered successful when:
1. All functional tests pass
2. No high or critical security issues are found
3. Performance meets or exceeds previous system
4. All regression tests pass
5. Documentation is updated
6. Development team approves the changes 