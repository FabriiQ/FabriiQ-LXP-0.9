import React from 'react';
import { Button } from '@/components/ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/core/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/dialog';
import {
  ProgramData,
  ProgramAction,
  UserRole,
  getEnabledActionsForRole
} from './types';
import {
  Eye,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  Home as Building,
  BookOpen,
  Download,
  Printer,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgramActionsProps {
  program: ProgramData;
  userRole: UserRole;
  actions?: ProgramAction[];
  onAction: (action: ProgramAction, program: ProgramData) => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  iconOnly?: boolean;
  showLabels?: boolean;
  dropdownOnly?: boolean;
}

/**
 * ProgramActions component
 *
 * Displays action buttons for a program based on the user's role.
 * Can display actions as buttons, icon-only buttons, or in a dropdown menu.
 */
const ProgramActions: React.FC<ProgramActionsProps> = ({
  program,
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
  const [confirmAction, setConfirmAction] = React.useState<ProgramAction | null>(null);

  // Handle action click
  const handleAction = (action: ProgramAction) => {
    // Check if action needs confirmation
    if (
      action === ProgramAction.DELETE ||
      action === ProgramAction.ARCHIVE ||
      action === ProgramAction.DEACTIVATE
    ) {
      setConfirmAction(action);
    } else {
      onAction(action, program);
    }
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction, program);
      setConfirmAction(null);
    }
  };

  // Get action icon
  const getActionIcon = (action: ProgramAction) => {
    switch (action) {
      case ProgramAction.VIEW:
        return <Eye className="h-4 w-4" />;
      case ProgramAction.EDIT:
        return <Edit className="h-4 w-4" />;
      case ProgramAction.DELETE:
        return <Trash2 className="h-4 w-4" />;
      case ProgramAction.ARCHIVE:
        return <Archive className="h-4 w-4" />;
      case ProgramAction.ACTIVATE:
        return <CheckCircle className="h-4 w-4" />;
      case ProgramAction.DEACTIVATE:
        return <XCircle className="h-4 w-4" />;
      case ProgramAction.ASSIGN_CAMPUS:
        return <Building className="h-4 w-4" />;
      case ProgramAction.ASSIGN_COURSE:
        return <BookOpen className="h-4 w-4" />;
      case ProgramAction.EXPORT:
        return <Download className="h-4 w-4" />;
      case ProgramAction.PRINT:
        return <Printer className="h-4 w-4" />;
      case ProgramAction.MORE:
        return <MoreHorizontal className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get action label
  const getActionLabel = (action: ProgramAction) => {
    switch (action) {
      case ProgramAction.VIEW:
        return 'View';
      case ProgramAction.EDIT:
        return 'Edit';
      case ProgramAction.DELETE:
        return 'Delete';
      case ProgramAction.ARCHIVE:
        return 'Archive';
      case ProgramAction.ACTIVATE:
        return 'Activate';
      case ProgramAction.DEACTIVATE:
        return 'Deactivate';
      case ProgramAction.ASSIGN_CAMPUS:
        return 'Assign Campus';
      case ProgramAction.ASSIGN_COURSE:
        return 'Assign Course';
      case ProgramAction.EXPORT:
        return 'Export';
      case ProgramAction.PRINT:
        return 'Print';
      case ProgramAction.MORE:
        return 'More';
      default:
        return '';
    }
  };

  // Get action variant
  const getActionVariant = (action: ProgramAction): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
    switch (action) {
      case ProgramAction.VIEW:
        return 'ghost';
      case ProgramAction.EDIT:
        return 'outline';
      case ProgramAction.DELETE:
        return 'destructive';
      case ProgramAction.ARCHIVE:
        return 'secondary';
      case ProgramAction.ACTIVATE:
        return 'default';
      case ProgramAction.DEACTIVATE:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get confirmation dialog title
  const getConfirmationTitle = (action: ProgramAction) => {
    switch (action) {
      case ProgramAction.DELETE:
        return `Delete ${program.name}`;
      case ProgramAction.ARCHIVE:
        return `Archive ${program.name}`;
      case ProgramAction.DEACTIVATE:
        return `Deactivate ${program.name}`;
      default:
        return `Confirm Action`;
    }
  };

  // Get confirmation dialog description
  const getConfirmationDescription = (action: ProgramAction) => {
    switch (action) {
      case ProgramAction.DELETE:
        return `Are you sure you want to delete ${program.name}? This action cannot be undone.`;
      case ProgramAction.ARCHIVE:
        return `Are you sure you want to archive ${program.name}? It will no longer be active in the system.`;
      case ProgramAction.DEACTIVATE:
        return `Are you sure you want to deactivate ${program.name}? It will no longer be available to users.`;
      default:
        return `Are you sure you want to perform this action?`;
    }
  };

  // Primary actions to show as buttons (if not dropdownOnly)
  const primaryActions: ProgramAction[] = dropdownOnly
    ? []
    : enabledActions.filter(action =>
        action === ProgramAction.VIEW ||
        action === ProgramAction.EDIT ||
        action === ProgramAction.DELETE
      );

  // Secondary actions to show in dropdown
  const secondaryActions = enabledActions.filter(action =>
    !primaryActions.includes(action) && action !== ProgramAction.MORE
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
                  action === ProgramAction.DELETE ||
                  action === ProgramAction.DEACTIVATE
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
              variant={confirmAction === ProgramAction.DELETE ? 'destructive' : 'default'}
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

export default ProgramActions;
