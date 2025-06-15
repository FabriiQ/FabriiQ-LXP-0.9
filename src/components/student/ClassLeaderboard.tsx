/**
 * @deprecated This component has been replaced by StudentLeaderboardView in src/features/leaderboard/components/StudentLeaderboardView.tsx
 * This file is kept for reference only and will be removed in a future update.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualizedLeaderboardTable } from '@/components/leaderboard/VirtualizedLeaderboardTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/trpc/react';
// Import the correct LeaderboardPeriod enum from optimized-queries
import { LeaderboardPeriod } from '@/server/api/services/optimized-queries';
import { Award, TrendingUp, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { RefreshCw } from '@/components/shared/entities/students/icons';
import { Trophy, Medal } from '@/components/ui/icons/trophy-medal';
import { cn } from '@/lib/utils';
import { generateConfetti } from '@/lib/utils/confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndexedDBStore } from '@/lib/hooks/use-indexed-db-store';

interface ClassLeaderboardProps {
  classId: string;
  currentStudentId?: string;
}

/**
 * ClassLeaderboard component displays a class leaderboard with UX psychology principles
 * including Loss Aversion, Goal Gradient Effect, social proof, Fresh Start Effect,
 * Recognition Over Recall, Singularity Effect, Endowment Effect, Commitment & Consistency,
 * and Peak-End Rule, with a mobile-first clean modern interface.
 */
