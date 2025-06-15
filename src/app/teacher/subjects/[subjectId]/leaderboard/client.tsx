'use client';

import React from 'react';
import { StandardLeaderboard } from '@/features/leaderboard/components/client-components';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

interface TeacherSubjectLeaderboardClientProps {
  subjectId: string;
  subjectName: string;
  campusId: string;
  campusName: string;
}

export function TeacherSubjectLeaderboardClient({
  subjectId,
  subjectName,
  campusId,
  campusName
}: TeacherSubjectLeaderboardClientProps) {
  return (
    <StandardLeaderboard
      entityType={LeaderboardEntityType.SUBJECT}
      entityId={subjectId}
      title={`Leaderboard: ${subjectName}`}
      description="Student rankings and performance metrics for this subject"
      showTimeGranularitySelector={true}
      showRankChange={true}
      showAcademicScore={true}
      showRewardPoints={true}
      showLevel={true}
      limit={50}
      metadata={{
        campusId,
        campusName
      }}
    />
  );
}
