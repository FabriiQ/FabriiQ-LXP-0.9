'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { MobileNav, MobileNavItem } from '@/components/ui/composite/mobile-nav';

interface ClassNavTab {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
}

interface ClassBottomNavProps {
  tabs: ClassNavTab[];
  className?: string;
}

/**
 * ClassBottomNav component for class-specific navigation on mobile
 *
 * Features:
 * - Shows class navigation items in the bottom bar on mobile
 * - Automatically hides on desktop
 * - Highlights the active tab
 */
export function ClassBottomNav({ tabs, className }: ClassBottomNavProps) {
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }

  // Convert tabs to MobileNavItems
  const navItems: MobileNavItem[] = tabs.map(tab => {
    const Icon = tab.icon;
    return {
      id: tab.id,
      label: tab.name,
      icon: <Icon size={20} />,
      href: tab.href,
      // Use the navigation system for consistent navigation
      useNavigation: true
    };
  });

  // Limit to 5 items for bottom nav
  const limitedNavItems = navItems.slice(0, 5);

  // Find active item ID
  const activeItemId = tabs.find(tab => pathname === tab.href)?.id;

  return (
    <MobileNav
      items={limitedNavItems}
      activeItemId={activeItemId}
      role="teacher"
      className={cn("z-[100]", className)} // Higher z-index to override main navigation
    />
  );
}
