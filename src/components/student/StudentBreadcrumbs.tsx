'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/navigation/breadcrumbs';
import { generateStudentBreadcrumbs } from '@/utils/navigation-utils';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

interface StudentBreadcrumbsProps {
  className?: string;
  classId?: string;
  classDisplayName?: string;
  subjectName?: string;
  activityName?: string;
  showHomeIcon?: boolean;
}

/**
 * StudentBreadcrumbs - A breadcrumb navigation component for student pages
 *
 * Features:
 * - Automatically generates breadcrumbs based on current path
 * - Provides context awareness for deep navigation
 * - Reduces disorientation with clear path indicators
 * - Supports view transitions for smooth navigation
 * - Optimized for mobile with responsive design
 */
export function StudentBreadcrumbs({
  className,
  classId,
  classDisplayName,
  subjectName,
  activityName,
  showHomeIcon = true
}: StudentBreadcrumbsProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Extract class ID from path if not provided
  const extractedClassId = classId || (pathname ? pathname.match(/\/class(?:es)?\/([^\/]+)/)?.[1] : undefined);

  // Generate breadcrumbs
  const breadcrumbs = generateStudentBreadcrumbs(
    pathname || '',
    classDisplayName,
    subjectName,
    activityName
  );

  // Fade in breadcrumbs for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't show breadcrumbs on the classes list page
  if (pathname === '/student/classes') {
    return null;
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <Breadcrumbs
        items={breadcrumbs}
        showHomeIcon={showHomeIcon}
        homeHref="/student/classes"
        className="text-xs md:text-sm"
      />
    </div>
  );
}
