'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  Copy, 
  Download, 
  Printer, 
  Clock, 
  GraduationCap, 
  MessageCircle, 
  UserPlus, 
  Users,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ClassData, 
  UserRole, 
  ClassAction, 
  ClassActionPlacement 
} from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ClassActionsProps {
  /**
   * Class data for the actions
   */
  classData: ClassData;
  
  /**
   * User role for role-specific actions
   */
  userRole: UserRole;
  
  /**
   * Array of enabled actions
   * @default []
   */
  enabledActions?: ClassAction[];
  
  /**
   * Callback for action execution
   */
  onAction?: (action: ClassAction, classData: ClassData) => void;
  
  /**
   * Placement of the actions
   * @default 'header'
   */
  placement?: ClassActionPlacement;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ClassActions component with mobile-first design
 * 
 * Features:
 * - Role-specific action visibility
 * - Multiple placement options
 * - Confirmation dialogs for destructive actions
 * - Tooltips for action buttons
 * 
 * @example
 * ```tsx
 * <ClassActions 
 *   classData={classData}
 *   userRole={UserRole.TEACHER}
 *   enabledActions={[ClassAction.VIEW, ClassAction.EDIT]}
 *   placement="header"
 * />
 * ```
 */
export const ClassActions: React.FC<ClassActionsProps> = ({
  classData,
  userRole,
  enabledActions = [],
  onAction,
  placement = 'header',
  className,
}) => {
  // Get base URL for actions based on user role
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
  const filteredActions = enabledActions.filter(action => {
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

  // Get icon for action
  const getActionIcon = (action: ClassAction) => {
    switch (action) {
      case ClassAction.VIEW:
        return <Eye className="h-4 w-4" />;
      case ClassAction.EDIT:
        return <Edit className="h-4 w-4" />;
      case ClassAction.DELETE:
        return <Trash2 className="h-4 w-4" />;
      case ClassAction.ARCHIVE:
        return <Archive className="h-4 w-4" />;
      case ClassAction.DUPLICATE:
        return <Copy className="h-4 w-4" />;
      case ClassAction.EXPORT:
        return <Download className="h-4 w-4" />;
      case ClassAction.PRINT:
        return <Printer className="h-4 w-4" />;
      case ClassAction.TAKE_ATTENDANCE:
        return <Clock className="h-4 w-4" />;
      case ClassAction.GRADE_ASSESSMENTS:
        return <GraduationCap className="h-4 w-4" />;
      case ClassAction.MESSAGE_STUDENTS:
        return <MessageCircle className="h-4 w-4" />;
      case ClassAction.ASSIGN_TEACHER:
        return <UserPlus className="h-4 w-4" />;
      case ClassAction.ENROLL_STUDENTS:
        return <Users className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  // Get label for action
  const getActionLabel = (action: ClassAction) => {
    return action.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Handle action click
  const handleActionClick = (action: ClassAction) => {
    if (onAction) {
      onAction(action, classData);
    }
  };

  // Check if action is destructive
  const isDestructiveAction = (action: ClassAction) => {
    return [ClassAction.DELETE, ClassAction.ARCHIVE].includes(action);
  };

  // Render action button
  const renderActionButton = (action: ClassAction) => {
    const icon = getActionIcon(action);
    const label = getActionLabel(action);
    const isDestructive = isDestructiveAction(action);
    const actionUrl = `${getBaseUrl()}${action === ClassAction.VIEW ? '' : `/${action}`}`;

    // For destructive actions, show confirmation dialog
    if (isDestructive) {
      return (
        <AlertDialog key={action}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={isDestructive ? "destructive" : "outline"} 
                    size="sm"
                    className={cn(
                      "gap-2",
                      placement === 'card' && "w-full justify-start"
                    )}
                  >
                    {icon}
                    {placement !== 'header' && label}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {action === ClassAction.DELETE 
                  ? `This will permanently delete the class "${classData.name}". This action cannot be undone.`
                  : `This will archive the class "${classData.name}". Archived classes can be restored later.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button 
                  variant={isDestructive ? "destructive" : "default"}
                  onClick={() => handleActionClick(action)}
                  asChild
                >
                  <Link href={actionUrl}>
                    {label}
                  </Link>
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // For non-destructive actions, show regular button
    return (
      <TooltipProvider key={action}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={action === ClassAction.VIEW ? "default" : "outline"} 
              size="sm"
              className={cn(
                "gap-2",
                placement === 'card' && "w-full justify-start"
              )}
              onClick={() => handleActionClick(action)}
              asChild
            >
              <Link href={actionUrl}>
                {icon}
                {placement !== 'header' && label}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // If no actions are enabled, return null
  if (filteredActions.length === 0) {
    return null;
  }

  // For card placement, show actions as a list
  if (placement === 'card') {
    return (
      <div className={cn("flex flex-col space-y-2", className)}>
        {filteredActions.map(renderActionButton)}
      </div>
    );
  }

  // For list placement, show actions as a dropdown
  if (placement === 'list') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {filteredActions.map(action => {
            const icon = getActionIcon(action);
            const label = getActionLabel(action);
            const isDestructive = isDestructiveAction(action);
            const actionUrl = `${getBaseUrl()}${action === ClassAction.VIEW ? '' : `/${action}`}`;

            if (isDestructive) {
              return (
                <AlertDialog key={action}>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className={isDestructive ? "text-destructive" : ""}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {icon}
                      <span className="ml-2">{label}</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {action === ClassAction.DELETE 
                          ? `This will permanently delete the class "${classData.name}". This action cannot be undone.`
                          : `This will archive the class "${classData.name}". Archived classes can be restored later.`
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button 
                          variant={isDestructive ? "destructive" : "default"}
                          onClick={() => handleActionClick(action)}
                          asChild
                        >
                          <Link href={actionUrl}>
                            {label}
                          </Link>
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            }

            return (
              <DropdownMenuItem 
                key={action} 
                asChild
                onSelect={() => handleActionClick(action)}
              >
                <Link href={actionUrl} className="flex items-center">
                  {icon}
                  <span className="ml-2">{label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For detail placement, show primary action as button and others in dropdown
  if (placement === 'detail') {
    const primaryAction = filteredActions[0];
    const secondaryActions = filteredActions.slice(1);

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {primaryAction && renderActionButton(primaryAction)}
        
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map(action => {
                const icon = getActionIcon(action);
                const label = getActionLabel(action);
                const isDestructive = isDestructiveAction(action);
                const actionUrl = `${getBaseUrl()}${action === ClassAction.VIEW ? '' : `/${action}`}`;

                if (isDestructive) {
                  return (
                    <AlertDialog key={action}>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          className={isDestructive ? "text-destructive" : ""}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {icon}
                          <span className="ml-2">{label}</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {action === ClassAction.DELETE 
                              ? `This will permanently delete the class "${classData.name}". This action cannot be undone.`
                              : `This will archive the class "${classData.name}". Archived classes can be restored later.`
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button 
                              variant={isDestructive ? "destructive" : "default"}
                              onClick={() => handleActionClick(action)}
                              asChild
                            >
                              <Link href={actionUrl}>
                                {label}
                              </Link>
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  );
                }

                return (
                  <DropdownMenuItem 
                    key={action} 
                    asChild
                    onSelect={() => handleActionClick(action)}
                  >
                    <Link href={actionUrl} className="flex items-center">
                      {icon}
                      <span className="ml-2">{label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Default (header) placement - show all actions as buttons
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filteredActions.map(renderActionButton)}
    </div>
  );
};

export default ClassActions;
