/**
 * useLeaderboardGoals Hook
 *
 * This hook integrates leaderboard milestones with the existing learning goals system,
 * making them trackable and persistent.
 */

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  LeaderboardEntityType,
  TimeGranularity,
  StudentPositionInfo
} from '../types/standard-leaderboard';
import { Milestone } from '../components/LeaderboardMilestones';
// Import custom icon implementations
import { Trophy } from '@/components/ui/icons/trophy-medal';
import { Medal } from '@/components/ui/icons/trophy-medal';
import { Star } from '@/components/ui/icons/reward-icons';
import { Target } from '@/components/ui/icons/reward-icons';
import { Crown } from '@/components/ui/icons/reward-icons';
import { Zap } from '@/components/ui/icons/reward-icons';
import { Award } from '@/components/ui/icons/lucide-icons';
import { TrendingUp } from 'lucide-react';
// Import Flag from custom icons
import { Flag } from '@/components/ui/icons/reward-icons';

// Assuming we have a tRPC API for learning goals
import { api } from '@/utils/api';

// Define a common icon type to avoid type mismatches
type IconType = React.ReactNode;

// Predefined milestone icons
export const MilestoneIcons: Record<string, IconType> = {
  trophy: React.createElement(Trophy, { className: "h-4 w-4 text-yellow-500", size: 16 }),
  star: React.createElement(Star, { className: "h-4 w-4 text-yellow-500" }),
  award: React.createElement(Award, { className: "h-4 w-4 text-blue-500" }),
  flag: React.createElement(Flag, { className: "h-4 w-4 text-green-500" }),
  target: React.createElement(Target, { className: "h-4 w-4 text-red-500" }),
  trending: React.createElement(TrendingUp, { className: "h-4 w-4 text-purple-500" }),
  crown: React.createElement(Crown, { className: "h-4 w-4 text-amber-500" }),
  medal: React.createElement(Medal, { className: "h-4 w-4 text-cyan-500", size: 16 }),
  zap: React.createElement(Zap, { className: "h-4 w-4 text-orange-500" })
};

interface UseLeaderboardGoalsOptions {
  entityType: LeaderboardEntityType | string;
  entityId: string;
  studentId: string;
  currentStudentPosition?: StudentPositionInfo;
}

/**
 * Hook for integrating leaderboard milestones with learning goals
 */
