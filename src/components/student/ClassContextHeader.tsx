'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/navigation/breadcrumbs';
import {
  extractClassIdFromPath,
  getClassPageSection,
  generateClassBreadcrumbs
} from '@/utils/path-utils';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Calendar,
  Award, // Using Award instead of Trophy
  Users,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { useClass } from '@/contexts/class-context';

interface ClassContextHeaderProps {
  className?: string;
  onBack?: () => void;
}

/**
 * ClassContextHeader component for displaying contextual information about the current class
 *
 * Features:
 * - Breadcrumb navigation for context awareness
 * - Visual indicators for current section
 * - Back button for easy navigation
 * - Consistent styling with the rest of the application
 */
export function ClassContextHeader({ className, onBack }: ClassContextHeaderProps) {
  const pathname = usePathname() || '';
  const { className: currentClassName, data } = useClass();

  // Get the primary subject for this class (using courseName as fallback)
  // Note: We'll need to update the class-context to include subjects data
  const subject = { name: data?.courseName || 'Course' };

  const classId = extractClassIdFromPath(pathname) || '';
  const section = getClassPageSection(pathname) || 'overview';

  // Generate breadcrumbs for the current path
  const breadcrumbs = generateClassBreadcrumbs(pathname, currentClassName || 'Class');

  // Get the appropriate icon for the current section
  const getSectionIcon = () => {
    switch(section) {
      case 'dashboard':
        return <BookOpen className="h-5 w-5" />;
      case 'activities':
        return <FileText className="h-5 w-5" />;
      case 'leaderboard':
        return <Award className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'students':
        return <Users className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div className={cn("space-y-2 pb-2", className)}>
      {/* Breadcrumbs for context */}
      <Breadcrumbs
        items={breadcrumbs}
        className="text-xs"
        showHomeIcon={true}
      />

      {/* Class header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <ViewTransitionLink
            href="/student/classes"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            ariaLabel="Back to classes"
            hapticFeedback={true}
          >
            <ChevronLeft className="h-4 w-4" />
          </ViewTransitionLink>

          {/* Class name and subject */}
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              {getSectionIcon()}
              <span className="capitalize">
                {section === 'overview' ? currentClassName : section}
              </span>
            </h1>
            {subject && (
              <p className="text-sm text-muted-foreground">
                {subject.name} • {currentClassName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassContextHeader;
