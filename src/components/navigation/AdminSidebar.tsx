'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, User, Sun, Moon } from 'lucide-react';
import { UserType } from '@prisma/client';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/atoms/button';
import { getNavItemsByRole, NavItem } from './role-based-nav-items';
import { cn } from '@/utils/cn';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isMobile } = useResponsive();

  // Get user type from session
  const userType = session?.user?.userType as UserType || 'SYSTEM_ADMIN';

  // Determine if we're in the coordinator section based on the URL
  const isCoordinatorSection = pathname.includes('/admin/coordinator');

  // Get navigation items based on user role or section
  let navItems;
  if (isCoordinatorSection) {
    // Always use coordinator navigation items when in coordinator section
    navItems = getNavItemsByRole('CAMPUS_COORDINATOR');
  } else {
    // Use navigation items based on user role for other sections
    navItems = getNavItemsByRole(userType);
  }

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if a navigation item is active
  const isActive = (item: NavItem): boolean => {
    if (!item.path) return false;

    // Check if any children are active
    if (item.children?.length) {
      return item.children.some(child => isActive(child));
    }

    // Special case for coordinator pages
    if (isCoordinatorSection && item.path.includes('/admin/coordinator')) {
      // For coordinator pages, we want to match the specific path
      // This ensures the correct navigation item is highlighted
      const pathParts = pathname.split('/');
      const itemParts = item.path.split('/');

      // Match up to the depth of the item path
      if (itemParts.length <= pathParts.length) {
        return itemParts.every((part, index) => part === pathParts[index]);
      }
    }

    // Check if the current path matches or is a subpath
    const exactMatch = pathname === item.path;
    const subpathMatch = pathname.startsWith(`${item.path}/`);

    return exactMatch || subpathMatch;
  };

  // Toggle expanded state of a parent item
  const toggleExpanded = (title: string): void => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(i => i !== title)
        : [...prev, title]
    );
  };

  // Check if user has access to a navigation item
  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredRoles) return true;

    // If we're in the coordinator section, always allow access to coordinator items
    if (isCoordinatorSection) {
      return item.requiredRoles.includes('CAMPUS_COORDINATOR') ||
             item.requiredRoles.includes('COORDINATOR');
    }

    return item.requiredRoles.includes(userType);
  };

  // Filter items based on user access
  const accessibleItems = navItems.filter(hasAccess);

  // Render a navigation item
  const renderNavItem = (item: NavItem): JSX.Element => {
    const isItemActive = isActive(item);
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = Boolean(item.children?.length);

    const itemKey = item.path || item.title; // Use path or title as key

    return (
      <div key={itemKey} className="space-y-1">
        {item.path ? (
          // Clickable item with path
          <Link
            href={item.path}
            className={cn(
              'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isItemActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground',
              isCollapsed && 'justify-center'
            )}
          >
            {item.icon}
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        ) : hasChildren ? (
          // Parent item without path
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isItemActive
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <div className="flex items-center space-x-2">
              {item.icon}
              {!isCollapsed && <span>{item.title}</span>}
            </div>
            {!isCollapsed && (
              <svg
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        ) : null}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && !isCollapsed && item.children && (
          <div className="ml-4 space-y-1">
            {item.children.map((child) => (
              <React.Fragment key={child.path || child.title}>
                {renderNavItem(child)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Handle sign out
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // On mobile devices, we use the bottom navigation instead of the sidebar
  // But we still need to render the sidebar for desktop view
  if (isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300 sticky top-0',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header with logo and collapse button */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="font-bold text-lg">AIVY LXP</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* User info */}
      <div className={cn(
        'flex items-center border-b p-4',
        isCollapsed ? 'justify-center' : 'justify-start'
      )}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="text-sm">
              <div className="font-medium">{session?.user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{userType}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {accessibleItems.map(renderNavItem)}
      </nav>

      {/* Footer */}
      <div className="border-t p-2 space-y-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            'w-full justify-start',
            isCollapsed && 'justify-center'
          )}
        >
          {mounted && theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </Button>

        {/* Sign out button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            'w-full justify-start',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}