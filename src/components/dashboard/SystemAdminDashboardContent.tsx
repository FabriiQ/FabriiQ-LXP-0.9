'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { LineChart } from "@/components/ui/charts/LineChart";
import { BarChart } from "@/components/ui/charts/BarChart";
import { PieChart } from "@/components/ui/charts/PieChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Button } from "@/components/ui/atoms/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/atoms/skeleton";

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  user?: {
    name: string | null;
    userType: string;
  } | null;
}

interface SystemAdminDashboardContentProps {
  recentAuditLogs: AuditLog[];
}

/**
 * System Admin Dashboard Content component
 * Displays analytics, charts, and activity logs for system administrators
 */
export function SystemAdminDashboardContent({ recentAuditLogs }: SystemAdminDashboardContentProps) {
  // State for loading indicators
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real-time data using tRPC
  const { data: userActivityData, isLoading: isLoadingUserActivity, refetch: refetchUserActivity } =
    api.systemAnalytics.getUserActivity.useQuery({ days: 7 });

  const { data: userDistributionData, isLoading: isLoadingUserDistribution, refetch: refetchUserDistribution } =
    api.systemAnalytics.getUserDistribution.useQuery();

  const { data: campusPerformanceData, isLoading: isLoadingCampusPerformance, refetch: refetchCampusPerformance } =
    api.systemAnalytics.getCampusPerformance.useQuery();

  const { data: institutionPerformanceData, isLoading: isLoadingInstitutionPerformance, refetch: refetchInstitutionPerformance } =
    api.systemAnalytics.getInstitutionPerformance.useQuery();

  const { data: systemHealthData, isLoading: isLoadingSystemHealth, refetch: refetchSystemHealth } =
    api.systemAnalytics.getSystemResources.useQuery();

  const { data: errorRateData, isLoading: isLoadingErrorRate, refetch: refetchErrorRate } =
    api.systemAnalytics.getSystemHealth.useQuery();

  const { data: apiResponseTimeData, isLoading: isLoadingApiResponseTime, refetch: refetchApiResponseTime } =
    api.systemAnalytics.getApiResponseTime.useQuery();

  // Function to refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchUserActivity(),
      refetchUserDistribution(),
      refetchCampusPerformance(),
      refetchInstitutionPerformance(),
      refetchSystemHealth(),
      refetchErrorRate(),
      refetchApiResponseTime()
    ]);
    setIsRefreshing(false);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-4 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">User Analytics</TabsTrigger>
        <TabsTrigger value="institutions">Institutions</TabsTrigger>
        <TabsTrigger value="system">System Health</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Daily user activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserActivity ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : userActivityData ? (
                <LineChart
                  data={userActivityData}
                  xAxisKey="date"
                  lines={[
                    { dataKey: "logins", name: "Logins", color: "#1F504B" },
                    { dataKey: "activeUsers", name: "Active Users", color: "#5A8A84" },
                    { dataKey: "registrations", name: "New Registrations", color: "#FF9852" }
                  ]}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Users by role type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserDistribution ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full rounded-full" />
                </div>
              ) : userDistributionData ? (
                <PieChart
                  data={userDistributionData}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campus Performance</CardTitle>
            <CardDescription>Comparative metrics across campuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCampusPerformance ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : campusPerformanceData ? (
              <BarChart
                data={campusPerformanceData}
                xAxisKey="name"
                bars={[
                  { dataKey: "students", name: "Students", color: "#1F504B" },
                  { dataKey: "teachers", name: "Teachers", color: "#5A8A84" },
                  { dataKey: "courses", name: "Courses", color: "#FF9852" }
                ]}
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>System-wide activity logs</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAuditLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{log.action}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{log.user?.name || 'Unknown user'}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{log.details}</p>
                  </div>
                </div>
              ))}

              {recentAuditLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Monthly user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={[
                  { month: "Jan", users: 950 },
                  { month: "Feb", users: 1050 },
                  { month: "Mar", users: 1100 },
                  { month: "Apr", users: 1180 },
                  { month: "May", users: 1250 }
                ]}
                xAxisKey="month"
                lines={[
                  { dataKey: "users", name: "Total Users", color: "#1F504B" }
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Users by role type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserDistribution ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full rounded-full" />
                </div>
              ) : userDistributionData ? (
                <PieChart
                  data={userDistributionData}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Activity by Time</CardTitle>
            <CardDescription>Hourly system usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingApiResponseTime ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : apiResponseTimeData ? (
              <BarChart
                data={apiResponseTimeData}
                xAxisKey="hour"
                bars={[
                  { dataKey: "time", name: "Response Time (ms)", color: "#1F504B" }
                ]}
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="institutions" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Campus Distribution</CardTitle>
              <CardDescription>Campuses per institution</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInstitutionPerformance ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : institutionPerformanceData ? (
                <BarChart
                  data={institutionPerformanceData}
                  xAxisKey="name"
                  bars={[
                    { dataKey: "campuses", name: "Campuses", color: "#1F504B" }
                  ]}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Institution Performance</CardTitle>
              <CardDescription>Key metrics by institution</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInstitutionPerformance ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : institutionPerformanceData ? (
                <BarChart
                  data={institutionPerformanceData}
                  xAxisKey="name"
                  bars={[
                    { dataKey: "students", name: "Students", color: "#1F504B" },
                    { dataKey: "teachers", name: "Teachers", color: "#5A8A84" },
                    { dataKey: "courses", name: "Courses", color: "#FF9852" }
                  ]}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="system" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Resource Usage</CardTitle>
              <CardDescription>Current system resource allocation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSystemHealth ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full rounded-full" />
                </div>
              ) : systemHealthData ? (
                <PieChart
                  data={systemHealthData}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>Average API response time (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApiResponseTime ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : apiResponseTimeData ? (
                <LineChart
                  data={apiResponseTimeData}
                  xAxisKey="hour"
                  lines={[
                    { dataKey: "time", name: "Response Time (ms)", color: "#D92632" }
                  ]}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate</CardTitle>
            <CardDescription>System errors over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingErrorRate ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : errorRateData ? (
              <BarChart
                data={errorRateData}
                xAxisKey="date"
                bars={[
                  { dataKey: "errors", name: "Errors", color: "#D92632" }
                ]}
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
