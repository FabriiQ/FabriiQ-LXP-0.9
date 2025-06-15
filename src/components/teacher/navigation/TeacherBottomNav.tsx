'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { InstitutionNavigationLink } from '@/components/ui/navigation/institution-navigation-link';
import {
  Home,
  Users,
  FileText,
  Calendar,
  ClipboardList
} from 'lucide-react';

/**
 * TeacherBottomNav component for mobile navigation in the teacher portal
 *
 * Features:
 * - Fixed position at bottom of screen
 * - Touch-friendly navigation items
 * - Visual indicators for active state
 * - Optimized for mobile use
 */
export function TeacherBottomNav() {
  const pathname = usePathname() || '';

  // Navigation items for teacher
  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: '/teacher/dashboard'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Classes',
      href: '/teacher/classes'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'AI Studio',
      href: '/teacher/content-studio'
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Schedule',
      href: '/teacher/schedule'
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Assessments',
      href: '/teacher/assessments'
    }
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-2 md:hidden',
        'pb-safe', // Add safe area padding for notched devices
        'shadow-[0_-2px_10px_rgba(0,0,0,0.05)]', // Add subtle shadow on top
        'backdrop-blur-sm bg-background/95' // Add blur effect for modern look
      )}
      aria-label="Teacher navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <InstitutionNavigationLink
            key={item.href}
            href={item.href}
            ariaLabel={item.label}
            className={cn(
              'flex h-full w-full flex-col items-center justify-center space-y-1 px-2 py-1 transition-colors',
              'min-h-[48px] min-w-[48px]', // Increased touch target size for better accessibility
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            activeClassName="text-primary"
            hapticFeedback={true}
            showLoadingIndicator={false}
            preserveScroll={true}
          >
            <div className={cn(
              'h-6 w-6 transition-transform duration-100',
              isActive ? 'text-primary scale-110' : 'text-muted-foreground'
            )}>
              {item.icon}
            </div>
            <span className={cn(
              "text-xs font-medium transition-colors",
              isActive && "font-semibold"
            )}>
              {item.label}
            </span>
          </InstitutionNavigationLink>
        );
      })}
    </nav>
  );
}
