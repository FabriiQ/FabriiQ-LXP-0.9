'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassData, ClassCardViewMode, UserRole, ClassAction } from './types';
import { Skeleton } from '@/components/ui/atoms/skeleton';

export interface ClassCardProps {
  /**
   * Class data to display
   */
  classData: ClassData;
  
  /**
   * View mode for the card
   * @default 'full'
   */
  viewMode?: ClassCardViewMode;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of allowed actions
   * @default []
   */
  actions?: ClassAction[];
  
  /**
   * Optional callback for card click
   */
  onClick?: (classData: ClassData) => void;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
}

/**
 * ClassCard component with mobile-first design
 * 
 * Features:
 * - Role-specific rendering
 * - Multiple view modes (full, compact, mobile)
 * - Status indicator
 * - Action buttons
 * - Loading state
 * 
 * @example
 * ```tsx
 * <ClassCard 
 *   classData={classData}
 *   viewMode="full"
 *   userRole={UserRole.TEACHER}
 *   actions={[ClassAction.VIEW, ClassAction.EDIT]}
 * />
 * ```
 */
export const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  viewMode = 'full',
  userRole,
  actions = [],
  onClick,
  className,
  isLoading = false,
}) => {
  if (isLoading) {
    return <ClassCardSkeleton viewMode={viewMode} />;
  }

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

  // Get action button based on user role
  const getActionButtons = () => {
    // Base URL for actions based on user role
    const getBaseUrl = () => {
      switch (userRole) {
        case UserRole.SYSTEM_ADMIN:
          return `/admin/system/classes/${classData.id}`;
        case UserRole.CAMPUS_ADMIN:
          return `/admin/campus/classes/${classData.id}`;
        case UserRole.COORDINATOR:
          return `/admin/coordinator/classes/${classData.id}`;
        case UserRole.TEACHER:
          return `/teacher/classes/${classData.id}`;
        case UserRole.STUDENT:
          return `/student/classes/${classData.id}`;
        default:
          return `/classes/${classData.id}`;
      }
    };

    // Filter actions based on user role
    const filteredActions = actions.filter(action => {
      // System admin can do everything
      if (userRole === UserRole.SYSTEM_ADMIN) return true;
      
      // Campus admin can't delete but can do most things
      if (userRole === UserRole.CAMPUS_ADMIN) {
        return action !== ClassAction.DELETE;
      }
      
      // Coordinator has limited actions
      if (userRole === UserRole.COORDINATOR) {
        return [
          ClassAction.VIEW, 
          ClassAction.EXPORT, 
          ClassAction.PRINT,
          ClassAction.MESSAGE_STUDENTS
        ].includes(action);
      }
      
      // Teacher has teaching-related actions
      if (userRole === UserRole.TEACHER) {
        return [
          ClassAction.VIEW, 
          ClassAction.TAKE_ATTENDANCE, 
          ClassAction.GRADE_ASSESSMENTS,
          ClassAction.MESSAGE_STUDENTS
        ].includes(action);
      }
      
      // Student has limited actions
      if (userRole === UserRole.STUDENT) {
        return [ClassAction.VIEW].includes(action);
      }
      
      return false;
    });

    // Only show primary action in compact mode
    if (viewMode === 'compact' && filteredActions.length > 0) {
      const primaryAction = filteredActions[0];
      return (
        <Button 
          variant="default" 
          size="sm" 
          asChild
          className="w-full"
        >
          <Link href={`${getBaseUrl()}${primaryAction === ClassAction.VIEW ? '' : `/${primaryAction}`}`}>
            {primaryAction === ClassAction.VIEW ? 'View Details' : primaryAction.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Link>
        </Button>
      );
    }

    // Show all actions in full mode
    return filteredActions.map(action => (
      <Button 
        key={action} 
        variant={action === ClassAction.VIEW ? "default" : "outline"} 
        size="sm" 
        asChild
      >
        <Link href={`${getBaseUrl()}${action === ClassAction.VIEW ? '' : `/${action}`}`}>
          {action === ClassAction.VIEW ? 'View Details' : action.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Link>
      </Button>
    ));
  };

  // Render card based on view mode
  const renderCardContent = () => {
    // Common elements
    const statusBadge = (
      <Badge variant={getStatusBadgeVariant(classData.status)}>
        {formatStatus(classData.status)}
      </Badge>
    );

    const title = (
      <CardTitle className={cn(
        "text-base font-semibold line-clamp-1",
        viewMode === 'compact' && "text-sm"
      )}>
        {classData.name}
      </CardTitle>
    );

    const code = (
      <CardDescription className="text-xs">
        <div className="flex items-center">
          <BookOpen className="h-3 w-3 mr-1" />
          {classData.code}
        </div>
      </CardDescription>
    );

    // Compact view
    if (viewMode === 'compact') {
      return (
        <>
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              {title}
              {statusBadge}
            </div>
            {code}
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-2">
            <div className="text-xs text-muted-foreground space-y-1">
              {classData.courseCampus?.course && (
                <div className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {classData.courseCampus.course.name}
                </div>
              )}
              {classData._count?.students !== undefined && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {classData._count.students} Students
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-2">
            {getActionButtons()}
          </CardFooter>
        </>
      );
    }

    // Mobile view
    if (viewMode === 'mobile') {
      return (
        <>
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              {title}
              {statusBadge}
            </div>
            {code}
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-2">
            <div className="text-xs text-muted-foreground space-y-1">
              {classData.courseCampus?.course && (
                <div className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {classData.courseCampus.course.name}
                </div>
              )}
              {classData._count?.students !== undefined && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {classData._count.students} Students
                </div>
              )}
              {classData.term && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {classData.term.name}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-2 flex flex-wrap gap-2">
            {getActionButtons()}
          </CardFooter>
        </>
      );
    }

    // Full view (default)
    return (
      <>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            {title}
            {statusBadge}
          </div>
          {code}
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-2">
          <div className="text-xs text-muted-foreground space-y-1">
            {classData.courseCampus?.course && (
              <div className="flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                {classData.courseCampus.course.name}
              </div>
            )}
            {classData._count?.students !== undefined && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {classData._count.students} Students
              </div>
            )}
            {classData.term && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {classData.term.name}
              </div>
            )}
            {classData.facility && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {classData.facility.name}
              </div>
            )}
            {classData.classTeacher?.user?.name && (
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Teacher: {classData.classTeacher.user.name}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-2 flex flex-wrap gap-2">
          {getActionButtons()}
        </CardFooter>
      </>
    );
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden h-full transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick ? () => onClick(classData) : undefined}
    >
      {renderCardContent()}
    </Card>
  );
};

/**
 * Skeleton loader for ClassCard
 */
const ClassCardSkeleton: React.FC<{ viewMode?: ClassCardViewMode }> = ({ viewMode = 'full' }) => {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {viewMode === 'full' && (
            <>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        {viewMode === 'compact' ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
