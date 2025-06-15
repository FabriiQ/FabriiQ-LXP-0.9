'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  UserMinus,
  Mail,
  FileText,
  BarChart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ClassData, UserRole } from './types';

export interface ClassStudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  enrollmentDate: Date;
  status: string;
  attendance?: {
    present: number;
    absent: number;
    excused: number;
    total: number;
    percentage: number;
  };
  grades?: {
    average: number;
    assessmentsCompleted: number;
    assessmentsTotal: number;
  };
}

export type ClassStudentAction = 
  | 'view' 
  | 'message' 
  | 'remove' 
  | 'view-grades' 
  | 'view-attendance';

export interface ClassStudentListProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * Array of student data
   */
  students: ClassStudentData[];
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of allowed actions
   * @default []
   */
  actions?: ClassStudentAction[];
  
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
  onAction?: (action: ClassStudentAction, student: ClassStudentData) => void;
  
  /**
   * Add student callback
   */
  onAddStudent?: () => void;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ClassStudentList component with mobile-first design
 * 
 * Features:
 * - Role-specific action visibility
 * - Multiple view modes
 * - Student search functionality
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * <ClassStudentList 
 *   classData={classData}
 *   students={students}
 *   userRole={UserRole.TEACHER}
 *   actions={['view', 'message', 'view-grades', 'view-attendance']}
 *   onAction={handleAction}
 * />
 * ```
 */
export const ClassStudentList: React.FC<ClassStudentListProps> = ({
  classData,
  students,
  userRole,
  actions = [],
  viewMode = 'table',
  isLoading = false,
  error,
  onAction,
  onAddStudent,
  className,
}) => {
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Determine which actions to show based on user role
  const getVisibleActions = (role: UserRole): ClassStudentAction[] => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.CAMPUS_ADMIN:
        return actions.filter(action => true); // All actions
      case UserRole.COORDINATOR:
        return actions.filter(action => 
          ['view', 'message', 'view-grades', 'view-attendance'].includes(action)
        );
      case UserRole.TEACHER:
        return actions.filter(action => 
          ['view', 'message', 'view-grades', 'view-attendance'].includes(action)
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
  const handleActionClick = (action: ClassStudentAction, student: ClassStudentData) => {
    if (onAction) {
      onAction(action, student);
    }
  };
  
  // Get action icon
  const getActionIcon = (action: ClassStudentAction) => {
    switch (action) {
      case 'view':
        return <FileText className="h-4 w-4" />;
      case 'message':
        return <Mail className="h-4 w-4" />;
      case 'remove':
        return <UserMinus className="h-4 w-4" />;
      case 'view-grades':
        return <BarChart className="h-4 w-4" />;
      case 'view-attendance':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Get action label
  const getActionLabel = (action: ClassStudentAction) => {
    switch (action) {
      case 'view':
        return 'View Profile';
      case 'message':
        return 'Send Message';
      case 'remove':
        return 'Remove from Class';
      case 'view-grades':
        return 'View Grades';
      case 'view-attendance':
        return 'View Attendance';
      default:
        return '';
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {onAddStudent && (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && (
              <Button onClick={onAddStudent}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                    {userRole !== UserRole.STUDENT && (
                      <>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Average Grade</TableHead>
                      </>
                    )}
                    {visibleActions.length > 0 && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{new Date(student.enrollmentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      {userRole !== UserRole.STUDENT && (
                        <>
                          <TableCell>
                            {student.attendance ? `${student.attendance.percentage}%` : '-'}
                          </TableCell>
                          <TableCell>
                            {student.grades ? `${student.grades.average}%` : '-'}
                          </TableCell>
                        </>
                      )}
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
                                  onClick={() => handleActionClick(action, student)}
                                  className={action === 'remove' ? 'text-destructive' : ''}
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
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          {onAddStudent && (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && (
            <Button onClick={onAddStudent}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          )}
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No students found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                      <span className="text-xl font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                    <Badge variant={student.status === 'ACTIVE' ? 'success' : 'secondary'} className="mb-4">
                      {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                    </Badge>
                    
                    {userRole !== UserRole.STUDENT && (
                      <div className="grid grid-cols-2 gap-2 w-full mb-4">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p className="font-medium">
                            {student.attendance ? `${student.attendance.percentage}%` : '-'}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Grade</p>
                          <p className="font-medium">
                            {student.grades ? `${student.grades.average}%` : '-'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {visibleActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {visibleActions.slice(0, 2).map((action) => (
                          <Button
                            key={action}
                            variant={action === 'remove' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleActionClick(action, student)}
                          >
                            {getActionIcon(action)}
                            <span className="ml-2">{getActionLabel(action)}</span>
                          </Button>
                        ))}
                        
                        {visibleActions.length > 2 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="ml-2">More</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {visibleActions.slice(2).map((action) => (
                                <DropdownMenuItem
                                  key={action}
                                  onClick={() => handleActionClick(action, student)}
                                  className={action === 'remove' ? 'text-destructive' : ''}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Render mobile view
  const renderMobileView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {onAddStudent && (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && (
          <Button onClick={onAddStudent} className="w-full mb-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        )}
        
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No students found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Badge variant={student.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                
                {userRole !== UserRole.STUDENT && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Attendance:</span>{' '}
                      <span className="font-medium">
                        {student.attendance ? `${student.attendance.percentage}%` : '-'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Grade:</span>{' '}
                      <span className="font-medium">
                        {student.grades ? `${student.grades.average}%` : '-'}
                      </span>
                    </div>
                  </div>
                )}
                
                {visibleActions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {visibleActions.slice(0, 1).map((action) => (
                      <Button
                        key={action}
                        variant={action === 'remove' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleActionClick(action, student)}
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
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {visibleActions.slice(1).map((action) => (
                            <DropdownMenuItem
                              key={action}
                              onClick={() => handleActionClick(action, student)}
                              className={action === 'remove' ? 'text-destructive' : ''}
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

export default ClassStudentList;
