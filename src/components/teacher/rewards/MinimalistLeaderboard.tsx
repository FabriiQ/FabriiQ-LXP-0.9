'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/atoms/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { api } from '@/trpc/react';
import { Trophy, Award, ChevronRight } from 'lucide-react';

interface MinimalistLeaderboardProps {
  classId: string;
  limit?: number;
}

/**
 * MinimalistLeaderboard
 *
 * A clean, focused leaderboard that motivates student engagement with psychological principles applied:
 * - Social Comparison Theory: Motivate students through positive competition
 * - Goal Gradient Effect: Show progress toward next rank
 * - Status Seeking: Tap into desire for status recognition
 * - Endowed Progress Effect: Show progress already made toward next level
 */
export function MinimalistLeaderboard({
  classId,
  limit = 8
}: MinimalistLeaderboardProps) {
  const [timeframe, setTimeframe] = useState<string>('weekly');

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading, error, refetch } = api.leaderboard.getClassLeaderboard.useQuery(
    {
      classId,
      period: timeframe === 'daily' ? 'DAILY' :
              timeframe === 'weekly' ? 'WEEKLY' :
              timeframe === 'monthly' ? 'MONTHLY' :
              timeframe === 'term' ? 'TERM' : 'ALL_TIME',
      limit,
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - longer cache time
      // Enable refetching when timeframe changes
      refetchOnMount: true,
    }
  );

  // Log any errors
  if (error) {
    console.error("Error fetching leaderboard:", error);
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Leaderboard</CardTitle>
            <CardDescription className="text-xs">
              Top performers in your class
            </CardDescription>
          </div>

          {/* Simplified time filter - Progressive Disclosure */}
          <Tabs defaultValue={timeframe} className="w-auto" onValueChange={(value) => {
            setTimeframe(value);
            // Force refetch when timeframe changes
            setTimeout(() => {
              refetch();
            }, 0);
          }}>
            <TabsList className="h-7 p-0">
              <TabsTrigger value="daily" className="text-xs px-2 h-7">Today</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2 h-7">Week</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2 h-7">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {leaderboard.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No leaderboard data available</p>
          </div>
        ) : (
          <>
            {/* Top 3 with visual distinction - Social Comparison Theory */}
            <div className="flex justify-center items-end py-4 px-2 bg-muted/30">
              {/* Second place */}
              {leaderboard.length > 1 && (
                <div key={`top-2-${leaderboard[1].studentId}`} className="flex flex-col items-center mx-2">
                  <Avatar className="h-14 w-14 border-2 border-[#C0C0C0]">
                    <AvatarImage src={leaderboard[1].profileImage || ''} alt={leaderboard[1].studentName || 'Student'} />
                    <AvatarFallback>{leaderboard[1].studentName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm">{leaderboard[1].studentName}</div>
                    <div className="text-xs font-bold">{leaderboard[1].points} pts</div>
                    <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1 bg-[#C0C0C0]/10">2nd</Badge>
                  </div>
                </div>
              )}

              {/* First place - Visual emphasis */}
              {leaderboard.length > 0 && (
                <div key={`top-1-${leaderboard[0].studentId}`} className="flex flex-col items-center mx-2 -mt-4">
                  <div className="mb-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <Avatar className="h-16 w-16 border-2 border-yellow-500">
                    <AvatarImage src={leaderboard[0].profileImage || ''} alt={leaderboard[0].studentName || 'Student'} />
                    <AvatarFallback>{leaderboard[0].studentName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm">{leaderboard[0].studentName}</div>
                    <div className="text-xs font-bold">{leaderboard[0].points} pts</div>
                    <Badge className="mt-1 text-[10px] h-4 px-1 bg-yellow-500/90 hover:bg-yellow-500/90">1st</Badge>
                  </div>
                </div>
              )}

              {/* Third place */}
              {leaderboard.length > 2 && (
                <div key={`top-3-${leaderboard[2].studentId}`} className="flex flex-col items-center mx-2">
                  <Avatar className="h-14 w-14 border-2 border-[#CD7F32]">
                    <AvatarImage src={leaderboard[2].profileImage || ''} alt={leaderboard[2].studentName || 'Student'} />
                    <AvatarFallback>{leaderboard[2].studentName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm">{leaderboard[2].studentName}</div>
                    <div className="text-xs font-bold">{leaderboard[2].points} pts</div>
                    <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1 bg-[#CD7F32]/10">3rd</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Remaining leaderboard - Minimalist design */}
            <div className="px-4 py-2">
              {leaderboard.slice(3, limit).map((entry, index) => (
                <div
                  key={`entry-${index}-${entry.studentId}`}
                  className="flex items-center py-2 border-b last:border-0"
                >
                  <div className="flex-shrink-0 w-6 text-center font-medium text-muted-foreground">
                    {index + 4}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.profileImage || ''} alt={entry.studentName || 'Student'} />
                    <AvatarFallback>{entry.studentName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 flex-grow">
                    <div className="text-sm">{entry.studentName}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Level indicator - Status Seeking */}
                    <Badge variant="outline" className="h-5 text-[10px]">
                      <Award className="h-3 w-3 mr-1" />
                      {entry.level || 1}
                    </Badge>
                    <div className="text-sm font-medium ml-2">{entry.points}</div>
                  </div>
                </div>
              ))}

              {/* View more link - Progressive Disclosure */}
              {leaderboardData?.totalCount && leaderboardData.totalCount > limit && (
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-8">
                  View All Rankings
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40 mt-1" />
          </div>
          <Skeleton className="h-7 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="py-4 px-2 bg-muted/30">
          <div className="flex justify-center items-end">
            <Skeleton className="h-14 w-14 mx-2" />
            <Skeleton className="h-16 w-16 mx-2" />
            <Skeleton className="h-14 w-14 mx-2" />
          </div>
        </div>
        <div className="px-4 py-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex items-center py-2 border-b">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24 ml-2" />
              <div className="flex-grow" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
