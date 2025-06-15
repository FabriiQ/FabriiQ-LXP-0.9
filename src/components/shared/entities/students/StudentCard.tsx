'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/core/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/core/avatar';
import { Badge } from '@/components/ui/core/badge';
import { Button } from '@/components/ui/core/button';
// TODO: Fix Progress import
// import { Progress } from '@/components/ui/core/progress';
import { Skeleton } from '@/components/ui/core/skeleton';
import {
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { Phone, Minus } from './icons';
import { cn } from '@/lib/utils';
import {
  StudentData,
  StudentStatus,
  StudentAction,
  StudentViewMode,
  UserRole
} from './types';

export interface StudentCardProps {
  /**
   * Student data
   */
  student: StudentData;

  /**
   * View mode for the card
   * @default 'full'
   */
  viewMode?: StudentViewMode;

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Array of allowed actions
   */
  actions?: StudentAction[];

  /**
   * Action callback
   */
  onAction?: (action: StudentAction, student: StudentData) => void;

  /**
   * Click callback
   */
  onClick?: (student: StudentData) => void;

  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentCard component with mobile-first design
 *
 * Features:
 * - Role-based rendering
 * - Multiple view modes (full, compact, mobile)
 * - Status indicators
 * - Performance metrics
 *
 * @example
 * ```tsx
 * <StudentCard
 *   student={student}
 *   viewMode="full"
 *   userRole={UserRole.TEACHER}
 *   actions={[StudentAction.VIEW, StudentAction.EDIT]}
 *   onAction={handleAction}
 * />
 * ```
 */
export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  viewMode = 'full',
  userRole,
  actions = [],
  onAction,
  onClick,
  isLoading = false,
  className,
}) => {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format score for display
  const formatScore = (score?: number) => {
    if (score === undefined) return 'N/A';
    return `${score.toFixed(1)}%`;
  };

  // Get progress value for progress bar
  const getProgressValue = (score?: number) => {
    if (score === undefined) return 0;
    return Math.max(0, Math.min(100, score));
  };

  // Get status badge variant
  const getStatusVariant = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.ACTIVE:
        return 'success';
      case StudentStatus.INACTIVE:
        return 'secondary';
      case StudentStatus.SUSPENDED:
        return 'destructive';
      case StudentStatus.GRADUATED:
        return 'default';
      case StudentStatus.WITHDRAWN:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get leaderboard trend icon
  const getLeaderboardTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  // Handle action click
  const handleActionClick = (action: StudentAction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(action, student);
    }
  };

  // Handle card click
  const handleCardClick = () => {
    if (onClick) {
      onClick(student);
    }
  };

  // Determine which actions to show based on user role
  const visibleActions = actions.filter(action => {
    switch (userRole) {
      case UserRole.SYSTEM_ADMIN:
        // System admin can perform all actions
        return true;
      case UserRole.CAMPUS_ADMIN:
        // Campus admin can't perform system-level actions
        return action !== StudentAction.DELETE;
      case UserRole.COORDINATOR:
        // Coordinator can only perform academic-related actions
        return [
          StudentAction.VIEW,
          StudentAction.EDIT,
          StudentAction.PROVIDE_FEEDBACK,
          StudentAction.VIEW_ATTENDANCE,
          StudentAction.VIEW_PERFORMANCE,
          StudentAction.SEND_MESSAGE,
          StudentAction.EXPORT,
          StudentAction.PRINT
        ].includes(action);
      case UserRole.TEACHER:
        // Teacher can only perform class-related actions
        return [
          StudentAction.VIEW,
          StudentAction.PROVIDE_FEEDBACK,
          StudentAction.VIEW_ATTENDANCE,
          StudentAction.VIEW_PERFORMANCE,
          StudentAction.SEND_MESSAGE
        ].includes(action);
      default:
        return false;
    }
  });

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
        {viewMode === 'full' && (
          <CardFooter className="border-t px-6 py-3">
            <Skeleton className="h-8 w-full" />
          </CardFooter>
        )}
      </Card>
    );
  }

  // Render mobile view
  if (viewMode === 'mobile') {
    return (
      <Card
        className={cn("overflow-hidden", className)}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={student.profileImage} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">{student.name}</h3>
                <p className="text-xs text-muted-foreground">{student.enrollmentNumber}</p>
              </div>
            </div>
            <Badge variant={getStatusVariant(student.status)} className="text-xs">
              {student.status}
            </Badge>
          </div>

          {(student.programName || student.academicScore !== undefined) && (
            <div className="mt-2 pt-2 border-t border-border">
              {student.programName && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {student.programName}
                </p>
              )}

              {student.academicScore !== undefined && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span>Academic: {formatScore(student.academicScore)}</span>
                  {student.attendanceRate !== undefined && (
                    <span>Attendance: {formatScore(student.attendanceRate)}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {visibleActions.length > 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => handleActionClick(StudentAction.VIEW, e)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render compact view
  if (viewMode === 'compact') {
    return (
      <Card
        className={cn("overflow-hidden", className)}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={student.profileImage} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{student.name}</CardTitle>
                <CardDescription className="text-xs">{student.enrollmentNumber}</CardDescription>
              </div>
            </div>
            <Badge variant={getStatusVariant(student.status)} className="text-xs">
              {student.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-xs">
              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="truncate">{student.email}</span>
            </div>

            {student.programName && (
              <div className="flex items-center text-xs">
                <GraduationCap className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>{student.programName}</span>
              </div>
            )}

            {student.academicScore !== undefined && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                    Academic
                  </span>
                  <span>{formatScore(student.academicScore)}</span>
                </div>
                {/* TODO: Fix Progress component */}
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getProgressValue(student.academicScore)}%` }}
                  />
                </div>
              </div>
            )}

            {student.attendanceRate !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                    Attendance
                  </span>
                  <span>{formatScore(student.attendanceRate)}</span>
                </div>
                {/* TODO: Fix Progress component */}
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getProgressValue(student.attendanceRate)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {visibleActions.length > 0 && (
          <CardFooter className="border-t px-4 py-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => handleActionClick(StudentAction.VIEW, e)}
            >
              <span className="text-xs mr-1">View</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Render full view
  return (
    <Card
      className={cn("overflow-hidden", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.profileImage} alt={student.name} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {student.enrollmentNumber}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusVariant(student.status)}>
            {student.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span>{student.email}</span>
          </div>

          {student.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>{student.phone}</span>
            </div>
          )}

          {student.programName && (
            <div className="flex items-center text-sm">
              <GraduationCap className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>{student.programName}</span>
              {student.classCount !== undefined && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {student.classCount} {student.classCount === 1 ? 'class' : 'classes'}
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {student.academicScore !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Academic
                  </span>
                  <span>{formatScore(student.academicScore)}</span>
                </div>
                {/* TODO: Fix Progress component */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getProgressValue(student.academicScore)}%` }}
                  />
                </div>
              </div>
            )}

            {student.attendanceRate !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Attendance
                  </span>
                  <span>{formatScore(student.attendanceRate)}</span>
                </div>
                {/* TODO: Fix Progress component */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getProgressValue(student.attendanceRate)}%` }}
                  />
                </div>
              </div>
            )}

            {student.participationRate !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Participation
                  </span>
                  <span>{formatScore(student.participationRate)}</span>
                </div>
                {/* TODO: Fix Progress component */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getProgressValue(student.participationRate)}%` }}
                  />
                </div>
              </div>
            )}

            {student.leaderboardPosition !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  Leaderboard
                </span>
                <div className="flex items-center gap-1">
                  <span>#{student.leaderboardPosition}</span>
                  {getLeaderboardTrendIcon(student.leaderboardChange)}
                  {student.leaderboardChange !== undefined && student.leaderboardChange !== 0 && (
                    <span className={cn(
                      "text-xs",
                      student.leaderboardChange > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {Math.abs(student.leaderboardChange)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {visibleActions.length > 0 && (
        <CardFooter className="border-t px-6 py-3 flex justify-end">
          {visibleActions.includes(StudentAction.VIEW) && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => handleActionClick(StudentAction.VIEW, e)}
              className="mr-2"
            >
              View Profile
            </Button>
          )}

          {visibleActions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleActionClick(StudentAction.VIEW, e)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default StudentCard;
