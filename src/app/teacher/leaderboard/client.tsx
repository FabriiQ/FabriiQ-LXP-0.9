'use client';

import React from 'react';
import { StandardLeaderboard } from '@/features/leaderboard/components/client-components';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

interface TeacherCampusLeaderboardClientProps {
  campusId: string;
  campusName: string;
}

export function TeacherCampusLeaderboardClient({
  campusId,
  campusName
}: TeacherCampusLeaderboardClientProps) {
  return (
    <StandardLeaderboard
      entityType={LeaderboardEntityType.CAMPUS}
      entityId={campusId}
      title={`Campus Leaderboard: ${campusName}`}
      description="Student rankings and performance metrics across the campus"
      showTimeGranularitySelector={true}
      showRankChange={true}
      showAcademicScore={true}
      showRewardPoints={true}
      showLevel={true}
      limit={50}
    />
  );
}
