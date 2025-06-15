"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeacherLeaderboardView } from "@/components/coordinator/leaderboard/TeacherLeaderboardView";
import { TeacherAchievementsView } from "@/components/coordinator/TeacherAchievementsView";
import { TeacherPointsHistoryView } from "@/components/coordinator/TeacherPointsHistoryView";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Trophy, Home, School } from "lucide-react";

/**
 * Teacher Leaderboard Page
 *
 * This page displays the teacher leaderboard and related information.
 * It reuses components from the coordinator portal.
 */
export default function TeacherLeaderboardPage() {
  const { toast } = useToast();
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  // Fetch campuses data from API
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal/teacher-leaderboard">
              <Trophy className="h-4 w-4 mr-1" />
              Teacher Leaderboard
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Teacher Leaderboard
      </h1>

      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="w-full md:w-1/3">
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
            <SelectTrigger>
              <SelectValue placeholder="Select Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Campuses</SelectItem>
              {isLoadingCampuses ? (
                <SelectItem value="" disabled>Loading campuses...</SelectItem>
              ) : campuses && campuses.length > 0 ? (
                campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No campuses found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">Points History</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance Ranking</CardTitle>
              <CardDescription>
                Teachers ranked by performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherLeaderboardView
                campusId={selectedCampus || undefined}
                timeframe={selectedTimeframe as any}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Achievements</CardTitle>
              <CardDescription>
                Badges and achievements earned by teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherAchievementsView
                campusId={selectedCampus || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>
                History of points earned by teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherPointsHistoryView
                campusId={selectedCampus || undefined}
                timeframe={selectedTimeframe as any}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
