'use client';

import React from 'react';
import { UserType } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';

export type AccessScope = 'SINGLE_CAMPUS' | 'MULTI_CAMPUS' | 'ALL_CAMPUSES';

interface AccessControlProps {
  /**
   * The content to render if the user has access
   */
  children: React.ReactNode;
  
  /**
   * The user types that are allowed to access the content
   * If not provided, all user types are allowed
   */
  allowedUserTypes?: UserType[];
  
  /**
   * The access scopes that are allowed to access the content
   * If not provided, all access scopes are allowed
   */
  allowedScopes?: AccessScope[];
  
  /**
   * The content to render if the user doesn't have access
   * If not provided, null will be rendered
   */
  fallback?: React.ReactNode;
  
  /**
   * Additional permissions to check
   * If provided, the user must have all the specified permissions
   */
  requiredPermissions?: string[];
  
  /**
   * Whether to show a loading state while checking authentication
   * Default: false
   */
  showLoading?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * A component that conditionally renders content based on the user's role and permissions
 * Uses Auth.js for authentication and authorization
 */
export const AccessControl: React.FC<AccessControlProps> = ({
  children,
  allowedUserTypes,
  allowedScopes,
  fallback = null,
  requiredPermissions,
  showLoading = false,
  loadingComponent = <div>Loading...</div>,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Show loading state if authentication is being checked
  if (isLoading) {
    return showLoading ? <>{loadingComponent}</> : null;
  }
  
  // If not authenticated or no user data, render fallback
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }
  
  // Check if the user type is allowed
  const hasAllowedUserType = !allowedUserTypes || allowedUserTypes.includes(user.userType as UserType);
  
  // Check if the access scope is allowed
  const hasAllowedScope = !allowedScopes || (user.accessScope && allowedScopes.includes(user.accessScope as AccessScope));
  
  // Check if the user has all required permissions
  const hasRequiredPermissions = !requiredPermissions || 
    requiredPermissions.every(permission => user.permissions?.includes(permission));
  
  // Render the children if the user has access, otherwise render the fallback
  if (hasAllowedUserType && hasAllowedScope && hasRequiredPermissions) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default AccessControl; 