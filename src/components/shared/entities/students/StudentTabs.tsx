'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/core/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/core/tabs';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import {
  User,
  BookOpen,
  BarChart,
  Calendar,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Pencil } from './icons';

import {
  StudentData,
  StudentTab,
  UserRole
} from './types';

export interface StudentTabsProps {
  /**
   * Student data
   */
  student: StudentData;

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Title for the tabs container
   */
  title?: string;

  /**
   * Description for the tabs container
   */
  description?: string;

  /**
   * Array of enabled tabs
   * @default ['overview', 'classes', 'performance', 'attendance', 'feedback', 'documents', 'notes']
   */
  enabledTabs?: StudentTab[];

  /**
   * Default active tab
   * @default StudentTab.OVERVIEW
   */
  defaultTab?: StudentTab;

  /**
   * Tab change callback
   */
  onTabChange?: (tab: StudentTab) => void;

  /**
   * Overview tab content
   */
  overviewContent?: React.ReactNode;

  /**
   * Classes tab content
   */
  classesContent?: React.ReactNode;

  /**
   * Performance tab content
   */
  performanceContent?: React.ReactNode;

  /**
   * Attendance tab content
   */
  attendanceContent?: React.ReactNode;

  /**
   * Feedback tab content
   */
  feedbackContent?: React.ReactNode;

  /**
   * Documents tab content
   */
  documentsContent?: React.ReactNode;

  /**
   * Notes tab content
   */
  notesContent?: React.ReactNode;

  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentTabs component with mobile-first design
 *
 * Features:
 * - Role-based tab visibility
 * - Customizable tab content
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <StudentTabs
 *   student={student}
 *   userRole={UserRole.TEACHER}
 *   title="Student Profile"
 *   enabledTabs={[StudentTab.OVERVIEW, StudentTab.ATTENDANCE]}
 *   overviewContent={<StudentOverview student={student} />}
 *   attendanceContent={<StudentAttendance student={student} />}
 * />
 * ```
 */
export const StudentTabs: React.FC<StudentTabsProps> = ({
  // student is used in the interface but not directly in the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  student,
  userRole,
  title,
  description,
  enabledTabs = Object.values(StudentTab),
  defaultTab = StudentTab.OVERVIEW,
  onTabChange,
  overviewContent,
  classesContent,
  performanceContent,
  attendanceContent,
  feedbackContent,
  documentsContent,
  notesContent,
  isLoading = false,
  error,
  className,
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<StudentTab>(defaultTab);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as StudentTab);
    if (onTabChange) {
      onTabChange(value as StudentTab);
    }
  };

  // Filter tabs based on user role
  const visibleTabs = enabledTabs.filter(tab => {
    // Students can't see notes tab
    if (tab === StudentTab.NOTES && userRole === UserRole.STUDENT) {
      return false;
    }

    // Only teachers, coordinators, and admins can see feedback tab
    if (tab === StudentTab.FEEDBACK && userRole === UserRole.STUDENT) {
      return false;
    }

    return true;
  });

  // Get tab icon
  const getTabIcon = (tab: StudentTab) => {
    switch (tab) {
      case StudentTab.OVERVIEW:
        return <User className="h-4 w-4 mr-2" />;
      case StudentTab.CLASSES:
        return <BookOpen className="h-4 w-4 mr-2" />;
      case StudentTab.PERFORMANCE:
        return <BarChart className="h-4 w-4 mr-2" />;
      case StudentTab.ATTENDANCE:
        return <Calendar className="h-4 w-4 mr-2" />;
      case StudentTab.FEEDBACK:
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case StudentTab.DOCUMENTS:
        return <FileText className="h-4 w-4 mr-2" />;
      case StudentTab.NOTES:
        return <Pencil className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  // Get tab label
  const getTabLabel = (tab: StudentTab) => {
    switch (tab) {
      case StudentTab.OVERVIEW:
        return 'Overview';
      case StudentTab.CLASSES:
        return 'Classes';
      case StudentTab.PERFORMANCE:
        return 'Performance';
      case StudentTab.ATTENDANCE:
        return 'Attendance';
      case StudentTab.FEEDBACK:
        return 'Feedback';
      case StudentTab.DOCUMENTS:
        return 'Documents';
      case StudentTab.NOTES:
        return 'Notes';
      default:
        return '';
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <Skeleton className="h-8 w-64 mb-2" />}
            {description && <Skeleton className="h-4 w-48" />}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 mb-6">
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab} value={tab} className="flex items-center">
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">{getTabLabel(tab).substring(0, 3)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.includes(StudentTab.OVERVIEW) && (
            <TabsContent value={StudentTab.OVERVIEW}>
              {overviewContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No overview information available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.CLASSES) && (
            <TabsContent value={StudentTab.CLASSES}>
              {classesContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No class information available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.PERFORMANCE) && (
            <TabsContent value={StudentTab.PERFORMANCE}>
              {performanceContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.ATTENDANCE) && (
            <TabsContent value={StudentTab.ATTENDANCE}>
              {attendanceContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance data available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.FEEDBACK) && (
            <TabsContent value={StudentTab.FEEDBACK}>
              {feedbackContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.DOCUMENTS) && (
            <TabsContent value={StudentTab.DOCUMENTS}>
              {documentsContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No documents available.
                </div>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes(StudentTab.NOTES) && (
            <TabsContent value={StudentTab.NOTES}>
              {notesContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No notes available.
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentTabs;
