'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/trpc/react';
import { BloomsCognitiveDistributionChart } from './BloomsCognitiveDistributionChart';
import { StudentBloomsPerformanceChart } from './StudentBloomsPerformanceChart';
import { MasteryHeatmap } from './MasteryHeatmap';
import { InterventionSuggestions } from './InterventionSuggestions';
import { AssessmentComparisonChart } from './AssessmentComparisonChart';
import {
  ClassBloomsPerformance,
  StudentBloomsPerformance,
  AssessmentComparison,
  CognitiveGap
} from '../../types/analytics';
import { BloomsTaxonomyLevel, BloomsDistribution } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA, DEFAULT_BLOOMS_DISTRIBUTION } from '../../constants/bloom-levels';
import {
  Download,
  FileText,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  BarChart,
  Users,
  BookOpen,
  Printer,
  // Use available icons
  Lightbulb,
  Share
} from 'lucide-react';
import { addDays, format, subDays, isSameMonth, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface BloomsAnalyticsDashboardProps {
  classId: string;
  teacherId: string;
  className?: string;
  initialTab?: string;
}

/**
 * BloomsAnalyticsDashboard Component
 *
 * A comprehensive dashboard for analyzing student performance through the lens of Bloom's Taxonomy.
 * Provides insights into cognitive level distribution, student performance tracking, assessment comparisons,
 * and intervention suggestions.
 */
export function BloomsAnalyticsDashboard({
  classId,
  teacherId,
  className = "",
  initialTab = 'overview'
}: BloomsAnalyticsDashboardProps) {
  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showIdealDistribution, setShowIdealDistribution] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: classPerformance, isLoading: isLoadingClassPerformance, refetch: refetchClassPerformance } =
    api.bloomsAnalytics.getClassPerformance.useQuery({
      classId,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString()
    });

  const { data: studentPerformance, isLoading: isLoadingStudentPerformance } =
    api.bloomsAnalytics.getStudentPerformance.useQuery({
      studentId: selectedStudentId,
      classId,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString()
    }, {
      enabled: !!selectedStudentId
    });

  // Get assessments for this class
  const { data: assessments = [], isLoading: isLoadingAssessments } =
    api.assessment.listByClass.useQuery({
      classId,
      page: 1,
      pageSize: 20,
    }, {
      enabled: !!classId
    });

  // Extract assessment IDs for comparison
  const assessmentIds = assessments && 'items' in assessments
    ? assessments.items.map(a => a.id)
    : [];

  // Compare assessments if there are at least 2
  const { data: assessmentComparison, isLoading: isLoadingComparison } =
    api.bloomsAnalytics.compareAssessments.useQuery({
      assessmentIds: assessmentIds
    }, {
      enabled: !!(assessmentIds.length >= 2)
    });

  // Generate report mutation
  const generateReport = api.bloomsAnalytics.generateClassReport.useMutation({
    onSuccess: (data) => {
      setReportId(data.id);
      setIsGeneratingReport(false);
    },
    onError: () => {
      setIsGeneratingReport(false);
    }
  });

  // Set the first student as selected when data loads
  useEffect(() => {
    if (classPerformance?.studentPerformance?.length && !selectedStudentId) {
      setSelectedStudentId(classPerformance.studentPerformance[0].studentId);
    }
  }, [classPerformance, selectedStudentId]);

  // Get class details
  const { data: classDetails } = api.class.getById.useQuery({
    classId,
    includeEnrollments: false
  }, {
    enabled: !!classId
  });

  // Get class course details to get subject ID
  const { data: classWithCourse } = api.class.getById.useQuery({
    classId,
    includeEnrollments: false
  }, {
    enabled: !!classId
  });

  // Get subject ID from class course
  const subjectId = classWithCourse?.courseCampus?.course?.subjects?.[0]?.id;

  // Get topics for this subject
  const { data: topics } = api.subjectTopic.getBySubject.useQuery({
    subjectId: subjectId || ''
  }, {
    enabled: !!subjectId
  });

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    if (range.from && range.to) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    }
  };

  // Handle report generation
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    generateReport.mutate({
      classId,
      teacherId,
      startDate: dateRange.from!.toISOString(),
      endDate: dateRange.to!.toISOString()
    });
  };

  // Handle export to PDF
  const handleExportToPdf = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  // Handle assessment selection
  const handleAssessmentSelection = (assessmentId: string) => {
    setSelectedAssessmentIds(prev => {
      if (prev.includes(assessmentId)) {
        return prev.filter(id => id !== assessmentId);
      } else {
        return [...prev, assessmentId];
      }
    });
  };

  // Custom DateRangePicker component
  const DateRangePicker = () => {
    return (
      <div className={cn("grid gap-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className={`bloom-analytics-dashboard ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {classDetails?.name ? (
              <>
                {classDetails.name}: <span className="text-primary">Bloom's Analytics</span>
              </>
            ) : (
              "Bloom's Taxonomy Analytics"
            )}
          </h2>
          <p className="text-muted-foreground">
            Cognitive level analysis and mastery tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker />

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchClassPerformance()}
            title="Refresh data"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingClassPerformance && "animate-spin")} />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportToPdf}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>

            {reportId && (
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Assessments</span>
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Interventions</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Class Average Mastery */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-4 w-4 mr-2 text-primary" />
                  Class Average Mastery
                </CardTitle>
                <CardDescription>Overall mastery across all topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32">
                  {isLoadingClassPerformance ? (
                    <div className="animate-pulse bg-gray-200 h-24 w-24 rounded-full flex items-center justify-center">
                      <span className="text-transparent">0%</span>
                    </div>
                  ) : (
                    <div className="relative h-32 w-32 flex items-center justify-center">
                      <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="10"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-primary"
                          strokeWidth="10"
                          strokeDasharray={`${(classPerformance?.averageMastery || 0) * 2.51} 251`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold">
                        {classPerformance?.averageMastery || 0}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {Object.values(BloomsTaxonomyLevel).map(level => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    const value = classPerformance?.distribution?.[level] || 0;

                    return (
                      <div key={level} className="text-center">
                        <div
                          className="text-xs font-medium mb-1 truncate"
                          title={metadata.name}
                        >
                          {metadata.name}
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: metadata.color }}
                        >
                          {value}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cognitive Level Distribution */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-primary" />
                      Cognitive Level Distribution
                    </CardTitle>
                    <CardDescription>Distribution across Bloom's Taxonomy levels</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIdealDistribution(!showIdealDistribution)}
                  >
                    {showIdealDistribution ? "Hide Ideal" : "Show Ideal"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BloomsCognitiveDistributionChart
                  distribution={classPerformance?.distribution || {}}
                  compareDistribution={showIdealDistribution ? DEFAULT_BLOOMS_DISTRIBUTION : undefined}
                  isLoading={isLoadingClassPerformance}
                  height={250}
                />
              </CardContent>
              {showIdealDistribution && (
                <CardFooter className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    <p>The ideal distribution shows recommended cognitive level balance based on educational research.</p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Class Performance Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Class Performance Summary
                </CardTitle>
                <CardDescription>Student performance across cognitive levels</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClassPerformance ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : classPerformance?.studentPerformance?.length ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                      <span>Student</span>
                      <span>Overall Mastery</span>
                    </div>
                    {classPerformance.studentPerformance
                      .sort((a, b) => b.overallMastery - a.overallMastery)
                      .slice(0, 5)
                      .map(student => (
                        <div key={student.studentId} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="font-medium">{student.studentName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.overallMastery}
                              max={100}
                              className="h-2 w-24"
                            />
                            <span className="font-medium text-sm">{student.overallMastery}%</span>
                          </div>
                        </div>
                      ))}
                    {classPerformance.studentPerformance.length > 5 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setActiveTab('students')}
                      >
                        View all {classPerformance.studentPerformance.length} students
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No student performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cognitive Gaps */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                  Cognitive Gaps
                </CardTitle>
                <CardDescription>Areas needing improvement</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClassPerformance ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : classPerformance?.cognitiveGaps?.length ? (
                  <div className="space-y-4">
                    {classPerformance.cognitiveGaps.slice(0, 3).map((gap, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Badge
                          className={`mt-0.5 text-white`}
                          style={{ backgroundColor: BLOOMS_LEVEL_METADATA[gap.bloomsLevel].color }}
                        >
                          {BLOOMS_LEVEL_METADATA[gap.bloomsLevel].name}
                        </Badge>
                        <div>
                          <p className="text-sm">{gap.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Affects {gap.affectedStudentCount} students
                          </p>
                        </div>
                      </div>
                    ))}
                    {classPerformance.cognitiveGaps.length > 3 && (
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setActiveTab('interventions')}
                      >
                        View all {classPerformance.cognitiveGaps.length} gaps
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No cognitive gaps identified
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mastery Heatmap */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Topic Mastery Heatmap
              </CardTitle>
              <CardDescription>Mastery levels across students and topics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClassPerformance ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 h-4/5 w-full rounded-md" />
                </div>
            ) : classPerformance ? (() => {
              // Prepare data for MasteryHeatmap
              let masteryHeatmapInputData;
              if (
                classPerformance &&
                classPerformance.studentPerformance &&
                classPerformance.topicPerformance &&
                classPerformance.studentPerformance.length > 0 &&
                classPerformance.topicPerformance.length > 0
              ) {
                masteryHeatmapInputData = {
                    studentIds: classPerformance.studentPerformance.map(s => s.studentId),
                    studentNames: classPerformance.studentPerformance.map(s => s.studentName),
                    topicIds: classPerformance.topicPerformance.map(t => t.topicId),
                    topicNames: classPerformance.topicPerformance.map(t => t.topicName),
                    heatmapData: classPerformance.studentPerformance.map(() =>
                      classPerformance.topicPerformance.map(() =>
                      Math.floor(Math.random() * 101) // Placeholder data
                      )
                    )
                };
              } else {
                masteryHeatmapInputData = {
                  studentIds: [],
                  studentNames: [],
                  topicIds: [],
                  topicNames: [],
                  heatmapData: []
                };
              }
              return (
                <MasteryHeatmap
                  data={masteryHeatmapInputData}
                  height={400}
                />
              );
            })() : (
                <div className="text-center py-6 text-muted-foreground">
                  No mastery data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Card className="w-full md:w-64 shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Students
                </CardTitle>
                <CardDescription>Select a student to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingClassPerformance ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : classPerformance?.studentPerformance?.length ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {classPerformance.studentPerformance
                      .sort((a, b) => a.studentName.localeCompare(b.studentName))
                      .map(student => (
                        <div
                          key={student.studentId}
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer hover:bg-muted transition-colors",
                            selectedStudentId === student.studentId && "bg-muted"
                          )}
                          onClick={() => setSelectedStudentId(student.studentId)}
                        >
                          <div className="font-medium">{student.studentName}</div>
                          <Badge variant={student.overallMastery >= 80 ? "success" : student.overallMastery >= 60 ? "warning" : "destructive"}>
                            {student.overallMastery}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No students available
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex-1">
              {selectedStudentId && studentPerformance ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h3 className="text-xl font-bold">{studentPerformance.studentName}</h3>
                      <p className="text-muted-foreground">
                        Overall Mastery: <span className="font-medium">{studentPerformance.overallMastery}%</span>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Cognitive Performance</CardTitle>
                        <CardDescription>Performance across Bloom's Taxonomy levels</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StudentBloomsPerformanceChart
                          performance={studentPerformance}
                          isLoading={isLoadingStudentPerformance}
                          height={250}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Performance Details</CardTitle>
                        <CardDescription>Detailed breakdown by cognitive level</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.values(BloomsTaxonomyLevel).map(level => {
                            const metadata = BLOOMS_LEVEL_METADATA[level];
                            const value = studentPerformance[level];

                            // Determine performance level
                            let performanceLabel = "";
                            let performanceColor = "";

                            if (value >= 80) {
                              performanceLabel = "Mastered";
                              performanceColor = "text-green-600";
                            } else if (value >= 60) {
                              performanceLabel = "Developing";
                              performanceColor = "text-amber-600";
                            } else {
                              performanceLabel = "Needs Improvement";
                              performanceColor = "text-red-600";
                            }

                            return (
                              <div key={level} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">{metadata.name}</div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${performanceColor}`}>
                                      {performanceLabel}
                                    </span>
                                    <span className="font-bold">{value}%</span>
                                  </div>
                                </div>
                                <Progress
                                  value={value}
                                  max={100}
                                  className="h-2"
                                  style={{
                                    "--progress-background": metadata.color
                                  } as React.CSSProperties}
                                />
                              </div>
                            );
                          })}

                          <div className="pt-4 mt-4 border-t">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Overall Mastery</div>
                                <div className="font-bold">{studentPerformance.overallMastery}%</div>
                              </div>
                              <Progress
                                value={studentPerformance.overallMastery}
                                max={100}
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Topic Performance</CardTitle>
                      <CardDescription>Performance across different topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topics?.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Topic</TableHead>
                              <TableHead>Mastery</TableHead>
                              <TableHead>Strongest Level</TableHead>
                              <TableHead>Weakest Level</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* This would be populated with actual topic performance data */}
                            {topics.slice(0, 5).map((topic, index) => {
                              // Simulate topic performance data
                              const mastery = Math.floor(Math.random() * 101);
                              const levels = Object.values(BloomsTaxonomyLevel);
                              const strongestLevel = levels[Math.floor(Math.random() * levels.length)];
                              const weakestLevel = levels[Math.floor(Math.random() * levels.length)];

                              return (
                                <TableRow key={topic.id || index}>
                                  <TableCell className="font-medium">{topic.title || `Topic ${index + 1}`}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Progress value={mastery} max={100} className="h-2 w-24" />
                                      <span>{mastery}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className="text-white"
                                      style={{ backgroundColor: BLOOMS_LEVEL_METADATA[strongestLevel].color }}
                                    >
                                      {BLOOMS_LEVEL_METADATA[strongestLevel].name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      style={{ color: BLOOMS_LEVEL_METADATA[weakestLevel].color, borderColor: BLOOMS_LEVEL_METADATA[weakestLevel].color }}
                                    >
                                      {BLOOMS_LEVEL_METADATA[weakestLevel].name}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          No topic performance data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Student Selected</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Select a student from the list to view their detailed performance across Bloom's Taxonomy levels.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Assessments
                </CardTitle>
                <CardDescription>Select assessments to compare</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingAssessments ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : assessments && 'items' in assessments && assessments.items.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {assessments.items.map(assessment => (
                      <div
                        key={assessment.id}
                        className={cn(
                          "flex items-center justify-between p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0",
                          selectedAssessmentIds.includes(assessment.id) && "bg-muted"
                        )}
                        onClick={() => handleAssessmentSelection(assessment.id)}
                      >
                        <div>
                          <div className="font-medium">{assessment.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {selectedAssessmentIds.includes(assessment.id) && (
                            <Badge variant="outline" className="mr-2">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No assessments found in the selected date range.
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-3">
                <div className="w-full flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedAssessmentIds.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedAssessmentIds.length < 2}
                    onClick={() => {
                      // Trigger comparison
                    }}
                  >
                    Compare
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-primary" />
                      Assessment Comparison
                    </CardTitle>
                    <CardDescription>Comparative analysis across assessments</CardDescription>
                  </div>
                  <Select defaultValue="overall">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall Scores</SelectItem>
                      <SelectItem value="cognitive">Cognitive Levels</SelectItem>
                      <SelectItem value="questions">Question Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingComparison ? (
                  <div className="h-[400px] w-full flex items-center justify-center">
                    <div className="animate-pulse bg-gray-200 h-4/5 w-full rounded-md" />
                  </div>
                ) : assessmentComparison ? (
                  <AssessmentComparisonChart
                    comparison={assessmentComparison}
                    height={400}
                  />
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Comparison Data</h3>
                    <p className="text-muted-foreground max-w-md">
                      {selectedAssessmentIds.length < 2 ? (
                        "Select at least two assessments from the list to compare their performance data."
                      ) : (
                        "No comparison data available for the selected assessments."
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {assessmentComparison && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    Cognitive Level Distribution Comparison
                  </CardTitle>
                  <CardDescription>Compare cognitive level distribution across assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Distribution by Assessment</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Assessment</TableHead>
                            {Object.values(BloomsTaxonomyLevel).map(level => (
                              <TableHead key={level} className="text-center">
                                <span className="text-xs" style={{ color: BLOOMS_LEVEL_METADATA[level].color }}>
                                  {BLOOMS_LEVEL_METADATA[level].name}
                                </span>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assessmentComparison.assessmentNames.map((name, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{name}</TableCell>
                              {Object.values(BloomsTaxonomyLevel).map(level => (
                                <TableCell key={level} className="text-center">
                                  {assessmentComparison.cognitiveDistributions[index][level] || 0}%
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-4">Performance by Cognitive Level</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Assessment</TableHead>
                            <TableHead className="text-right">Overall</TableHead>
                            <TableHead className="text-right">Highest Level</TableHead>
                            <TableHead className="text-right">Lowest Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assessmentComparison.assessmentNames.map((name, index) => {
                            // Find highest and lowest performing levels
                            const levelPerformance = Object.entries(assessmentComparison.cognitivePerformance[index])
                              .map(([level, value]) => ({ level, value }));

                            const highest = [...levelPerformance].sort((a, b) => (b.value as number) - (a.value as number))[0];
                            const lowest = [...levelPerformance].sort((a, b) => (a.value as number) - (b.value as number))[0];

                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{name}</TableCell>
                                <TableCell className="text-right">{assessmentComparison.overallScoreComparison[index]}%</TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    className="text-white"
                                    style={{ backgroundColor: BLOOMS_LEVEL_METADATA[highest.level as BloomsTaxonomyLevel].color }}
                                  >
                                    {BLOOMS_LEVEL_METADATA[highest.level as BloomsTaxonomyLevel].name} ({(highest.value as number).toFixed(0)}%)
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant="outline"
                                    style={{
                                      color: BLOOMS_LEVEL_METADATA[lowest.level as BloomsTaxonomyLevel].color,
                                      borderColor: BLOOMS_LEVEL_METADATA[lowest.level as BloomsTaxonomyLevel].color
                                    }}
                                  >
                                    {BLOOMS_LEVEL_METADATA[lowest.level as BloomsTaxonomyLevel].name} ({(lowest.value as number).toFixed(0)}%)
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interventions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                  Cognitive Gaps
                </CardTitle>
                <CardDescription>Areas needing improvement</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingClassPerformance ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : classPerformance?.cognitiveGaps?.length ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {classPerformance.cognitiveGaps.map((gap, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0",
                          selectedStudentId === gap.bloomsLevel && "bg-muted"
                        )}
                        onClick={() => setSelectedStudentId(gap.bloomsLevel)}
                      >
                        <Badge
                          className="mt-0.5 text-white shrink-0"
                          style={{ backgroundColor: BLOOMS_LEVEL_METADATA[gap.bloomsLevel].color }}
                        >
                          {BLOOMS_LEVEL_METADATA[gap.bloomsLevel].name}
                        </Badge>
                        <div className="ml-3">
                          <p className="text-sm">{gap.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Affects {gap.affectedStudentCount} students
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No cognitive gaps identified
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                  Intervention Suggestions
                </CardTitle>
                <CardDescription>Recommended interventions based on cognitive gaps</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClassPerformance ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : classPerformance?.interventionSuggestions?.length ? (
                  <InterventionSuggestions
                    suggestions={classPerformance.interventionSuggestions}
                    isLoading={isLoadingClassPerformance}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Intervention Suggestions</h3>
                    <p className="text-muted-foreground max-w-md">
                      No intervention suggestions are available at this time. This could mean that students are performing well across all cognitive levels.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {classPerformance?.interventionSuggestions && classPerformance.interventionSuggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Recommended Activities by Cognitive Level
                </CardTitle>
                <CardDescription>Activities to address gaps in specific cognitive levels</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.values(BloomsTaxonomyLevel)[0]}>
                  <TabsList className="mb-4">
                    {Object.values(BloomsTaxonomyLevel).map(level => {
                      const metadata = BLOOMS_LEVEL_METADATA[level];
                      return (
                        <TabsTrigger
                          key={level}
                          value={level}
                          className="flex items-center gap-2"
                          style={{
                            borderBottomColor: metadata.color,
                            borderBottomWidth: '2px'
                          }}
                        >
                          <span style={{ color: metadata.color }}>{metadata.name}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {Object.values(BloomsTaxonomyLevel).map(level => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    // Find suggestions for this level
                    const levelSuggestions = classPerformance?.interventionSuggestions
                      ? classPerformance.interventionSuggestions.filter(s => s.bloomsLevel === level)
                      : [];

                    return (
                      <TabsContent key={level} value={level}>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="text-white"
                              style={{ backgroundColor: metadata.color }}
                            >
                              {metadata.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {metadata.description}
                            </span>
                          </div>

                          {levelSuggestions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {levelSuggestions.map((suggestion, index) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardHeader className="pb-2 bg-muted/50">
                                    <CardTitle className="text-base">{suggestion.description}</CardTitle>
                                    <CardDescription>
                                      Targets {suggestion.targetStudentCount} students
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="pt-4">
                                    <h4 className="text-sm font-medium mb-2">Suggested Activities</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {suggestion.activitySuggestions.map((activity, actIndex) => (
                                        <li key={actIndex} className="text-sm">{activity}</li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              No intervention suggestions for {metadata.name} level
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Available Reports
                </CardTitle>
                <CardDescription>Generated reports for this class</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingClassPerformance ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {/* This would be populated with actual reports */}
                    {[1, 2, 3].map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() - index * 7);

                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-start p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0",
                            reportId === `report-${index}` && "bg-muted"
                          )}
                          onClick={() => setReportId(`report-${index}`)}
                        >
                          <div>
                            <div className="font-medium">
                              {index === 0 ? "Current Period Report" : `Report ${index + 1}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Generated on {date.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-3">
                <div className="w-full">
                  <Button
                    className="w-full"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate New Report
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Cognitive Balance Report
                    </CardTitle>
                    <CardDescription>Analysis of cognitive level balance in your class</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-medium mb-4">Current Distribution</h3>
                      <div className="h-[250px]">
                        <BloomsCognitiveDistributionChart
                          distribution={classPerformance?.distribution || {}}
                          isLoading={isLoadingClassPerformance}
                          height={250}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-medium mb-4">Ideal vs. Current</h3>
                      <div className="h-[250px]">
                        <BloomsCognitiveDistributionChart
                          distribution={classPerformance?.distribution || {}}
                          compareDistribution={DEFAULT_BLOOMS_DISTRIBUTION}
                          isLoading={isLoadingClassPerformance}
                          height={250}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-4">Cognitive Balance Analysis</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={(classPerformance?.averageMastery || 0) >= 70 ? "success" : "warning"}>
                              {(classPerformance?.averageMastery || 0) >= 70 ? "Well Balanced" : "Needs Improvement"}
                            </Badge>
                            <span className="text-sm">
                              Overall cognitive balance score: <strong>{classPerformance?.averageMastery || 0}%</strong>
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {classPerformance?.cognitiveGaps?.length ? (
                                classPerformance.cognitiveGaps.slice(0, 3).map((gap, index) => (
                                  <li key={index} className="text-sm">
                                    <span className="font-medium" style={{ color: BLOOMS_LEVEL_METADATA[gap.bloomsLevel].color }}>
                                      {BLOOMS_LEVEL_METADATA[gap.bloomsLevel].name}:
                                    </span>{" "}
                                    {gap.description}
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm">No specific recommendations at this time.</li>
                              )}
                              <li className="text-sm">
                                Consider adding more activities that target higher-order thinking skills.
                              </li>
                              <li className="text-sm">
                                Balance assessments to include questions from all cognitive levels.
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-4">Mastery Progress Summary</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cognitive Level</TableHead>
                          <TableHead>Current Mastery</TableHead>
                          <TableHead>Previous Period</TableHead>
                          <TableHead>Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(BloomsTaxonomyLevel).map(level => {
                          const metadata = BLOOMS_LEVEL_METADATA[level];
                          const currentValue = classPerformance?.distribution?.[level] || 0;
                          // Simulate previous value
                          const previousValue = Math.max(0, currentValue - (Math.random() * 10 - 5));
                          const change = currentValue - previousValue;

                          return (
                            <TableRow key={level}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: metadata.color }}
                                  />
                                  <span>{metadata.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{currentValue}%</TableCell>
                              <TableCell>{previousValue.toFixed(1)}%</TableCell>
                              <TableCell>
                                <div className={cn(
                                  "flex items-center gap-1",
                                  change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
                                )}>
                                  {change > 0 ? "+" : ""}{change.toFixed(1)}%
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
