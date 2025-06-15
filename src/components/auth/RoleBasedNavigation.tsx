import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserType } from '@prisma/client';
import { AccessScope } from './AccessControl';

export interface NavigationItem {
  /**
   * The label to display for the navigation item
   */
  label: string;
  
  /**
   * The URL to navigate to
   */
  href: string;
  
  /**
   * The icon to display (optional)
   */
  icon?: React.ReactNode;
  
  /**
   * Whether the item is active
   * If not provided, it will be determined based on the current path
   */
  isActive?: boolean;
  
  /**
   * The user types that are allowed to see this navigation item
   * If not provided, all user types are allowed
   */
  allowedUserTypes?: UserType[];
  
  /**
   * The access scopes that are allowed to see this navigation item
   * If not provided, all access scopes are allowed
   */
  allowedScopes?: AccessScope[];
  
  /**
   * The permissions required to see this navigation item
   * If provided, the user must have all the specified permissions
   */
  requiredPermissions?: string[];
  
  /**
   * Child navigation items
   */
  children?: NavigationItem[];
  
  /**
   * Whether the item is expanded (for items with children)
   */
  isExpanded?: boolean;
  
  /**
   * Whether the item is disabled
   */
  isDisabled?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Additional CSS class names for active state
   */
  activeClassName?: string;
  
  /**
   * Additional CSS class names for disabled state
   */
  disabledClassName?: string;
  
  /**
   * Additional CSS class names for expanded state
   */
  expandedClassName?: string;
  
  /**
   * Additional CSS class names for the icon
   */
  iconClassName?: string;
  
  /**
   * Additional CSS class names for the label
   */
  labelClassName?: string;
  
  /**
   * Additional CSS class names for the children container
   */
  childrenClassName?: string;
  
  /**
   * Additional CSS class names for the children items
   */
  childItemClassName?: string;
  
  /**
   * Additional CSS class names for the active children items
   */
  activeChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled children items
   */
  disabledChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded children items
   */
  expandedChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon in children items
   */
  childIconClassName?: string;
  
  /**
   * Additional CSS class names for the label in children items
   */
  childLabelClassName?: string;
  
  /**
   * Additional CSS class names for the children container in children items
   */
  childChildrenClassName?: string;
  
  /**
   * Additional CSS class names for the children items in children items
   */
  childChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the active children items in children items
   */
  childActiveChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled children items in children items
   */
  childDisabledChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded children items in children items
   */
  childExpandedChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon in children items in children items
   */
  childChildIconClassName?: string;
  
  /**
   * Additional CSS class names for the label in children items in children items
   */
  childChildLabelClassName?: string;
}

interface RoleBasedNavigationProps {
  /**
   * The navigation items to display
   */
  items: NavigationItem[];
  
  /**
   * The current user's type
   */
  userType: UserType;
  
  /**
   * The current user's access scope
   */
  accessScope: AccessScope;
  
  /**
   * The current user's permissions
   */
  userPermissions?: string[];
  
  /**
   * Whether to render as a vertical navigation (sidebar)
   * Default: true
   */
  vertical?: boolean;
  
  /**
   * Whether to render as a mobile navigation
   * Default: false
   */
  mobile?: boolean;
  
  /**
   * Whether to collapse the navigation on mobile
   * Default: true
   */
  collapsible?: boolean;
  
  /**
   * Whether the navigation is collapsed
   * Only used if collapsible is true
   */
  isCollapsed?: boolean;
  
  /**
   * Callback for toggling the collapsed state
   * Only used if collapsible is true
   */
  onToggleCollapse?: () => void;
  
  /**
   * Callback for toggling the expanded state of an item
   */
  onToggleExpand?: (item: NavigationItem) => void;
  
  /**
   * Additional CSS class names for the container
   */
  className?: string;
  
  /**
   * Additional CSS class names for the items container
   */
  itemsClassName?: string;
  
  /**
   * Additional CSS class names for the items
   */
  itemClassName?: string;
  
  /**
   * Additional CSS class names for the active items
   */
  activeItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled items
   */
  disabledItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded items
   */
  expandedItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon
   */
  iconClassName?: string;
  
