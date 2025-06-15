'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/data-display/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import {
  Search, Mail, BookOpen, Users, Award, TrendingUp, Filter,
  AlertCircle, CheckCircle, Clock, Calendar, GraduationCap,
  ArrowUpDown, ChevronUp, ChevronDown
} from "lucide-react";
import { Phone, Star, WifiOff } from "@/components/ui/icons/custom-icons";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/form/select";

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentNumber: string;
  currentGrade?: string;
  academicScore?: number;
  attendanceRate?: number;
  participationRate?: number;
  classCount: number;
  programName?: string;
  courseName?: string;
  leaderboardPosition?: number;
  leaderboardChange?: number;
  status?: string;
  lastActive?: Date;
  improvementRate?: number;
  completionRate?: number;
  tags?: string[];
  recentActivity?: {
    type: string;
    name: string;
    date: Date;
    score?: number;
  };
}

interface StudentGridProps {
  students: Student[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isOffline?: boolean;
  onFilter?: (filters: {
    academicRange?: [number, number];
    attendanceRange?: [number, number];
    participationRange?: [number, number];
    programId?: string;
    courseId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  programs?: Array<{ id: string; name: string }>;
  courses?: Array<{ id: string; name: string }>;
}

export function StudentGrid({
  students,
  isLoading,
  searchQuery,
  onSearchChange,
  onSearch,
  isOffline = false,
  onFilter,
  programs = [],
  courses = []
}: StudentGridProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [academicRange, setAcademicRange] = useState<[number, number]>([0, 100]);
  const [attendanceRange, setAttendanceRange] = useState<[number, number]>([0, 100]);
  const [participationRange, setParticipationRange] = useState<[number, number]>([0, 100]);

  // Filter students based on active tab and other filters
  const filteredStudents = students.filter(student => {
    // Tab filters
    if (activeTab === 'all') {
      // No tab filter
    } else if (activeTab === 'high-performers') {
      if ((student.academicScore || 0) < 80) return false;
    } else if (activeTab === 'needs-attention') {
      if ((student.academicScore || 0) >= 60) return false;
    } else if (activeTab === 'attendance-issues') {
      if ((student.attendanceRate || 0) >= 80) return false;
    }

    // Program filter
    if (selectedProgram && student.programName !== selectedProgram) return false;

    // Course filter
    if (selectedCourse && student.courseName !== selectedCourse) return false;

    // Academic range filter
    if ((student.academicScore || 0) < academicRange[0] || (student.academicScore || 0) > academicRange[1]) return false;

    // Attendance range filter
    if ((student.attendanceRate || 0) < attendanceRange[0] || (student.attendanceRate || 0) > attendanceRange[1]) return false;

    // Participation range filter
    if ((student.participationRate || 0) < participationRange[0] || (student.participationRate || 0) > participationRange[1]) return false;

    return true;
  }).sort((a, b) => {
    // Sort by selected field
    let valueA, valueB;

    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'academic':
        valueA = a.academicScore || 0;
        valueB = b.academicScore || 0;
        break;
      case 'attendance':
        valueA = a.attendanceRate || 0;
        valueB = b.attendanceRate || 0;
        break;
      case 'participation':
        valueA = a.participationRate || 0;
        valueB = b.participationRate || 0;
        break;
      case 'leaderboard':
        valueA = a.leaderboardPosition || 999;
        valueB = b.leaderboardPosition || 999;
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }

    // Apply sort order
    const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Handle filter changes
  const handleFilterChange = () => {
    if (onFilter) {
      onFilter({
        academicRange,
        attendanceRange,
        participationRange,
        programId: selectedProgram,
        courseId: selectedCourse,
        sortBy,
        sortOrder
      });
    }
  };

  // Toggle sort order
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format academic score for display
  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return 'N/A';
    return `${score.toFixed(1)}%`;
  };

  // Get color class based on score
  const getScoreColorClass = (score?: number) => {
    if (score === undefined || score === null) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get progress value based on score
  const getProgressValue = (score?: number) => {
    if (score === undefined || score === null) return 0;
    return score;
  };

  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    if (!status) return 'secondary';
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'secondary';
      case 'SUSPENDED': return 'warning';
      case 'WITHDRAWN': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <div>
            <p className="font-medium">Offline Mode</p>
            <p className="text-xs">You're viewing cached student data. Some features may be limited.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isOffline}
            />
          </div>
          <Button variant="outline" type="submit" disabled={isOffline}>
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isOffline}>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => toggleSort('name')}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('academic')}>
                  Academic Score {sortBy === 'academic' && (sortOrder === 'asc' ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('attendance')}>
                  Attendance {sortBy === 'attendance' && (sortOrder === 'asc' ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('participation')}>
                  Participation {sortBy === 'participation' && (sortOrder === 'asc' ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('leaderboard')}>
                  Leaderboard {sortBy === 'leaderboard' && (sortOrder === 'asc' ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            disabled={isOffline}
            className={showFilters ? 'bg-muted' : ''}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            <CardDescription>Filter students by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program</label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Programs</SelectItem>
                      {programs.map(program => (
                        <SelectItem key={program.id} value={program.name}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {courses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.name}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="ACTIVE" disabled={isOffline}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="default"
                size="sm"
                onClick={handleFilterChange}
                disabled={isOffline}
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="high-performers">High Performers</TabsTrigger>
          <TabsTrigger value="needs-attention">Needs Attention</TabsTrigger>
          <TabsTrigger value="attendance-issues">Attendance Issues</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-16" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${student.name}`} alt={student.name} />
                          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>{student.enrollmentNumber}</CardDescription>
                            {student.status && (
                              <Badge variant={getStatusVariant(student.status)} className="text-xs">
                                {student.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {student.leaderboardPosition && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          #{student.leaderboardPosition}
                          {student.leaderboardChange && student.leaderboardChange !== 0 && (
                            <span className={student.leaderboardChange > 0 ? "text-green-500" : "text-red-500"}>
                              {student.leaderboardChange > 0 ? "↑" : "↓"}{Math.abs(student.leaderboardChange)}
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>{student.phone}</span>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            Academic
                          </span>
                          <span className={
                            (student.academicScore || 0) >= 80 ? "text-green-600" :
                            (student.academicScore || 0) >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }>
                            {formatScore(student.academicScore)}
                          </span>
                        </div>
                        <Progress
                          value={getProgressValue(student.academicScore)}
                          className="h-1.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            Attendance
                          </span>
                          <span className={
                            (student.attendanceRate || 0) >= 90 ? "text-green-600" :
                            (student.attendanceRate || 0) >= 75 ? "text-yellow-600" :
                            "text-red-600"
                          }>
                            {formatScore(student.attendanceRate)}
                          </span>
                        </div>
                        <Progress
                          value={getProgressValue(student.attendanceRate)}
                          className="h-1.5"
                        />
                      </div>

                      {student.participationRate !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center">
                              <Award className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              Participation
                            </span>
                            <span className={
                              (student.participationRate || 0) >= 80 ? "text-green-600" :
                              (student.participationRate || 0) >= 60 ? "text-yellow-600" :
                              "text-red-600"
                            }>
                              {formatScore(student.participationRate)}
                            </span>
                          </div>
                          <Progress
                            value={getProgressValue(student.participationRate)}
                            className="h-1.5"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm mt-2">
                        <div className="flex items-center">
                          <GraduationCap className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span>{student.currentGrade || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{student.programName || student.courseName || 'N/A'}</span>
                        </div>
                      </div>

                      {student.tags && student.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/admin/coordinator/students/${student.id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
