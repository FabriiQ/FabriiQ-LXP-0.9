'use client';

import React, { useState, useEffect } from 'react'; // Ensure useEffect is imported
import { TeacherHeader } from '../navigation/TeacherHeader';
// import { TeacherBottomNav } from '../navigation/TeacherBottomNav'; // TeacherBottomNav is not used in the provided code
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { useOfflineSupport } from '@/features/teacher/offline/hooks';
import { OfflineIndicator } from '@/features/teacher/offline/components';
import { useToast } from '@/components/ui/use-toast';
import { TeacherAssistantProvider, TeacherAssistantComponents } from '@/features/teacher-assistant';
import { registerSpecificServiceWorker } from '@/utils/register-sw';

interface TeacherLayoutProps {
  children: React.ReactNode;
  teacherId: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
  currentClassId?: string;
  title?: string;
  className?: string;
}

/**
 * TeacherLayout component for the teacher portal
 *
 * Features:
 * - Mobile-first responsive design
 * - Header with class selector and profile menu
 * - Main content area with appropriate padding
 */
export function TeacherLayout({
  children,
  teacherId,
  userName,
  userEmail,
  userImage,
  currentClassId,
  title,
  className,
}: TeacherLayoutProps) {
  // const { isMobile } = useResponsive(); // isMobile is not used in the provided code
  const { toast } = useToast();
  // const [showOfflineIndicator, setShowOfflineIndicator] = useState(true); // Removed

  useEffect(() => {
    // Register the teacher-specific service worker
    registerSpecificServiceWorker('/service-worker.js');
  }, []); // Empty dependency array ensures this runs once on mount

  // Set up offline support
  const { isOffline, syncStatus, syncProgress } = useOfflineSupport({
    teacherId,
    enabled: true,
    config: { autoSync: true },
    onStatusChange: (offline) => {
      if (offline) {
        toast({
          title: "You're offline",
          description: "You can still work. Your changes will be saved and synced when you reconnect.",
          variant: "warning",
          duration: 5000,
        });
      } else {
        toast({
          title: "You're back online",
          description: "Your data will be synced automatically.",
          variant: "default",
          duration: 3000,
        });
      }
    }
  });

  return (
    <TeacherAssistantProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Show offline banner at the top - always rely on this banner */}
        <OfflineIndicator
          variant="banner"
          position="top"
          showSyncStatus={true}
        />

        <TeacherHeader
          teacherId={teacherId}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          currentClassId={currentClassId}
          title={title}
          isOffline={isOffline}
        />

        <main
          className={cn(
            "flex-1 container mx-auto",
            "px-4 py-4 md:px-6 md:py-6", // Consistent spacing per UX guidelines
            "max-w-screen-xl", // Max width for large screens
            className
          )}
          id="main-content"
          tabIndex={-1} // For accessibility, allows skipping to main content
        >
          {children}
        </main>

        {/* Floating indicator removed as showOfflineIndicator state was removed.
            If a floating indicator is desired under different conditions,
            new state logic would be needed.
        */}
        {/*
        {!showOfflineIndicator && (
          <OfflineIndicator
            variant="floating"
            position="bottom"
            showSyncStatus={true}
          />
        )}
        */}

        {/* Teacher Assistant Components */}
        <TeacherAssistantComponents />
      </div>
    </TeacherAssistantProvider>
  );
}
