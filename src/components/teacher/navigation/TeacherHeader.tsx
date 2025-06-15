'use client';

import React from 'react';
import { ClassSelector } from './ClassSelector';
import { ProfileMenu } from '../profile/ProfileMenu';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface TeacherHeaderProps {
  teacherId: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
  currentClassId?: string;
  title?: string;
  className?: string;
  isOffline?: boolean;
}

/**
 * TeacherHeader component for the teacher portal
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Class selector integration
 * - Profile menu integration
 * - Customizable title
 */
export function TeacherHeader({
  teacherId,
  userName,
  userEmail,
  userImage,
  currentClassId,
  title = 'Teacher Dashboard',
  className,
  isOffline = false,
}: TeacherHeaderProps) {
  const { isMobile } = useResponsive();

  return (
    <header className={cn(
      "sticky top-0 z-10 w-full border-b bg-background px-4 md:px-6",
      isMobile ? "pb-3" : "h-16", // Allow height to expand on mobile for class selector
      className
    )}>
      <div className="flex h-14 md:h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold truncate text-primary-foreground">{title}</h1>
            {isOffline && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Offline
              </span>
            )}
          </div>
          {!isMobile && <ClassSelector teacherId={teacherId} currentClassId={currentClassId} />}
        </div>
        <ProfileMenu
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          isOffline={isOffline}
        />
      </div>

      {/* Mobile-only class selector */}
      {isMobile && (
        <div className="mt-1">
          <ClassSelector teacherId={teacherId} currentClassId={currentClassId} />
        </div>
      )}
    </header>
  );
}
