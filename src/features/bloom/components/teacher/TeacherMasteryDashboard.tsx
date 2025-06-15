'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MasteryRadarChart } from '../mastery/MasteryRadarChart';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Info, Download } from 'lucide-react';
import { BarChart } from '@/components/ui/charts/bar-chart';
import { HeatMap } from '@/components/ui/charts/heat-map';
import { BloomsTaxonomyLevel, MasteryLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';

interface TeacherMasteryDashboardProps {
  classId: string;
}

/**
 * TeacherMasteryDashboard
 * 
 * This component displays a teacher's dashboard for monitoring class mastery.
 * It shows mastery across topics, students, and cognitive levels.
 */
export function TeacherMasteryDashboard({
  classId
}: TeacherMasteryDashboardProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  
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
  
  // Fetch topics for the selected subject
  const { data: topics } = api.topic.getBySubject.useQuery(
    { subjectId: selectedSubjectId },
    { enabled: !!selectedSubjectId }
  );
  
  // Fetch class analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = api.analytics.getClassMasteryAnalytics.useQuery(
    { 
      classId,
      subjectId: selectedSubjectId || undefined,
      topicId: selectedTopicId || undefined
    },
    { enabled: !!classId }
  );
  
  // Fetch mastery heatmap data
  const { data: heatmapData, isLoading: isLoadingHeatmap } = api.analytics.getClassMasteryHeatmap.useQuery(
    { 
      classId,
      subjectId: selectedSubjectId || undefined
    },
    { enabled: !!classId }
  );
  
  // Fetch student leaderboard
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = api.analytics.getTopicMasteryLeaderboard.useQuery(
    { 
      classId,
      topicId: selectedTopicId || undefined,
      limit: 10
    },
    { enabled: !!classId && !!selectedTopicId }
  );
  
  // Prepare data for charts
  const masteryDistributionData = analytics?.masteryDistribution 
    ? Object.entries(analytics.masteryDistribution).map(([level, value]) => ({
        level: level.charAt(0) + level.slice(1).toLowerCase(),
        value
      }))
    : [];
  
  // Prepare heatmap data
  const heatmapChartData = heatmapData?.map(item => ({
    topic: item.topicName,
    remember: item.bloomsLevels[BloomsTaxonomyLevel.REMEMBER],
    understand: item.bloomsLevels[BloomsTaxonomyLevel.UNDERSTAND],
    apply: item.bloomsLevels[BloomsTaxonomyLevel.APPLY],
    analyze: item.bloomsLevels[BloomsTaxonomyLevel.ANALYZE],
    evaluate: item.bloomsLevels[BloomsTaxonomyLevel.EVALUATE],
    create: item.bloomsLevels[BloomsTaxonomyLevel.CREATE],
  })) || [];
  
  // Prepare leaderboard data
  const leaderboardData = leaderboard?.map((student, index) => ({
    rank: index + 1,
    name: student.name,
    mastery: student.overallMastery,
    remember: student.bloomsLevels[BloomsTaxonomyLevel.REMEMBER] || 0,
    understand: student.bloomsLevels[BloomsTaxonomyLevel.UNDERSTAND] || 0,
    apply: student.bloomsLevels[BloomsTaxonomyLevel.APPLY] || 0,
    analyze: student.bloomsLevels[BloomsTaxonomyLevel.ANALYZE] || 0,
    evaluate: student.bloomsLevels[BloomsTaxonomyLevel.EVALUATE] || 0,
    create: student.bloomsLevels[BloomsTaxonomyLevel.CREATE] || 0,
  })) || [];
  
  const isLoading = isLoadingAnalytics || isLoadingHeatmap || isLoadingLeaderboard;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Mastery Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor student mastery across topics and cognitive skills
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          
          <Select
            value={selectedTopicId}
            onValueChange={setSelectedTopicId}
            disabled={!selectedSubjectId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Topics</SelectItem>
              {topics?.map(topic => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Mastery Card */}
        <Card>
          <CardHeader>
            <CardTitle>Average Mastery</CardTitle>
            <CardDescription>
              Class average across all topics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isLoading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : analytics ? (
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {Math.round(analytics.averageMastery)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {analytics.topicMastery.length} topics tracked
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No mastery data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Mastery Distribution Card */}
        <Card>
          <CardHeader>
            <CardTitle>Mastery Distribution</CardTitle>
            <CardDescription>
              Distribution of mastery levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : analytics ? (
              <BarChart
                data={masteryDistributionData}
                index="level"
                categories={["value"]}
                colors={["#3b82f6"]}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Cognitive Skills Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cognitive Skills</CardTitle>
            <CardDescription>
              Class mastery across Bloom's levels
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            ) : analytics ? (
              <MasteryRadarChart 
                data={analytics.bloomsLevels}
                size={200}
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
      
      <Tabs defaultValue="heatmap">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="heatmap">Mastery Heatmap</TabsTrigger>
          <TabsTrigger value="leaderboard">Student Leaderboard</TabsTrigger>
        </TabsList>
        
        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Topic Mastery Heatmap</CardTitle>
              <CardDescription>
                Mastery levels across topics and cognitive skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : heatmapChartData.length > 0 ? (
                <div className="h-[400px]">
                  <HeatMap
                    data={heatmapChartData}
                    index="topic"
                    categories={[
                      "remember",
                      "understand",
                      "apply",
                      "analyze",
                      "evaluate",
                      "create"
                    ]}
                    valueFormatter={(value) => `${value}%`}
                    colors={{
                      start: "#f3f4f6",
                      end: "#3b82f6"
                    }}
                  />
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Heatmap Data</AlertTitle>
                  <AlertDescription>
                    There is no mastery data available for topics in this class yet.
                    Students need to complete activities and assessments to generate mastery data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Mastery Leaderboard</CardTitle>
              <CardDescription>
                Top performing students by mastery level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !selectedTopicId ? (
                selectedTopicId ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Select a Topic</AlertTitle>
                    <AlertDescription>
                      Please select a specific topic to view the student leaderboard.
                    </AlertDescription>
                  </Alert>
                )
              ) : leaderboardData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Rank</th>
                        <th className="text-left py-2 px-4">Student</th>
                        <th className="text-center py-2 px-4">Overall</th>
                        {Object.values(BloomsTaxonomyLevel).map(level => (
                          <th 
                            key={level} 
                            className="text-center py-2 px-4"
                            style={{ color: BLOOMS_LEVEL_METADATA[level].color }}
                          >
                            {BLOOMS_LEVEL_METADATA[level].name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map(student => (
                        <tr key={student.name} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{student.rank}</td>
                          <td className="py-2 px-4">{student.name}</td>
                          <td className="text-center py-2 px-4 font-medium">{student.mastery}%</td>
                          {Object.values(BloomsTaxonomyLevel).map(level => (
                            <td key={level} className="text-center py-2 px-4">
                              {student[level.toLowerCase() as keyof typeof student]}%
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Leaderboard Data</AlertTitle>
                  <AlertDescription>
                    There is no mastery data available for students in this topic yet.
                    Students need to complete activities and assessments to generate mastery data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
