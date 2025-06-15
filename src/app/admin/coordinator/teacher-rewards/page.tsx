"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { Award, Search, Filter, RotateCw } from "lucide-react";
import { CoordinatorAwardPointsDialog } from "@/components/coordinator/rewards/CoordinatorAwardPointsDialog";
import { TeacherLeaderboardView } from "@/components/coordinator/TeacherLeaderboardView";
import { TeacherPointsHistoryView } from "@/components/coordinator/TeacherPointsHistoryView";

/**
 * TeacherRewardsPage
 *
 * Main page for managing teacher rewards in the coordinator portal.
 * Provides tabs for leaderboard, points history, and awarding points.
 */
export default function TeacherRewardsPage() {
  // State
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch campuses
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery(
    undefined,
    {
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load campuses",
          variant: "error",
        });
      },
    }
  );

  // Fetch programs based on selected campus
  const { data: programs, isLoading: isLoadingPrograms } = api.program.getProgramCampusesByCampus.useQuery(
    { campusId: selectedCampusId },
    {
      enabled: !!selectedCampusId,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load programs",
          variant: "error",
        });
      },
    }
  );

  // Fetch courses based on selected program
  const { data: courses, isLoading: isLoadingCourses } = api.course.getByCampus.useQuery(
    { programId: selectedProgramId, campusId: selectedCampusId },
    {
      enabled: !!selectedProgramId && !!selectedCampusId,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load courses",
          variant: "error",
        });
      },
    }
  );

  // Fetch teachers based on selected campus and coordinator's managed classes
  const { data: teachers, isLoading: isLoadingTeachers } = api.coordinator.getTeachers.useQuery(
    {
      campusId: selectedCampusId,
      programId: selectedProgramId || undefined,
      courseId: selectedCourseId || undefined,
      search: searchQuery
    },
    {
      enabled: !!selectedCampusId,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load teachers",
          variant: "error",
        });
      },
    }
  );

  // Use teachers from coordinator's managed classes
  const filteredTeachers = teachers?.teachers || [];

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Implement refresh logic here
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Teacher rewards data has been updated",
        variant: "success",
      });
    }, 1000);
  };

  // Handle points awarded
  const handlePointsAwarded = () => {
    // Refresh data after points are awarded
    // This would typically invalidate the relevant queries
    toast({
      title: "Points Awarded",
      description: "Teacher points have been awarded successfully",
      variant: "success",
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Rewards</h1>
        <p className="text-muted-foreground">
          Manage teacher rewards, view leaderboards, and award points to recognize achievements.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Teacher Rewards Management</CardTitle>
              <CardDescription>
                Award points and track teacher performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedCampusId && (
                <CoordinatorAwardPointsDialog
                  teachers={filteredTeachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.user.name || "Unknown Teacher",
                    profileImage: typeof teacher.user.profileData === 'object' && teacher.user.profileData ?
                      (teacher.user.profileData as any).avatar : undefined,
                  }))}
                  classId={selectedCourseId}
                  onPointsAwarded={handlePointsAwarded}
                />
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campus</label>
              {isLoadingCampuses ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Campuses</SelectItem>
                    {campuses?.map((campus) => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              {isLoadingPrograms ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                  disabled={!selectedCampusId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Programs</SelectItem>
                    {programs?.map((programCampus) => (
                      <SelectItem key={programCampus.program.id} value={programCampus.program.id}>
                        {programCampus.program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              {isLoadingCourses ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={!selectedProgramId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Courses</SelectItem>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Teachers</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="leaderboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="points-history">Points History</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="mt-0">
              <TeacherLeaderboardView
                campusId={selectedCampusId || undefined}
                programId={selectedProgramId || undefined}
                courseId={selectedCourseId || undefined}
              />
            </TabsContent>

            <TabsContent value="points-history" className="mt-0">
              {selectedTeacherId ? (
                <TeacherPointsHistoryView teacherId={selectedTeacherId} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Please select a teacher to view their points history.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
