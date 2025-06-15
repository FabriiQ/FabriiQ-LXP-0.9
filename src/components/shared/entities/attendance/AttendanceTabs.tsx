'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/core/tabs';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from './types';
import { AttendanceGrid } from './AttendanceGrid';
import { AttendanceAnalytics } from './AttendanceAnalytics';
import { StudentAttendanceProfile } from './StudentAttendanceProfile';

export interface AttendanceTabsProps {
  /**
   * Title for the tabs container
   */
  title: string;
  
  /**
   * Description for the tabs container
   */
  description?: string;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of tabs to display
   * @default ['overview', 'byClass', 'byStudent']
   */
  tabs?: ('overview' | 'byClass' | 'byStudent')[];
  
  /**
   * Default active tab
   * @default 'overview'
   */
  defaultTab?: 'overview' | 'byClass' | 'byStudent';
  
  /**
   * Tab change callback
   */
  onTabChange?: (tab: string) => void;
  
  /**
   * Children components to render in each tab
   */
  children?: React.ReactNode;
  
  /**
   * Overview tab content
   */
  overviewContent?: React.ReactNode;
  
  /**
   * By Class tab content
   */
  byClassContent?: React.ReactNode;
  
  /**
   * By Student tab content
   */
  byStudentContent?: React.ReactNode;
  
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
 * AttendanceTabs component with mobile-first design
 * 
 * Features:
 * - Role-based tab visibility
 * - Responsive design
 * - Multiple tab views (overview, by class, by student)
 * 
 * @example
 * ```tsx
 * <AttendanceTabs 
 *   title="Attendance Dashboard"
 *   userRole={UserRole.TEACHER}
 *   overviewContent={<AttendanceAnalytics {...props} />}
 *   byClassContent={<AttendanceGrid {...props} />}
 *   byStudentContent={<StudentAttendanceProfile {...props} />}
 * />
 * ```
 */
export const AttendanceTabs: React.FC<AttendanceTabsProps> = ({
  title,
  description,
  userRole,
  tabs = ['overview', 'byClass', 'byStudent'],
  defaultTab = 'overview',
  onTabChange,
  children,
  overviewContent,
  byClassContent,
  byStudentContent,
  isLoading = false,
  error,
  className,
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => {
    if (tab === 'byStudent' && userRole === UserRole.STUDENT) {
      return false;
    }
    return true;
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
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
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 mb-6">
            {visibleTabs.includes('overview') && (
              <TabsTrigger value="overview">Overview</TabsTrigger>
            )}
            {visibleTabs.includes('byClass') && (
              <TabsTrigger value="byClass">By Class</TabsTrigger>
            )}
            {visibleTabs.includes('byStudent') && (
              <TabsTrigger value="byStudent">By Student</TabsTrigger>
            )}
          </TabsList>
          
          {visibleTabs.includes('overview') && (
            <TabsContent value="overview">
              {overviewContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No overview content provided.
                </div>
              )}
            </TabsContent>
          )}
          
          {visibleTabs.includes('byClass') && (
            <TabsContent value="byClass">
              {byClassContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No class content provided.
                </div>
              )}
            </TabsContent>
          )}
          
          {visibleTabs.includes('byStudent') && (
            <TabsContent value="byStudent">
              {byStudentContent || (
                <div className="text-center py-8 text-muted-foreground">
                  No student content provided.
                </div>
              )}
            </TabsContent>
          )}
          
          {children}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AttendanceTabs;
