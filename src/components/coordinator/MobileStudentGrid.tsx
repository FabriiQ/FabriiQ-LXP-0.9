'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { WifiOff } from "@/components/ui/icons/custom-icons";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Progress } from "@/components/ui/progress";
import { useResponsive } from '@/lib/hooks/use-responsive';

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
}

interface MobileStudentGridProps {
  students: Student[];
  isLoading?: boolean;
  campusId?: string;
  programId?: string;
  classId?: string;
  isOffline?: boolean;
}

export function MobileStudentGrid({
  students,
  isLoading = false,
  campusId,
  programId,
  classId,
  isOffline = false
}: MobileStudentGridProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null; // Only render on mobile
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStudentClick = (studentId: string) => {
    let basePath = '/admin/coordinator/students';
    if (classId) {
      basePath = `/admin/coordinator/classes/${classId}/students`;
    } else if (programId) {
      basePath = `/admin/coordinator/programs/${programId}/students`;
    } else if (campusId) {
      basePath = `/admin/coordinator/campus/${campusId}/students`;
    }
    router.push(`${basePath}/${studentId}`);
  };

  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs">Offline Mode: Using cached data</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isOffline}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No students found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="overflow-hidden"
              onClick={() => handleStudentClick(student.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={student.name} />
                      <AvatarFallback>
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">{student.name}</h3>
                      <p className="text-xs text-muted-foreground">{student.enrollmentNumber}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {(student.academicScore !== undefined || student.attendanceRate !== undefined) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {student.academicScore !== undefined && (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Academic</span>
                          <span className="text-xs font-medium">{student.academicScore}%</span>
                        </div>
                        <Progress value={student.academicScore} className="h-1 mt-1" />
                      </div>
                    )}

                    {student.attendanceRate !== undefined && (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Attendance</span>
                          <span className="text-xs font-medium">{student.attendanceRate}%</span>
                        </div>
                        <Progress value={student.attendanceRate} className="h-1 mt-1" />
                      </div>
                    )}
                  </div>
                )}

                {student.leaderboardPosition && (
                  <div className="mt-2 flex items-center">
                    <Badge variant="outline" className="text-xs">
                      Rank #{student.leaderboardPosition}
                    </Badge>
                    {student.leaderboardChange && (
                      <Badge variant={student.leaderboardChange > 0 ? "success" : "destructive"} className="ml-2 text-xs">
                        {student.leaderboardChange > 0 ? '+' : ''}{student.leaderboardChange}
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
