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
  Download, 
  Printer, 
  FileText, 
  MoreHorizontal, 
  Mail, 
  Share, 
  Edit, 
  Trash 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from './types';

export interface AttendanceActionsProps {
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Export callback
   */
  onExport?: () => void;
  
  /**
   * Print callback
   */
  onPrint?: () => void;
  
  /**
   * Generate report callback
   */
  onGenerateReport?: () => void;
  
  /**
   * Email report callback
   */
  onEmailReport?: () => void;
  
  /**
   * Share callback
   */
  onShare?: () => void;
  
  /**
   * Edit callback
   */
  onEdit?: () => void;
  
  /**
   * Delete callback
   */
  onDelete?: () => void;
  
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
 * AttendanceActions component with mobile-first design
 * 
 * Features:
 * - Role-based action visibility
 * - Export, print, and report generation
 * - Responsive design with compact mode
 * 
 * @example
 * ```tsx
 * <AttendanceActions 
 *   userRole={UserRole.TEACHER}
 *   onExport={handleExport}
 *   onPrint={handlePrint}
 *   onGenerateReport={handleGenerateReport}
 * />
 * ```
 */
export const AttendanceActions: React.FC<AttendanceActionsProps> = ({
  userRole,
  onExport,
  onPrint,
  onGenerateReport,
  onEmailReport,
  onShare,
  onEdit,
  onDelete,
  compact = false,
  className,
}) => {
  // Determine which actions are available based on user role
  const canEdit = userRole !== UserRole.STUDENT && onEdit;
  const canDelete = (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && onDelete;
  const canExport = onExport;
  const canPrint = onPrint;
  const canGenerateReport = (userRole !== UserRole.STUDENT) && onGenerateReport;
  const canEmailReport = (userRole !== UserRole.STUDENT) && onEmailReport;
  const canShare = onShare;
  
  // If compact mode, show all actions in dropdown
  if (compact) {
    return (
      <div className={cn("flex justify-end", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {canExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            )}
            
            {canPrint && (
              <DropdownMenuItem onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            )}
            
            {canGenerateReport && (
              <DropdownMenuItem onClick={onGenerateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </DropdownMenuItem>
            )}
            
            {canEmailReport && (
              <DropdownMenuItem onClick={onEmailReport}>
                <Mail className="h-4 w-4 mr-2" />
                Email Report
              </DropdownMenuItem>
            )}
            
            {canShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            
            {(canEdit || canDelete) && <DropdownMenuSeparator />}
            
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  // If not compact mode, show buttons
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {canExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      )}
      
      {canPrint && (
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      )}
      
      {canGenerateReport && (
        <Button variant="outline" size="sm" onClick={onGenerateReport}>
          <FileText className="h-4 w-4 mr-1" />
          Report
        </Button>
      )}
      
      {/* Additional actions in dropdown */}
      {(canEmailReport || canShare || canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEmailReport && (
              <DropdownMenuItem onClick={onEmailReport}>
                <Mail className="h-4 w-4 mr-2" />
                Email Report
              </DropdownMenuItem>
            )}
            
            {canShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            
            {(canEdit || canDelete) && <DropdownMenuSeparator />}
            
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default AttendanceActions;
