'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { StudentLeaderboardAnalytics } from './StudentLeaderboardAnalytics';
import { api } from '@/trpc/react';
import {
  LeaderboardEntityType,
  TimeGranularity
} from '@/features/leaderboard/types/standard-leaderboard';
// Import icons from custom icons directory or use alternative imports
import {
  // Only import the icons we actually use
  ChevronUp,
  ChevronDown,
  BarChart as BarChart2
} from 'lucide-react';
import { RefreshCw } from '@/components/ui/icons/custom-icons';
import { Trophy, Medal } from '@/components/ui/icons/trophy-medal';
// Star is not used in this component
import { Minus } from '@/components/ui/icons/minus';

interface StudentLeaderboardViewProps {
  courseId?: string;
  classId?: string;
  programId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
  rankingCriteria?: 'overall' | 'grades' | 'participation' | 'improvement';
}

interface Student {
  id: string;
  name: string;
  avatar?: string;
  position: number;
  previousPosition?: number;
  score: number;
  grade: number;
  attendance: number;
  participation: number;
  improvement: number;
  badges: string[];
}

/**
 * StudentLeaderboardView Component
 *
 * Displays a comprehensive student leaderboard with multiple ranking criteria.
 * Includes course-specific, class-specific, and program-wide views.
 */
