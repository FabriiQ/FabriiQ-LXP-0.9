"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeacherLeaderboardView } from "@/components/coordinator/TeacherLeaderboardView";
import { TeacherAchievementsView } from "@/components/coordinator/TeacherAchievementsView";
import { TeacherPointsHistoryView } from "@/components/coordinator/TeacherPointsHistoryView";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, History, BarChart, Award as Trophy } from "lucide-react";

/**
 * TeacherLeaderboardPage
 *
 * Main page for the teacher leaderboard in the coordinator portal.
 * Provides tabs for leaderboard, achievements, and points history.
 */
export default function TeacherLeaderboardPage() {
  // State
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
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

  // Fetch teachers based on selected campus
  const { data: teachers, isLoading: isLoadingTeachers } = api.teacher.getAllTeachers.useQuery(
    { campusId: selectedCampusId },
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

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Leaderboard</h1>
        <p className="text-muted-foreground">
          Track teacher performance, achievements, and engagement across your institution.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select filters to view specific leaderboard data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Teacher</label>
              {isLoadingTeachers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedTeacherId}
                  onValueChange={setSelectedTeacherId}
                  disabled={!selectedCampusId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teachers</SelectItem>
                    {teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="points-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Points History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-0">
          <TeacherLeaderboardView
            campusId={selectedCampusId || undefined}
            programId={selectedProgramId || undefined}
            courseId={selectedCourseId || undefined}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-0">
          {selectedTeacherId ? (
            <TeacherAchievementsView teacherId={selectedTeacherId} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Please select a teacher to view their achievements.
                </p>
              </CardContent>
            </Card>
          )}
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

        <TabsContent value="analytics" className="mt-0">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Teacher analytics will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
