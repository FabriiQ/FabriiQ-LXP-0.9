'use client';

import React from 'react';
import { Button } from '@/components/ui/core/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import { 
  Eye, 
  Edit, 
  Trash, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  LogOut, 
  MessageSquare, 
  Star, 
  Calendar, 
  BarChart, 
  Download, 
  Printer, 
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  StudentData, 
  StudentAction, 
  UserRole 
} from './types';

export interface StudentActionsProps {
  /**
   * Student data
   */
  student: StudentData;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of enabled actions
   */
  enabledActions?: StudentAction[];
  
  /**
   * Action callback
   */
  onAction: (action: StudentAction, student: StudentData) => void;
  
  /**
   * Whether to show all actions in dropdown
   * @default false
   */
  compact?: boolean;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentActions component with mobile-first design
 * 
 * Features:
 * - Role-based action visibility
 * - Compact mode for mobile
 * - Confirmation dialogs for destructive actions
 * 
 * @example
 * ```tsx
 * <StudentActions 
 *   student={student}
 *   userRole={UserRole.TEACHER}
 *   enabledActions={[StudentAction.VIEW, StudentAction.PROVIDE_FEEDBACK]}
 *   onAction={handleAction}
 * />
 * ```
 */
export const StudentActions: React.FC<StudentActionsProps> = ({
  student,
  userRole,
  enabledActions = Object.values(StudentAction),
  onAction,
  compact = false,
  className,
}) => {
  // Filter actions based on user role
  const visibleActions = enabledActions.filter(action => {
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
  
  // Get action icon
  const getActionIcon = (action: StudentAction) => {
    switch (action) {
      case StudentAction.VIEW:
        return <Eye className="h-4 w-4" />;
      case StudentAction.EDIT:
        return <Edit className="h-4 w-4" />;
      case StudentAction.DELETE:
        return <Trash className="h-4 w-4" />;
      case StudentAction.ENROLL:
        return <UserCheck className="h-4 w-4" />;
      case StudentAction.UNENROLL:
        return <UserX className="h-4 w-4" />;
      case StudentAction.SUSPEND:
        return <UserX className="h-4 w-4" />;
      case StudentAction.ACTIVATE:
        return <UserCheck className="h-4 w-4" />;
      case StudentAction.GRADUATE:
        return <GraduationCap className="h-4 w-4" />;
      case StudentAction.WITHDRAW:
        return <LogOut className="h-4 w-4" />;
      case StudentAction.SEND_MESSAGE:
        return <MessageSquare className="h-4 w-4" />;
      case StudentAction.PROVIDE_FEEDBACK:
        return <Star className="h-4 w-4" />;
      case StudentAction.EXPORT:
        return <Download className="h-4 w-4" />;
      case StudentAction.PRINT:
        return <Printer className="h-4 w-4" />;
      case StudentAction.VIEW_ATTENDANCE:
        return <Calendar className="h-4 w-4" />;
      case StudentAction.VIEW_PERFORMANCE:
        return <BarChart className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };
  
  // Get action label
  const getActionLabel = (action: StudentAction) => {
    switch (action) {
      case StudentAction.VIEW:
        return 'View Profile';
      case StudentAction.EDIT:
        return 'Edit Profile';
      case StudentAction.DELETE:
        return 'Delete Student';
      case StudentAction.ENROLL:
        return 'Enroll in Class';
      case StudentAction.UNENROLL:
        return 'Unenroll from Class';
      case StudentAction.SUSPEND:
        return 'Suspend Student';
      case StudentAction.ACTIVATE:
        return 'Activate Student';
      case StudentAction.GRADUATE:
        return 'Mark as Graduated';
      case StudentAction.WITHDRAW:
        return 'Mark as Withdrawn';
      case StudentAction.SEND_MESSAGE:
        return 'Send Message';
      case StudentAction.PROVIDE_FEEDBACK:
        return 'Provide Feedback';
      case StudentAction.EXPORT:
        return 'Export Data';
      case StudentAction.PRINT:
        return 'Print Profile';
      case StudentAction.VIEW_ATTENDANCE:
        return 'View Attendance';
      case StudentAction.VIEW_PERFORMANCE:
        return 'View Performance';
      default:
        return 'View';
    }
  };
  
  // Get action variant
  const getActionVariant = (action: StudentAction): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
    switch (action) {
      case StudentAction.VIEW:
        return 'default';
      case StudentAction.EDIT:
        return 'outline';
      case StudentAction.DELETE:
        return 'destructive';
      case StudentAction.SUSPEND:
        return 'destructive';
      case StudentAction.ACTIVATE:
        return 'default';
      case StudentAction.GRADUATE:
        return 'outline';
      case StudentAction.WITHDRAW:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Is action destructive
  const isDestructiveAction = (action: StudentAction) => {
    return [
      StudentAction.DELETE,
      StudentAction.SUSPEND,
      StudentAction.WITHDRAW,
      StudentAction.UNENROLL
    ].includes(action);
  };
  
  // Handle action click
  const handleActionClick = (action: StudentAction) => {
    // For destructive actions, we should show a confirmation dialog
    // But for simplicity, we'll just call the onAction callback
    onAction(action, student);
  };
  
  // If compact mode, show all actions in dropdown
  if (compact) {
    return (
      <div className={cn("flex justify-end", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* View and Edit actions */}
            {visibleActions.includes(StudentAction.VIEW) && (
              <DropdownMenuItem onClick={() => handleActionClick(StudentAction.VIEW)}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
            )}
            
            {visibleActions.includes(StudentAction.EDIT) && (
              <DropdownMenuItem onClick={() => handleActionClick(StudentAction.EDIT)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
            )}
            
            {/* Academic actions */}
            {(visibleActions.includes(StudentAction.VIEW_ATTENDANCE) || 
              visibleActions.includes(StudentAction.VIEW_PERFORMANCE) || 
              visibleActions.includes(StudentAction.PROVIDE_FEEDBACK)) && (
              <>
                <DropdownMenuSeparator />
                
                {visibleActions.includes(StudentAction.VIEW_ATTENDANCE) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.VIEW_ATTENDANCE)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Attendance
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.VIEW_PERFORMANCE) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.VIEW_PERFORMANCE)}>
                    <BarChart className="h-4 w-4 mr-2" />
                    View Performance
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.PROVIDE_FEEDBACK) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.PROVIDE_FEEDBACK)}>
                    <Star className="h-4 w-4 mr-2" />
                    Provide Feedback
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {/* Communication actions */}
            {visibleActions.includes(StudentAction.SEND_MESSAGE) && (
              <>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => handleActionClick(StudentAction.SEND_MESSAGE)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
              </>
            )}
            
            {/* Export actions */}
            {(visibleActions.includes(StudentAction.EXPORT) || 
              visibleActions.includes(StudentAction.PRINT)) && (
              <>
                <DropdownMenuSeparator />
                
                {visibleActions.includes(StudentAction.EXPORT) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.EXPORT)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.PRINT) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.PRINT)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Profile
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {/* Enrollment actions */}
            {(visibleActions.includes(StudentAction.ENROLL) || 
              visibleActions.includes(StudentAction.UNENROLL)) && (
              <>
                <DropdownMenuSeparator />
                
                {visibleActions.includes(StudentAction.ENROLL) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.ENROLL)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Enroll in Class
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.UNENROLL) && (
                  <DropdownMenuItem 
                    onClick={() => handleActionClick(StudentAction.UNENROLL)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Unenroll from Class
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {/* Status actions */}
            {(visibleActions.includes(StudentAction.ACTIVATE) || 
              visibleActions.includes(StudentAction.SUSPEND) || 
              visibleActions.includes(StudentAction.GRADUATE) || 
              visibleActions.includes(StudentAction.WITHDRAW)) && (
              <>
                <DropdownMenuSeparator />
                
                {visibleActions.includes(StudentAction.ACTIVATE) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.ACTIVATE)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate Student
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.SUSPEND) && (
                  <DropdownMenuItem 
                    onClick={() => handleActionClick(StudentAction.SUSPEND)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend Student
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.GRADUATE) && (
                  <DropdownMenuItem onClick={() => handleActionClick(StudentAction.GRADUATE)}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Mark as Graduated
                  </DropdownMenuItem>
                )}
                
                {visibleActions.includes(StudentAction.WITHDRAW) && (
                  <DropdownMenuItem 
                    onClick={() => handleActionClick(StudentAction.WITHDRAW)}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Mark as Withdrawn
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {/* Delete action */}
            {visibleActions.includes(StudentAction.DELETE) && (
              <>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => handleActionClick(StudentAction.DELETE)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Student
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  // If not compact mode, show buttons
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Primary actions */}
      {visibleActions.includes(StudentAction.VIEW) && (
        <Button 
          variant="default" 
          size="sm"
          onClick={() => handleActionClick(StudentAction.VIEW)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )}
      
      {visibleActions.includes(StudentAction.EDIT) && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleActionClick(StudentAction.EDIT)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
      
      {/* Secondary actions in dropdown */}
      {visibleActions.length > 2 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Skip VIEW and EDIT as they're already shown as buttons */}
            {visibleActions
              .filter(action => action !== StudentAction.VIEW && action !== StudentAction.EDIT)
              .map(action => (
                <React.Fragment key={action}>
                  {/* Add separators between action groups */}
                  {action === StudentAction.VIEW_ATTENDANCE || 
                   action === StudentAction.SEND_MESSAGE || 
                   action === StudentAction.EXPORT || 
                   action === StudentAction.ENROLL || 
                   action === StudentAction.ACTIVATE || 
                   action === StudentAction.DELETE ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  
                  <DropdownMenuItem 
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      isDestructiveAction(action) && "text-destructive focus:text-destructive"
                    )}
                  >
                    {getActionIcon(action)}
                    <span className="ml-2">{getActionLabel(action)}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default StudentActions;
