'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Info
} from 'lucide-react';
import { Minus as MinusIcon } from '@/components/ui/icons/lucide-icons';
import {
  RefreshCw as RotateCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from '@/components/ui/icons/custom-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';

interface ClassComparisonViewProps {
  courseId: string;
  courseName?: string;
  programId?: string;
  campusId?: string;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  teacherId: string;
  studentCount: number;
  attendanceRate: number;
  averageGrade: number;
  completionRate: number;
  performanceChange: number;
  teacherImpactScore?: number;
}

/**
 * ClassComparisonView Component
 *
 * Provides side-by-side comparison of classes within a course with performance variance analysis
 * and teacher impact assessment visualization.
 */
export function ClassComparisonView({
  courseId,
  courseName = 'Course',
  programId,
  campusId
}: ClassComparisonViewProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonMetric, setComparisonMetric] = useState<string>('averageGrade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Offline storage hooks
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch class comparison data
  const {
    data: classData,
    isLoading: isLoadingClassData,
    refetch: refetchClassData
  } = api.courseAnalytics.getClassComparison.useQuery(
    { courseId },
    {
      enabled: isOnline && !!courseId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) {
          saveOfflineData('classComparison', courseId, data);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch class comparison data: ${error.message}`,
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
        if (isOnline && classData) {
          setClasses(classData);
          setIsLoading(false);
        } else {
          // If offline or no API data, try to get data from storage
          const offlineData = await getOfflineData('classComparison', courseId);
          if (offlineData) {
            setClasses(offlineData);
          } else {
            // If no offline data, set empty array
            setClasses([]);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading class comparison data:', error);
        setClasses([]);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOnline, classData, courseId]);

  // Empty function since we're not using mock data anymore
  const getEmptyClassData = (): ClassData[] => {
    return [];
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (isOnline) {
        await refetchClassData();
      } else {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Data cannot be refreshed.',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Error refreshing class comparison data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh class comparison data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle class selection for detailed comparison
  const toggleClassSelection = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      // Limit to comparing 2 classes at a time for simplicity
      if (selectedClasses.length < 2) {
        setSelectedClasses([...selectedClasses, classId]);
      } else {
        // Replace the first selected class
        setSelectedClasses([selectedClasses[1], classId]);
      }
    }
  };

  // Get sorted classes based on selected metric and sort order
  const getSortedClasses = () => {
    return [...classes].sort((a, b) => {
      const aValue = a[comparisonMetric as keyof ClassData] as number;
      const bValue = b[comparisonMetric as keyof ClassData] as number;

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Get class average for a specific metric
  const getClassAverage = (metric: string) => {
    if (classes.length === 0) return 0;

    const sum = classes.reduce((acc, cls) => {
      return acc + (cls[metric as keyof ClassData] as number);
    }, 0);

    return sum / classes.length;
  };

  // Get variance from average for a specific class and metric
  const getVarianceFromAverage = (classData: ClassData, metric: string) => {
    const average = getClassAverage(metric);
    const value = classData[metric as keyof ClassData] as number;

    return value - average;
  };

  // Determine if variance is statistically significant (simplified for demo)
  const isVarianceSignificant = (variance: number, metric: string) => {
    // This is a simplified approach - in a real implementation,
    // you would use proper statistical methods
    const thresholds: Record<string, number> = {
      'averageGrade': 5,
      'attendanceRate': 5,
      'completionRate': 7,
      'teacherImpactScore': 0.5
    };

    return Math.abs(variance) > (thresholds[metric] || 5);
  };

  // Render change indicator
  const renderChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(1)}%
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-xs font-medium">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(1)}%
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 text-xs font-medium">
          <MinusIcon className="h-3 w-3 mr-1" />
          0%
        </div>
      );
    }
  };

  // Get actionable insights based on class data
  const getActionableInsights = (classData: ClassData) => {
    const insights: string[] = [];

    // Check attendance rate
    if (classData.attendanceRate < getClassAverage('attendanceRate') - 5) {
      insights.push('Attendance rate is significantly below average. Consider investigating potential barriers to attendance.');
    }

    // Check average grade
    if (classData.averageGrade < getClassAverage('averageGrade') - 5) {
      insights.push('Average grade is below course average. Review teaching methods and consider additional support.');
    }

    // Check completion rate
    if (classData.completionRate < getClassAverage('completionRate') - 7) {
      insights.push('Assignment completion rate is low. Consider reviewing workload and providing additional resources.');
    }

    // Check performance trend
    if (classData.performanceChange < -2) {
      insights.push('Performance is declining. Immediate intervention may be necessary.');
    }

    return insights.length > 0 ? insights : ['Class is performing within expected parameters.'];
  };

  // Navigate to class details
  const navigateToClassDetails = (classId: string) => {
    router.push(`/admin/coordinator/classes/${classId}`);
  };

  // Navigate to teacher details
  const navigateToTeacherDetails = (teacherId: string) => {
    router.push(`/admin/coordinator/teachers/${teacherId}`);
  };

  const sortedClasses = getSortedClasses();
  const selectedClassesData = classes.filter(cls => selectedClasses.includes(cls.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">{courseName} - Class Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Compare performance across different classes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Compare by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="averageGrade">Average Grade</SelectItem>
              <SelectItem value="attendanceRate">Attendance Rate</SelectItem>
              <SelectItem value="completionRate">Completion Rate</SelectItem>
              <SelectItem value="teacherImpactScore">Teacher Impact</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>

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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Comparison</CardTitle>
                <CardDescription>
                  Comparing {comparisonMetric === 'averageGrade' ? 'average grades' :
                            comparisonMetric === 'attendanceRate' ? 'attendance rates' :
                            comparisonMetric === 'completionRate' ? 'completion rates' :
                            'teacher impact'} across classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedClasses.map((cls) => {
                    const variance = getVarianceFromAverage(cls, comparisonMetric);
                    const isSignificant = isVarianceSignificant(variance, comparisonMetric);

                    return (
                      <div
                        key={cls.id}
                        className={`p-3 rounded-md border ${selectedClasses.includes(cls.id) ? 'border-primary bg-primary/5' : 'border-border'}
                                   hover:border-primary/50 transition-colors cursor-pointer`}
                        onClick={() => toggleClassSelection(cls.id)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                          <div>
                            <div className="font-medium">{cls.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Teacher: {cls.teacherName} | Students: {cls.studentCount}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {isSignificant && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={variance > 0 ? "success" : "destructive"}>
                                      {variance > 0 ? 'Above Average' : 'Below Average'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This class is significantly {variance > 0 ? 'above' : 'below'} the course average</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {renderChangeIndicator(cls.performanceChange)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">
                              {comparisonMetric === 'averageGrade' ? 'Average Grade' :
                               comparisonMetric === 'attendanceRate' ? 'Attendance Rate' :
                               comparisonMetric === 'completionRate' ? 'Completion Rate' :
                               'Teacher Impact'}
                            </span>
                            <span className="font-medium">
                              {comparisonMetric === 'teacherImpactScore'
                                ? cls[comparisonMetric]?.toFixed(1)
                                : `${cls[comparisonMetric as keyof ClassData]}%`}
                            </span>
                          </div>
                          <Progress
                            value={comparisonMetric === 'teacherImpactScore'
                              ? (cls[comparisonMetric] as number) * 20 // Scale 0-5 to 0-100
                              : cls[comparisonMetric as keyof ClassData] as number}
                            className={isSignificant
                              ? (variance > 0 ? 'bg-green-100' : 'bg-red-100')
                              : undefined}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>
                  {selectedClasses.length === 0
                    ? 'Select classes to see detailed analysis'
                    : `Analysis of ${selectedClasses.length} selected ${selectedClasses.length === 1 ? 'class' : 'classes'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedClasses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No classes selected</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                      Select one or two classes from the list to see a detailed comparison and analysis
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedClassesData.map((cls) => (
                      <div key={cls.id} className="space-y-4">
                        <h3 className="font-medium">{cls.name}</h3>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground">Attendance</div>
                            <div className="font-medium">{cls.attendanceRate}%</div>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground">Avg. Grade</div>
                            <div className="font-medium">{cls.averageGrade}%</div>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground">Completion</div>
                            <div className="font-medium">{cls.completionRate}%</div>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground">Teacher Impact</div>
                            <div className="font-medium">{cls.teacherImpactScore?.toFixed(1)}/5</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Insights:</h4>
                          <ul className="text-sm space-y-1">
                            {getActionableInsights(cls).map((insight, index) => (
                              <li key={index} className="text-muted-foreground">• {insight}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToClassDetails(cls.id)}
                          >
                            View Class
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToTeacherDetails(cls.teacherId)}
                          >
                            View Teacher
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
