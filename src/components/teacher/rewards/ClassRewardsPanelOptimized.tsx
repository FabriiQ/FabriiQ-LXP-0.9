'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  Search,
  TrendingUp,
  Users,
  SlidersHorizontal,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { AwardPointsDialog, Student } from './AwardPointsDialog';
import { StudentPointsData } from './StudentPointsCard';
import { StudentPointsHistory, PointsHistoryEntry } from './StudentPointsHistory';
import { MinimalistLeaderboard } from './MinimalistLeaderboard';
import { VirtualizedStudentPointsGrid } from './VirtualizedStudentPointsGrid';
import { useRewardsOffline } from '@/features/teacher/offline/hooks/use-rewards-offline';
import { LeaderboardPeriod } from '@/server/api/services/optimized-queries';
import { isOnline } from '@/utils/offline-storage';

interface ClassRewardsPanelOptimizedProps {
  classId: string;
  className: string;
}

export function ClassRewardsPanelOptimized({ classId, className }: ClassRewardsPanelOptimizedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const { toast } = useToast();

  // Offline support
  const {
    isOffline,
    getClassRewards,
    saveClassRewards,
    getPointsHistory,
    savePointsHistory,
    sync
  } = useRewardsOffline({
    enabled: true,
    autoSync: true,
    onStatusChange: (offline) => {
      if (offline) {
        toast({
          title: "You're offline",
          description: "You can still view rewards data. Changes will sync when you're back online.",
          variant: "warning",
        });
      } else {
        toast({
          title: "You're back online",
          description: "Syncing your data...",
          variant: "default",
        });
      }
    }
  });

  // Fetch consolidated class rewards data
  const {
    data: rewardsData,
    isLoading: isLoadingRewards,
    refetch: refetchRewards
  } = api.rewards.getClassRewardsData.useQuery(
    {
      classId,
      includeStudents: true,
      includeLeaderboard: true,
      leaderboardPeriod: LeaderboardPeriod.WEEKLY,
      leaderboardLimit: 8,
      page,
      pageSize,
      searchTerm
    },
    {
      enabled: isOnline(), // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes - longer cache time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveClassRewards(classId, data).catch(console.error);
        }
      }
    }
  );

  // Fetch points history for a specific student
  const { data: pointsHistory, isLoading: isLoadingHistory, refetch: refetchHistory } =
    api.points.getPointsHistory.useQuery(
      {
        studentId: selectedStudentId || '',
        classId,
        limit: 50
      },
      {
        enabled: !!selectedStudentId && isOnline(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
          if (data && selectedStudentId) {
            // Cache history data for offline use
            savePointsHistory(
              `${selectedStudentId}-${classId}`,
              selectedStudentId,
              classId,
              data
            ).catch(console.error);
          }
        },
        onError: (error) => {
          console.error("Error fetching points history:", error);
          toast({
            title: "Error fetching points history",
            description: error.message,
          });
        }
      }
    );

  // Load offline data if we're offline
  const [offlineData, setOfflineData] = useState<any | null>(null);
  const [offlinePointsHistory, setOfflinePointsHistory] = useState<any | null>(null);

  useEffect(() => {
    if (isOffline) {
      getClassRewards(classId)
        .then(data => {
          if (data) setOfflineData(data);
        })
        .catch(console.error);
    } else {
      setOfflineData(null);
    }
  }, [isOffline, classId, getClassRewards]);

  useEffect(() => {
    if (isOffline && selectedStudentId) {
      getPointsHistory(selectedStudentId, classId)
        .then(data => {
          if (data) setOfflinePointsHistory(data);
        })
        .catch(console.error);
    } else {
      setOfflinePointsHistory(null);
    }
  }, [isOffline, selectedStudentId, classId, getPointsHistory]);

  // Use either online or offline data
  const effectiveRewardsData = isOffline ? offlineData : rewardsData;
  const effectivePointsHistory = isOffline ? offlinePointsHistory : pointsHistory;

  // Calculate weekly points from student data if not available in stats
  useEffect(() => {
    if (effectiveRewardsData &&
        effectiveRewardsData.stats &&
        effectiveRewardsData.students &&
        effectiveRewardsData.students.items &&
        effectiveRewardsData.stats.weeklyPoints === 0) {

      // Calculate weekly points from student data
      const calculatedWeeklyPoints = effectiveRewardsData.students.items.reduce(
        (sum, student: any) => sum + (student.weeklyPoints || 0),
        0
      );

      // Update stats if we calculated non-zero weekly points
      if (calculatedWeeklyPoints > 0 && effectiveRewardsData.stats.weeklyPoints === 0) {
        if (isOffline && offlineData) {
          const updatedOfflineData = {
            ...offlineData,
            stats: {
              ...offlineData.stats,
              weeklyPoints: calculatedWeeklyPoints
            }
          };
          setOfflineData(updatedOfflineData);
        }
      }
    }
  }, [effectiveRewardsData, isOffline, offlineData, setOfflineData]);

  // Initialize default values if data is not available
  if (!effectiveRewardsData) {
    console.log('No rewards data available');
    // Create a default data structure to prevent errors
    const defaultRewardsData = {
      class: {
        id: classId,
        name: className,
        code: '',
        status: 'ACTIVE'
      },
      students: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: pageSize,
        totalPages: 1
      },
      stats: {
        totalPoints: 0,
        weeklyPoints: 0,
        teacherBonusPoints: 0
      },
      leaderboard: []
    };

    // Use the default data if no data is available
    if (isOffline) {
      setOfflineData(defaultRewardsData);
    }
  }

  // Prepare students data
  const students: Student[] = effectiveRewardsData?.students?.items
    ? effectiveRewardsData.students.items.map((student: any) => ({
        id: student.id,
        name: student.name,
        profileImage: student.profileImage
      }))
    : [];

  // Prepare student points data
  const studentPointsData: StudentPointsData[] = effectiveRewardsData?.students?.items
    ? effectiveRewardsData.students.items.map((student: any) => ({
        id: student.id,
        name: student.name,
        profileImage: student.profileImage,
        totalPoints: student.totalPoints || 0,
        weeklyPoints: student.weeklyPoints || 0,
        monthlyPoints: student.monthlyPoints || 0,
        level: student.level || 1,
        lastPointsAwarded: student.lastAward
          ? {
              amount: student.lastAward.amount,
              source: student.lastAward.source,
              description: student.lastAward.description || '',
              timestamp: new Date(student.lastAward.timestamp)
            }
          : undefined
      }))
    : [];

  // Filter students based on search term
  const filteredStudents = studentPointsData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students by total points (highest first)
  const sortedStudents = [...filteredStudents].sort((a, b) =>
    b.totalPoints - a.totalPoints
  );

  // Handle viewing points history for a student
  const handleViewHistory = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowPointsHistory(true);
  };

  // Handle points awarded (refresh data)
  const handlePointsAwarded = () => {
    refetchRewards();

    // Refresh points history if available
    if (selectedStudentId) {
      refetchHistory();
    }

    toast({
      title: 'Points awarded',
      description: 'The points have been successfully awarded to the student(s).',
      variant: 'success',
    });
  };

  // Get selected student data
  const selectedStudent = selectedStudentId
    ? studentPointsData.find(s => s.id === selectedStudentId)
    : null;

  // Format points history data
  const formattedPointsHistory: PointsHistoryEntry[] = effectivePointsHistory
    ? effectivePointsHistory.map((entry: any) => ({
        id: entry.id,
        amount: entry.amount,
        source: entry.source,
        description: entry.description || '',
        timestamp: entry.createdAt,
        classId: entry.classId || undefined,
        className: entry.classId ? 'Class' : undefined
      }))
    : [];

  // Calculate total points from history if available
  const calculatedTotalPoints = formattedPointsHistory && formattedPointsHistory.length > 0
    ? formattedPointsHistory.reduce((sum, entry) => sum + entry.amount, 0)
    : (selectedStudent?.totalPoints || 0);

  // Handle load more students
  const handleLoadMore = () => {
    if (effectiveRewardsData?.students?.page < effectiveRewardsData?.students?.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  // Check if we have more students to load
  const hasMoreStudents = effectiveRewardsData?.students
    ? page < effectiveRewardsData.students.totalPages
    : false;

  return (
    <div className="space-y-4 md:space-y-6 pb-16 md:pb-0">
      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center">
          <WifiOff className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-yellow-800">You're offline</p>
            <p className="text-xs text-yellow-600">Viewing cached rewards data</p>
          </div>
        </div>
      )}

      {/* Header with class info and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{className} Rewards</h2>
          <p className="text-muted-foreground">
            Manage student rewards and points for this class
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AwardPointsDialog
            students={students}
            classId={classId}
            onPointsAwarded={handlePointsAwarded}
            trigger={
              <Button className="gap-2" disabled={isOffline}>
                <Award className="h-4 w-4" />
                Award Points
              </Button>
            }
          />

          {isOffline && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => sync()}
              title="Sync when back online"
            >
              <Wifi className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Class points summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Class Points</CardTitle>
            <CardDescription>All points earned by students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">
                {effectiveRewardsData?.stats?.totalPoints || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Points</CardTitle>
            <CardDescription>Points earned this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {effectiveRewardsData?.stats?.weeklyPoints || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teacher Bonus Points</CardTitle>
            <CardDescription>Points you've awarded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">
                {effectiveRewardsData?.stats?.teacherBonusPoints || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimalist Leaderboard */}
      <div className="mt-6">
        <MinimalistLeaderboard classId={classId} limit={5} />
      </div>

      {/* Student points section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-lg md:text-xl">Student Points</CardTitle>
          <CardDescription>
            View and manage points for individual students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoadingRewards && !effectiveRewardsData ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-64 bg-gray-200 rounded"></div>
                <div className="h-12 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : sortedStudents.length > 0 ? (
            <VirtualizedStudentPointsGrid
              students={sortedStudents}
              onViewHistory={handleViewHistory}
              onLoadMore={handleLoadMore}
              hasMore={hasMoreStudents}
              isLoading={isLoadingRewards && page > 1}
            />
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Add students to this class to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points history dialog */}
      {selectedStudent && (
        <StudentPointsHistory
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          studentImage={selectedStudent.profileImage}
          totalPoints={calculatedTotalPoints}
          pointsHistory={formattedPointsHistory}
          isOpen={showPointsHistory}
          onOpenChange={setShowPointsHistory}
        />
      )}
    </div>
  );
}
