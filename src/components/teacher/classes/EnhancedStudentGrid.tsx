'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  ClipboardList,
  Award,
  UserPlus,
  Download,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  email?: string;
  image?: string;
  attendanceRate?: number;
  completionRate?: number;
  averageScore?: number;
  status?: 'active' | 'inactive';
}

interface EnhancedStudentGridProps {
  classId: string;
  className?: string;
}

/**
 * EnhancedStudentGrid component for displaying students with performance metrics
 *
 * Features:
 * - Responsive grid/table layout based on screen size
 * - Search and filter functionality
 * - Performance metrics for each student
 * - Quick actions for student management
 */
export function EnhancedStudentGrid({ classId, className }: EnhancedStudentGridProps) {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch students for this class
  const { data: students, isLoading } = api.teacher.getClassStudents.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort students
  const filteredStudents = students
    ? students
        .filter(student =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
          // Handle different field types
          if (sortField === 'name') {
            return sortDirection === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          } else if (sortField === 'attendanceRate') {
            return sortDirection === 'asc'
              ? (a.attendanceRate || 0) - (b.attendanceRate || 0)
              : (b.attendanceRate || 0) - (a.attendanceRate || 0);
          } else if (sortField === 'completionRate') {
            return sortDirection === 'asc'
              ? (a.completionRate || 0) - (b.completionRate || 0)
              : (b.completionRate || 0) - (a.completionRate || 0);
          } else if (sortField === 'averageScore') {
            return sortDirection === 'asc'
              ? (a.averageScore || 0) - (b.averageScore || 0)
              : (b.averageScore || 0) - (a.averageScore || 0);
          }
          return 0;
        })
    : [];

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Mobile/tablet view - card grid
  if (isMobile || isTablet) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Search only */}
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8 w-full sm:w-[260px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Student count */}
        <div className="text-sm text-muted-foreground">
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
        </div>

        {/* Students grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {student.image && <AvatarImage src={student.image} alt={student.name} />}
                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        {student.email && (
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}`)}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}/performance`)}>
                          View Performance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}/message`)}>
                          Send Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Attendance</span>
                        <span className="font-medium">{student.attendanceRate || 0}%</span>
                      </div>
                      <Progress value={student.attendanceRate || 0} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion</span>
                        <span className="font-medium">{student.completionRate || 0}%</span>
                      </div>
                      <Progress value={student.completionRate || 0} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Score</span>
                        <span className="font-medium">{student.averageScore || 0}%</span>
                      </div>
                      <Progress value={student.averageScore || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}`)}
                  >
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? `No students matching "${searchQuery}"`
                  : "This class doesn't have any students yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop view - table
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search only */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8 w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Student count */}
      <div className="text-sm text-muted-foreground">
        {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
      </div>

      {/* Students table */}
      <Card>
        {isLoading ? (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-full rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : filteredStudents.length > 0 ? (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Student
                      {sortField === 'name' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortDirection === 'desc' && "rotate-180"
                        )} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('attendanceRate')}
                  >
                    <div className="flex items-center">
                      Attendance
                      {sortField === 'attendanceRate' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortDirection === 'desc' && "rotate-180"
                        )} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('completionRate')}
                  >
                    <div className="flex items-center">
                      Completion
                      {sortField === 'completionRate' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortDirection === 'desc' && "rotate-180"
                        )} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('averageScore')}
                  >
                    <div className="flex items-center">
                      Average Score
                      {sortField === 'averageScore' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortDirection === 'desc' && "rotate-180"
                        )} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {student.image && <AvatarImage src={student.image} alt={student.name} />}
                          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          {student.email && (
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={student.attendanceRate || 0} className="h-2 w-16" />
                        <span className="text-sm font-medium">{student.attendanceRate || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={student.completionRate || 0} className="h-2 w-16" />
                        <span className="text-sm font-medium">{student.completionRate || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={student.averageScore || 0} className="h-2 w-16" />
                        <span className="text-sm font-medium">{student.averageScore || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'inactive' ? 'outline' : 'default'}>
                        {student.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}/performance`)}>
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${classId}/students/${student.id}/message`)}>
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : (
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No students found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No students matching "${searchQuery}"`
                : "This class doesn't have any students yet"}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
