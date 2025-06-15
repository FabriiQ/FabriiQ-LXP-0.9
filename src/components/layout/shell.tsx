'use client';

import React from 'react';
import { Sidebar } from '@/components/ui/navigation/sidebar';
import { BottomNav, type BottomNavItem } from '@/components/ui/navigation/bottom-nav';
import { useTheme } from '@/providers/theme-provider';
import { useSession } from 'next-auth/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  Home,
  Users,
  Settings,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  FileText,
  School,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  User,
  UserCog
} from 'lucide-react';

// Define teacher navigation items
const teacherNavigationItems = [
  {
    title: 'Dashboard',
    path: '/teacher/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'My Classes',
    path: '/teacher/classes',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Schedule',
    path: '/teacher/schedule',
    icon: <Calendar className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Assessments',
    path: '/teacher/assessments',
    icon: <ClipboardCheck className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'AI Content Studio',
    path: '/teacher/content-studio',
    icon: <FileText className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Resources',
    path: '/teacher/resources',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Communications',
    path: '/teacher/communications',
    icon: <MessageSquare className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Reports',
    path: '/teacher/reports',
    icon: <FileText className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  },
  {
    title: 'Settings',
    path: '/teacher/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_TEACHER', 'TEACHER'],
  }
];

// Define system admin navigation items
const systemAdminItems = [
  {
    title: 'Dashboard',
    path: '/admin/system',
    icon: <LayoutDashboard className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN'],
  },
  {
    title: 'Institutions',
    path: '/admin/system/institutions',
    icon: <School className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN'],
  },
  {
    title: 'Users',
    path: '/admin/system/users',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN'],
  },
  {
    title: 'Settings',
    path: '/admin/system/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN'],
  }
];

// Define campus admin navigation items
const campusAdminItems = [
  {
    title: 'Dashboard',
    path: '/admin/campus',
    icon: <LayoutDashboard className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Teachers',
    path: '/admin/campus/teachers',
    icon: <GraduationCap className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Coordinators',
    path: '/admin/campus/coordinators',
    icon: <UserCog className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Students',
    path: '/admin/campus/students',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Classes',
    path: '/admin/campus/classes',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Courses',
    path: '/admin/campus/courses',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  },
  {
    title: 'Settings',
    path: '/admin/campus/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN'],
  }
];

export function Shell({ children, onLogout }: { children: React.ReactNode, onLogout?: () => Promise<void> }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useResponsive();

  // Debug feature flag
  console.log('ENABLE_WORKSHEETS feature flag in Shell:', isFeatureEnabled('ENABLE_WORKSHEETS'));

  const getNavigationItems = () => {
    switch (session?.user?.userType) {
      case 'SYSTEM_ADMIN':
        return systemAdminItems;
      case 'CAMPUS_ADMIN':
        return campusAdminItems;
      case 'CAMPUS_TEACHER':
      case 'TEACHER':
        return teacherNavigationItems;
      default:
        return [];
    }
  };

  // Convert navigation items to bottom nav format
  const navItems = getNavigationItems();

  // For teacher role, ensure AI Content Studio is included in bottom nav
  let bottomNavItems: BottomNavItem[] = [];

  if (session?.user?.userType === 'TEACHER' || session?.user?.userType === 'CAMPUS_TEACHER') {
    // Custom bottom nav for teachers with AI Content Studio
    bottomNavItems = [
      { icon: <Home className="h-5 w-5" />, label: 'Dashboard', href: '/teacher/dashboard' },
      { icon: <Users className="h-5 w-5" />, label: 'Classes', href: '/teacher/classes' },
      { icon: <FileText className="h-5 w-5" />, label: 'AI Studio', href: '/teacher/content-studio' },
      { icon: <Calendar className="h-5 w-5" />, label: 'Schedule', href: '/teacher/schedule' },
      { icon: <ClipboardCheck className="h-5 w-5" />, label: 'Assessments', href: '/teacher/assessments' }
    ];
  } else {
    // Default bottom nav for other roles
    bottomNavItems = navItems
      .slice(0, 5) // Limit to 5 items for bottom nav
      .map(item => ({
        icon: item.icon,
        label: item.title,
        href: item.path
      }));
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <div className="md:block hidden">
        <Sidebar
          items={navItems}
          userType={session?.user?.userType}
          userName={session?.user?.name || 'User'}
          onLogout={onLogout}
        />
      </div>

      {/* Main content without bottom nav padding */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
