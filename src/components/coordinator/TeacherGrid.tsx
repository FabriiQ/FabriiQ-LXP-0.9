'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Mail, BookOpen, Users, Award, Calendar, Clock, Filter } from "lucide-react";
import { WifiOff } from "@/components/ui/icons/custom-icons";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  specialization: string;
  qualifications?: string;
  classCount: number;
  subjectCount: number;
  studentCount?: number;
  attendanceRate?: number;
  performanceRating?: number;
  lastActive?: Date;
  joinDate?: string;
  avatar?: string;
  department?: string;
  points?: number;
  achievements?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }[];
}

interface TeacherGridProps {
  teachers: Teacher[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isOffline?: boolean;
  onFilter?: (filters: {
    status?: string;
    department?: string;
    specialization?: string;
    performanceRating?: number;
    attendanceRate?: number;
  }) => void;
  departments?: string[];
  specializations?: string[];
}

export function TeacherGrid({
  teachers,
  isLoading,
  searchQuery,
  onSearchChange,
  onSearch,
  isOffline = false,
  onFilter,
  departments = [],
  specializations = []
}: TeacherGridProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');

  // Filter teachers based on active tab and other filters
  const filteredTeachers = teachers.filter(teacher => {
    // Status filter
    if (activeTab !== 'all' && teacher.status.toLowerCase() !== activeTab) {
      return false;
    }

    // Department filter
    if (departmentFilter !== 'all' && teacher.department !== departmentFilter) {
      return false;
    }

    // Specialization filter
    if (specializationFilter !== 'all' && teacher.specialization !== specializationFilter) {
      return false;
    }

    // Performance filter
    if (performanceFilter !== 'all' && teacher.performanceRating) {
      const rating = parseInt(performanceFilter);
      if (teacher.performanceRating < rating) {
        return false;
      }
    }

    // Attendance filter
    if (attendanceFilter !== 'all' && teacher.attendanceRate) {
      const rate = parseInt(attendanceFilter);
      if (teacher.attendanceRate < rate) {
        return false;
      }
    }

    return true;
  });

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <div>
            <p className="font-medium">Offline Mode</p>
            <p className="text-xs">You're viewing cached teacher data. Some features may be limited.</p>
          </div>
        </div>
      )}

      <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search teachers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isOffline}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="submit" disabled={isOffline}>
            Search
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </form>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-muted/20 rounded-md">
          {departments.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
                disabled={isOffline}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {specializations.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Specialization</label>
              <Select
                value={specializationFilter}
                onValueChange={setSpecializationFilter}
                disabled={isOffline}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Performance Rating</label>
            <Select
              value={performanceFilter}
              onValueChange={setPerformanceFilter}
              disabled={isOffline}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Attendance Rate</label>
            <Select
              value={attendanceFilter}
              onValueChange={setAttendanceFilter}
              disabled={isOffline}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="90">90%+</SelectItem>
                <SelectItem value="80">80%+</SelectItem>
                <SelectItem value="70">70%+</SelectItem>
                <SelectItem value="60">60%+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Teachers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
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
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No teachers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <Card key={teacher.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={teacher.avatar || `https://avatar.vercel.sh/${teacher.name}`} alt={teacher.name} />
                          <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{teacher.name}</CardTitle>
                          <CardDescription>
                            {teacher.specialization}
                            {teacher.department && ` • ${teacher.department}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={teacher.status.toLowerCase() === 'active' ? 'success' : 'secondary'}>
                          {teacher.status}
                        </Badge>
                        {teacher.points !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {teacher.points} pts
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Teacher Points</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span>{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center text-sm">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span>{teacher.classCount} Classes</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span>{teacher.subjectCount} Subjects</span>
                        </div>

                        {teacher.studentCount !== undefined && (
                          <div className="flex items-center text-sm">
                            <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{teacher.studentCount} Students</span>
                          </div>
                        )}

                        {teacher.joinDate && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>Joined {teacher.joinDate}</span>
                          </div>
                        )}
                      </div>

                      {(teacher.performanceRating !== undefined || teacher.attendanceRate !== undefined) && (
                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t">
                          {teacher.performanceRating !== undefined && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className={`h-4 w-4 ${i < Math.round(teacher.performanceRating || 0)
                                          ? 'text-yellow-500 fill-yellow-500'
                                          : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Performance Rating: {teacher.performanceRating}/5</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {teacher.attendanceRate !== undefined && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          teacher.attendanceRate >= 90 ? 'bg-green-500' :
                                          teacher.attendanceRate >= 80 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${teacher.attendanceRate}%` }}
                                      />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Attendance Rate: {teacher.attendanceRate}%</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}

                      {teacher.achievements && teacher.achievements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {teacher.achievements.slice(0, 3).map(achievement => (
                            <TooltipProvider key={achievement.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center">
                                    <span role="img" aria-label={achievement.name}>{achievement.icon}</span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{achievement.name}</p>
                                  <p className="text-xs">{achievement.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {teacher.achievements.length > 3 && (
                            <Badge variant="outline" className="h-6 px-2 flex items-center justify-center">
                              +{teacher.achievements.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/admin/coordinator/teachers/${teacher.id}`}>
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
