/**
 * @deprecated This component has been replaced by StudentLeaderboardView in src/features/leaderboard/components/StudentLeaderboardView.tsx
 * This file is kept for reference only and will be removed in a future update.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Search,
  Filter,
  Medal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  position: number;
  previousPosition?: number;
  score: number;
  className?: string;
  subject?: string;
}

export interface StudentLeaderboardProps {
  studentId: string;
  studentPosition: number;
  studentPreviousPosition?: number;
  studentScore: number;
  leaderboard: LeaderboardEntry[];
  className?: string;
  isLoading?: boolean;
  error?: string;
}

/**
 * StudentLeaderboard component with mobile-first design
 *
 * Features:
 * - Displays student's current position
 * - Shows leaderboard with top students
 * - Tabs for different leaderboard scopes (class, grade, school)
 *
 * @example
 * ```tsx
 * <StudentLeaderboard
 *   studentId="student-1"
 *   studentPosition={5}
 *   studentPreviousPosition={7}
 *   studentScore={85}
 *   leaderboard={leaderboardData}
 * />
 * ```
 */
export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({
  studentId,
  studentPosition,
  studentPreviousPosition,
  studentScore,
  leaderboard,
  className,
  isLoading = false,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [scope, setScope] = useState('class');

  // Calculate position change
  const positionChange = studentPreviousPosition
    ? studentPreviousPosition - studentPosition
    : 0;

  // Get position trend icon
  const getPositionTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  // Get medal for top 3 positions
  const getMedal = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedSubject === 'all' || entry.subject === selectedSubject)
  );

  // Find student in leaderboard
  const studentEntry = leaderboard.find(entry => entry.id === studentId);

  return (
    <div className={className}>
      {/* Student's position card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Leaderboard Position</CardTitle>
          <CardDescription>
            {scope === 'class' ? 'Class Ranking' : scope === 'grade' ? 'Grade Ranking' : 'School Ranking'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">#{studentPosition}</span>
                  {positionChange !== 0 && (
                    <Badge variant={positionChange > 0 ? "success" : positionChange < 0 ? "destructive" : "outline"} className="flex items-center gap-1">
                      {positionChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(positionChange)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {positionChange > 0
                    ? `Improved by ${positionChange} ${positionChange === 1 ? 'position' : 'positions'}`
                    : positionChange < 0
                      ? `Dropped by ${Math.abs(positionChange)} ${Math.abs(positionChange) === 1 ? 'position' : 'positions'}`
                      : 'No change in position'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{studentScore}</div>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>See how you compare with your peers</CardDescription>
            </div>
            <Tabs value={scope} onValueChange={setScope} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="class">Class</TabsTrigger>
                <TabsTrigger value="grade">Grade</TabsTrigger>
                <TabsTrigger value="school">School</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leaderboard list */}
          <div className="space-y-2">
            {filteredLeaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center p-3 rounded-md ${entry.id === studentId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 text-center font-semibold">
                    {entry.position <= 3 ? (
                      getMedal(entry.position)
                    ) : (
                      <span>#{entry.position}</span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10">
                    {entry.avatar ? (
                      <AvatarImage src={entry.avatar} alt={entry.name} />
                    ) : (
                      <AvatarFallback>
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{entry.name}</div>
                    {entry.className && (
                      <div className="text-xs text-muted-foreground">{entry.className}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.previousPosition && (
                    <div className="flex items-center">
                      {getPositionTrendIcon(entry.position, entry.previousPosition)}
                      {entry.previousPosition !== entry.position && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {Math.abs(entry.previousPosition - entry.position)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="font-semibold text-right min-w-[50px]">{entry.score}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/student/leaderboard">
              View Full Leaderboard
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudentLeaderboard;
