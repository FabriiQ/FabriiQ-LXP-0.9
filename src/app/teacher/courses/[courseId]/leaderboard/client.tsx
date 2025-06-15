'use client';

import React from 'react';
import { StandardLeaderboard } from '@/features/leaderboard/components/client-components';
import { LeaderboardEntityType } from '@/features/leaderboard/types/standard-leaderboard';

interface TeacherCourseLeaderboardClientProps {
  courseId: string;
  courseName: string;
  campusId: string;
  campusName: string;
}

export function TeacherCourseLeaderboardClient({
  courseId,
  courseName,
  campusId,
  campusName
}: TeacherCourseLeaderboardClientProps) {
  return (
    <StandardLeaderboard
      entityType={LeaderboardEntityType.COURSE}
      entityId={courseId}
      title={`Leaderboard: ${courseName}`}
      description="Student rankings and performance metrics for this course"
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
