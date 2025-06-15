'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MasteryRadarChart } from './MasteryRadarChart';
import { TopicMasteryCard } from './TopicMasteryCard';
import { BloomsTaxonomyLevel, TopicMasteryData } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { useTrpcMastery } from '../../hooks/useTrpcMastery';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Info } from 'lucide-react';
import { LineChart } from '@/components/ui/charts/line-chart';

interface StudentMasteryProfileProps {
  studentId: string;
  studentName?: string;
  subjectId?: string;
  className?: string;
}

/**
 * Component for displaying a student's mastery profile
 * 
 * This component shows a student's mastery across topics and cognitive levels,
 * including historical progress tracking and personalized recommendations.
 */
export function StudentMasteryProfile({
  studentId,
  studentName,
  subjectId,
  className = '',
}: StudentMasteryProfileProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'history' | 'recommendations'>('overview');

  // Get student analytics
  const { 
    getStudentAnalytics,
    getPartitionedMastery,
    isLoadingAnalytics,
    isLoadingMastery
  } = useTrpcMastery();

  // Get student analytics data
  const { data: analytics } = getStudentAnalytics(studentId, subjectId);
  
  // Get topic masteries
  const { data: topicMasteries } = getPartitionedMastery({
    studentId,
    subjectId,
  });

  // Loading state
  const isLoading = isLoadingAnalytics || isLoadingMastery;

  // Generate recommendations based on mastery data
  const generateRecommendations = () => {
    if (!analytics) return [];

    const recommendations: { title: string; description: string; level: BloomsTaxonomyLevel }[] = [];

    // Find the lowest mastery level
    let lowestLevel: BloomsTaxonomyLevel = BloomsTaxonomyLevel.REMEMBER;
    let lowestScore = 100;

    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const score = analytics.bloomsLevels[level] || 0;
      if (score < lowestScore) {
        lowestScore = score;
        lowestLevel = level;
      }
    });

    // Add recommendation for lowest level
    const metadata = BLOOMS_LEVEL_METADATA[lowestLevel];
    recommendations.push({
      title: `Improve ${metadata.name} Skills`,
      description: `Focus on activities that strengthen your ${metadata.name.toLowerCase()} skills. ${metadata.description}`,
      level: lowestLevel
    });

    // Add recommendation for balanced growth
    recommendations.push({
      title: 'Balance Your Cognitive Skills',
      description: 'Try to maintain balanced growth across all cognitive levels for comprehensive understanding.',
      level: BloomsTaxonomyLevel.UNDERSTAND
    });

    // Add recommendation for higher-order thinking
    if (lowestLevel === BloomsTaxonomyLevel.REMEMBER || lowestLevel === BloomsTaxonomyLevel.UNDERSTAND) {
      recommendations.push({
        title: 'Develop Higher-Order Thinking',
        description: 'Challenge yourself with activities that require analysis, evaluation, and creation to develop critical thinking skills.',
        level: BloomsTaxonomyLevel.ANALYZE
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Generate mock historical data for demonstration
  const generateHistoricalData = () => {
    if (!analytics) return [];

    const today = new Date();
    const data = [];

    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      // Create random data that trends upward
      const baseValue = 30 + (5 - i) * 10; // Start at 30%, increase by ~10% per month
      
      data.push({
        date: date.toISOString().split('T')[0],
        remember: Math.min(100, baseValue + Math.random() * 10),
        understand: Math.min(100, baseValue - 5 + Math.random() * 15),
        apply: Math.min(100, baseValue - 10 + Math.random() * 20),
        analyze: Math.min(100, baseValue - 15 + Math.random() * 25),
        evaluate: Math.min(100, baseValue - 20 + Math.random() * 30),
        create: Math.min(100, baseValue - 25 + Math.random() * 35),
      });
    }

    return data;
  };

  const historicalData = generateHistoricalData();

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="overview" onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mastery Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Mastery by Cognitive Level</CardTitle>
                <CardDescription>
                  Current mastery levels across Bloom's Taxonomy
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-[300px] rounded-full" />
                ) : analytics ? (
                  <MasteryRadarChart 
                    data={{
                      [BloomsTaxonomyLevel.REMEMBER]: analytics.bloomsLevels[BloomsTaxonomyLevel.REMEMBER] || 0,
                      [BloomsTaxonomyLevel.UNDERSTAND]: analytics.bloomsLevels[BloomsTaxonomyLevel.UNDERSTAND] || 0,
                      [BloomsTaxonomyLevel.APPLY]: analytics.bloomsLevels[BloomsTaxonomyLevel.APPLY] || 0,
                      [BloomsTaxonomyLevel.ANALYZE]: analytics.bloomsLevels[BloomsTaxonomyLevel.ANALYZE] || 0,
                      [BloomsTaxonomyLevel.EVALUATE]: analytics.bloomsLevels[BloomsTaxonomyLevel.EVALUATE] || 0,
                      [BloomsTaxonomyLevel.CREATE]: analytics.bloomsLevels[BloomsTaxonomyLevel.CREATE] || 0,
                    }}
                    size={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No mastery data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Mastery Overview</CardTitle>
                <CardDescription>
                  Detailed breakdown of mastery by cognitive level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : analytics ? (
                  <div className="space-y-4">
                    {Object.values(BloomsTaxonomyLevel).map(level => {
                      const metadata = BLOOMS_LEVEL_METADATA[level];
                      const value = analytics.bloomsLevels[level] || 0;
                      
                      return (
                        <div key={level} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium" style={{ color: metadata.color }}>
                              {metadata.name}
                            </span>
                            <span className="font-medium">{Math.round(value)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${value}%`,
                                backgroundColor: metadata.color,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {metadata.description}
                          </p>
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 mt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Overall Mastery</span>
                        <span className="font-medium">{Math.round(analytics.overallMastery)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${analytics.overallMastery}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No mastery data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topic Mastery</CardTitle>
              <CardDescription>
                Mastery levels across different topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : topicMasteries?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicMasteries.map((mastery: TopicMasteryData & { topicName: string; subjectName: string }) => (
                    <TopicMasteryCard
                      key={mastery.topicId}
                      masteryData={mastery}
                      topicName={mastery.topicName}
                      subjectName={mastery.subjectName}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No topic mastery data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historical Progress</CardTitle>
              <CardDescription>
                Mastery progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : historicalData.length > 0 ? (
                <div className="h-[400px]">
                  <LineChart
                    data={historicalData}
                    index="date"
                    categories={[
                      "remember",
                      "understand",
                      "apply",
                      "analyze",
                      "evaluate",
                      "create"
                    ]}
                    colors={[
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.REMEMBER].color,
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.UNDERSTAND].color,
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.APPLY].color,
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.ANALYZE].color,
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.EVALUATE].color,
                      BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.CREATE].color,
                    ]}
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                    yAxisWidth={40}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No historical data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve your mastery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => {
                    const metadata = BLOOMS_LEVEL_METADATA[rec.level];
                    
                    return (
                      <Alert key={index}>
                        <Info className="h-4 w-4" />
                        <AlertTitle style={{ color: metadata.color }}>
                          {rec.title}
                        </AlertTitle>
                        <AlertDescription>
                          {rec.description}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Complete more assessments to receive personalized recommendations
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
