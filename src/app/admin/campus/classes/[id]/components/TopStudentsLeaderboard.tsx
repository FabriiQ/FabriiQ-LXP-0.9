"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/utils/api";
import { LeaderboardPeriod } from "@/server/api/types/leaderboard";

interface TopStudentsLeaderboardProps {
  classId: string;
  className: string;
}

export function TopStudentsLeaderboard({ classId, className }: TopStudentsLeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);

  // Fetch top 5 students for this class
  const { data, isLoading, error } = api.leaderboard.getClassLeaderboard.useQuery(
    {
      classId,
      period,
      limit: 5
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Function to get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="flex items-center justify-center h-5 w-5 font-semibold">{rank}</span>;
    }
  };

  // Function to get grade letter
  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  // Function to get grade color
  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  // Get most improved students
  const getMostImprovedStudents = (data: any) => {
    if (!data?.leaderboard || data.leaderboard.length === 0) return [];

    return data.leaderboard
      .filter((entry: any) => entry.improvement !== undefined && entry.previousScore !== undefined)
      .sort((a: any, b: any) => (b.improvement || 0) - (a.improvement || 0))
      .slice(0, 2);
  };

  // Get most improved students
  const mostImprovedStudents = data ? getMostImprovedStudents(data) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>
            Highest performing students in this class
          </CardDescription>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}/leaderboard`}>
            <span className="mr-2">View Full Leaderboard</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500">
            <p>Error loading leaderboard data.</p>
          </div>
        ) : data?.leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No student performance data available yet.</p>
            <p className="text-sm mt-2">Data will appear once students complete graded activities.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Top Performers</h3>
              <div className="space-y-3">
                {data?.leaderboard.map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {student.studentName.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-xs text-muted-foreground">{student.enrollmentNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-bold ${getGradeColor(student.score)}`}>
                        {getGradeLetter(student.score)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {mostImprovedStudents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Most Improved</h3>
                <div className="space-y-3">
                  {mostImprovedStudents.map((student: any) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {student.studentName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.previousScore?.toFixed(1)}% → {student.score.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-green-600">
                          +{student.improvement?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link href={`/admin/campus/classes/${classId}/leaderboard`}>
                  View Full Leaderboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
