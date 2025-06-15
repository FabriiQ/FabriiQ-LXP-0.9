'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Activity,
  Target,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';

interface AssessmentAnalytics {
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  passingRate: number;
  completionRate: number;
  averageTimeSpent: number;
  bloomsDistribution: Record<BloomsTaxonomyLevel, {
    averageScore: number;
    maxScore: number;
    percentage: number;
    studentCount: number;
  }>;
  topicMasteryImpact: Array<{
    topicId: string;
    topicName: string;
    averageImpact: number;
    studentsAffected: number;
  }>;
  learningOutcomeAchievement: Array<{
    outcomeId: string;
    outcomeStatement: string;
    achievementRate: number;
    averageScore: number;
  }>;
  performanceDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    studentName: string;
    score: number;
    weakAreas: BloomsTaxonomyLevel[];
  }>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    score: number;
    strongAreas: BloomsTaxonomyLevel[];
  }>;
}

interface AssessmentAnalyticsDashboardProps {
  assessmentId: string;
  assessmentTitle: string;
  maxScore: number;
  passingScore?: number;
  analytics: AssessmentAnalytics;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function AssessmentAnalyticsDashboard({
  assessmentId,
  assessmentTitle,
  maxScore,
  passingScore = 60,
  analytics,
  isLoading = false,
  onRefresh,
  className = '',
}: AssessmentAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'blooms' | 'mastery' | 'students'>('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');

  // Calculate key metrics
  const getKeyMetrics = () => {
    const completionPercentage = analytics.totalSubmissions > 0
      ? (analytics.gradedSubmissions / analytics.totalSubmissions) * 100
      : 0;

    const averagePercentage = (analytics.averageScore / maxScore) * 100;

    const passingPercentage = analytics.passingRate * 100;

    return {
      completionPercentage,
      averagePercentage,
      passingPercentage,
    };
  };

  const metrics = getKeyMetrics();

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{assessmentTitle} Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive assessment performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.completionPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.gradedSubmissions} graded ({metrics.completionPercentage.toFixed(1)}%)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <BarChart className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.averagePercentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.averagePercentage.toFixed(1)}% of max score
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{(analytics.passingRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Passing Rate</div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.passingPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                Passing score: {passingScore}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.averageTimeSpent}</div>
                <div className="text-sm text-muted-foreground">Avg. Time (min)</div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                Time spent on assessment
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="blooms">
            <Activity className="h-4 w-4 mr-2" />
            Bloom's Analysis
          </TabsTrigger>
          <TabsTrigger value="mastery">
            <Target className="h-4 w-4 mr-2" />
            Topic Mastery
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Student Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  How students performed across score ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performanceDistribution.map((range, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{range.range}</span>
                        <span>{range.count} students ({range.percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={range.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Outcome Achievement */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Outcome Achievement</CardTitle>
                <CardDescription>
                  Success rates for each learning outcome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.learningOutcomeAchievement.map((outcome) => (
                    <div key={outcome.outcomeId} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium line-clamp-2">
                            {outcome.outcomeStatement}
                          </div>
                        </div>
                        <Badge variant={outcome.achievementRate >= 0.7 ? "default" : "secondary"}>
                          {(outcome.achievementRate * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={outcome.achievementRate * 100} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Average score: {outcome.averageScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Bloom's Taxonomy Performance Analysis
              </CardTitle>
              <CardDescription>
                Cognitive level performance breakdown and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(analytics.bloomsDistribution).map(([level, data]) => {
                  const metadata = BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel];
                  const isStruggling = data.percentage < 60;

                  return (
                    <div key={level} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: metadata.color }}
                          />
                          <div>
                            <h4 className="font-medium">{metadata.name}</h4>
                            <p className="text-sm text-muted-foreground">{metadata.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {data.averageScore.toFixed(1)}/{data.maxScore}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <Progress
                        value={data.percentage}
                        className="h-3"
                        style={{
                          '--progress-background': metadata.color,
                        } as any}
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span>{data.studentCount} students assessed</span>
                        {isStruggling && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Needs attention</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mastery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Topic Mastery Impact
              </CardTitle>
              <CardDescription>
                How this assessment affects student topic mastery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topicMasteryImpact.map((topic) => (
                  <div key={topic.topicId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{topic.topicName}</h4>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          +{topic.averageImpact.toFixed(1)}% avg impact
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {topic.studentsAffected} students affected
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Students who excelled in this assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPerformers.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          Strong in: {student.strongAreas.map(area =>
                            BLOOMS_LEVEL_METADATA[area].name
                          ).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{student.score}</div>
                        <div className="text-sm text-muted-foreground">
                          {((student.score / maxScore) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Struggling Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Students Needing Support
                </CardTitle>
                <CardDescription>
                  Students who may need additional help
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.strugglingStudents.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          Weak in: {student.weakAreas.map(area =>
                            BLOOMS_LEVEL_METADATA[area].name
                          ).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-600">{student.score}</div>
                        <div className="text-sm text-muted-foreground">
                          {((student.score / maxScore) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
