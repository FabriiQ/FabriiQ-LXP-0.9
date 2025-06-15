'use client';

import React, { useState } from 'react';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface QuestionUsageAnalyticsProps {
  questionId: string;
  className?: string;
}

/**
 * Question Usage Analytics Component
 * 
 * This component displays analytics for a question's usage in activities.
 * It shows statistics like usage count, correct/incorrect answers, and time to answer.
 */
export const QuestionUsageAnalytics: React.FC<QuestionUsageAnalyticsProps> = ({
  questionId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch question usage stats
  const { data: stats, isLoading: isLoadingStats } = api.questionUsage.getQuestionUsageStats.useQuery({
    questionId,
  }, {
    enabled: !!questionId,
  });

  // Fetch question usage history
  const { data: historyData, isLoading: isLoadingHistory } = api.questionUsage.getQuestionUsageHistory.useQuery({
    questionId,
    limit: 10,
  }, {
    enabled: !!questionId && activeTab === 'history',
  });

  // Calculate statistics
  const correctPercentage = stats?.usageCount ? Math.round((stats.correctCount / stats.usageCount) * 100) : 0;
  const incorrectPercentage = stats?.usageCount ? Math.round((stats.incorrectCount / stats.usageCount) * 100) : 0;
  const partialPercentage = stats?.usageCount ? Math.round((stats.partialCount / stats.usageCount) * 100) : 0;

  // Prepare chart data
  const pieChartData = [
    { name: 'Correct', value: stats?.correctCount || 0, color: '#10b981' },
    { name: 'Incorrect', value: stats?.incorrectCount || 0, color: '#ef4444' },
    { name: 'Partial', value: stats?.partialCount || 0, color: '#f59e0b' },
  ];

  // Format time to answer
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Question Usage Analytics</CardTitle>
          <CardDescription>
            Analytics for how this question has been used in activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="history">Usage History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {isLoadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : !stats || stats.usageCount === 0 ? (
                <div className="p-6 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    This question has not been used in any activities yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Total Uses</div>
                      <div className="text-2xl font-bold">{stats.usageCount}</div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Correct Answers</div>
                      <div className="text-2xl font-bold text-green-600">{stats.correctCount}</div>
                      <div className="text-sm text-muted-foreground">{correctPercentage}% of total</div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Avg. Time to Answer</div>
                      <div className="text-2xl font-bold">{formatTime(stats.averageTime || 0)}</div>
                    </div>
                  </div>

                  {/* Answer Distribution */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Answer Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} answers`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Last Used */}
                  {stats.lastUsedAt && (
                    <div className="text-sm text-muted-foreground">
                      Last used {formatDistanceToNow(new Date(stats.lastUsedAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance">
              {isLoadingStats ? (
                <Skeleton className="h-60 w-full" />
              ) : !stats || stats.usageCount === 0 ? (
                <div className="p-6 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    No performance data available for this question.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Answer Performance</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Correct ({correctPercentage}%)</span>
                          <span className="text-sm text-muted-foreground">{stats.correctCount} of {stats.usageCount}</span>
                        </div>
                        <Progress value={correctPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-green-600" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Incorrect ({incorrectPercentage}%)</span>
                          <span className="text-sm text-muted-foreground">{stats.incorrectCount} of {stats.usageCount}</span>
                        </div>
                        <Progress value={incorrectPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-red-600" />
                      </div>
                      {stats.partialCount > 0 && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Partial ({partialPercentage}%)</span>
                            <span className="text-sm text-muted-foreground">{stats.partialCount} of {stats.usageCount}</span>
                          </div>
                          <Progress value={partialPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-yellow-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Difficulty Rating */}
                  {stats.difficultyRating !== null && stats.difficultyRating !== undefined && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Empirical Difficulty</h3>
                      <div className="flex items-center">
                        <Progress 
                          value={stats.difficultyRating * 20} 
                          className="h-2 w-full max-w-md bg-gray-200" 
                          indicatorClassName={`
                            ${stats.difficultyRating < 2 ? 'bg-green-500' : 
                              stats.difficultyRating < 3 ? 'bg-blue-500' : 
                              stats.difficultyRating < 4 ? 'bg-yellow-500' : 
                              'bg-red-500'}
                          `}
                        />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {stats.difficultyRating < 2 ? 'Easy' : 
                           stats.difficultyRating < 3 ? 'Medium' : 
                           stats.difficultyRating < 4 ? 'Hard' : 
                           'Very Hard'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {isLoadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !historyData || historyData.history.length === 0 ? (
                <div className="p-6 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    No usage history available for this question.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyData.history.map((usage) => (
                    <div key={usage.id} className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {usage.student?.name || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {usage.activity?.title || 'Unknown Activity'}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={usage.wasCorrect ? 'success' : 'destructive'}>
                            {usage.wasCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          <span className="ml-2 text-sm text-muted-foreground">
                            {formatTime(usage.timeToAnswer)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(usage.answeredAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                  
                  {historyData.total > historyData.history.length && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      Showing {historyData.history.length} of {historyData.total} records
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
