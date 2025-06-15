'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { Skeleton } from '@/components/ui/atoms/skeleton';
import {
  Users,
  BookOpen,
  Calendar,
  Search,
  Plus,
  MoreVertical,
  ClipboardList
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ClassesGridProps {
  teacherId: string;
}

/**
 * ClassesGrid component for displaying teacher's classes
 *
 * Features:
 * - Responsive grid layout
 * - Search functionality
 * - Class cards with key metrics
 * - Quick actions
 */
export function ClassesGrid({ teacherId }: ClassesGridProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch classes for this teacher
  const { data: classes, isLoading } = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Filter classes based on search query
  const filteredClasses = classes?.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.courseCampus?.course?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8 w-full sm:w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Classes grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredClasses && filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <CardDescription>
                      {cls.courseCampus?.course?.name || 'No course assigned'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${cls.id}/attendance`)}>
                        Take Attendance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${cls.id}/assessments`)}>
                        Manage Assessments
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/teacher/classes/${cls.id}/edit`)}>
                        Edit Class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="flex flex-col items-center">
                    <Users className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{cls.students?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Students</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{cls.activities?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Activities</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ClipboardList className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{cls.assessments?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Assessments</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${cls.id}`)}
                >
                  View Class
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No classes found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchQuery
              ? `No classes matching "${searchQuery}"`
              : "You don't have any classes assigned yet. Please contact your administrator to be assigned to classes."}
          </p>
        </div>
      )}
    </div>
  );
}
