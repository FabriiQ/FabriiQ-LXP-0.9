'use client';

import React, { useEffect, useState } from 'react';
import { StudentDashboard, StudentDashboardProps } from './StudentDashboard';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

export function StudentDashboardWithRewards(props: StudentDashboardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState(props.metrics);
  const [leaderboard, setLeaderboard] = useState(props.leaderboard);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get student ID from session
  const studentId = session?.user?.id;

  // Get student points summary
  const { data: pointsSummary, refetch: refetchPoints } = api.points.getPointsSummary.useQuery(
    { studentId: studentId || '' },
    { enabled: !!studentId, refetchOnWindowFocus: true }
  );

  // Get student level
  const { data: levelData, refetch: refetchLevel } = api.level.getStudentLevel.useQuery(
    { studentId: studentId || '' },
    { enabled: !!studentId, refetchOnWindowFocus: true }
  );

  // Get student achievements
  const { data: achievementsData, refetch: refetchAchievements } = api.achievement.getStudentAchievements.useQuery(
    { studentId: studentId || '' },
    { enabled: !!studentId, refetchOnWindowFocus: true }
  );

  // Get student's class ID (assuming the student is in a class)
  const { data: studentClasses } = api.student.getStudentClasses.useQuery(
    { studentId: studentId || '' },
    { enabled: !!studentId }
  );

  // Get class leaderboard for the student's first class
  const classId = studentClasses?.[0]?.id;
  const { data: classLeaderboard, refetch: refetchLeaderboard } = api.leaderboard.getClassLeaderboard.useQuery(
    { classId: classId || '' },
    { enabled: !!classId, refetchOnWindowFocus: true }
  );

  // Find student's position in the leaderboard - memoize this calculation
  const leaderboardData = React.useMemo(() => {
    const studentPosition = classLeaderboard?.leaderboard.findIndex(
      (entry) => entry.studentId === studentId
    );

    return studentPosition !== undefined && studentPosition >= 0
      ? {
          position: studentPosition + 1,
          previousPosition: studentPosition + 2, // Simulate previous position
          score: classLeaderboard?.leaderboard[studentPosition]?.points || 0
        }
      : {
          position: 0,
          previousPosition: 0,
          score: 0
        };
  }, [classLeaderboard, studentId]);

  // Update metrics when data changes
  useEffect(() => {
    if (pointsSummary && props.metrics) {
      // Create a copy of the initial metrics from props
      const updatedMetrics = { ...props.metrics };

      // Update points if it exists
      if (props.metrics.points) {
        updatedMetrics.points = {
          value: pointsSummary.totalPoints,
          description: props.metrics.points.description
        };
      }

      // Update level if it exists and levelData is available
      if (props.metrics.level && levelData) {
        updatedMetrics.level = {
          value: levelData.level || props.metrics.level.value || 1,
          description: props.metrics.level.description
        };
      }

      // Update achievements if it exists and achievementsData is available
      if (props.metrics.achievements && achievementsData) {
        updatedMetrics.achievements = {
          value: achievementsData.length || props.metrics.achievements.value || 0,
          description: props.metrics.achievements.description
        };
      }

      // Only update state if the metrics have actually changed
      const hasPointsChanged = metrics?.points?.value !== updatedMetrics.points?.value;
      const hasLevelChanged = metrics?.level?.value !== updatedMetrics.level?.value;
      const hasAchievementsChanged = metrics?.achievements?.value !== updatedMetrics.achievements?.value;

      if (hasPointsChanged || hasLevelChanged || hasAchievementsChanged) {
        setMetrics(updatedMetrics);
      }
    }
  }, [pointsSummary, levelData, achievementsData, props.metrics, metrics]);

  // Update leaderboard when data changes
  useEffect(() => {
    if (leaderboardData && props.leaderboard) {
      // Only update if the data has actually changed to prevent infinite loops
      const newLeaderboard = {
        ...props.leaderboard,
        position: leaderboardData.position,
        previousPosition: leaderboardData.previousPosition,
        score: leaderboardData.score
      };

      // Check if the new leaderboard data is different from the current state
      if (
        leaderboard?.position !== newLeaderboard.position ||
        leaderboard?.previousPosition !== newLeaderboard.previousPosition ||
        leaderboard?.score !== newLeaderboard.score
      ) {
        setLeaderboard(newLeaderboard);
      }
    }
  }, [leaderboardData, props.leaderboard, leaderboard]);

  // Listen for reward events
  useEffect(() => {
    const handleRewardEarned = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Reward earned event received:', customEvent.detail);

      // Show a toast notification
      if (customEvent.detail?.rewardResult?.points) {
        toast({
          title: 'Points Earned',
          description: `You earned ${customEvent.detail.rewardResult.points} points!`,
          variant: 'success',
        });
      }

      // Refresh data
      refetchPoints();
      refetchLevel();
      refetchAchievements();
      refetchLeaderboard();
      setRefreshKey(prev => prev + 1);
    };

    const handleActivityCompleted = () => {
      // Refresh data
      refetchPoints();
      refetchLevel();
      refetchAchievements();
      refetchLeaderboard();
      setRefreshKey(prev => prev + 1);
    };

    const handleDashboardUpdateNeeded = () => {
      // Refresh data
      refetchPoints();
      refetchLevel();
      refetchAchievements();
      refetchLeaderboard();
      setRefreshKey(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('reward-earned', handleRewardEarned);
    window.addEventListener('activity-completed', handleActivityCompleted);
    window.addEventListener('dashboard-update-needed', handleDashboardUpdateNeeded);

    // Clean up event listeners
    return () => {
      window.removeEventListener('reward-earned', handleRewardEarned);
      window.removeEventListener('activity-completed', handleActivityCompleted);
      window.removeEventListener('dashboard-update-needed', handleDashboardUpdateNeeded);
    };
  }, [toast, refetchPoints, refetchLevel, refetchAchievements, refetchLeaderboard]);

  // Handle refresh
  const handleRefresh = () => {
    refetchPoints();
    refetchLevel();
    refetchAchievements();
    refetchLeaderboard();
    setRefreshKey(prev => prev + 1);

    if (props.onRefresh) {
      props.onRefresh();
    }
  };

  return (
    <StudentDashboard
      {...props}
      metrics={metrics}
      leaderboard={leaderboard}
      onRefresh={handleRefresh}
      key={refreshKey}
    />
  );
}
