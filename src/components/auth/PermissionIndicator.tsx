import React from 'react';
import { UserType } from '@prisma/client';
import { AccessScope } from './AccessControl';

export interface PermissionIndicatorProps {
  /**
   * The user's type
   */
  userType: UserType;

  /**
   * The user's access scope
   */
  accessScope: AccessScope;

  /**
   * Whether to show the user type
   * Default: true
   */
  showUserType?: boolean;

  /**
   * Whether to show the access scope
   * Default: true
   */
  showAccessScope?: boolean;

  /**
   * How to render the indicator
   * Default: 'badge'
   */
  renderAs?: 'badge' | 'tooltip' | 'text';

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Additional CSS class names for the badge
   */
  badgeClassName?: string;

  /**
   * Additional CSS class names for the tooltip
   */
  tooltipClassName?: string;

  /**
   * Additional CSS class names for the text
   */
  textClassName?: string;
}

/**
 * A component that displays the user's role and access scope
 */
export const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  userType,
  accessScope,
  showUserType = true,
  showAccessScope = true,
  renderAs = 'badge',
  className = '',
  badgeClassName = '',
  tooltipClassName = '',
  textClassName = '',
}) => {
  // Map user types to display names
  const userTypeDisplayMap: Record<string, string> = {
    SYSTEM_ADMIN: 'System Admin',
    CAMPUS_ADMIN: 'Campus Admin',
    CAMPUS_PRINCIPAL: 'Campus Principal',
    COORDINATOR: 'Coordinator',
    TEACHER: 'Teacher',
    CAMPUS_STUDENT: 'Student',
  };

  // Map access scopes to display names
  const accessScopeDisplayMap: Record<AccessScope, string> = {
    SINGLE_CAMPUS: 'Single Campus',
    MULTI_CAMPUS: 'Multiple Campuses',
    ALL_CAMPUSES: 'All Campuses',
  };

  // Determine badge color based on user type
  const getBadgeColor = (): string => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CAMPUS_ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CAMPUS_COORDINATOR':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CAMPUS_TEACHER':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CAMPUS_STUDENT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Build the content to display
  const buildContent = (): string => {
    const parts: string[] = [];

    if (showUserType) {
      parts.push(userTypeDisplayMap[userType] || String(userType));
    }

    if (showAccessScope) {
      parts.push(accessScopeDisplayMap[accessScope] || String(accessScope));
    }

    return parts.join(' • ');
  };

  const content = buildContent();

  // Render as badge
  if (renderAs === 'badge') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()} ${className} ${badgeClassName}`}
      >
        {content}
      </span>
    );
  }

  // Render as tooltip
  if (renderAs === 'tooltip') {
    return (
      <div className={`relative inline-block ${className}`}>
        <span className="cursor-help">
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
        <div className={`absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 -mt-6 -ml-16 ${tooltipClassName}`}>
          {content}
        </div>
      </div>
    );
  }

  // Render as text
  return (
    <span className={`text-sm ${className} ${textClassName}`}>
      {content}
    </span>
  );
};

export default PermissionIndicator;