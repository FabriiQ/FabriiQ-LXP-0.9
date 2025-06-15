import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/core/card';
import { Badge } from '@/components/ui/core/badge';
import { Button } from '@/components/ui/core/button';
import {
  ProgramData,
  ProgramAction,
  UserRole,
  getEnabledActionsForRole
} from './types';
import {
  Home as Building,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface ProgramCardProps {
  program: ProgramData;
  userRole: UserRole;
  viewMode?: 'full' | 'compact' | 'list';
  actions?: ProgramAction[];
  onAction?: (action: ProgramAction, program: ProgramData) => void;
  className?: string;
}

/**
 * ProgramCard component
 *
 * Displays a program's information in a card format.
 * Adapts based on the user's role and the specified view mode.
 */
const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  userRole,
  viewMode = 'full',
  actions,
  onAction,
  className
}) => {
  // Use provided actions or get default actions for the user role
  const enabledActions = actions || getEnabledActionsForRole(userRole);

  // Format date function
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return typeof date === 'string'
      ? format(new Date(date), 'MMM d, yyyy')
      : format(date, 'MMM d, yyyy');
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      case 'DELETED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  // Handle action click
  const handleAction = (action: ProgramAction) => {
    if (onAction) {
      onAction(action, program);
    }
  };

  // Render compact view
  if (viewMode === 'compact') {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{program.name}</CardTitle>
            <Badge className={cn("text-xs", getStatusColor(program.status))}>
              {program.status}
            </Badge>
          </div>
          {program.code && (
            <CardDescription className="text-xs">
              Code: {program.code}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-col space-y-1 text-sm">
            {program.campusName && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{program.campusName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center">
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                <span>{program.courseCount || 0} Courses</span>
              </div>
              <div className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                <span>{program.studentCount || 0} Students</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          {enabledActions.includes(ProgramAction.VIEW) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction(ProgramAction.VIEW)}
            >
              View
            </Button>
          )}
          {enabledActions.includes(ProgramAction.EDIT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(ProgramAction.EDIT)}
            >
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Render list view
  if (viewMode === 'list') {
    return (
      <Card className={cn("w-full flex flex-row items-center p-4", className)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium truncate">{program.name}</h3>
            <Badge className={cn("ml-2", getStatusColor(program.status))}>
              {program.status}
            </Badge>
          </div>
          {program.code && (
            <p className="text-sm text-muted-foreground">
              Code: {program.code}
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center mx-4 space-x-4">
          {program.campusName && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{program.campusName}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            <span>{program.courseCount || 0} Courses</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>{program.studentCount || 0} Students</span>
          </div>
        </div>
        <div className="flex gap-2">
          {enabledActions.includes(ProgramAction.VIEW) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction(ProgramAction.VIEW)}
            >
              View
            </Button>
          )}
          {enabledActions.includes(ProgramAction.EDIT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(ProgramAction.EDIT)}
            >
              Edit
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Render full view (default)
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{program.name}</CardTitle>
          <Badge className={getStatusColor(program.status)}>
            {program.status}
          </Badge>
        </div>
        {program.code && (
          <CardDescription>
            Code: {program.code}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {program.description && (
          <p className="text-sm mb-4">{program.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {/* Institution and Campus */}
          {(userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && (
            <>
              {program.institutionName && (
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{program.institutionName}</span>
                </div>
              )}
              {program.campusName && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{program.campusName}</span>
                </div>
              )}
            </>
          )}

          {/* Dates */}
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Start: {formatDate(program.startDate)}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>End: {formatDate(program.endDate)}</span>
          </div>

          {/* Counts */}
          <div className="flex items-center text-muted-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>{program.courseCount || 0} Courses</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{program.studentCount || 0} Students</span>
          </div>

          {/* Created/Updated dates for admins */}
          {userRole === UserRole.SYSTEM_ADMIN && (
            <>
              {program.createdAt && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Created: {formatDate(program.createdAt)}</span>
                </div>
              )}
              {program.updatedAt && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Updated: {formatDate(program.updatedAt)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        {enabledActions.includes(ProgramAction.VIEW) && (
          <Button
            variant="ghost"
            onClick={() => handleAction(ProgramAction.VIEW)}
          >
            View
          </Button>
        )}
        {enabledActions.includes(ProgramAction.EDIT) && (
          <Button
            variant="outline"
            onClick={() => handleAction(ProgramAction.EDIT)}
          >
            Edit
          </Button>
        )}
        {enabledActions.includes(ProgramAction.DELETE) && (
          <Button
            variant="destructive"
            onClick={() => handleAction(ProgramAction.DELETE)}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
