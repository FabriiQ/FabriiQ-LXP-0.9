'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface ClassNavigationProps {
  classId: string;
  activeTab?: string;
}

/**
 * ClassNavigation component for class-specific navigation
 * 
 * Features:
 * - Hideable on both mobile and desktop
 * - Saves state in localStorage
 * - Responsive design
 */
export function ClassNavigation({ classId, activeTab }: ClassNavigationProps) {
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const [navVisible, setNavVisible] = useState(true);

  // Load visibility state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('class-nav-visible');
      if (savedState !== null) {
        setNavVisible(savedState === 'true');
      } else {
        // Default to visible on desktop, hidden on mobile
        setNavVisible(!isMobile);
      }
    }
  }, [isMobile]);

  // Save visibility state to localStorage when it changes
  const toggleNavVisibility = () => {
    const newState = !navVisible;
    setNavVisible(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('class-nav-visible', String(newState));
    }
  };

  // Define navigation tabs
  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/teacher/classes/${classId}`,
    },
    {
      id: 'students',
      name: 'Students',
      href: `/teacher/classes/${classId}/students`,
    },
    {
      id: 'lesson-plans',
      name: 'Lesson Plans',
      href: `/teacher/classes/${classId}/lesson-plans`,
    },
    {
      id: 'activities',
      name: 'Activities',
      href: `/teacher/classes/${classId}/activities`,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      href: `/teacher/classes/${classId}/assessments`,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      href: `/teacher/classes/${classId}/analytics`,
    },
    {
      id: 'bloom-analytics',
      name: 'Bloom\'s Analytics',
      href: `/teacher/classes/${classId}/bloom-analytics`,
    },
  ];

  return (
    <>
      {/* Toggle button - visible on both mobile and desktop */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed z-50 shadow-md bg-background transition-all duration-300",
          isMobile ? "top-4 left-4" : "top-4 left-4"
        )}
        onClick={toggleNavVisibility}
        aria-label={navVisible ? "Hide navigation" : "Show navigation"}
      >
        {navVisible ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Navigation sidebar */}
      <div className={cn(
        'transition-all duration-300 ease-in-out fixed top-0 left-0 z-40 h-full bg-background shadow-lg border-r',
        navVisible ? 'translate-x-0' : '-translate-x-full',
        'w-64 pt-16'
      )}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Class Navigation</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <ul className="space-y-1 p-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab || pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <li key={tab.id}>
                  <Link
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    )}
                    onClick={isMobile ? toggleNavVisibility : undefined}
                  >
                    {tab.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main content padding to account for the navigation */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        navVisible ? 'ml-64' : 'ml-0'
      )}>
        {/* This is where the children would go */}
      </div>
    </>
  );
}
