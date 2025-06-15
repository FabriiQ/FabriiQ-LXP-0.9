'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/trpc/react';
import { BloomsCognitiveDistributionChart } from '../analytics/BloomsCognitiveDistributionChart';
import { MasteryHeatmap } from '../analytics/MasteryHeatmap';
import { InterventionSuggestions } from '../analytics/InterventionSuggestions';
import { MasteryProgressReport } from '../reporting/MasteryProgressReport';
import { CognitiveBalanceReport } from '../reporting/CognitiveBalanceReport';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BarChart, BookOpen, FileText, GraduationCap, PieChart, Users } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface BloomsTeacherDashboardProps {
  teacherId: string;
  classId?: string;
  className?: string;
}

export function BloomsTeacherDashboard({
  teacherId,
  classId,
  className = ""
}: BloomsTeacherDashboardProps) {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClassId, setSelectedClassId] = useState(classId || '');

  // Get teacher's classes
  const { data: teacherClasses, isLoading: isLoadingClasses } = api.teacher.getTeacherClasses.useQuery({
    teacherId
  });

  // Get class performance data if a class is selected
  const { data: classPerformance, isLoading: isLoadingPerformance } = api.bloomsAnalytics.getClassPerformance.useQuery({
    classId: selectedClassId
  }, {
    enabled: !!selectedClassId
  });

  // Get recent assessments for the selected class
  const { data: recentAssessments, isLoading: isLoadingAssessments } = api.assessment.listByClass.useQuery({
    classId: selectedClassId,
    page: 1,
    pageSize: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }, {
    enabled: !!selectedClassId
  });

  // Handle class selection
  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
  };

  return (
    <div className={`blooms-teacher-dashboard ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bloom's Taxonomy Dashboard</h2>
          <p className="text-muted-foreground">
            Cognitive level analytics and mastery tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedClassId} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingClasses ? (
                <SelectItem value="loading" disabled>Loading classes...</SelectItem>
              ) : teacherClasses && teacherClasses.length > 0 ? (
                teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No classes available</SelectItem>
              )}
            </SelectContent>
          </Select>

          {selectedClassId && (
            <Button variant="outline" asChild>
              <Link href={`/teacher/classes/${selectedClassId}/bloom-analytics`}>
                <BarChart className="mr-2 h-4 w-4" />
                Detailed Analytics
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!selectedClassId ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Please select a class to view Bloom's Taxonomy analytics.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <PieChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="assessments">
              <FileText className="h-4 w-4 mr-2" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="mastery">
              <GraduationCap className="h-4 w-4 mr-2" />
              Mastery
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BookOpen className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Class Average Mastery */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Class Average Mastery</CardTitle>
                  <CardDescription>Overall mastery across all topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32">
                    {isLoadingPerformance ? (
                      <div className="animate-pulse bg-gray-200 h-24 w-24 rounded-full flex items-center justify-center">
                        <span className="text-transparent">0%</span>
                      </div>
                    ) : classPerformance ? (
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
                            strokeDasharray={`${(classPerformance.averageMastery || 0) * 2.51} 251`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        <span className="absolute text-2xl font-bold">
                          {classPerformance.averageMastery || 0}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No data available
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
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/teacher/classes/${selectedClassId}/bloom-analytics`}>
                      View Detailed Analytics
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Cognitive Level Distribution */}
              <BloomsCognitiveDistributionChart
                distribution={classPerformance?.distribution || {}}
                isLoading={isLoadingPerformance}
              />
            </div>

            {/* Intervention Suggestions */}
            {classPerformance?.interventionSuggestions && (
              <InterventionSuggestions
                suggestions={classPerformance.interventionSuggestions}
                isLoading={isLoadingPerformance}
                className="mb-6"
              />
            )}
          </TabsContent>

          <TabsContent value="students">
            {isLoadingPerformance ? (
              <Skeleton className="h-[400px] w-full" />
            ) : classPerformance ? (
              <MasteryHeatmap
                data={{
                  studentIds: classPerformance.studentPerformance.map(s => s.studentId),
                  studentNames: classPerformance.studentPerformance.map(s => s.studentName),
                  topicIds: classPerformance.topicPerformance.map(t => t.topicId),
                  topicNames: classPerformance.topicPerformance.map(t => t.topicName),
                  heatmapData: classPerformance.studentPerformance.map(() =>
                    classPerformance.topicPerformance.map(() =>
                      Math.floor(Math.random() * 101) // Placeholder data
                    )
                  )
                }}
                isLoading={isLoadingPerformance}
              />
            ) : (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center text-muted-foreground">
                    No student mastery data available.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Bloom's Levels</CardTitle>
                <CardDescription>
                  Cognitive level distribution in recent assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAssessments ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentAssessments && 'items' in recentAssessments && recentAssessments.items.length > 0 ? (
                  <div className="space-y-4">
                    {recentAssessments.items.map(assessment => (
                      <div key={assessment.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{assessment.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Assessment • Max Score: {assessment.maxScore || 'N/A'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/assessments/${assessment.id}/grade`}>
                              Grade
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No assessments available for this class.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/teacher/classes/${selectedClassId}/assessments`}>
                    View All Assessments
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="mastery">
            {selectedClassId && teacherId && (
              <MasteryProgressReport
                classId={selectedClassId}
                teacherId={teacherId}
              />
            )}
          </TabsContent>

          <TabsContent value="reports">
            {selectedClassId && teacherId && (
              <CognitiveBalanceReport
                classId={selectedClassId}
                teacherId={teacherId}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
