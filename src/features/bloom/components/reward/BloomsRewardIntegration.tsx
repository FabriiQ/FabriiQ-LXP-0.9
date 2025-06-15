'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { 
  calculateRewardPoints, 
  determineMasteryLevel,
  calculateAchievementProgress,
  getAchievementName
} from '@/features/bloom/utils/reward-calculator';
import { api } from '@/trpc/react';

interface BloomsRewardIntegrationProps {
  activityGradeId: string;
  onRewardsCalculated?: (points: number) => void;
}

/**
 * BloomsRewardIntegration
 * 
 * A component that calculates and displays rewards based on Bloom's Taxonomy levels
 */
export function BloomsRewardIntegration({ 
  activityGradeId,
  onRewardsCalculated
}: BloomsRewardIntegrationProps) {
  // Fetch activity grade data
  const { data: activityGrade, isLoading } = api.activityGrade.getById.useQuery({ id: activityGradeId });
  
  // Extract Bloom's data from the grade
  const bloomsLevelScores = activityGrade?.attachments?.gradingDetails?.bloomsLevelScores as Record<BloomsTaxonomyLevel, number> | undefined;
  const bloomsLevel = activityGrade?.activity?.bloomsLevel as BloomsTaxonomyLevel | undefined;
  
  // Calculate rewards
  const score = activityGrade?.score || 0;
  const maxScore = activityGrade?.activity?.maxScore || 100;
  const rewardPoints = calculateRewardPoints(score, maxScore, bloomsLevelScores, bloomsLevel);
  
  // Notify parent component when rewards are calculated
  useEffect(() => {
    if (rewardPoints && onRewardsCalculated) {
      onRewardsCalculated(rewardPoints);
    }
  }, [rewardPoints, onRewardsCalculated]);
  
  if (isLoading) {
    return (
      <div className="h-48 bg-gray-200 animate-pulse rounded-md"></div>
    );
  }
  
  if (!activityGrade) {
    return null;
  }
  
  // Determine achievements
  const achievements = bloomsLevelScores ? 
    Object.entries(bloomsLevelScores).map(([level, score]) => {
      const bloomsLevel = level as BloomsTaxonomyLevel;
      const masteryLevel = determineMasteryLevel(score, 100);
      const progress = calculateAchievementProgress(bloomsLevelScores, bloomsLevel);
      const achievementName = getAchievementName(bloomsLevel, masteryLevel);
      
      return {
        level: bloomsLevel,
        masteryLevel,
        progress,
        achievementName
      };
    }) : 
    bloomsLevel ? 
      [{
        level: bloomsLevel,
        masteryLevel: determineMasteryLevel(score, maxScore, bloomsLevel),
        progress: (score / maxScore) * 100,
        achievementName: getAchievementName(
          bloomsLevel, 
          determineMasteryLevel(score, maxScore, bloomsLevel)
        )
      }] : 
      [];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Learning Rewards</CardTitle>
          <Badge variant="outline" className="font-mono">
            +{rewardPoints} points
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="space-y-4">
            {achievements.map(achievement => (
              <div key={achievement.level} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: BLOOMS_LEVEL_METADATA[achievement.level].color }}
                    />
                    <span className="text-sm font-medium">
                      {achievement.achievementName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {achievement.masteryLevel !== 'none' ? 
                      achievement.masteryLevel.charAt(0).toUpperCase() + achievement.masteryLevel.slice(1) : 
                      'Not achieved'}
                  </span>
                </div>
                <Progress value={achievement.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No achievements available for this activity
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>Higher cognitive levels earn more points. Keep challenging yourself!</p>
        </div>
      </CardContent>
    </Card>
  );
}
