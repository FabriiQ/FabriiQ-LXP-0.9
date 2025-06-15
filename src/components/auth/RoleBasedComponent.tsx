"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserType } from '@prisma/client';

interface RoleBasedComponentProps {
  children: ReactNode;
  allowedRoles: UserType[];
  fallback?: ReactNode;
}

/**
 * A simplified component that conditionally renders content based on user roles
 * This is a more focused version of AccessControl that only checks roles
 */
export default function RoleBasedComponent({
  children,
  allowedRoles,
  fallback = null,
}: RoleBasedComponentProps) {
  const { user, isLoading } = useAuth();
  
  // If still loading, don't render anything
  if (isLoading) {
    return null;
  }
  
  // If user is not authenticated or doesn't have an allowed role, show fallback
  if (!user || !allowedRoles.includes(user.userType as UserType)) {
    return <>{fallback}</>;
  }
  
  // User has an allowed role, show the children
  return <>{children}</>;
} 