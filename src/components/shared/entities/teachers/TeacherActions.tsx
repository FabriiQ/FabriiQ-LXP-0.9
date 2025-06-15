import React from 'react';
import { Button } from '@/components/ui/atoms/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/atoms/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/atoms/dialog';
import { 
  TeacherData, 
  TeacherAction, 
  UserRole, 
  getEnabledActionsForRole 
} from './types';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  UserCheck, 
  UserX, 
  Building, 
  BookOpen, 
  Users, 
  MessageCircle, 
  Download, 
  Printer, 
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeacherActionsProps {
  teacher: TeacherData;
  userRole: UserRole;
  actions?: TeacherAction[];
  onAction: (action: TeacherAction, teacher: TeacherData) => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  iconOnly?: boolean;
  showLabels?: boolean;
  dropdownOnly?: boolean;
}

/**
 * TeacherActions component
 * 
 * Displays action buttons for a teacher based on the user's role.
 * Can display actions as buttons, icon-only buttons, or in a dropdown menu.
 */
const TeacherActions: React.FC<TeacherActionsProps> = ({
  teacher,
  userRole,
  actions,
  onAction,
  size = 'default',
  className,
  iconOnly = false,
  showLabels = true,
  dropdownOnly = false
}) => {
  // Use provided actions or get default actions for the user role
  const enabledActions = actions || getEnabledActionsForRole(userRole);
  
  // State for confirmation dialogs
  const [confirmAction, setConfirmAction] = React.useState<TeacherAction | null>(null);
  
  // Handle action click
  const handleAction = (action: TeacherAction) => {
    // Check if action needs confirmation
    if (
      action === TeacherAction.DELETE ||
      action === TeacherAction.ARCHIVE ||
      action === TeacherAction.DEACTIVATE
    ) {
      setConfirmAction(action);
    } else {
      onAction(action, teacher);
    }
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction, teacher);
      setConfirmAction(null);
    }
  };
  
  // Get action icon
  const getActionIcon = (action: TeacherAction) => {
    switch (action) {
      case TeacherAction.VIEW:
        return <Eye className="h-4 w-4" />;
      case TeacherAction.EDIT:
        return <Edit className="h-4 w-4" />;
      case TeacherAction.DELETE:
        return <Trash2 className="h-4 w-4" />;
      case TeacherAction.ARCHIVE:
        return <Archive className="h-4 w-4" />;
      case TeacherAction.ACTIVATE:
        return <UserCheck className="h-4 w-4" />;
      case TeacherAction.DEACTIVATE:
        return <UserX className="h-4 w-4" />;
      case TeacherAction.ASSIGN_CAMPUS:
        return <Building className="h-4 w-4" />;
      case TeacherAction.ASSIGN_SUBJECT:
        return <BookOpen className="h-4 w-4" />;
      case TeacherAction.ASSIGN_CLASS:
        return <Users className="h-4 w-4" />;
      case TeacherAction.PROVIDE_FEEDBACK:
        return <MessageCircle className="h-4 w-4" />;
      case TeacherAction.EXPORT:
        return <Download className="h-4 w-4" />;
      case TeacherAction.PRINT:
        return <Printer className="h-4 w-4" />;
      case TeacherAction.MORE:
        return <MoreHorizontal className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Get action label
  const getActionLabel = (action: TeacherAction) => {
    switch (action) {
      case TeacherAction.VIEW:
        return 'View';
      case TeacherAction.EDIT:
        return 'Edit';
      case TeacherAction.DELETE:
        return 'Delete';
      case TeacherAction.ARCHIVE:
        return 'Archive';
      case TeacherAction.ACTIVATE:
        return 'Activate';
      case TeacherAction.DEACTIVATE:
        return 'Deactivate';
      case TeacherAction.ASSIGN_CAMPUS:
        return 'Assign Campus';
      case TeacherAction.ASSIGN_SUBJECT:
        return 'Assign Subject';
      case TeacherAction.ASSIGN_CLASS:
        return 'Assign Class';
      case TeacherAction.PROVIDE_FEEDBACK:
        return 'Provide Feedback';
      case TeacherAction.EXPORT:
        return 'Export';
      case TeacherAction.PRINT:
        return 'Print';
      case TeacherAction.MORE:
        return 'More';
      default:
        return '';
    }
  };
  
  // Get action variant
  const getActionVariant = (action: TeacherAction): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
    switch (action) {
      case TeacherAction.VIEW:
        return 'ghost';
      case TeacherAction.EDIT:
        return 'outline';
      case TeacherAction.DELETE:
        return 'destructive';
      case TeacherAction.ARCHIVE:
        return 'secondary';
      case TeacherAction.ACTIVATE:
        return 'default';
      case TeacherAction.DEACTIVATE:
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  // Get confirmation dialog title
  const getConfirmationTitle = (action: TeacherAction) => {
    switch (action) {
      case TeacherAction.DELETE:
        return `Delete ${teacher.name}`;
      case TeacherAction.ARCHIVE:
        return `Archive ${teacher.name}`;
      case TeacherAction.DEACTIVATE:
        return `Deactivate ${teacher.name}`;
      default:
        return `Confirm Action`;
    }
  };
  
  // Get confirmation dialog description
  const getConfirmationDescription = (action: TeacherAction) => {
    switch (action) {
      case TeacherAction.DELETE:
        return `Are you sure you want to delete ${teacher.name}? This action cannot be undone.`;
      case TeacherAction.ARCHIVE:
        return `Are you sure you want to archive ${teacher.name}? They will no longer be active in the system.`;
      case TeacherAction.DEACTIVATE:
        return `Are you sure you want to deactivate ${teacher.name}? They will no longer be able to access the system.`;
      default:
        return `Are you sure you want to perform this action?`;
    }
  };
  
  // Primary actions to show as buttons (if not dropdownOnly)
  const primaryActions = dropdownOnly 
    ? [] 
    : enabledActions.filter(action => 
        action === TeacherAction.VIEW || 
        action === TeacherAction.EDIT || 
        action === TeacherAction.DELETE
      );
  
  // Secondary actions to show in dropdown
  const secondaryActions = enabledActions.filter(action => 
    !primaryActions.includes(action) && action !== TeacherAction.MORE
  );
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Primary action buttons */}
      {!dropdownOnly && primaryActions.map(action => (
        <Button
          key={action}
          variant={getActionVariant(action)}
          size={size}
          onClick={() => handleAction(action)}
          className={iconOnly ? 'px-2' : ''}
        >
          {getActionIcon(action)}
          {(!iconOnly && showLabels) && (
            <span className={iconOnly ? 'sr-only' : 'ml-2'}>
              {getActionLabel(action)}
            </span>
          )}
        </Button>
      ))}
      
      {/* Dropdown menu for secondary actions */}
      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={size}
              className={iconOnly ? 'px-2' : ''}
            >
              <MoreHorizontal className="h-4 w-4" />
              {(!iconOnly && showLabels) && (
                <span className={iconOnly ? 'sr-only' : 'ml-2'}>
                  More
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions.map(action => (
              <DropdownMenuItem
                key={action}
                onClick={() => handleAction(action)}
                className={
                  action === TeacherAction.DELETE || 
                  action === TeacherAction.DEACTIVATE 
                    ? 'text-destructive focus:text-destructive' 
                    : ''
                }
              >
                {getActionIcon(action)}
                <span className="ml-2">{getActionLabel(action)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Confirmation dialog */}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction && getConfirmationTitle(confirmAction)}
            </DialogTitle>
            <DialogDescription>
              {confirmAction && getConfirmationDescription(confirmAction)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction === TeacherAction.DELETE ? 'destructive' : 'default'} 
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherActions;
