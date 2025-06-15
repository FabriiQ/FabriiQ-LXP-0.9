import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Badge } from '@/components/ui/core/badge';
import { Input } from '@/components/ui/core/input';
import { Skeleton } from '@/components/ui/core/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/core/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import {
  ProgramData,
  CourseInProgram,
  UserRole,
  SystemStatus
} from './types';
import {
  Search,
  BookOpen,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgramCourseListProps {
  program: ProgramData;
  courses: CourseInProgram[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string;
  onViewCourse?: (course: CourseInProgram) => void;
  onEditCourse?: (course: CourseInProgram) => void;
  onRemoveCourse?: (course: CourseInProgram) => void;
  onAddCourse?: () => void;
  className?: string;
}

/**
 * ProgramCourseList component
 *
 * Displays a list of courses in a program.
 * Adapts based on the user's role and provides actions for course management.
 */
const ProgramCourseList: React.FC<ProgramCourseListProps> = ({
  program,
  courses,
  userRole,
  isLoading = false,
  error,
  onViewCourse,
  onEditCourse,
  onRemoveCourse,
  onAddCourse,
  className
}) => {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (course.subjectName && course.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  // Check if user can edit courses
  const canEditCourses = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN;

  // Render loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Courses</CardTitle>
          {canEditCourses && onAddCourse && (
            <Button size="sm" onClick={onAddCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Empty state */}
        {filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 border rounded-md">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "No courses match your search criteria."
                : "This program doesn't have any courses yet."}
            </p>
            {canEditCourses && onAddCourse && (
              <Button onClick={onAddCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            )}
          </div>
        )}

        {/* Course list */}
        {filteredCourses.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Classes</TableHead>
                  <TableHead className="hidden md:table-cell">Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.name}</div>
                        {course.code && (
                          <div className="text-sm text-muted-foreground">
                            Code: {course.code}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.subjectName || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                        {course.classCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {course.studentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewCourse && (
                            <DropdownMenuItem onClick={() => onViewCourse(course)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {canEditCourses && onEditCourse && (
                            <DropdownMenuItem onClick={() => onEditCourse(course)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canEditCourses && onRemoveCourse && (
                            <DropdownMenuItem
                              onClick={() => onRemoveCourse(course)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramCourseList;
