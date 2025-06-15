'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserRole, ClassData } from '../types';
import { ScheduleItem } from './ScheduleForm';

export type ScheduleAction = 
  | 'view' 
  | 'edit' 
  | 'delete' 
  | 'duplicate';

export interface ScheduleListProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * Array of schedule items
   */
  scheduleItems: ScheduleItem[];
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of allowed actions
   * @default []
   */
  actions?: ScheduleAction[];
  
  /**
   * View mode for the list
   * @default 'table'
   */
  viewMode?: 'table' | 'grid' | 'mobile';
  
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
   * Action callback
   */
  onAction?: (action: ScheduleAction, scheduleItem: ScheduleItem) => void;
  
  /**
   * Add schedule item callback
   */
  onAddScheduleItem?: () => void;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ScheduleList component with mobile-first design
 * 
 * Features:
 * - Role-specific action visibility
 * - Multiple view modes
 * - Color-coded schedule types
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * <ScheduleList 
 *   classData={classData}
 *   scheduleItems={scheduleItems}
 *   userRole={UserRole.TEACHER}
 *   actions={['view', 'edit', 'delete']}
 *   onAction={handleAction}
 * />
 * ```
 */
export const ScheduleList: React.FC<ScheduleListProps> = ({
  classData,
  scheduleItems,
  userRole,
  actions = [],
  viewMode = 'table',
  isLoading = false,
  error,
  onAction,
  onAddScheduleItem,
  className,
}) => {
  // Determine which actions to show based on user role
  const getVisibleActions = (role: UserRole): ScheduleAction[] => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.CAMPUS_ADMIN:
        return actions.filter(action => true); // All actions
      case UserRole.COORDINATOR:
        return actions.filter(action => 
          ['view', 'edit', 'duplicate'].includes(action)
        );
      case UserRole.TEACHER:
        return actions.filter(action => 
          ['view', 'edit', 'duplicate'].includes(action)
        );
      case UserRole.STUDENT:
        return actions.filter(action => 
          ['view'].includes(action)
        );
      default:
        return [];
    }
  };
  
  // Get visible actions based on user role
  const visibleActions = getVisibleActions(userRole);
  
  // Handle action click
  const handleActionClick = (action: ScheduleAction, scheduleItem: ScheduleItem) => {
    if (onAction) {
      onAction(action, scheduleItem);
    }
  };
  
  // Check if user can add schedule items
  const canAddScheduleItems = [
    UserRole.SYSTEM_ADMIN,
    UserRole.CAMPUS_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes(userRole);
  
  // Get schedule type color
  const getScheduleTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-green-100 text-green-800';
      case 'exam':
        return 'bg-red-100 text-red-800';
      case 'assignment':
        return 'bg-amber-100 text-amber-800';
      case 'office_hours':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get schedule type name
  const getScheduleTypeName = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'Lecture';
      case 'lab':
        return 'Lab';
      case 'exam':
        return 'Exam';
      case 'assignment':
        return 'Assignment';
      case 'office_hours':
        return 'Office Hours';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Get action icon
  const getActionIcon = (action: ScheduleAction) => {
    switch (action) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'edit':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash className="h-4 w-4" />;
      case 'duplicate':
        return <Copy className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Get action label
  const getActionLabel = (action: ScheduleAction) => {
    switch (action) {
      case 'view':
        return 'View Details';
      case 'edit':
        return 'Edit';
      case 'delete':
        return 'Delete';
      case 'duplicate':
        return 'Duplicate';
      default:
        return '';
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            
            <div className="overflow-x-auto">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
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
  
  // Render table view
  const renderTableView = () => (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {canAddScheduleItems && onAddScheduleItem && (
            <div className="flex justify-end">
              <Button onClick={onAddScheduleItem}>
                Add Schedule Item
              </Button>
            </div>
          )}
          
          {scheduleItems.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No schedule items found</p>
              {canAddScheduleItems && onAddScheduleItem && (
                <Button variant="link" onClick={onAddScheduleItem}>
                  Add your first schedule item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    {visibleActions.length > 0 && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-normal", getScheduleTypeColor(item.type))}>
                          {getScheduleTypeName(item.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.facilityId ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            Facility
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {visibleActions.length > 0 && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {visibleActions.map((action) => (
                                <DropdownMenuItem
                                  key={action}
                                  onClick={() => handleActionClick(action, item)}
                                  className={action === 'delete' ? 'text-destructive' : ''}
                                >
                                  {getActionIcon(action)}
                                  <span className="ml-2">{getActionLabel(action)}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render grid view
  const renderGridView = () => (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {canAddScheduleItems && onAddScheduleItem && (
            <div className="flex justify-end">
              <Button onClick={onAddScheduleItem}>
                Add Schedule Item
              </Button>
            </div>
          )}
          
          {scheduleItems.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No schedule items found</p>
              {canAddScheduleItems && onAddScheduleItem && (
                <Button variant="link" onClick={onAddScheduleItem}>
                  Add your first schedule item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className={cn("pb-2", getScheduleTypeColor(item.type))}>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>
                      {getScheduleTypeName(item.type)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(item.date), 'PPPP')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{item.startTime} - {item.endTime}</span>
                    </div>
                    {item.facilityId && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Facility</span>
                      </div>
                    )}
                    {item.teacherId && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Teacher</span>
                      </div>
                    )}
                    {item.isRecurring && (
                      <Badge variant="outline" className="mt-2">
                        Recurring
                      </Badge>
                    )}
                  </CardContent>
                  {visibleActions.length > 0 && (
                    <CardFooter className="flex justify-end gap-2 pt-0">
                      {visibleActions.slice(0, 2).map((action) => (
                        <Button
                          key={action}
                          variant={action === 'delete' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleActionClick(action, item)}
                        >
                          {getActionIcon(action)}
                          <span className="sr-only">{getActionLabel(action)}</span>
                        </Button>
                      ))}
                      
                      {visibleActions.length > 2 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {visibleActions.slice(2).map((action) => (
                              <DropdownMenuItem
                                key={action}
                                onClick={() => handleActionClick(action, item)}
                                className={action === 'delete' ? 'text-destructive' : ''}
                              >
                                {getActionIcon(action)}
                                <span className="ml-2">{getActionLabel(action)}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render mobile view
  const renderMobileView = () => (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {canAddScheduleItems && onAddScheduleItem && (
            <Button onClick={onAddScheduleItem} className="w-full">
              Add Schedule Item
            </Button>
          )}
          
          {scheduleItems.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No schedule items found</p>
              {canAddScheduleItems && onAddScheduleItem && (
                <Button variant="link" onClick={onAddScheduleItem}>
                  Add your first schedule item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {scheduleItems.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div className={cn("p-4", getScheduleTypeColor(item.type))}>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm">{getScheduleTypeName(item.type)}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(item.date), 'PPPP')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{item.startTime} - {item.endTime}</span>
                    </div>
                    {item.facilityId && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Facility</span>
                      </div>
                    )}
                    {item.isRecurring && (
                      <Badge variant="outline" className="mt-1">
                        Recurring
                      </Badge>
                    )}
                  </div>
                  {visibleActions.length > 0 && (
                    <div className="p-4 pt-0 flex flex-wrap gap-2">
                      {visibleActions.slice(0, 1).map((action) => (
                        <Button
                          key={action}
                          variant={action === 'delete' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleActionClick(action, item)}
                          className="flex-1"
                        >
                          {getActionIcon(action)}
                          <span className="ml-2">{getActionLabel(action)}</span>
                        </Button>
                      ))}
                      
                      {visibleActions.length > 1 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="ml-2">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {visibleActions.slice(1).map((action) => (
                              <DropdownMenuItem
                                key={action}
                                onClick={() => handleActionClick(action, item)}
                                className={action === 'delete' ? 'text-destructive' : ''}
                              >
                                {getActionIcon(action)}
                                <span className="ml-2">{getActionLabel(action)}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render based on view mode
  switch (viewMode) {
    case 'grid':
      return renderGridView();
    case 'mobile':
      return renderMobileView();
    case 'table':
    default:
      return renderTableView();
  }
};

export default ScheduleList;
