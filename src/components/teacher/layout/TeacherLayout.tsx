'use client';

import React, { useState } from 'react';
import { TeacherHeader } from '../navigation/TeacherHeader';
import { TeacherBottomNav } from '../navigation/TeacherBottomNav';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { useOfflineSupport } from '@/features/teacher/offline/hooks';
import { OfflineIndicator } from '@/features/teacher/offline/components';
import { useToast } from '@/components/ui/use-toast';
import { TeacherAssistantProvider, TeacherAssistantComponents } from '@/features/teacher-assistant';

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
 * - Bottom navigation for mobile
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
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(true);

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
        {/* Show offline banner at the top */}
        {showOfflineIndicator && (
          <OfflineIndicator
            variant="banner"
            position="top"
            showSyncStatus={true}
          />
        )}

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

        {/* Show floating indicator for sync status */}
        {!showOfflineIndicator && (
          <OfflineIndicator
            variant="floating"
            position="bottom"
            showSyncStatus={true}
          />
        )}

        {/* Teacher Assistant Components */}
        <TeacherAssistantComponents />
      </div>
    </TeacherAssistantProvider>
  );
}