  /**
   * Additional CSS class names for the label
   */
  labelClassName?: string;
  
  /**
   * Additional CSS class names for the children container
   */
  childrenClassName?: string;
  
  /**
   * Additional CSS class names for the children items
   */
  childItemClassName?: string;
  
  /**
   * Additional CSS class names for the active children items
   */
  activeChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled children items
   */
  disabledChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded children items
   */
  expandedChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon in children items
   */
  childIconClassName?: string;
  
  /**
   * Additional CSS class names for the label in children items
   */
  childLabelClassName?: string;
  
  /**
   * Additional CSS class names for the children container in children items
   */
  childChildrenClassName?: string;
  
  /**
   * Additional CSS class names for the children items in children items
   */
  childChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the active children items in children items
   */
  childActiveChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled children items in children items
   */
  childDisabledChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded children items in children items
   */
  childExpandedChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon in children items in children items
   */
  childChildIconClassName?: string;
  
  /**
   * Additional CSS class names for the label in children items in children items
   */
  childChildLabelClassName?: string;
  
  /**
   * Additional CSS class names for the children container in children items in children items
   */
  childChildChildrenClassName?: string;
  
  /**
   * Additional CSS class names for the children items in children items in children items
   */
  childChildChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the active children items in children items in children items
   */
  childChildActiveChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the disabled children items in children items in children items
   */
  childChildDisabledChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the expanded children items in children items in children items
   */
  childChildExpandedChildItemClassName?: string;
  
  /**
   * Additional CSS class names for the icon in children items in children items in children items
   */
  childChildChildIconClassName?: string;
  
  /**
   * Additional CSS class names for the label in children items in children items in children items
   */
  childChildChildLabelClassName?: string;
}

/**
 * A component that renders navigation items based on the user's role and permissions
 */