export function useLeaderboardGoals({
  entityType,
  entityId,
  studentId,
  currentStudentPosition
}: UseLeaderboardGoalsOptions) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // tRPC mutations
  const createLearningGoalMutation = api.learningGoal.createLearningGoal.useMutation();
  const updateLearningGoalMutation = api.learningGoal.updateLearningGoal.useMutation();

  // Get learning goals from API
  const {
    data: learningGoals,
    isLoading: isLoadingGoals,
    error: learningGoalsError,
    refetch: refetchLearningGoals
  } = api.learningGoal.getStudentLearningGoals.useQuery({
    studentId,
    classId: entityType === LeaderboardEntityType.CLASS ? entityId : undefined,
    subjectId: entityType === LeaderboardEntityType.SUBJECT ? entityId : undefined,
    isCustom: false // Only get system-generated goals for leaderboard milestones
  }, {
    enabled: !!studentId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate default milestones based on entity type
  const generateDefaultMilestones = useCallback((): Milestone[] => {
    const defaultMilestones: Milestone[] = [];

    // Add rank-based milestones
    defaultMilestones.push({
      id: `rank-top-10-${entityType}-${entityId}`,
      title: 'Reach Top 10',
      description: 'Achieve a rank in the top 10 of the leaderboard',
      type: 'rank',
      targetValue: 10,
      icon: MilestoneIcons.trophy,
      color: '#FFD700', // Gold
      rewardPoints: 100
    });

    defaultMilestones.push({
      id: `rank-top-5-${entityType}-${entityId}`,
      title: 'Reach Top 5',
      description: 'Achieve a rank in the top 5 of the leaderboard',
      type: 'rank',
      targetValue: 5,
      icon: MilestoneIcons.medal,
      color: '#C0C0C0', // Silver
      rewardPoints: 200
    });

    defaultMilestones.push({
      id: `rank-top-3-${entityType}-${entityId}`,
      title: 'Reach Top 3',
      description: 'Achieve a rank in the top 3 of the leaderboard',
      type: 'rank',
      targetValue: 3,
      icon: MilestoneIcons.crown,
      color: '#CD7F32', // Bronze
      rewardPoints: 300
    });

    defaultMilestones.push({
      id: `rank-top-1-${entityType}-${entityId}`,
      title: 'Reach #1',
      description: 'Become the top-ranked student on the leaderboard',
      type: 'rank',
      targetValue: 1,
      icon: MilestoneIcons.star,
      color: '#FFD700', // Gold
      rewardPoints: 500
    });

    // Add points-based milestones
    defaultMilestones.push({
      id: `points-1000-${entityType}-${entityId}`,
      title: 'Score 1,000 Points',
      description: 'Earn a total of 1,000 points',
      type: 'points',
      targetValue: 1000,
      icon: MilestoneIcons.zap,
      color: '#4CAF50', // Green
      rewardPoints: 50
    });

    defaultMilestones.push({
      id: `points-5000-${entityType}-${entityId}`,
      title: 'Score 5,000 Points',
      description: 'Earn a total of 5,000 points',
      type: 'points',
      targetValue: 5000,
      icon: MilestoneIcons.zap,
      color: '#2196F3', // Blue
      rewardPoints: 100
    });

    defaultMilestones.push({
      id: `points-10000-${entityType}-${entityId}`,
      title: 'Score 10,000 Points',
      description: 'Earn a total of 10,000 points',
      type: 'points',
      targetValue: 10000,
      icon: MilestoneIcons.zap,
      color: '#9C27B0', // Purple
      rewardPoints: 200
    });

    // Add academic score milestones
    defaultMilestones.push({
      id: `academic-80-${entityType}-${entityId}`,
      title: 'Achieve 80% Academic Score',
      description: 'Reach an academic score of 80% or higher',
      type: 'academic',
      targetValue: 80,
      icon: MilestoneIcons.target,
      color: '#4CAF50', // Green
      rewardPoints: 100
    });

    defaultMilestones.push({
      id: `academic-90-${entityType}-${entityId}`,
      title: 'Achieve 90% Academic Score',
      description: 'Reach an academic score of 90% or higher',
      type: 'academic',
      targetValue: 90,
      icon: MilestoneIcons.target,
      color: '#2196F3', // Blue
      rewardPoints: 200
    });

    defaultMilestones.push({
      id: `academic-95-${entityType}-${entityId}`,
      title: 'Achieve 95% Academic Score',
      description: 'Reach an academic score of 95% or higher',
      type: 'academic',
      targetValue: 95,
      icon: MilestoneIcons.target,
      color: '#9C27B0', // Purple
      rewardPoints: 300
    });

    return defaultMilestones;
  }, [entityType, entityId]);

  // Convert learning goals to milestones
  const convertLearningGoalsToMilestones = useCallback((goals: any[]): Milestone[] => {
    if (!goals || goals.length === 0) {
      return [];
    }

    return goals.map(goal => {
      // Extract milestone type and target value from the goal title
      // Format: "Milestone: [Type] - [Value]"
      const titleMatch = goal.title.match(/Milestone: (rank|points|academic|completion) - (.+)/i);
      const type = titleMatch ? titleMatch[1].toLowerCase() as Milestone['type'] : 'points';
      const targetValue = titleMatch ? parseInt(titleMatch[2], 10) : goal.total;

      // Determine icon and color based on type
      let icon = MilestoneIcons.flag;
      let color = '#4CAF50'; // Default green

      switch (type) {
        case 'rank':
          icon = targetValue <= 3 ? MilestoneIcons.trophy : MilestoneIcons.medal;
          color = targetValue <= 3 ? '#FFD700' : '#C0C0C0';
          break;
        case 'points':
          icon = MilestoneIcons.zap;
          color = '#2196F3';
          break;
        case 'academic':
          icon = MilestoneIcons.target;
          color = '#9C27B0';
          break;
        case 'completion':
          icon = MilestoneIcons.flag;
          color = '#FF9800';
          break;
      }

      return {
        id: goal.id,
        title: goal.title.replace(/Milestone: (rank|points|academic|completion) - /i, ''),
        description: goal.description || '',
        type,
        targetValue,
        icon,
        color,
        rewardPoints: Math.floor(targetValue / 10), // Simple calculation for reward points
        progress: goal.progress,
        total: goal.total
      };
    });
  }, []);

  // Create a learning goal from a milestone
  const createMilestoneGoal = useCallback(async (milestone: Milestone) => {
    try {
      // Format the title to include the milestone type and target value
      // This will help us parse it back when converting from goals to milestones
      const title = `Milestone: ${milestone.type} - ${milestone.targetValue}`;

      // Create the learning goal
      await createLearningGoalMutation.mutateAsync({
        studentId,
        title,
        description: milestone.description,
        progress: 0,
        total: 100, // Always use 100 for percentage-based progress
        classId: entityType === LeaderboardEntityType.CLASS ? entityId : undefined,
        subjectId: entityType === LeaderboardEntityType.SUBJECT ? entityId : undefined,
        isCustom: false // Mark as system-generated
      });

      // Refetch learning goals
      await refetchLearningGoals();
    } catch (error) {
      console.error('Error creating milestone goal', error);
      setError(error as Error);
    }
  }, [
    studentId,
    entityType,
    entityId,
    createLearningGoalMutation,
    refetchLearningGoals
  ]);

  // Update milestone progress based on student position
  const updateMilestoneProgress = useCallback(async (milestone: Milestone) => {
    if (!currentStudentPosition) return;

    try {
      // Calculate progress based on milestone type
      let progress = 0;

      switch (milestone.type) {
        case 'rank':
          // Lower rank is better, so we invert the progress calculation
          progress = Math.min(100, Math.max(0,
            (milestone.targetValue === 0 ? 0 : (1 - (currentStudentPosition.rank - 1) / milestone.targetValue)) * 100
          ));
          break;
        case 'points':
          progress = Math.min(100, Math.max(0,
            (currentStudentPosition.rewardPoints / milestone.targetValue) * 100
          ));
          break;
        case 'academic':
          progress = Math.min(100, Math.max(0,
            (currentStudentPosition.academicScore / milestone.targetValue) * 100
          ));
          break;
        case 'completion':
          // This would require additional data about completion rate
          progress = 0;
          break;
      }

      // Update the learning goal
      await updateLearningGoalMutation.mutateAsync({
        id: milestone.id,
        progress: Math.round(progress)
      });

      // Refetch learning goals
      await refetchLearningGoals();
    } catch (error) {
      console.error('Error updating milestone progress', error);
      setError(error as Error);
    }
  }, [currentStudentPosition, updateLearningGoalMutation, refetchLearningGoals]);

  // Initialize milestones
  useEffect(() => {
    const initializeMilestones = async () => {
      try {
        setIsLoading(true);

        // If we have learning goals, convert them to milestones
        if (learningGoals && learningGoals.length > 0) {
          const convertedMilestones = convertLearningGoalsToMilestones(learningGoals);
          setMilestones(convertedMilestones);
        } else {
          // Otherwise, generate default milestones and create learning goals for them
          const defaultMilestones = generateDefaultMilestones();
          setMilestones(defaultMilestones);

          // Create learning goals for each default milestone
          for (const milestone of defaultMilestones) {
            await createMilestoneGoal(milestone);
          }
        }
      } catch (error) {
        console.error('Error initializing milestones', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingGoals && studentId) {
      initializeMilestones();
    }
  }, [
    studentId,
    isLoadingGoals,
    learningGoals,
    generateDefaultMilestones,
    convertLearningGoalsToMilestones,
    createMilestoneGoal
  ]);

  // Update milestone progress when student position changes
  useEffect(() => {
    if (currentStudentPosition && milestones.length > 0) {
      // Update progress for each milestone
      milestones.forEach(milestone => {
        updateMilestoneProgress(milestone);
      });
    }
  }, [currentStudentPosition, milestones, updateMilestoneProgress]);

  return {
    milestones,
    isLoading: isLoading || isLoadingGoals,
    error: error || learningGoalsError,
    refetch: refetchLearningGoals
  };
}


