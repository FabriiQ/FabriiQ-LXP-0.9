'use client';

import React, { useEffect } from 'react';
import { CoordinatorBottomNav } from '@/components/coordinator/CoordinatorBottomNav';
import { CoordinatorMobileHeader } from '@/components/coordinator/CoordinatorMobileHeader';
import { OfflineIndicator } from '@/components/coordinator/OfflineIndicator';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { usePathname } from 'next/navigation';
import { registerServiceWorker } from '@/features/coordinator/offline/register-sw';

/**
 * Coordinator Layout Component
 *
 * This layout is used for all coordinator pages.
 * It inherits from the admin layout but adds mobile-specific navigation.
 * It also includes offline support and service worker registration.
 */
export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsive();
  const pathname = usePathname();

  // Determine if we should show back button based on path
  const showBackButton = pathname !== '/admin/coordinator' && isMobile;

  // Determine back URL based on path segments
  const pathSegments = pathname ? pathname.split('/') : [];
  const backUrl = pathSegments.length > 3
    ? `/${pathSegments.slice(1, 3).join('/')}`
    : '/admin/coordinator';

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="w-full">
      {/* Mobile header - only shown on mobile */}
      {isMobile && (
        <CoordinatorMobileHeader
          showBackButton={showBackButton}
          backUrl={backUrl}
        />
      )}

      {/* Offline indicator - shown when offline */}
      <OfflineIndicator variant="banner" />

      {/* Main content with padding for bottom nav on mobile */}
      <div className="pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom navigation - only shown on mobile */}
      {isMobile && <CoordinatorBottomNav />}
    </div>
  );
}