export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  items,
  userType,
  accessScope,
  userPermissions = [],
  vertical = true,
  mobile = false,
  collapsible = true,
  isCollapsed = false,
  onToggleCollapse,
  onToggleExpand,
  className = '',
  itemsClassName = '',
  itemClassName = '',
  activeItemClassName = '',
  disabledItemClassName = '',
  expandedItemClassName = '',
  iconClassName = '',
  labelClassName = '',
  childrenClassName = '',
  childItemClassName = '',
  activeChildItemClassName = '',
  disabledChildItemClassName = '',
  expandedChildItemClassName = '',
  childIconClassName = '',
  childLabelClassName = '',
  childChildrenClassName = '',
  childChildItemClassName = '',
  childActiveChildItemClassName = '',
  childDisabledChildItemClassName = '',
  childExpandedChildItemClassName = '',
  childChildIconClassName = '',
  childChildLabelClassName = '',
  childChildChildrenClassName = '',
  childChildChildItemClassName = '',
  childChildActiveChildItemClassName = '',
  childChildDisabledChildItemClassName = '',
  childChildExpandedChildItemClassName = '',
  childChildChildIconClassName = '',
  childChildChildLabelClassName = '',
}) => {
  const pathname = usePathname();
  
  // Filter items based on user's role and permissions
  const filteredItems = items.filter(item => {
    // Check if the user type is allowed
    const hasAllowedUserType = !item.allowedUserTypes || item.allowedUserTypes.includes(userType);
    
    // Check if the access scope is allowed
    const hasAllowedScope = !item.allowedScopes || item.allowedScopes.includes(accessScope);
    
    // Check if the user has all required permissions
    const hasRequiredPermissions = !item.requiredPermissions || 
      item.requiredPermissions.every(permission => userPermissions.includes(permission));
    
    return hasAllowedUserType && hasAllowedScope && hasRequiredPermissions;
  });
  
  // Render a navigation item
  const renderItem = (item: NavigationItem, isChild = false, isGrandchild = false) => {
    // Determine if the item is active
    const isActive = item.isActive !== undefined 
      ? item.isActive 
      : pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));
    
    // Determine the CSS classes
    const itemClasses = [
      isChild 
        ? isGrandchild 
          ? childChildItemClassName || childItemClassName || itemClassName
          : childItemClassName || itemClassName
        : itemClassName,
      isActive 
        ? isChild 
          ? isGrandchild 
            ? childChildActiveChildItemClassName || activeChildItemClassName || activeItemClassName
            : activeChildItemClassName || activeItemClassName
          : activeItemClassName
        : '',
      item.isDisabled 
        ? isChild 
          ? isGrandchild 
            ? childChildDisabledChildItemClassName || disabledChildItemClassName || disabledItemClassName
            : disabledChildItemClassName || disabledItemClassName
          : disabledItemClassName
        : '',
      item.isExpanded 
        ? isChild 
          ? isGrandchild 
            ? childChildExpandedChildItemClassName || expandedChildItemClassName || expandedItemClassName
            : expandedChildItemClassName || expandedItemClassName
          : expandedItemClassName
        : '',
      item.className || '',
    ].filter(Boolean).join(' ');
    
    // Determine the icon classes
    const iconClasses = [
      isChild 
        ? isGrandchild 
          ? childChildChildIconClassName || childChildIconClassName || childIconClassName || iconClassName
          : childIconClassName || iconClassName
        : iconClassName,
      item.iconClassName || '',
    ].filter(Boolean).join(' ');
    
    // Determine the label classes
    const labelClasses = [
      isChild 
        ? isGrandchild 
          ? childChildChildLabelClassName || childChildLabelClassName || childLabelClassName || labelClassName
          : childLabelClassName || labelClassName
        : labelClassName,
      item.labelClassName || '',
    ].filter(Boolean).join(' ');
    
    // Determine the children container classes
    const childrenContainerClasses = [
      isChild 
        ? isGrandchild 
          ? childChildChildrenClassName || childChildrenClassName || childrenClassName
          : childChildrenClassName || childrenClassName
        : childrenClassName,
      item.childrenClassName || '',
    ].filter(Boolean).join(' ');
    
    // Render the item content
    const itemContent = (
      <>
        {item.icon && <span className={iconClasses}>{item.icon}</span>}
        <span className={labelClasses}>{item.label}</span>
        {item.children && item.children.length > 0 && (
          <span className="ml-auto">
            {item.isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
        )}
      </>
    );
    
    // Render the item
    return (
      <li key={item.href} className={itemClasses}>
        {item.isDisabled ? (
          <span className="flex items-center px-4 py-2 cursor-not-allowed opacity-50">
            {itemContent}
          </span>
        ) : item.children && item.children.length > 0 ? (
          <>
            <button
              className="flex items-center w-full px-4 py-2 text-left"
              onClick={() => onToggleExpand && onToggleExpand(item)}
            >
              {itemContent}
            </button>
            {item.isExpanded && item.children && item.children.length > 0 && (
              <ul className={childrenContainerClasses}>
                {item.children
                  .filter(child => {
                    // Check if the user type is allowed
                    const hasAllowedUserType = !child.allowedUserTypes || child.allowedUserTypes.includes(userType);
                    
                    // Check if the access scope is allowed
                    const hasAllowedScope = !child.allowedScopes || child.allowedScopes.includes(accessScope);
                    
                    // Check if the user has all required permissions
                    const hasRequiredPermissions = !child.requiredPermissions || 
                      child.requiredPermissions.every(permission => userPermissions.includes(permission));
                    
                    return hasAllowedUserType && hasAllowedScope && hasRequiredPermissions;
                  })
                  .map(child => renderItem(child, true, isChild))}
              </ul>
            )}
          </>
        ) : (
          <Link href={item.href} className="flex items-center px-4 py-2">
            {itemContent}
          </Link>
        )}
      </li>
    );
  };
  
  // Render the navigation
  return (
    <nav className={`${vertical ? 'flex flex-col' : 'flex flex-row'} ${className}`}>
      {collapsible && (
        <button
          className="p-2 md:hidden"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
      
      {(!collapsible || !isCollapsed || !mobile) && (
        <ul className={`${vertical ? 'flex flex-col' : 'flex flex-row'} ${itemsClassName}`}>
          {filteredItems.map(item => renderItem(item))}
        </ul>
      )}
    </nav>
  );
};

export default RoleBasedNavigation; 