'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { Trophy, Medal } from '@/components/ui/icons/trophy-medal';
import { Minus } from '@/components/ui/icons/minus';

interface TeacherLeaderboardViewProps {
  courseId?: string;
  // programId is not used in this component but kept for API compatibility
  programId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
  rankingCriteria?: 'overall' | 'attendance' | 'feedback' | 'studentPerformance';
}

interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  position: number;
  previousPosition?: number;
  score: number;
  attendance: number;
  feedbackTime: number;
  studentPerformance: number;
  classCount: number;
  studentCount: number;
  achievements: string[];
}

/**
 * TeacherLeaderboardView Component
 *
 * Displays a comprehensive teacher leaderboard with multiple ranking criteria.
 * Includes course-specific and program-wide views.
 */
export function TeacherLeaderboardView({
  courseId,
  // programId is not used but kept for API compatibility
  programId: _programId,
  timeframe = 'term',
  rankingCriteria = 'overall'
}: TeacherLeaderboardViewProps) {
  // isMobile is not used in this component but kept for future responsive design
  const { isMobile: _isMobile } = useResponsive();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedRankingCriteria, setSelectedRankingCriteria] = useState<string>(rankingCriteria);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getLeaderboardData,
    saveData: saveLeaderboardData,
    // sync is not used in this component but kept for future sync operations
    sync: _sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Toast hook
  const { toast } = useToast();

  // Available courses for selection
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Fetch available courses
  const { data: coursesData, isLoading: isLoadingCourses } = api.teacherAnalytics.getAvailableCourses.useQuery(
    {
      programId: _programId // Use the programId passed from parent component
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: isOnline,
      onSuccess: (data) => {
        if (data) {
          setAvailableCourses(data.map((course: any) => ({
            id: course.id,
            name: course.name
          })));

          // Save to offline storage
          saveLeaderboardData('availableCourses', 'list', data);
        }
      },
      onError: (error) => {
        console.error('Error fetching courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch courses. Using cached data if available.',
          variant: 'error',
        });

        // Try to get courses from offline storage
        getLeaderboardData('availableCourses', 'list').then((offlineCourses) => {
          if (offlineCourses) {
            setAvailableCourses(offlineCourses.map((course: any) => ({
              id: course.id,
              name: course.name
            })));
          }
        });
      }
    }
  );

  // Helper function to map ranking criteria to sortBy parameter
  const mapRankingCriteriaToSortBy = (criteria: string): "points" | "activityCreation" | "studentPerformance" | "attendance" | "feedback" => {
    switch (criteria) {
      case 'attendance':
        return 'attendance';
      case 'feedback':
        return 'feedback';
      case 'studentPerformance':
        return 'studentPerformance';
      case 'overall':
      default:
        return 'points';
    }
  };

  // Fetch leaderboard data on component mount or when parameters change
  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedTimeframe, selectedRankingCriteria, selectedCourseId]);

  // Fetch teacher leaderboard data from API
  const { data: leaderboardData, refetch: refetchLeaderboard } = api.teacherLeaderboard.getTeacherLeaderboard.useQuery(
    {
      courseId: selectedCourseId,
      timeframe: selectedTimeframe as "daily" | "weekly" | "monthly" | "term" | "all",
      sortBy: mapRankingCriteriaToSortBy(selectedRankingCriteria)
    },
    {
      enabled: isOnline && (!!selectedCourseId || availableCourses.length > 0),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.leaderboard) {
          // Create a unique cache key for this request
          const cacheKey = `${selectedCourseId || 'all'}-${selectedTimeframe}-${selectedRankingCriteria}`;

          // Transform the data to match our Teacher interface
          const transformedTeachers = data.leaderboard.map(item => ({
            id: item.teacherId,
            name: item.name,
            avatar: item.avatar || undefined,
            position: item.position,
            previousPosition: item.position - (item.rankChange || 0),
            score: item.points,
            attendance: item.metrics.attendanceRate,
            feedbackTime: item.metrics.feedbackTime,
            studentPerformance: item.metrics.studentPerformance,
            classCount: item.classCount || 0,
            studentCount: 0, // Not provided by the API, could be added later
            achievements: [] // Not provided by the API, could be added later
          }));

          // Save to offline storage
          saveLeaderboardData('teacherLeaderboard', cacheKey, transformedTeachers);

          // Update state
          setTeachers(transformedTeachers);
          setIsLoading(false);
        }
      },
      onError: (error) => {
        console.error('Error fetching leaderboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch leaderboard data. Using cached data if available.',
          variant: 'error',
        });
      }
    }
  );

  // Function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    setIsRefreshing(true);

    try {
      // Create a unique cache key for this request
      const cacheKey = `${selectedCourseId || 'all'}-${selectedTimeframe}-${selectedRankingCriteria}`;

      // Check if we have a valid course selection or available courses
      if (!selectedCourseId && availableCourses.length === 0) {
        setIsLoading(false);
        setIsRefreshing(false);
        setTeachers([]);
        return;
      }

      if (isOnline) {
        // Refetch data from API
        await refetchLeaderboard();
      } else {
        // Try to get data from offline storage
        const cachedData = await getLeaderboardData('teacherLeaderboard', cacheKey);
        if (cachedData) {
          setTeachers(cachedData);
        } else {
          toast({
            title: 'No Cached Data',
            description: 'No cached leaderboard data available. Please connect to the internet.',
            variant: 'warning',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);

      // Try to get data from offline storage as fallback
      try {
        const cacheKey = `${selectedCourseId || 'all'}-${selectedTimeframe}-${selectedRankingCriteria}`;
        const offlineData = await getLeaderboardData('teacherLeaderboard', cacheKey);
        if (offlineData) {
          setTeachers(offlineData);
        }
      } catch (offlineError) {
        console.error('Error getting offline data:', offlineError);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchLeaderboardData();
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  // Handle ranking criteria change - not used in current UI but kept for future tabs
  // This would be used when the ranking criteria tabs are implemented
  const _handleRankingCriteriaChange = (value: string) => {
    setSelectedRankingCriteria(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value === 'all' ? undefined : value);
  };

  // Render position change indicator
  const renderPositionChange = (current: number, previous?: number) => {
    if (!previous) return null;

    if (current < previous) {
      return (
        <div className="flex items-center text-green-500">
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs">{previous - current}</span>
        </div>
      );
    } else if (current > previous) {
      return (
        <div className="flex items-center text-red-500">
          <ChevronDown className="h-4 w-4" />
          <span className="text-xs">{current - previous}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4" />
        </div>
      );
    }
  };

  // Render position badge
  const renderPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full">
          <Trophy className="h-4 w-4" />
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 rounded-full">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-800 rounded-full">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full">
          {position}
        </div>
      );
    }
  };

  // Render metric based on selected criteria
  // This function is not currently used but kept for future implementation of the tab content
  // It would be used to render different metrics in the attendance, feedback, and performance tabs
  const _renderMetric = (teacher: Teacher) => {
    if (selectedRankingCriteria === 'attendance') {
      return (
        <div className="flex flex-col items-end">
          <div className="font-semibold">{teacher.attendance}%</div>
          <div className="w-24 mt-1">
            <Progress value={teacher.attendance} className="h-2" />
          </div>
        </div>
      );
    } else if (selectedRankingCriteria === 'feedback') {
      return (
        <div className="flex flex-col items-end">
          <div className="font-semibold flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {teacher.feedbackTime}h
          </div>
          <div className="text-xs text-muted-foreground">Avg. feedback time</div>
        </div>
      );
    } else if (selectedRankingCriteria === 'studentPerformance') {
      return (
        <div className="flex flex-col items-end">
          <div className="font-semibold">{teacher.studentPerformance}%</div>
          <div className="w-24 mt-1">
            <Progress value={teacher.studentPerformance} className="h-2" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-end">
          <div className="font-semibold">{teacher.score}</div>
          <div className="text-xs text-muted-foreground">Overall score</div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Teacher Leaderboard
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="performance">Student Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>
                    {selectedCourseId
                      ? `Course Leaderboard: ${availableCourses.find(c => c.id === selectedCourseId)?.name}`
                      : 'Program Leaderboard'}
                  </CardTitle>
                  <CardDescription>
                    Teacher rankings based on overall performance
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-b">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {renderPositionBadge(teacher.position)}
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={teacher.avatar} alt={teacher.name} />
                          <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium">{teacher.name}</h4>
                          {teacher.achievements.length > 0 && (
                            <div className="flex ml-2 gap-1">
                              {teacher.achievements.slice(0, 2).map((achievement, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {achievement}
                                </Badge>
                              ))}
                              {teacher.achievements.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{teacher.achievements.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            {teacher.classCount} Classes
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {teacher.studentCount} Students
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="font-semibold">{teacher.score}</div>
                        {renderPositionChange(teacher.position, teacher.previousPosition)}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center mt-4">
                    <Button variant="outline">View All Teachers</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Leaderboard</CardTitle>
              <CardDescription>Teacher rankings based on attendance rates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-b">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...teachers]
                    .sort((a, b) => b.attendance - a.attendance)
                    .map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium">{teacher.name}</h4>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center">
                              <BookOpen className="h-3.5 w-3.5 mr-1" />
                              {teacher.classCount} Classes
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="font-semibold">{teacher.attendance}%</div>
                          <div className="w-24 mt-1">
                            <Progress value={teacher.attendance} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Timeliness</CardTitle>
              <CardDescription>Teacher rankings based on feedback response time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-b">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...teachers]
                    .sort((a, b) => a.feedbackTime - b.feedbackTime) // Lower is better for feedback time
                    .map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium">{teacher.name}</h4>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center">
                              <BookOpen className="h-3.5 w-3.5 mr-1" />
                              {teacher.classCount} Classes
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="font-semibold flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {teacher.feedbackTime}h
                          </div>
                          <div className="text-xs text-muted-foreground">Avg. feedback time</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Teacher rankings based on student performance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-b">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...teachers]
                    .sort((a, b) => b.studentPerformance - a.studentPerformance)
                    .map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium">{teacher.name}</h4>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {teacher.studentCount} Students
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="font-semibold">{teacher.studentPerformance}%</div>
                          <div className="w-24 mt-1">
                            <Progress value={teacher.studentPerformance} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
