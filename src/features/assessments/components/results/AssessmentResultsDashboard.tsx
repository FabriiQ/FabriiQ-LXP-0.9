'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Activity,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Eye,
  FileText,
  Calendar
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { BloomsCognitiveDistributionChart } from '@/features/bloom/components/analytics/BloomsCognitiveDistributionChart';

interface StudentResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  percentage: number;
  grade: string;
  submittedAt: Date;
  timeSpent: number;
  bloomsLevelScores: Record<BloomsTaxonomyLevel, number>;
  topicMasteryChanges: Array<{
    topicId: string;
    topicName: string;
    previousMastery: number;
    newMastery: number;
    change: number;
  }>;
  learningOutcomeAchievements: Array<{
    outcomeId: string;
    outcomeStatement: string;
    achieved: boolean;
    score: number;
  }>;
}

interface AssessmentComparison {
  assessmentId: string;
  assessmentTitle: string;
  averageScore: number;
  passingRate: number;
  completionDate: Date;
}

interface AssessmentResultsDashboardProps {
  assessmentId: string;
  assessmentTitle: string;
  maxScore: number;
  passingScore: number;
  results: StudentResult[];
  bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
  comparisons?: AssessmentComparison[];
  isLoading?: boolean;
  onExportResults?: () => void;
  onViewStudentDetail?: (studentId: string) => void;
  className?: string;
}

export function AssessmentResultsDashboard({
  assessmentId,
  assessmentTitle,
  maxScore,
  passingScore,
  results,
  bloomsDistribution,
  comparisons = [],
  isLoading = false,
  onExportResults,
  onViewStudentDetail,
  className = '',
}: AssessmentResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'analytics' | 'comparisons' | 'insights'>('results');
  const [sortField, setSortField] = useState<'name' | 'score' | 'percentage' | 'submittedAt'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterGrade, setFilterGrade] = useState<'all' | 'A' | 'B' | 'C' | 'D' | 'F'>('all');

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const averagePercentage = percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length;
    const passingCount = results.filter(r => r.percentage >= passingScore).length;
    const passingRate = (passingCount / results.length) * 100;

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const averageTimeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;

    return {
      totalStudents: results.length,
      averageScore: averageScore.toFixed(1),
      averagePercentage: averagePercentage.toFixed(1),
      passingCount,
      passingRate: passingRate.toFixed(1),
      highestScore,
      lowestScore,
      averageTimeSpent: Math.round(averageTimeSpent),
    };
  };

  // Get grade distribution
  const getGradeDistribution = () => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    results.forEach(result => {
      distribution[result.grade as keyof typeof distribution]++;
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: results.length > 0 ? (count / results.length) * 100 : 0,
    }));
  };

  // Sort and filter results
  const getSortedAndFilteredResults = () => {
    let filtered = results;

    if (filterGrade !== 'all') {
      filtered = results.filter(r => r.grade === filterGrade);
    }

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.studentName.toLowerCase();
          bValue = b.studentName.toLowerCase();
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const summaryStats = getSummaryStats();
  const gradeDistribution = getGradeDistribution();
  const sortedResults = getSortedAndFilteredResults();

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summaryStats) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Results Available</h3>
        <p className="text-muted-foreground">
          No assessment results to display yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{assessmentTitle} Results</h2>
          <p className="text-muted-foreground">
            Comprehensive results and performance analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summaryStats.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summaryStats.averageScore}</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {summaryStats.averagePercentage}% of max score
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summaryStats.passingRate}%</div>
                <div className="text-sm text-muted-foreground">Passing Rate</div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {summaryStats.passingCount} students passed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summaryStats.averageTimeSpent}m</div>
                <div className="text-sm text-muted-foreground">Avg. Time</div>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Time spent on assessment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">
            <FileText className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="comparisons">
            <TrendingUp className="h-4 w-4 mr-2" />
            Comparisons
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={filterGrade} onValueChange={(value: any) => setFilterGrade(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="A">Grade A</SelectItem>
                    <SelectItem value="B">Grade B</SelectItem>
                    <SelectItem value="C">Grade C</SelectItem>
                    <SelectItem value="D">Grade D</SelectItem>
                    <SelectItem value="F">Grade F</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="submittedAt">Submit Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                Individual student performance and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((result) => (
                      <TableRow key={result.studentId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.studentName}</div>
                            <div className="text-xs text-muted-foreground">{result.studentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{result.score}/{maxScore}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                            <Progress value={result.percentage} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              result.grade === 'A' ? 'default' :
                              result.grade === 'B' ? 'secondary' :
                              result.grade === 'C' ? 'outline' :
                              'destructive'
                            }
                          >
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.submittedAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{result.timeSpent}m</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewStudentDetail?.(result.studentId)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of letter grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gradeDistribution.map((item) => (
                    <div key={item.grade} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Grade {item.grade}</span>
                        <span>{item.count} students ({item.percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bloom's Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
                <CardDescription>
                  Cognitive level performance breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BloomsCognitiveDistributionChart
                  distribution={bloomsDistribution}
                  height={250}
                  showLegend={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Comparisons</CardTitle>
              <CardDescription>
                Compare this assessment with previous assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparisons.length > 0 ? (
                <div className="space-y-4">
                  {comparisons.map((comparison) => (
                    <div key={comparison.assessmentId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{comparison.assessmentTitle}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(comparison.completionDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{comparison.averageScore.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">
                            {(comparison.passingRate * 100).toFixed(1)}% passing
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Comparisons Available</h3>
                  <p className="text-muted-foreground">
                    Assessment comparisons will appear here once more assessments are completed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">Strengths</span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Students performed well in higher-order thinking skills with {summaryStats.passingRate}% passing rate.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-900 dark:text-amber-100">Areas for Improvement</span>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Consider reviewing concepts where students scored below {passingScore}%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Follow-up Activities</h4>
                    <p className="text-sm text-muted-foreground">
                      Create targeted activities for students who struggled with specific cognitive levels.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Individual Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide additional support for students who scored below the passing threshold.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Curriculum Adjustment</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider adjusting future lessons based on identified knowledge gaps.
                    </p>
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
