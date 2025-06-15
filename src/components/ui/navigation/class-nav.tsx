'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/use-responsive';

export interface ClassNavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
}

interface ClassNavProps {
  tabs: ClassNavItem[];
  className?: string;
}

export function ClassNav({ tabs, className }: ClassNavProps) {
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const [navVisible, setNavVisible] = useState(true);

  // Load visibility state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('class-nav-visible');
      if (savedState !== null) {
        setNavVisible(savedState === 'true');
      } else if (isMobile) {
        // Default to hidden on mobile if no preference is saved
        setNavVisible(false);
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

  // Render the toggle button
  const renderToggleButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="fixed top-16 left-4 z-50 shadow-md bg-background"
      onClick={toggleNavVisibility}
      aria-label={navVisible ? "Hide navigation" : "Show navigation"}
    >
      {navVisible ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </Button>
  );

  // Render the navigation items
  const renderNavItems = (onClick?: () => void) => (
    <ul className="space-y-1 p-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

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
              onClick={onClick}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Toggle button - visible on both mobile and desktop */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 shadow-md bg-background"
        onClick={toggleNavVisibility}
        aria-label={navVisible ? "Hide navigation" : "Show navigation"}
      >
        {navVisible ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Navigation sidebar */}
      <div className={cn(
        'transition-all duration-300 ease-in-out fixed top-0 left-0 z-40 h-full bg-background shadow-lg border-r',
        'w-64 pt-16',
        navVisible ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Class Navigation</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {renderNavItems(() => toggleNavVisibility())}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && navVisible && (
        <div
          className="fixed inset-0 z-30 bg-black/30 transition-opacity"
          onClick={toggleNavVisibility}
          aria-hidden="true"
        />
      )}

      {/* Main content padding to account for the navigation */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        navVisible && !isMobile ? 'ml-64' : 'ml-0'
      )}>
        {/* This is where the children would go */}
      </div>
    </>
  );
}
