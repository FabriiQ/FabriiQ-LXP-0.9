'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, WifiOff, Filter, Award, Star, Clock, Users, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { useResponsive } from '@/lib/hooks/use-responsive';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  specialization?: string;
  qualifications?: string;
  classCount?: number;
  subjectCount?: number;
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

interface MobileTeacherGridProps {
  teachers: Teacher[];
  isLoading?: boolean;
  campusId?: string;
  programId?: string;
  isOffline?: boolean;
  departments?: string[];
  specializations?: string[];
}

export function MobileTeacherGrid({
  teachers,
  isLoading = false,
  campusId,
  programId,
  isOffline = false,
  departments = [],
  specializations = []
}: MobileTeacherGridProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null; // Only render on mobile
  }

  // Filter teachers based on search query and other filters
  const filteredTeachers = teachers.filter(teacher => {
    // Search filter
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.specialization && teacher.specialization.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && teacher.status?.toLowerCase() !== statusFilter) {
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

  const handleTeacherClick = (teacherId: string) => {
    let basePath = '/admin/coordinator/teachers';
    if (programId) {
      basePath = `/admin/coordinator/programs/${programId}/teachers`;
    } else if (campusId) {
      basePath = `/admin/coordinator/campus/${campusId}/teachers`;
    }
    router.push(`${basePath}/${teacherId}`);
  };

  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs">Offline Mode: Using cached data</p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search teachers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isOffline}
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" disabled={isOffline}>
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Teachers</SheetTitle>
              <SheetDescription>
                Apply filters to find specific teachers
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={isOffline}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setSpecializationFilter('all');
                    setPerformanceFilter('all');
                    setAttendanceFilter('all');
                  }}
                  variant="outline"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No teachers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="overflow-hidden"
              onClick={() => handleTeacherClick(teacher.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={teacher.avatar || ""} alt={teacher.name} />
                      <AvatarFallback>
                        {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">{teacher.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {teacher.specialization || 'Teacher'}
                        {teacher.department && ` • ${teacher.department}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {teacher.status && (
                    <Badge variant={teacher.status.toLowerCase() === 'active' ? 'success' : 'secondary'} className="text-xs">
                      {teacher.status}
                    </Badge>
                  )}

                  {teacher.points !== undefined && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {teacher.points} pts
                    </Badge>
                  )}

                  {teacher.classCount !== undefined && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {teacher.classCount}
                    </Badge>
                  )}

                  {teacher.subjectCount !== undefined && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {teacher.subjectCount}
                    </Badge>
                  )}
                </div>

                {(teacher.performanceRating !== undefined || teacher.attendanceRate !== undefined) && (
                  <div className="mt-3 pt-2 border-t flex items-center justify-between">
                    {teacher.performanceRating !== undefined && (
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < Math.round(teacher.performanceRating || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}

                    {teacher.attendanceRate !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
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
                    )}
                  </div>
                )}

                {teacher.achievements && teacher.achievements.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {teacher.achievements.slice(0, 3).map(achievement => (
                      <Badge key={achievement.id} variant="outline" className="h-5 w-5 p-0 flex items-center justify-center">
                        <span role="img" aria-label={achievement.name}>{achievement.icon}</span>
                      </Badge>
                    ))}
                    {teacher.achievements.length > 3 && (
                      <Badge variant="outline" className="h-5 px-1 text-xs flex items-center justify-center">
                        +{teacher.achievements.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
