'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MasteryRadarChart } from '../mastery/MasteryRadarChart';
import { TopicMasteryCard } from '../mastery/TopicMasteryCard';
import { BloomsRewardIntegration } from '../reward/BloomsRewardIntegration';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Info } from 'lucide-react';
import { LineChart } from '@/components/ui/charts/line-chart';
import { BloomsTaxonomyLevel } from '../../types';

interface StudentTopicMasteryDashboardProps {
  studentId: string;
  classId: string;
}

/**
 * StudentTopicMasteryDashboard
 * 
 * This component displays a student's topic mastery dashboard.
 * It shows mastery across topics, cognitive levels, and rewards.
 */
export function StudentTopicMasteryDashboard({
  studentId,
  classId
}: StudentTopicMasteryDashboardProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Fetch class data
  const { data: classData } = api.class.getById.useQuery(
    { id: classId },
    { enabled: !!classId }
  );
  
  // Fetch subjects for the class
  const { data: subjects } = api.subject.getByClass.useQuery(
    { classId },
    { enabled: !!classId }
  );
  
  // Fetch student data
  const { data: student } = api.student.getById.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );
  
  // Fetch topic masteries for the student
  const { data: topicMasteries, isLoading: isLoadingMasteries } = api.topicMastery.getByStudent.useQuery(
    { 
      studentId,
      subjectId: selectedSubjectId || undefined
    },
    { 
      enabled: !!studentId,
      refetchOnWindowFocus: true
    }
  );
  
  // Fetch student analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = api.analytics.getStudentMasteryAnalytics.useQuery(
    { 
      studentId,
      subjectId: selectedSubjectId || undefined
    },
    { enabled: !!studentId }
  );
  
  // Fetch historical mastery data
  const { data: historicalData, isLoading: isLoadingHistory } = api.analytics.getStudentMasteryHistory.useQuery(
    { 
      studentId,
      subjectId: selectedSubjectId || undefined,
      period: 'month'
    },
    { enabled: !!studentId }
  );
  
  // Prepare data for charts
  const masteryChartData = analytics?.bloomsLevels || {};
  
  // Prepare historical data for line chart
  const lineChartData = historicalData?.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    remember: entry.levels[BloomsTaxonomyLevel.REMEMBER] || 0,
    understand: entry.levels[BloomsTaxonomyLevel.UNDERSTAND] || 0,
    apply: entry.levels[BloomsTaxonomyLevel.APPLY] || 0,
    analyze: entry.levels[BloomsTaxonomyLevel.ANALYZE] || 0,
    evaluate: entry.levels[BloomsTaxonomyLevel.EVALUATE] || 0,
    create: entry.levels[BloomsTaxonomyLevel.CREATE] || 0,
  })) || [];
  
  const isLoading = isLoadingMasteries || isLoadingAnalytics || isLoadingHistory;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Topic Mastery Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and mastery across topics and cognitive skills
          </p>
        </div>
        
        <Select
          value={selectedSubjectId}
          onValueChange={setSelectedSubjectId}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subjects</SelectItem>
            {subjects?.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Mastery Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Mastery</CardTitle>
            <CardDescription>
              Your overall mastery across all topics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isLoading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : analytics ? (
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {Math.round(analytics.overallMastery)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {analytics.masteryBySubject.length} topics mastered
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No mastery data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Cognitive Skills Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cognitive Skills</CardTitle>
            <CardDescription>
              Your mastery across Bloom's Taxonomy levels
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <Skeleton className="h-[250px] w-[250px] rounded-full" />
            ) : analytics ? (
              <MasteryRadarChart 
                data={masteryChartData}
                size={250}
                showLabels
                showValues
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No cognitive skills data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="topics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="history">Progress History</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Achievements</TabsTrigger>
        </TabsList>
        
        {/* Topics Tab */}
        <TabsContent value="topics" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full" />
              ))}
            </div>
          ) : topicMasteries?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicMasteries.map(mastery => (
                <TopicMasteryCard
                  key={mastery.id}
                  masteryData={mastery}
                  topicName={mastery.topicName || 'Unknown Topic'}
                  subjectName={mastery.subjectName || 'Unknown Subject'}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Topic Mastery Data</AlertTitle>
              <AlertDescription>
                You haven't completed any assessments or activities for topics yet.
                Complete activities and assessments to build your mastery profile.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mastery Progress</CardTitle>
              <CardDescription>
                Your mastery progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : lineChartData.length > 0 ? (
                <div className="h-[400px]">
                  <LineChart
                    data={lineChartData}
                    index="date"
                    categories={[
                      "remember",
                      "understand",
                      "apply",
                      "analyze",
                      "evaluate",
                      "create"
                    ]}
                    colors={["#e11d48", "#ea580c", "#eab308", "#16a34a", "#0ea5e9", "#8b5cf6"]}
                    valueFormatter={(value) => `${value}%`}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No historical data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-4">
          {/* This would be populated with recent activity grades and their rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* This is a placeholder - in a real implementation, you would fetch recent activity grades */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Rewards System</AlertTitle>
              <AlertDescription>
                Complete activities and assessments to earn rewards based on your mastery of cognitive skills.
                Higher-level thinking skills earn more points!
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
