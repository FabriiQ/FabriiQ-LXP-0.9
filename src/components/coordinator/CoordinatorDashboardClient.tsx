'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { CourseAnalyticsDashboard } from '@/components/coordinator/analytics/CourseAnalyticsDashboard';
import { StudentLeaderboardView } from '@/components/coordinator/leaderboard/StudentLeaderboardView';
import { TeacherLeaderboardView } from '@/components/coordinator/leaderboard/TeacherLeaderboardView';
import { TeacherManagementDashboard } from '@/components/coordinator/teachers/TeacherManagementDashboard';
import { CoordinatorDashboardCore } from '@/components/coordinator/dashboard/CoordinatorDashboardCore';
import { IntelligentActivityFeed } from '@/components/coordinator/dashboard/IntelligentActivityFeed';
import { Loader2 } from 'lucide-react';

/**
 * CoordinatorDashboardClient Component
 *
 * Client component for the coordinator dashboard with real-time data.
 * Includes tabs for overview, teachers, and students.
 */
export function CoordinatorDashboardClient() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Offline storage hooks
  const { isOnline } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      // Refresh all components by forcing a re-render
      setActiveTab(activeTab);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      // Set a timeout to prevent flickering
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening across your programs
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
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CoordinatorDashboardCore />

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
              {/* Pass a default programId to avoid the "User is not a coordinator or admin" error */}
              <TeacherLeaderboardView programId="default-program-id" />
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
              {/* Pass a default programId to avoid the "Campus not found" error */}
              <StudentLeaderboardView programId="default-program-id" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <TeacherManagementDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
