'use client';

import React from 'react';
import { AdminSidebar } from '@/components/navigation/AdminSidebar';
import { useResponsive } from '@/lib/hooks/use-responsive';

/**
 * Admin Layout Component
 *
 * This layout is used for all admin pages and provides role-based navigation.
 * This is a reusable version of the main admin layout.
 */
export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsive();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* AdminSidebar will return null on mobile */}
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
