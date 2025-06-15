'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { Loader2 } from 'lucide-react';

// Reusing coordinator components
import { CourseAnalyticsDashboard } from '@/components/coordinator/analytics/CourseAnalyticsDashboard';
import { StudentLeaderboardView } from '@/components/coordinator/leaderboard/StudentLeaderboardView';
import { TeacherLeaderboardView } from '@/components/coordinator/leaderboard/TeacherLeaderboardView';
import { PrincipalDashboardCore } from '@/components/principal/dashboard/PrincipalDashboardCore';
import { IntelligentActivityFeed } from '@/components/coordinator/dashboard/IntelligentActivityFeed';

/**
 * PrincipalDashboardClient Component
 *
 * Main client component for the Principal Dashboard.
 * Provides tabs for different views and analytics sections.
 */
export function PrincipalDashboardClient() {
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Dashboard refreshed',
        description: 'All data has been updated with the latest information.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'There was an error refreshing the dashboard. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening across your campus
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || !isOnline}
        >
          <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PrincipalDashboardCore />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CourseAnalyticsDashboard />
            <IntelligentActivityFeed limit={5} />
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance</CardTitle>
              <CardDescription>Teacher performance metrics and leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherLeaderboardView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Student performance metrics and leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentLeaderboardView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>Performance metrics across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
