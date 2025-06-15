'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

interface StudentDashboardUpdaterProps {
  studentId: string;
}

/**
 * Component that listens for reward events and updates the student dashboard
 * This component doesn't render anything visible, it just handles events
 */
export function StudentDashboardUpdater({ studentId }: StudentDashboardUpdaterProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [updateNeeded, setUpdateNeeded] = useState(false);

  // Get student points summary
  const { data: pointsSummary, refetch: refetchPoints } = api.points.getPointsSummary.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get student achievements
  const { data: achievements, refetch: refetchAchievements } = api.achievement.getStudentAchievements.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get student level
  const { data: levelData, refetch: refetchLevel } = api.level.getStudentLevel.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get student's class ID (assuming the student is in a class)
  const { data: studentClasses } = api.student.getStudentClasses.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get class leaderboard for the student's first class
  const classId = studentClasses?.[0]?.id;
  const { data: classLeaderboard, refetch: refetchLeaderboard } = api.leaderboard.getClassLeaderboard.useQuery(
    { classId: classId || '' },
    { enabled: !!classId }
  );

  // Find student's position in the leaderboard
  const studentPosition = classLeaderboard?.leaderboard.findIndex(
    (entry) => entry.studentId === studentId
  );

  // Create leaderboard data
  const leaderboard = studentPosition !== undefined && studentPosition >= 0
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

  // Listen for reward events
  useEffect(() => {
    const handleRewardEarned = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Reward earned event received:', customEvent.detail);

      // Set update flag
      setUpdateNeeded(true);

      // Show a toast notification
      if (customEvent.detail?.rewardResult?.points) {
        toast({
          title: 'Points Earned',
          description: `You earned ${customEvent.detail.rewardResult.points} points!`,
          variant: 'success',
        });
      }
    };

    const handleActivityCompleted = () => {
      // Set update flag
      setUpdateNeeded(true);
    };

    const handleDashboardUpdateNeeded = () => {
      // Set update flag
      setUpdateNeeded(true);
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
  }, [toast]);

  // Update dashboard data when needed
  useEffect(() => {
    if (updateNeeded) {
      // Refetch all data
      refetchPoints();
      refetchLevel();
      refetchAchievements();
      refetchLeaderboard();

      // Refresh the page to show updated data
      router.refresh();

      // Reset update flag
      setUpdateNeeded(false);
    }
  }, [updateNeeded, refetchPoints, refetchLevel, refetchAchievements, refetchLeaderboard, router]);

  // This component doesn't render anything visible
  return null;
}
