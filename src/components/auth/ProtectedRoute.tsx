'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@prisma/client';
import { AccessScope } from './AccessControl';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  /**
   * The content to render if the user is authenticated and authorized
   */
  children: React.ReactNode;
  
  /**
   * The user types that are allowed to access the route
   * If not provided, all user types are allowed
   */
  allowedUserTypes?: UserType[];
  
  /**
   * The access scopes that are allowed to access the route
   * If not provided, all access scopes are allowed
   */
  allowedScopes?: AccessScope[];
  
  /**
   * Additional permissions to check
   * If provided, the user must have all the specified permissions
   */
  requiredPermissions?: string[];
  
  /**
   * The path to redirect to if the user is not authenticated
   * Default: '/login'
   */
  loginRedirect?: string;
  
  /**
   * The path to redirect to if the user is authenticated but not authorized
   * Default: '/unauthorized'
   */
  unauthorizedRedirect?: string;
  
  /**
   * Whether to show a loading state while checking authentication
   * Default: true
   */
  showLoading?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * A component that protects routes based on authentication and authorization
 * Uses Auth.js for authentication and authorization
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedUserTypes,
  allowedScopes,
  requiredPermissions,
  loginRedirect = '/login',
  unauthorizedRedirect = '/unauthorized',
  showLoading = true,
  loadingComponent = <div className="flex items-center justify-center min-h-screen">Loading...</div>,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const isAuthLoading = status === 'loading' || isLoading;
  
  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isAuthLoading && !isAuthenticated) {
      router.push(loginRedirect);
      return;
    }
    
    // If authenticated but user data is not available yet, wait
    if (!isAuthLoading && isAuthenticated && !user) {
      return;
    }
    
    // If authenticated and user data is available, check authorization
    if (!isAuthLoading && isAuthenticated && user) {
      // Check if the user type is allowed
      const hasAllowedUserType = !allowedUserTypes || allowedUserTypes.includes(user.userType as UserType);
      
      // Check if the access scope is allowed
      const hasAllowedScope = !allowedScopes || (user.accessScope && allowedScopes.includes(user.accessScope as AccessScope));
      
      // Check if the user has all required permissions
      const hasRequiredPermissions = !requiredPermissions || 
        requiredPermissions.every(permission => user.permissions?.includes(permission));
      
      // If not authorized, redirect to unauthorized page
      if (!hasAllowedUserType || !hasAllowedScope || !hasRequiredPermissions) {
        router.push(unauthorizedRedirect);
      }
    }
  }, [
    isAuthLoading,
    isAuthenticated, 
    user, 
    allowedUserTypes, 
    allowedScopes, 
    requiredPermissions, 
    loginRedirect, 
    unauthorizedRedirect, 
    router
  ]);
  
  // Show loading state if authentication is being checked
  if (isAuthLoading || !isAuthenticated || !user) {
    return showLoading ? <>{loadingComponent}</> : null;
  }
  
  // Check authorization
  const hasAllowedUserType = !allowedUserTypes || allowedUserTypes.includes(user.userType as UserType);
  const hasAllowedScope = !allowedScopes || (user.accessScope && allowedScopes.includes(user.accessScope as AccessScope));
  const hasRequiredPermissions = !requiredPermissions || 
    requiredPermissions.every(permission => user.permissions?.includes(permission));
  
  // If not authorized, show loading while redirecting
  if (!hasAllowedUserType || !hasAllowedScope || !hasRequiredPermissions) {
    return showLoading ? <>{loadingComponent}</> : null;
  }
  
  // If authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute; 