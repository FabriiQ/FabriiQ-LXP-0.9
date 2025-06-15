'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, TrendingUp, Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';

interface Student {
  studentId: string;
  userId: string;
  name: string;
  image: string | null;
}

interface ClassLeaderboardClientProps {
  classId: string;
  className: string;
  students: Student[];
}

export function ClassLeaderboardClient({ classId, className, students }: ClassLeaderboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = api.analytics.getClassLeaderboard.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Filter students based on search query
  const filteredLeaderboard = leaderboardData?.leaderboard.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get top performers
  const topPerformers = leaderboardData?.leaderboard.slice(0, 3) || [];

  // Get most improved students (mock data for now)
  const mostImproved = [
    { id: '1', name: 'Student 1', improvement: 15 },
    { id: '2', name: 'Student 2', improvement: 12 },
    { id: '3', name: 'Student 3', improvement: 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{className} Leaderboard</h1>
          <p className="text-muted-foreground">Student rankings based on assessment performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-auto"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Top Performers */}
      {!isLoading && topPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((student, index) => (
            <Card key={student.studentId} className={index === 0 ? 'border-yellow-500 dark:border-yellow-500 border-2' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {index === 0 ? (
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                      Top Performer
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Medal className="h-4 w-4 text-blue-500 mr-2" />
                      Rank #{index + 1}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-2">
                  {student.image ? (
                    <AvatarImage src={student.image} alt={student.name} />
                  ) : (
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-medium">{student.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">Score: {student.averageScore}%</p>
                <Badge variant={index === 0 ? 'default' : 'outline'}>
                  {index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="improved">Most Improved</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Ranking</CardTitle>
              <CardDescription>Students ranked by assessment performance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeaderboard.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted font-semibold">
                          {student.rank}
                        </div>
                        <Avatar className="h-10 w-10">
                          {student.image ? (
                            <AvatarImage src={student.image} alt={student.name} />
                          ) : (
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.assessmentCount} assessments completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{student.averageScore}%</p>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improved" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Improved</CardTitle>
              <CardDescription>Students with the greatest improvement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostImproved.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted font-semibold">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Improved by {student.improvement}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-green-500">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+{student.improvement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
