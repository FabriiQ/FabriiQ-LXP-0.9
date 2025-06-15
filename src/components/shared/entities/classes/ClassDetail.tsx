'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BookOpen, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassData, UserRole, ClassAction } from './types';
import { ClassTabs } from './ClassTabs';
import { ClassActions } from './ClassActions';
import { TabsContent } from '@/components/ui/tabs';

export interface ClassDetailProps {
  /**
   * Class data to display
   */
  classData: ClassData;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of enabled tabs
   * @default []
   */
  tabs?: string[];
  
  /**
   * Array of allowed actions
   * @default []
   */
  actions?: ClassAction[];
  
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
   * Tab change callback
   */
  onTabChange?: (tabId: string) => void;
  
  /**
   * Action callback
   */
  onAction?: (action: ClassAction, classData: ClassData) => void;
  
  /**
   * Children to render in the tab content
   */
  children?: React.ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ClassDetail component with mobile-first design
 * 
 * Features:
 * - Role-specific rendering
 * - Tabbed interface for different views
 * - Action buttons
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * <ClassDetail 
 *   classData={classData}
 *   userRole={UserRole.TEACHER}
 *   tabs={['overview', 'students', 'attendance']}
 *   actions={[ClassAction.EDIT, ClassAction.TAKE_ATTENDANCE]}
 *   onTabChange={handleTabChange}
 *   onAction={handleAction}
 * >
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="students">Students content</TabsContent>
 *   <TabsContent value="attendance">Attendance content</TabsContent>
 * </ClassDetail>
 * ```
 */
export const ClassDetail: React.FC<ClassDetailProps> = ({
  classData,
  userRole,
  tabs = [],
  actions = [],
  isLoading = false,
  error,
  onTabChange,
  onAction,
  children,
  className,
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(tabs.length > 0 ? tabs[0] : 'overview');
  
  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };
  
  // Get status badge variant based on class status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'UPCOMING':
        return 'warning';
      case 'COMPLETED':
        return 'secondary';
      case 'INACTIVE':
        return 'outline';
      case 'ARCHIVED':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  // Format status text (e.g., "ACTIVE" -> "Active")
  const formatStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs skeleton */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <Skeleton className="h-10 w-24 mx-2" />
            <Skeleton className="h-10 w-24 mx-2" />
            <Skeleton className="h-10 w-24 mx-2" />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
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
    <div className={cn("space-y-6", className)}>
      {/* Class header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">{classData.name}</CardTitle>
              <CardDescription>{classData.code}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(classData.status)}>
                {formatStatus(classData.status)}
              </Badge>
              <ClassActions
                classData={classData}
                userRole={userRole}
                enabledActions={actions}
                onAction={onAction}
                placement="detail"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {classData.courseCampus?.course && (
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Course:</span>
                <span className="ml-2">{classData.courseCampus.course.name}</span>
              </div>
            )}
            
            {classData._count?.students !== undefined && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Students:</span>
                <span className="ml-2">{classData._count.students}</span>
              </div>
            )}
            
            {classData.term && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Term:</span>
                <span className="ml-2">{classData.term.name}</span>
              </div>
            )}
            
            {classData.facility && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Facility:</span>
                <span className="ml-2">{classData.facility.name}</span>
              </div>
            )}
            
            {classData.classTeacher?.user?.name && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Teacher:</span>
                <span className="ml-2">{classData.classTeacher.user.name}</span>
              </div>
            )}
            
            {/* Capacity */}
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Capacity:</span>
              <span className="ml-2">
                {classData.currentCount} / {classData.maxCapacity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <ClassTabs
        classData={classData}
        userRole={userRole}
        enabledTabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {children}
      </ClassTabs>
    </div>
  );
};

export default ClassDetail;
