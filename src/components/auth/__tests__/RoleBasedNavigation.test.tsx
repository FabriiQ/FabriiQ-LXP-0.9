import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleBasedNavigation, { NavigationItem } from '../RoleBasedNavigation';
import { UserType } from '@prisma/client';
import { AccessScope } from '../AccessControl';

// Mock the usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('RoleBasedNavigation', () => {
  // Sample navigation items for testing
  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <span data-testid="dashboard-icon">📊</span>,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <span data-testid="profile-icon">👤</span>,
    },
    {
      label: 'Admin Settings',
      href: '/admin',
      icon: <span data-testid="admin-icon">⚙️</span>,
      allowedUserTypes: ['SYSTEM_ADMIN' as UserType, 'CAMPUS_ADMIN' as UserType],
    },
    {
      label: 'Campus Management',
      href: '/campus',
      icon: <span data-testid="campus-icon">🏫</span>,
      allowedScopes: ['MULTI_CAMPUS' as AccessScope, 'ALL_CAMPUSES' as AccessScope],
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <span data-testid="reports-icon">📈</span>,
      requiredPermissions: ['view_reports'],
    },
    {
      label: 'Courses',
      href: '/courses',
      icon: <span data-testid="courses-icon">📚</span>,
      children: [
        {
          label: 'My Courses',
          href: '/courses/my-courses',
          icon: <span data-testid="my-courses-icon">📖</span>,
        },
        {
          label: 'Course Management',
          href: '/courses/management',
          icon: <span data-testid="course-management-icon">📝</span>,
          allowedUserTypes: ['TEACHER' as UserType, 'COORDINATOR' as UserType],
        },
      ],
      isExpanded: true,
    },
    {
      label: 'Disabled Item',
      href: '/disabled',
      icon: <span data-testid="disabled-icon">🚫</span>,
      isDisabled: true,
    },
  ];

  test('renders navigation items correctly', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        userPermissions={['view_reports']}
      />
    );

    // Check if all allowed items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText('Campus Management')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Disabled Item')).toBeInTheDocument();

    // Check if child items are rendered when parent is expanded
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Course Management')).toBeInTheDocument();

    // Check if icons are rendered
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
    expect(screen.getByTestId('admin-icon')).toBeInTheDocument();
    expect(screen.getByTestId('campus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('reports-icon')).toBeInTheDocument();
    expect(screen.getByTestId('courses-icon')).toBeInTheDocument();
    expect(screen.getByTestId('disabled-icon')).toBeInTheDocument();
    expect(screen.getByTestId('my-courses-icon')).toBeInTheDocument();
    expect(screen.getByTestId('course-management-icon')).toBeInTheDocument();
  });

  test('filters items based on user type', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'CAMPUS_STUDENT' as UserType}
        accessScope={'SINGLE_CAMPUS' as AccessScope}
        userPermissions={[]}
      />
    );

    // Items that should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Disabled Item')).toBeInTheDocument();

    // Items that should be filtered out
    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Campus Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();

    // Child items that should be visible
    expect(screen.getByText('My Courses')).toBeInTheDocument();

    // Child items that should be filtered out
    expect(screen.queryByText('Course Management')).not.toBeInTheDocument();
  });

  test('filters items based on access scope', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'SINGLE_CAMPUS' as AccessScope}
        userPermissions={['view_reports']}
      />
    );

    // Items that should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();

    // Items that should be filtered out
    expect(screen.queryByText('Campus Management')).not.toBeInTheDocument();
  });

  test('filters items based on permissions', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        userPermissions={[]}
      />
    );

    // Items that should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText('Campus Management')).toBeInTheDocument();

    // Items that should be filtered out
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
  });

  test('handles item expansion correctly', () => {
    const onToggleExpand = jest.fn();
    
    render(
      <RoleBasedNavigation
        items={[
          {
            label: 'Expandable Item',
            href: '/expandable',
            children: [
              {
                label: 'Child Item',
                href: '/expandable/child',
              },
            ],
            isExpanded: false,
          },
        ]}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        onToggleExpand={onToggleExpand}
      />
    );

    // Child item should not be visible initially
    expect(screen.queryByText('Child Item')).not.toBeInTheDocument();

    // Click the expandable item
    fireEvent.click(screen.getByText('Expandable Item'));

    // onToggleExpand should be called
    expect(onToggleExpand).toHaveBeenCalled();
  });

  test('handles mobile navigation correctly', () => {
    const onToggleCollapse = jest.fn();
    
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        mobile={true}
        collapsible={true}
        isCollapsed={true}
        onToggleCollapse={onToggleCollapse}
      />
    );

    // Navigation items should not be visible when collapsed on mobile
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Toggle button should be visible
    const toggleButton = screen.getByRole('button', { name: 'Expand navigation' });
    expect(toggleButton).toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(toggleButton);

    // onToggleCollapse should be called
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  test('renders vertical navigation correctly', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems.slice(0, 3)}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        vertical={true}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex flex-col');
  });

  test('renders horizontal navigation correctly', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems.slice(0, 3)}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        vertical={false}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex flex-row');
  });

  test('applies custom class names correctly', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems.slice(0, 3)}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
        className="custom-nav"
        itemsClassName="custom-items"
        itemClassName="custom-item"
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-nav');
    
    const itemsContainer = nav.querySelector('ul');
    expect(itemsContainer).toHaveClass('custom-items');
    
    const item = screen.getByText('Dashboard').closest('li');
    expect(item).toHaveClass('custom-item');
  });

  test('handles disabled items correctly', () => {
    render(
      <RoleBasedNavigation
        items={navigationItems}
        userType={'SYSTEM_ADMIN' as UserType}
        accessScope={'ALL_CAMPUSES' as AccessScope}
      />
    );

    const disabledItem = screen.getByText('Disabled Item').closest('span');
    expect(disabledItem).toHaveClass('cursor-not-allowed');
    expect(disabledItem).toHaveClass('opacity-50');
  });
}); 