'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/core/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Textarea } from '@/components/ui/core/textarea';
import { Label } from '@/components/ui/core/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Edit,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceStatus } from './types';

export interface AttendanceStatusCellProps {
  /**
   * Current attendance status
   */
  status?: AttendanceStatus;
  
  /**
   * Whether the cell is editable
   * @default false
   */
  editable?: boolean;
  
  /**
   * Attendance comments
   */
  comments?: string;
  
  /**
   * Change callback
   */
  onChange?: (status: AttendanceStatus, comments?: string) => void;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * AttendanceStatusCell component with mobile-first design
 * 
 * Features:
 * - Color-coded status display
 * - Status editing
 * - Comments display and editing
 * 
 * @example
 * ```tsx
 * <AttendanceStatusCell 
 *   status={AttendanceStatus.PRESENT}
 *   editable={true}
 *   comments="Student arrived on time"
 *   onChange={handleStatusChange}
 * />
 * ```
 */
export const AttendanceStatusCell: React.FC<AttendanceStatusCellProps> = ({
  status,
  editable = false,
  comments = '',
  onChange,
  className,
}) => {
  // State for popover open
  const [isOpen, setIsOpen] = useState(false);
  
  // State for editing
  const [editStatus, setEditStatus] = useState<AttendanceStatus | undefined>(status);
  const [editComments, setEditComments] = useState<string>(comments);
  
  // Get color class based on attendance status
  const getStatusColorClass = (status: AttendanceStatus | undefined): string => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case AttendanceStatus.ABSENT:
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case AttendanceStatus.LATE:
        return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case AttendanceStatus.EXCUSED:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: AttendanceStatus | undefined): React.ReactNode => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <CheckCircle className="h-4 w-4" />;
      case AttendanceStatus.ABSENT:
        return <XCircle className="h-4 w-4" />;
      case AttendanceStatus.LATE:
        return <Clock className="h-4 w-4" />;
      case AttendanceStatus.EXCUSED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Get status text
  const getStatusText = (status: AttendanceStatus | undefined): string => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'Present';
      case AttendanceStatus.ABSENT:
        return 'Absent';
      case AttendanceStatus.LATE:
        return 'Late';
      case AttendanceStatus.EXCUSED:
        return 'Excused';
      default:
        return 'Not Marked';
    }
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setEditStatus(newStatus);
  };
  
  // Handle save
  const handleSave = () => {
    if (onChange && editStatus) {
      onChange(editStatus, editComments);
    }
    setIsOpen(false);
  };
  
  // If not editable, just display the status
  if (!editable) {
    return (
      <div 
        className={cn(
          "h-10 w-full rounded-md border flex items-center justify-center",
          getStatusColorClass(status),
          className
        )}
        title={comments ? `${getStatusText(status)}: ${comments}` : getStatusText(status)}
      >
        {getStatusIcon(status)}
        {comments && (
          <span className="ml-1 text-xs">*</span>
        )}
      </div>
    );
  }
  
  // If editable, show popover for editing
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "h-10 w-full rounded-md border flex items-center justify-center cursor-pointer relative group",
            getStatusColorClass(status),
            className
          )}
        >
          {getStatusIcon(status)}
          {comments && (
            <span className="ml-1 text-xs">*</span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/10 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit className="h-3 w-3" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Attendance Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={editStatus === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(AttendanceStatus.PRESENT)}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Present
              </Button>
              <Button
                variant={editStatus === AttendanceStatus.ABSENT ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(AttendanceStatus.ABSENT)}
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Absent
              </Button>
              <Button
                variant={editStatus === AttendanceStatus.LATE ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(AttendanceStatus.LATE)}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-1" />
                Late
              </Button>
              <Button
                variant={editStatus === AttendanceStatus.EXCUSED ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(AttendanceStatus.EXCUSED)}
                className="w-full"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Excused
              </Button>
            </div>
          </div>
          
          {(editStatus === AttendanceStatus.ABSENT || editStatus === AttendanceStatus.EXCUSED || editStatus === AttendanceStatus.LATE) && (
            <div>
              <Label htmlFor="comments" className="mb-2 block">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Add comments..."
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!editStatus}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AttendanceStatusCell;