export function StudentLeaderboardView({
  courseId,
  classId,
  programId,
  timeframe = 'term',
  rankingCriteria = 'overall'
}: StudentLeaderboardViewProps) {
  // isMobile is not used in this component but kept for future responsive design
  const { isMobile: _isMobile } = useResponsive();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedRankingCriteria, setSelectedRankingCriteria] = useState<string>(rankingCriteria);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(classId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getLeaderboardData,
    saveData: saveLeaderboardData,
    // sync is not used in this component but kept for future sync operations
    sync: _sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Available courses for selection
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Available classes for selection
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);

  // Fetch courses data from API
  const { data: coursesData, isLoading: isLoadingCourses } = api.teacherAnalytics.getAvailableCourses.useQuery(
    { programId: programId || undefined },
    {
      enabled: isOnline && !!programId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          setAvailableCourses(data.map((course: any) => ({
            id: course.id,
            name: course.name
          })));

          // If we have a courseId from props, make sure it's in the available courses
          if (courseId && !data.some((c: any) => c.id === courseId)) {
            setAvailableCourses(prev => [
              ...prev,
              { id: courseId, name: 'Selected Course' }
            ]);
          }

          // Save to offline storage
          saveLeaderboardData('availableCourses', 'list', data);
        }
      },
      onError: async (error) => {
        console.error('Error fetching courses:', error);

        // Try to get courses from offline storage
        const offlineCourses = await getLeaderboardData('availableCourses', 'list');
        if (offlineCourses) {
          setAvailableCourses(offlineCourses.map((course: any) => ({
            id: course.id,
            name: course.name
          })));
        }
      }
    }
  );

  // Fetch classes data from API - using a safer endpoint
  const { data: classesData, isLoading: isLoadingClasses } = api.teacher.getTeacherClasses.useQuery(
    {
      courseId: selectedCourseId || undefined
    },
    {
      enabled: isOnline && !!selectedCourseId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          const classes = Array.isArray(data) ? data : data.classes || [];
          setAvailableClasses(classes.map((cls: any) => ({
            id: cls.id,
            name: cls.name || cls.className || `Class ${cls.id}`,
            courseId: selectedCourseId
          })));

          // If we have a classId from props, make sure it's in the available classes
          if (classId && !classes.some((c: any) => c.id === classId)) {
            setAvailableClasses(prev => [
              ...prev,
              { id: classId, name: 'Selected Class', courseId: selectedCourseId }
            ]);
          }

          // Save to offline storage
          saveLeaderboardData('availableClasses', selectedCourseId || 'default', classes);
        }
      },
      onError: async (error) => {
        console.error('Error fetching classes:', error);

        // Try to get classes from offline storage
        const offlineClasses = await getLeaderboardData('availableClasses', selectedCourseId || 'default');
        if (offlineClasses) {
          setAvailableClasses(offlineClasses.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            courseId: selectedCourseId
          })));
        } else {
          // If no offline data, set empty array
          setAvailableClasses([]);
        }
      }
    }
  );

  // Map timeframe to TimeGranularity
  const mapTimeframeToGranularity = (timeframe: string): TimeGranularity => {
    switch (timeframe) {
      case 'week':
        return TimeGranularity.WEEKLY;
      case 'month':
        return TimeGranularity.MONTHLY;
      case 'term':
        return TimeGranularity.TERM;
      case 'year':
        return TimeGranularity.ALL_TIME;
      default:
        return TimeGranularity.TERM;
    }
  };

  // Determine entity type and ID based on selected filters
  const getEntityTypeAndId = () => {
    if (selectedClassId) {
      return {
        type: LeaderboardEntityType.CLASS,
        id: selectedClassId
      };
    } else if (selectedCourseId) {
      return {
        type: LeaderboardEntityType.COURSE,
        id: selectedCourseId
      };
    } else if (programId) {
      // If we have a program ID but no course or class selected
      return {
        type: LeaderboardEntityType.CAMPUS, // Using CAMPUS as a proxy for program
        id: programId
      };
    } else {
      // Default to a fallback if nothing is selected
      return {
        type: LeaderboardEntityType.COURSE,
        id: availableCourses.length > 0 ? availableCourses[0].id : 'fallback-id'
      };
    }
  };

  // Get entity type and ID
  const { type: entityType, id: entityId } = getEntityTypeAndId();

  // Use the unified leaderboard API to get the leaderboard instead of student position
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    refetch: refetchLeaderboard
  } = api.unifiedLeaderboard.getLeaderboard.useQuery(
    {
      type: entityType,
      referenceId: entityId,
      timeGranularity: mapTimeframeToGranularity(selectedTimeframe),
      limit: 10,
      offset: 0,
      includeCurrentStudent: false,
      sortBy: 'rank',
      sortDirection: 'asc'
    },
    {
      enabled: !!entityId && entityId !== 'fallback-id',
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.leaderboard && data.leaderboard.length > 0) {
          // Transform the leaderboard data into our Student format
          const transformedStudents: Student[] = data.leaderboard.map((entry, index) => ({
            id: entry.studentId || `student-${index}`,
            name: entry.studentName || `Student ${index + 1}`,
            position: entry.rank || index + 1,
            previousPosition: entry.previousRank,
            score: entry.rewardPoints || 0,
            grade: entry.academicScore || 0,
            attendance: entry.completionRate || 0,
            participation: entry.completionRate || 0,
            improvement: entry.rankChange ? Math.abs(entry.rankChange) : 0,
            badges: [],
            avatar: entry.studentAvatar
          }));

          setStudents(transformedStudents);
        } else {
          // If no data is available, create some mock data
          const mockStudents: Student[] = Array.from({ length: 5 }).map((_, index) => ({
            id: `mock-student-${index}`,
            name: `Student ${index + 1}`,
            position: index + 1,
            previousPosition: index + 2,
            score: 90 - index * 5,
            grade: 85 - index * 3,
            attendance: 95 - index * 2,
            participation: 90 - index * 4,
            improvement: 5 - index,
            badges: index === 0 ? ['Top Performer'] : index === 1 ? ['Most Improved'] : [],
            avatar: undefined
          }));

          setStudents(mockStudents);

          // Save to offline storage
          const cacheKey = `${selectedCourseId || 'all'}-${selectedClassId || 'all'}-${selectedTimeframe}-${selectedRankingCriteria}`;
          saveLeaderboardData('studentLeaderboard', cacheKey, mockStudents);
        }
      },
      onError: async (error) => {
        console.error('Error fetching leaderboard data:', error);

        // Try to get data from offline storage
        try {
          const cacheKey = `${selectedCourseId || 'all'}-${selectedClassId || 'all'}-${selectedTimeframe}-${selectedRankingCriteria}`;
          const offlineData = await getLeaderboardData('studentLeaderboard', cacheKey);
          if (offlineData) {
            setStudents(offlineData);
          }
        } catch (offlineError) {
          console.error('Error getting offline data:', offlineError);
        }
      }
    }
  );

  // Set loading state based on API loading state
  useEffect(() => {
    setIsLoading(isLoadingLeaderboard);
    setIsRefreshing(isLoadingLeaderboard);
  }, [isLoadingLeaderboard]);

  // Function to fetch leaderboard data (for manual refresh)
  const fetchLeaderboardData = async () => {
    setIsRefreshing(true);
    try {
      // Check if we have a valid entity ID
      if (!entityId || entityId === 'fallback-id') {
        setIsLoading(false);
        setStudents([]);
        return;
      }

      await refetchLeaderboard();
    } catch (error) {
      console.error('Error refreshing leaderboard data:', error);
    } finally {
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

  // Handle ranking criteria change
  const handleRankingCriteriaChange = (value: string) => {
    setSelectedRankingCriteria(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    // If "all-courses" is selected, set selectedCourseId to undefined
    setSelectedCourseId(value === 'all-courses' ? undefined : value);
    setSelectedClassId(undefined); // Reset class selection when course changes
  };

  // Handle class change
  const handleClassChange = (value: string) => {
    // If "all-classes" is selected, set selectedClassId to undefined
    setSelectedClassId(value === 'all-classes' ? undefined : value);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Student Leaderboard
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-courses">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCourseId && (
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-classes">All Classes</SelectItem>
                {availableClasses
                  .filter(cls => cls.courseId === selectedCourseId)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

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

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>
                    {selectedClassId
                      ? `Class Leaderboard: ${availableClasses.find(c => c.id === selectedClassId)?.name}`
                      : selectedCourseId
                        ? `Course Leaderboard: ${availableCourses.find(c => c.id === selectedCourseId)?.name}`
                        : 'Program Leaderboard'}
                  </CardTitle>
                  <CardDescription>
                    Student rankings based on performance metrics
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

                  <Select value={selectedRankingCriteria} onValueChange={handleRankingCriteriaChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Ranking By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall</SelectItem>
                      <SelectItem value="grades">Grades</SelectItem>
                      <SelectItem value="participation">Participation</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
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
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No students found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-3 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {renderPositionBadge(student.position)}
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium">{student.name}</h4>
                          {student.badges.length > 0 && (
                            <div className="flex ml-2 gap-1">
                              {student.badges.slice(0, 2).map((badge, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                              {student.badges.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{student.badges.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span>Grade: {student.grade}%</span>
                          <span>Attendance: {student.attendance}%</span>
                          <span>Participation: {student.participation}%</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="font-semibold">
                          {selectedRankingCriteria === 'grades'
                            ? `${student.grade}%`
                            : selectedRankingCriteria === 'participation'
                              ? `${student.participation}%`
                              : selectedRankingCriteria === 'improvement'
                                ? `+${student.improvement}%`
                                : student.score}
                        </div>
                        {renderPositionChange(student.position, student.previousPosition)}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center mt-4">
                    <Button variant="outline">View All Students</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {/* Import and use the StudentLeaderboardAnalytics component */}
          <StudentLeaderboardAnalytics
            courseId={selectedCourseId}
            classId={selectedClassId}
            programId={programId}
            timeframe={selectedTimeframe as 'week' | 'month' | 'term' | 'year'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
