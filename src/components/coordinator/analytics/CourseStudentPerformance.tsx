'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import {
  BarChart,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Info,
  Search,
  Award,
  ArrowRight
} from 'lucide-react';
import { AlertOctagon } from '@/components/ui/icons/custom-icons';
import { Minus as MinusIcon } from '@/components/ui/icons/lucide-icons';
import {
  RefreshCw as RotateCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from '@/components/ui/icons/custom-icons';

// Alias for AlertOctagon
const AlertTriangleIcon = AlertOctagon;
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';

interface CourseStudentPerformanceProps {
  courseId: string;
  courseName?: string;
  programId?: string;
  campusId?: string;
}

interface StudentPerformance {
  id: string;
  name: string;
  avatar?: string;
  enrollmentNumber: string;
  grade: number;
  attendance: number;
  completionRate: number;
  participationScore: number;
  improvementRate: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
  needsIntervention: boolean;
  strengths: string[];
  weaknesses: string[];
  classId: string;
  className: string;
}

/**
 * CourseStudentPerformance Component
 *
 * Tracks and visualizes student performance within a specific course context.
 * Features performance tiers, intervention recommendations, and detailed analytics.
 */
export function CourseStudentPerformance({
  courseId,
  courseName = 'Course',
  programId,
  campusId
}: CourseStudentPerformanceProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('grade');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Offline storage hooks
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch student performance data
  const {
    data: studentData,
    isLoading: isLoadingStudentData,
    refetch: refetchStudentData
  } = api.courseAnalytics.getCourseStudentPerformance.useQuery(
    { courseId },
    {
      enabled: isOnline && !!courseId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) {
          saveOfflineData('courseStudentPerformance', courseId, data);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch student performance data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Load data from API or offline storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get data from API first
        if (isOnline && studentData) {
          // Convert null avatars to undefined to match StudentPerformance type
          const processedData = studentData.map(student => ({
            ...student,
            avatar: student.avatar || undefined // Convert null to undefined
          })) as StudentPerformance[];

          setStudents(processedData);
          setIsLoading(false);
        } else {
          // If offline or no API data, try to get data from storage
          const offlineData = await getOfflineData('courseStudentPerformance', courseId);
          if (offlineData) {
            // Convert null avatars to undefined
            const processedData = offlineData.map((student: any) => ({
              ...student,
              avatar: student.avatar || undefined
            })) as StudentPerformance[];

            setStudents(processedData);
          } else {
            // If no offline data, set empty array
            setStudents([]);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading student performance data:', error);
        setStudents([]);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOnline, studentData, courseId]);

  // Empty function since we're not using mock data anymore
  const getEmptyStudentData = (): StudentPerformance[] => {
    return [];
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (isOnline) {
        await refetchStudentData();
      } else {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Data cannot be refreshed.',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Error refreshing student performance data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh student performance data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    // Filter by search query
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by performance tier
    if (performanceFilter !== 'all') {
      if (performanceFilter === 'high') {
        filtered = filtered.filter(student => student.grade >= 85);
      } else if (performanceFilter === 'medium') {
        filtered = filtered.filter(student => student.grade >= 70 && student.grade < 85);
      } else if (performanceFilter === 'low') {
        filtered = filtered.filter(student => student.grade < 70);
      } else if (performanceFilter === 'improving') {
        filtered = filtered.filter(student => student.performanceTrend === 'improving');
      } else if (performanceFilter === 'declining') {
        filtered = filtered.filter(student => student.performanceTrend === 'declining');
      } else if (performanceFilter === 'intervention') {
        filtered = filtered.filter(student => student.needsIntervention);
      }
    }

    // Sort by selected criteria
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'grade') {
        return b.grade - a.grade;
      } else if (sortBy === 'attendance') {
        return b.attendance - a.attendance;
      } else if (sortBy === 'improvement') {
        return b.improvementRate - a.improvementRate;
      } else if (sortBy === 'participation') {
        return b.participationScore - a.participationScore;
      } else {
        return 0;
      }
    });
  };

  // Get performance tier label
  const getPerformanceTier = (grade: number) => {
    if (grade >= 85) return 'High';
    if (grade >= 70) return 'Medium';
    return 'Low';
  };

  // Get performance tier color
  const getPerformanceTierColor = (grade: number) => {
    if (grade >= 85) return 'bg-green-100 text-green-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get trend indicator
  const getTrendIndicator = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === 'declining') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get intervention recommendations
  const getInterventionRecommendations = (student: StudentPerformance) => {
    const recommendations: string[] = [];

    if (student.attendance < 80) {
      recommendations.push('Schedule a meeting to discuss attendance issues');
    }

    if (student.grade < 70) {
      recommendations.push('Provide additional academic support or tutoring');
    }

    if (student.completionRate < 75) {
      recommendations.push('Create a structured assignment completion plan');
    }

    if (student.performanceTrend === 'declining') {
      recommendations.push('Conduct a detailed performance review to identify issues');
    }

    return recommendations.length > 0 ? recommendations : ['No specific interventions needed at this time'];
  };

  // Navigate to student details
  const navigateToStudentDetails = (studentId: string) => {
    router.push(`/admin/coordinator/students/${studentId}`);
  };

  // Navigate to class details
  const navigateToClassDetails = (classId: string) => {
    router.push(`/admin/coordinator/classes/${classId}`);
  };

  const filteredAndSortedStudents = getFilteredAndSortedStudents();
  const selectedStudentData = selectedStudent
    ? students.find(student => student.id === selectedStudent)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">{courseName} - Student Performance</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze student performance across classes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Tracking</CardTitle>
              <CardDescription>
                Monitor student performance and identify intervention needs
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="high">High Performers</SelectItem>
                    <SelectItem value="medium">Medium Performers</SelectItem>
                    <SelectItem value="low">Low Performers</SelectItem>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                    <SelectItem value="intervention">Needs Intervention</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="grade">Grade</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredAndSortedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No students found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 rounded-md border ${selectedStudent === student.id ? 'border-primary bg-primary/5' : 'border-border'}
                                hover:border-primary/50 transition-colors cursor-pointer`}
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {student.enrollmentNumber} | {student.className}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPerformanceTierColor(student.grade)}>
                            {getPerformanceTier(student.grade)}
                          </Badge>
                          {student.needsIntervention && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive">
                                    <AlertTriangleIcon className="h-3 w-3 mr-1" />
                                    Intervention
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This student needs intervention</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {getTrendIndicator(student.performanceTrend)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Grade</div>
                          <div className="font-medium">{student.grade}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Attendance</div>
                          <div className="font-medium">{student.attendance}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Completion</div>
                          <div className="font-medium">{student.completionRate}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Improvement</div>
                          <div className="font-medium">
                            {student.improvementRate > 0 ? '+' : ''}
                            {student.improvementRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>
                {selectedStudentData
                  ? `Detailed information for ${selectedStudentData.name}`
                  : 'Select a student to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedStudentData ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No student selected</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    Select a student from the list to view detailed information
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudentData.avatar} alt={selectedStudentData.name} />
                      <AvatarFallback>{selectedStudentData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">{selectedStudentData.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudentData.enrollmentNumber} | {selectedStudentData.className}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Grade</span>
                          <span className="font-medium">{selectedStudentData.grade}%</span>
                        </div>
                        <Progress value={selectedStudentData.grade} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Attendance</span>
                          <span className="font-medium">{selectedStudentData.attendance}%</span>
                        </div>
                        <Progress value={selectedStudentData.attendance} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Assignment Completion</span>
                          <span className="font-medium">{selectedStudentData.completionRate}%</span>
                        </div>
                        <Progress value={selectedStudentData.completionRate} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Participation</span>
                          <span className="font-medium">{selectedStudentData.participationScore}%</span>
                        </div>
                        <Progress value={selectedStudentData.participationScore} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Strengths</h4>
                      <ul className="text-sm space-y-1">
                        {selectedStudentData.strengths.length > 0 ? (
                          selectedStudentData.strengths.map((strength, index) => (
                            <li key={index} className="text-muted-foreground">• {strength}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No specific strengths identified</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                      <ul className="text-sm space-y-1">
                        {selectedStudentData.weaknesses.length > 0 ? (
                          selectedStudentData.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-muted-foreground">• {weakness}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No specific areas identified</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {selectedStudentData.needsIntervention && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-500 mr-1" />
                        Recommended Interventions
                      </h4>
                      <ul className="text-sm space-y-1">
                        {getInterventionRecommendations(selectedStudentData).map((recommendation, index) => (
                          <li key={index} className="text-muted-foreground">• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToStudentDetails(selectedStudentData.id)}
                    >
                      Student Profile
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToClassDetails(selectedStudentData.classId)}
                    >
                      View Class
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