export function ClassLeaderboard({ classId, currentStudentId }: ClassLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'improved'>('leaderboard');
  const [currentPeriod, setCurrentPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.WEEKLY);
  const confettiRef = useRef<HTMLDivElement>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [showCommitmentPledge, setShowCommitmentPledge] = useState(false);
  const [pledgeCompleted, setPledgeCompleted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Setup IndexedDB for offline caching
  const {
    getItem,
    setItem,
    isLoading: isLoadingCache
  } = useIndexedDBStore('leaderboard', 'leaderboard-data');

  // Fetch leaderboard data with offline support
  const {
    data: leaderboardData,
    isLoading: isLoadingApi,
    error,
    refetch
  } = api.leaderboard.getClassLeaderboard.useQuery(
    {
      classId,
      period: currentPeriod as LeaderboardPeriod | undefined,
      limit: 100
    },
    {
      refetchOnWindowFocus: false,
      // Use stale data while revalidating to improve perceived performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Don't refetch on mount if we have data
      refetchOnMount: false,
      // Enable this for offline support
      enabled: navigator.onLine,
      // Cache the data in IndexedDB when it's fetched
      onSuccess: (data) => {
        if (data) {
          const cacheKey = `${classId}-${currentPeriod}`;
          setItem(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }
      }
    }
  );

  // Combine loading states
  const isLoading = isLoadingApi || isLoadingCache;

  // State to hold cached data
  const [cachedLeaderboardData, setCachedLeaderboardData] = useState<typeof leaderboardData | null>(null);

  // Load data from IndexedDB if online fetch fails or we're offline
  useEffect(() => {
    const loadFromCache = async () => {
      if (!navigator.onLine || (error && !leaderboardData)) {
        const cacheKey = `${classId}-${currentPeriod}`;
        const cachedData = await getItem(cacheKey);

        if (cachedData && cachedData.data) {
          // Check if cache is older than 24 hours
          const isCacheStale = Date.now() - cachedData.timestamp > 24 * 60 * 60 * 1000;

          if (!isCacheStale) {
            // Use cached data
            console.log('Using cached leaderboard data');
            setCachedLeaderboardData(cachedData.data);
          } else {
            console.log('Cached data is stale');
            setCachedLeaderboardData(null);
          }
        } else {
          console.log('No cached data found');
          setCachedLeaderboardData(null);
        }
      } else if (leaderboardData) {
        // Reset cached data when online data is available
        console.log('Using online data');
        setCachedLeaderboardData(null);
      }
    };

    loadFromCache();
  }, [classId, currentPeriod, error, getItem, leaderboardData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (navigator.onLine) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
  };

  // Use online data or fall back to cached data
  const effectiveData = leaderboardData || cachedLeaderboardData;

  // Get class metadata
  const className = effectiveData?.metadata?.className || 'Class';
  const totalStudents = effectiveData?.totalStudents || 0;

  // Find current student in leaderboard and add type safety
  const currentStudentEntry = effectiveData?.leaderboard.find(
    entry => entry.studentId === currentStudentId
  ) || undefined;

  // Get top performers (top 3)
  const topPerformers = effectiveData?.leaderboard.slice(0, 3) || [];

  // Get most improved students - handle case where improvement might not exist
  const mostImproved = effectiveData?.leaderboard
    .filter(entry => {
      // Check if the entry has an improvement property and it's positive
      const hasImprovement = 'improvement' in entry && typeof entry.improvement === 'number';
      return hasImprovement && (entry.improvement as number) > 0;
    })
    .sort((a, b) => {
      const improvementA = 'improvement' in a ? (a.improvement as number) || 0 : 0;
      const improvementB = 'improvement' in b ? (b.improvement as number) || 0 : 0;
      return improvementB - improvementA;
    })
    .slice(0, 5) || [];

  // Calculate next position data for current student
  const nextPositionData = currentStudentEntry &&
    typeof currentStudentEntry.rank === 'number' &&
    currentStudentEntry.rank > 1
      ? effectiveData?.leaderboard.find(entry => entry.rank === (currentStudentEntry.rank - 1))
      : undefined;

  // Calculate points needed to reach next position
  const pointsToNextPosition = nextPositionData && currentStudentEntry &&
    'score' in nextPositionData && 'score' in currentStudentEntry
    ? (nextPositionData.score as number) - (currentStudentEntry.score as number)
    : 0;

  // Show confetti for personal best (only once)
  useEffect(() => {
    if (
      !hasShownConfetti &&
      !isLoading &&
      currentStudentEntry &&
      'previousRank' in currentStudentEntry &&
      typeof currentStudentEntry.previousRank === 'number' &&
      typeof currentStudentEntry.rank === 'number' &&
      currentStudentEntry.rank < currentStudentEntry.previousRank &&
      confettiRef.current
    ) {
      generateConfetti(confettiRef.current, {
        count: 50,
        reducedMotion: localStorage.getItem('reducedMotion') === 'true'
      });
      setHasShownConfetti(true);
    }
  }, [currentStudentEntry, hasShownConfetti, isLoading]);

  // Handle period change
  const handlePeriodChange = (period: LeaderboardPeriod) => {
    setCurrentPeriod(period);
  };

  // Handle commitment pledge
  const handleCommitmentPledge = () => {
    setPledgeCompleted(true);
    setTimeout(() => {
      setShowCommitmentPledge(false);
    }, 2000);
  };

  // Format rank change indicator
  const getRankChangeIndicator = (currentRank?: number, previousRank?: number) => {
    if (!currentRank || !previousRank) return null;

    if (currentRank < previousRank) {
      return (
        <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
          <ChevronUp className="h-3 w-3" />
          {previousRank - currentRank}
        </Badge>
      );
    } else if (currentRank > previousRank) {
      return (
        <Badge className="flex items-center gap-1 bg-red-100 text-red-800">
          <ChevronDown className="h-3 w-3" />
          {currentRank - previousRank}
        </Badge>
      );
    } else {
      return (
        <Badge className="flex items-center gap-1 border border-gray-200 text-gray-800">
          <span className="h-3 w-3">-</span>
        </Badge>
      );
    }
  };

  // Get medal for rank
  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return null;
  };

  if (error) {
    return (
      <div className="mb-6 border border-destructive/50 text-destructive rounded-lg p-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load leaderboard data. Please try again later.
        </AlertDescription>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh button and offline indicator */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || !navigator.onLine}
          className="flex items-center gap-1"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        {!navigator.onLine && (
          <div className="ml-2 text-sm text-amber-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Offline mode
          </div>
        )}
      </div>

      {/* Confetti container for personal best */}
      <div
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
      />

      {/* Current student position highlight (Self-relevance effect) */}
      {currentStudentEntry && (
        <Card className="border-primary-green border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Your Position</span>
                {getRankChangeIndicator(
                  typeof currentStudentEntry.rank === 'number' ? currentStudentEntry.rank : undefined,
                  'previousRank' in currentStudentEntry ? Number(currentStudentEntry.previousRank) : undefined
                )}
              </div>
              <span className="text-2xl font-bold flex items-center">
                {getMedal(typeof currentStudentEntry.rank === 'number' ? currentStudentEntry.rank : 0)}
                <span className="ml-2">#{typeof currentStudentEntry.rank === 'number' ? currentStudentEntry.rank : 'N/A'}</span>
              </span>
            </CardTitle>
            <CardDescription>
              Out of {totalStudents} students in {className}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Score and progress */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Your Score</p>
                  <p className="text-2xl font-bold">
                    {currentStudentEntry && 'score' in currentStudentEntry && typeof currentStudentEntry.score === 'number' ?
                      currentStudentEntry.score.toFixed(1) + '%' :
                      'N/A'}
                  </p>
                </div>
                {currentStudentEntry && 'level' in currentStudentEntry && typeof currentStudentEntry.level === 'number' && (
                  <div className="text-right">
                    <p className="text-sm font-medium">Level</p>
                    <p className="text-2xl font-bold">{currentStudentEntry.level}</p>
                  </div>
                )}
              </div>

              {/* Progress to next position (Goal Gradient Effect) */}
              {nextPositionData &&
               'rank' in nextPositionData &&
               typeof nextPositionData.rank === 'number' &&
               typeof pointsToNextPosition === 'number' &&
               pointsToNextPosition > 0 &&
               currentStudentEntry &&
               'score' in currentStudentEntry &&
               typeof currentStudentEntry.score === 'number' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to #{nextPositionData.rank}</span>
                    <span className="font-medium">
                      {Math.max(0, Math.min(100, 100 - (pointsToNextPosition / (currentStudentEntry.score * 0.1)) * 100)).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, 100 - (pointsToNextPosition / (currentStudentEntry.score * 0.1)) * 100))}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    You need <span className="font-medium text-primary-green">
                      {typeof pointsToNextPosition === 'number' ? pointsToNextPosition.toFixed(1) : '0'}%
                    </span> more to overtake {nextPositionData.studentName}
                  </p>
                </div>
              )}

              {/* What would be lost by dropping (Loss Aversion) */}
              {currentStudentEntry &&
               'rank' in currentStudentEntry &&
               typeof currentStudentEntry.rank === 'number' &&
               currentStudentEntry.rank <= 10 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {typeof currentStudentEntry.rank === 'number' && currentStudentEntry.rank <= 3
                      ? `Don't lose your top ${currentStudentEntry.rank} position and special badge!`
                      : `Stay in the top 10 to maintain your special recognition!`}
                  </p>
                </div>
              )}

              {/* Commitment pledge button (Commitment & Consistency) */}
              {!showCommitmentPledge && !pledgeCompleted && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCommitmentPledge(true)}
                >
                  Make a commitment pledge
                </Button>
              )}

              {/* Commitment pledge form */}
              <AnimatePresence>
                {showCommitmentPledge && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-primary-green/10 p-3 rounded-md border border-primary-green/30"
                  >
                    <p className="text-sm font-medium mb-2">I pledge to:</p>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center">
                        <input type="checkbox" id="pledge1" className="mr-2" />
                        <label htmlFor="pledge1" className="text-sm">Complete all my pending activities this week</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="pledge2" className="mr-2" />
                        <label htmlFor="pledge2" className="text-sm">Improve my score by at least 5%</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="pledge3" className="mr-2" />
                        <label htmlFor="pledge3" className="text-sm">Help at least one classmate with their studies</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowCommitmentPledge(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-primary-green hover:bg-primary-green/90"
                        onClick={handleCommitmentPledge}
                      >
                        Commit
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pledge completed confirmation */}
              <AnimatePresence>
                {pledgeCompleted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-900"
                  >
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Commitment pledged! You're on your way to success.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top performers (Recognition Over Recall) */}
      {topPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((student, index) => (
            <Card
              key={student.studentId}
              className={cn(
                index === 0 ? "border-yellow-400 dark:border-yellow-600" : "",
                index === 1 ? "border-gray-300 dark:border-gray-500" : "",
                index === 2 ? "border-amber-600 dark:border-amber-700" : "",
                index < 3 ? "border-2" : ""
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  {index === 0 ? (
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                      Top Performer
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {index === 1 ? (
                        <Medal className="h-4 w-4 text-gray-400 mr-2" />
                      ) : (
                        <Award className="h-4 w-4 text-amber-700 mr-2" />
                      )}
                      Rank #{index + 1}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.studentName || 'Student'}`}
                      alt={student.studentName || 'Student'}
                    />
                    <AvatarFallback>
                      {student.studentName ? student.studentName.split(" ").map(n => n[0]).join("").toUpperCase() : 'ST'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.studentName || 'Student'}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {('score' in student && typeof student.score === 'number') ? student.score.toFixed(1) + '%' : 'N/A'}
                      {('level' in student && typeof student.level === 'number') ? ` • Level ${student.level}` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs for different views (Fresh Start Effect) */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leaderboard' | 'improved')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="improved">Most Improved</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <VirtualizedLeaderboardTable
            leaderboard={effectiveData?.leaderboard.map(entry => {
              // Create a safe entry with proper type checking
              return {
                rank: typeof entry.rank === 'number' ? entry.rank : 0,
                studentId: entry.studentId || '',
                studentName: entry.studentName || 'Student',
                // Handle optional properties that might not exist in the API response
                enrollmentNumber: 'enrollmentNumber' in entry ? String(entry.enrollmentNumber) : '',
                score: 'score' in entry ? Number(entry.score) : 0,
                totalPoints: 'totalPoints' in entry ? Number(entry.totalPoints) : 0,
                completionRate: 'completionRate' in entry ? Number(entry.completionRate) : 0,
                level: 'level' in entry && typeof entry.level === 'number' ? entry.level : undefined,
                achievements: 'achievements' in entry ? entry.achievements : undefined,
                rewardPoints: 'rewardPoints' in entry ? Number(entry.rewardPoints) : 0,
                previousRank: 'previousRank' in entry ? Number(entry.previousRank) : undefined
              };
            }) || []}
            currentStudentId={currentStudentId}
            title={`${className} Leaderboard`}
            description="Student rankings based on performance"
            totalStudents={totalStudents}
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="improved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Improved Students</CardTitle>
              <CardDescription>Students who have shown the greatest improvement</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading data...</p>
                </div>
              ) : mostImproved.length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No improvement data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Improvement data will appear when students improve their rankings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mostImproved.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.studentName || 'Student'}`}
                            alt={student.studentName || 'Student'}
                          />
                          <AvatarFallback>
                            {student.studentName ? student.studentName.split(" ").map(n => n[0]).join("").toUpperCase() : 'ST'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.studentName || 'Student'}</p>
                          <p className="text-sm text-muted-foreground">
                            Current rank: #{typeof student.rank === 'number' ? student.rank : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {('improvement' in student && typeof student.improvement === 'number') ?
                          `${student.improvement.toFixed(1)}%` :
                          'N/A'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Almost there indicators (Endowment Effect) */}
      {currentStudentEntry &&
       nextPositionData &&
       typeof pointsToNextPosition === 'number' &&
       pointsToNextPosition > 0 &&
       pointsToNextPosition < 5 && (
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 rounded-lg p-4">
          <div className="flex">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
            <div>
              <AlertTitle className="text-blue-800 dark:text-blue-300">Almost there!</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                You're just {typeof pointsToNextPosition === 'number' ? pointsToNextPosition.toFixed(1) : '0'}% away from overtaking {nextPositionData.studentName} and reaching rank #{typeof nextPositionData.rank === 'number' ? nextPositionData.rank : 'N/A'}!
              </AlertDescription>
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame (Recognition) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            Hall of Fame
          </CardTitle>
          <CardDescription>Historical top performers in this class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would ideally be populated with real historical data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-500 h-8 w-8 rounded-full flex items-center justify-center text-white">
                  1
                </Badge>
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Term 1 Champion</p>
                </div>
              </div>
              <p className="font-medium">98.5%</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-gray-400 h-8 w-8 rounded-full flex items-center justify-center text-white">
                  2
                </Badge>
                <div>
                  <p className="font-medium">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">Most Consistent</p>
                </div>
              </div>
              <p className="font-medium">97.2%</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-amber-700 h-8 w-8 rounded-full flex items-center justify-center text-white">
                  3
                </Badge>
                <div>
                  <p className="font-medium">Aisha Patel</p>
                  <p className="text-sm text-muted-foreground">Most Improved</p>
                </div>
              </div>
              <p className="font-medium">96.8%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
