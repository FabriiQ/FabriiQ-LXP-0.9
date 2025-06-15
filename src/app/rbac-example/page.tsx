'use client';

import React, { useState } from 'react';
import { UserType } from '@prisma/client';
import AccessControl from '@/components/auth/AccessControl';
import PermissionIndicator from '@/components/auth/PermissionIndicator';
import RoleBasedNavigation, { NavigationItem } from '@/components/auth/RoleBasedNavigation';
import { AccessScope } from '@/components/auth/AccessControl';

export default function RBACExamplePage() {
  // State for user role selection
  const [userType, setUserType] = useState<UserType>('CAMPUS_STUDENT' as UserType);
  const [accessScope, setAccessScope] = useState<AccessScope>('SINGLE_CAMPUS');
  const [userPermissions, setUserPermissions] = useState<string[]>(['view_course']);
  
  // State for navigation
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/courses': true,
  });
  
  // Sample navigation items
  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <span className="mr-2">📊</span>,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <span className="mr-2">👤</span>,
    },
    {
      label: 'Admin Settings',
      href: '/admin',
      icon: <span className="mr-2">⚙️</span>,
      allowedUserTypes: ['SYSTEM_ADMIN' as UserType, 'CAMPUS_ADMIN' as UserType],
    },
    {
      label: 'Campus Management',
      href: '/campus',
      icon: <span className="mr-2">🏫</span>,
      allowedScopes: ['MULTI_CAMPUS' as AccessScope, 'ALL_CAMPUSES' as AccessScope],
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <span className="mr-2">📈</span>,
      requiredPermissions: ['view_reports'],
    },
    {
      label: 'Courses',
      href: '/courses',
      icon: <span className="mr-2">📚</span>,
      isExpanded: expandedItems['/courses'],
      children: [
        {
          label: 'My Courses',
          href: '/courses/my-courses',
          icon: <span className="mr-2">📖</span>,
        },
        {
          label: 'Course Management',
          href: '/courses/management',
          icon: <span className="mr-2">📝</span>,
          allowedUserTypes: ['TEACHER' as UserType, 'COORDINATOR' as UserType],
        },
        {
          label: 'Create Course',
          href: '/courses/create',
          icon: <span className="mr-2">➕</span>,
          allowedUserTypes: ['TEACHER' as UserType, 'COORDINATOR' as UserType],
          requiredPermissions: ['create_course'],
        },
      ],
    },
  ];
  
  // Available permissions
  const availablePermissions = [
    'view_course',
    'edit_course',
    'create_course',
    'delete_course',
    'view_reports',
    'manage_users',
  ];
  
  // Handle navigation item expansion
  const handleToggleExpand = (item: NavigationItem) => {
    setExpandedItems(prev => ({
      ...prev,
      [item.href]: !prev[item.href]
    }));
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permission: string) => {
    setUserPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Role-Based Access Control Example</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Role Selection */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">User Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">User Type</label>
            <select 
              className="w-full p-2 border rounded"
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
            >
              <option value="SYSTEM_ADMIN">System Admin</option>
              <option value="CAMPUS_ADMIN">Campus Admin</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="TEACHER">Teacher</option>
              <option value="CAMPUS_STUDENT">Student</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Access Scope</label>
            <select 
              className="w-full p-2 border rounded"
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as AccessScope)}
            >
              <option value="SINGLE_CAMPUS">Single Campus</option>
              <option value="MULTI_CAMPUS">Multiple Campuses</option>
              <option value="ALL_CAMPUSES">All Campuses</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Permissions</label>
            <div className="space-y-2">
              {availablePermissions.map(permission => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={permission}
                    checked={userPermissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="mr-2"
                  />
                  <label htmlFor={permission}>{permission}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <PermissionIndicator
              userType={userType}
              accessScope={accessScope}
              showUserType={true}
              showAccessScope={true}
              renderAs="badge"
              className="mt-2"
            />
          </div>
        </div>
        
        {/* Navigation Example */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          
          <div className="border rounded p-4">
            <RoleBasedNavigation
              items={navigationItems}
              userType={userType}
              accessScope={accessScope}
              userPermissions={userPermissions}
              vertical={true}
              mobile={false}
              collapsible={false}
              onToggleExpand={handleToggleExpand}
              className="w-full"
              itemClassName="border-b last:border-b-0"
              activeItemClassName="bg-blue-50"
              childrenClassName="pl-4 border-t mt-1"
            />
          </div>
        </div>
        
        {/* Access Control Examples */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">UI Elements</h2>
          
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Admin Panel</h3>
              <AccessControl
                userType={userType}
                accessScope={accessScope}
                allowedUserTypes={['SYSTEM_ADMIN' as UserType, 'CAMPUS_ADMIN' as UserType]}
                fallback={<p className="text-red-500">You don't have admin access.</p>}
              >
                <div className="bg-gray-100 p-2 rounded">
                  <p>Welcome to the admin panel!</p>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded mt-2">
                    Manage System
                  </button>
                </div>
              </AccessControl>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Course Management</h3>
              <AccessControl
                userType={userType}
                accessScope={accessScope}
                allowedUserTypes={['TEACHER' as UserType, 'COORDINATOR' as UserType]}
                fallback={<p className="text-red-500">Only teachers and coordinators can manage courses.</p>}
              >
                <div className="bg-gray-100 p-2 rounded">
                  <p>Course management tools</p>
                  <div className="flex space-x-2 mt-2">
                    <button className="bg-green-500 text-white px-3 py-1 rounded">
                      View Courses
                    </button>
                    
                    <AccessControl
                      userType={userType}
                      accessScope={accessScope}
                      requiredPermissions={['create_course']}
                      userPermissions={userPermissions}
                    >
                      <button className="bg-blue-500 text-white px-3 py-1 rounded">
                        Create Course
                      </button>
                    </AccessControl>
                  </div>
                </div>
              </AccessControl>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Reports</h3>
              <AccessControl
                userType={userType}
                accessScope={accessScope}
                requiredPermissions={['view_reports']}
                userPermissions={userPermissions}
                fallback={<p className="text-red-500">You need the 'view_reports' permission.</p>}
              >
                <div className="bg-gray-100 p-2 rounded">
                  <p>Reports dashboard</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white p-2 rounded border">
                      <p className="text-sm font-medium">Attendance</p>
                      <p className="text-xs text-gray-500">85% overall</p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="text-sm font-medium">Grades</p>
                      <p className="text-xs text-gray-500">B+ average</p>
                    </div>
                  </div>
                </div>
              </AccessControl>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Multi-Campus View</h3>
              <AccessControl
                userType={userType}
                accessScope={accessScope}
                allowedScopes={['MULTI_CAMPUS' as AccessScope, 'ALL_CAMPUSES' as AccessScope]}
                fallback={<p className="text-red-500">You need multi-campus or all-campuses access.</p>}
              >
                <div className="bg-gray-100 p-2 rounded">
                  <p>Campus comparison</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white p-2 rounded border">
                      <p className="text-sm font-medium">Campus A</p>
                      <p className="text-xs text-gray-500">1,200 students</p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="text-sm font-medium">Campus B</p>
                      <p className="text-xs text-gray-500">950 students</p>
                    </div>
                  </div>
                </div>
              </AccessControl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <p className="mb-2">
          This example demonstrates how to use the Role-Based Access Control (RBAC) components to control access to UI elements and navigation items based on user roles, permissions, and access scopes.
        </p>
        <p className="mb-2">
          Try changing the user type, access scope, and permissions to see how the UI adapts to different user roles and permissions.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>AccessControl</strong>: Conditionally renders content based on user role and permissions</li>
          <li><strong>PermissionIndicator</strong>: Displays the user's role and access scope</li>
          <li><strong>RoleBasedNavigation</strong>: Renders navigation items based on user role and permissions</li>
        </ul>
      </div>
    </div>
  );
} 