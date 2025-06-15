'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import {
  Search,
  RotateCcw,
  BookOpen,
  Users,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

interface Course {
  id: string;
  name: string;
  code: string;
  programName: string;
  classCount: number;
  studentCount: number;
  teacherCount: number;
  status: 'active' | 'inactive' | 'upcoming';
}

interface CoordinatorCoursesClientProps {
  initialSearch?: string;
  initialProgramId?: string;
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  programCampuses: Array<{
    id: string;
    programId: string;
    program: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * CoordinatorCoursesClient Component
 *
 * Client component for the coordinator courses page with real-time data.
 * Includes course listing, filtering, and analytics.
 */
export function CoordinatorCoursesClient({
  initialSearch = '',
  initialProgramId = '',
  campus,
  programCampuses
}: CoordinatorCoursesClientProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    syncStatus,
    getData: getCoursesData,
    saveData: saveCoursesData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Use API imported at the top

  // Fetch courses using the API
  const { data: coursesData, isLoading: isLoadingCourses, refetch: refetchCourses } = api.coordinator.getProgramCourses.useQuery(
    {
      programId: initialProgramId || "", // Use initialProgramId if provided
      campusId: campus.id
    },
    {
      enabled: isOnline,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data?.courses) {
          // Transform API data to match our component's data structure
          const transformedCourses: Course[] = data.courses.map((course: any) => ({
            id: course.id,
            name: course.name,
            code: course.code || 'N/A',
            programName: course.program?.name || 'N/A',
            classCount: course.classes?.length || 0,
            studentCount: course.studentCount || 0,
            teacherCount: course.teacherCount || 0,
            status: course.status?.toLowerCase() || 'active'
          }));

          setCourses(transformedCourses);
          setIsLoading(false);

          // Save to offline storage
          saveCoursesData('courses', 'all', transformedCourses);
        }
      },
      onError: (error) => {
        console.error('Error fetching courses:', error);

        // Try to get data from offline storage
        getCoursesData('courses', 'all').then((offlineData) => {
          if (offlineData) {
            setCourses(offlineData);
          } else {
            setCourses([]);
          }
          setIsLoading(false);
        }).catch((offlineError) => {
          console.error('Error getting offline data:', offlineError);
          setCourses([]);
          setIsLoading(false);
        });
      }
    }
  );

  // Fetch courses on component mount
  useEffect(() => {
    if (!isOnline) {
      // If offline, try to get data from offline storage
      getCoursesData('courses', 'all').then((offlineData) => {
        if (offlineData) {
          setCourses(offlineData);
        }
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error getting offline data:', error);
        setIsLoading(false);
      });
    }
  }, []);

  // Function to fetch courses
  const fetchCourses = async () => {
    setIsRefreshing(true);

    try {
      if (isOnline) {
        // Refetch data from API
        await refetchCourses();
      } else {
        // Try to get data from offline storage
        const offlineData = await getCoursesData('courses', 'all');
        if (offlineData) {
          setCourses(offlineData);
        } else {
          // If no offline data, set empty array
          setCourses([]);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchCourses();
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.programName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to course detail with performance metrics
  const handleCourseClick = (courseId: string) => {
    router.push(`/admin/coordinator/courses/${courseId}/performance`);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || !isOnline}
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="science">Science</TabsTrigger>
          <TabsTrigger value="arts">Arts</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent/5">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No courses found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            // Course list
            filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:bg-accent/5"
                onClick={() => handleCourseClick(course.id)}
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {course.name}
                      <span className="text-sm text-muted-foreground ml-2">({course.code})</span>
                    </CardTitle>
                    <CardDescription>{course.programName}</CardDescription>
                  </div>
                  <div className="flex items-center">
                    {renderStatusBadge(course.status)}
                    <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Classes</span>
                      <span className="text-sm font-medium flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {course.classCount}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Students</span>
                      <span className="text-sm font-medium flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {course.studentCount}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Teachers</span>
                      <span className="text-sm font-medium flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {course.teacherCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="science">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent/5 mb-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Filter courses by Science program
            filteredCourses
              .filter(course => course.programName.toLowerCase().includes('science'))
              .map((course) => (
                <Card
                  key={course.id}
                  className="cursor-pointer hover:bg-accent/5 mb-4"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {course.name}
                        <span className="text-sm text-muted-foreground ml-2">({course.code})</span>
                      </CardTitle>
                      <CardDescription>{course.programName}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      {renderStatusBadge(course.status)}
                      <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Classes</span>
                        <span className="text-sm font-medium flex items-center">
                          <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.classCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Students</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.studentCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Teachers</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.teacherCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="arts">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent/5 mb-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Filter courses by Arts program
            filteredCourses
              .filter(course => course.programName.toLowerCase().includes('arts'))
              .map((course) => (
                <Card
                  key={course.id}
                  className="cursor-pointer hover:bg-accent/5 mb-4"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {course.name}
                        <span className="text-sm text-muted-foreground ml-2">({course.code})</span>
                      </CardTitle>
                      <CardDescription>{course.programName}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      {renderStatusBadge(course.status)}
                      <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Classes</span>
                        <span className="text-sm font-medium flex items-center">
                          <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.classCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Students</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.studentCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Teachers</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.teacherCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="technology">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent/5 mb-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Filter courses by Technology program
            filteredCourses
              .filter(course => course.programName.toLowerCase().includes('technology'))
              .map((course) => (
                <Card
                  key={course.id}
                  className="cursor-pointer hover:bg-accent/5 mb-4"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {course.name}
                        <span className="text-sm text-muted-foreground ml-2">({course.code})</span>
                      </CardTitle>
                      <CardDescription>{course.programName}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      {renderStatusBadge(course.status)}
                      <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Classes</span>
                        <span className="text-sm font-medium flex items-center">
                          <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.classCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Students</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.studentCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Teachers</span>
                        <span className="text-sm font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {course.teacherCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
