"use client";

import ActivityGrading from "./grading";

// Define the props for the component
interface ActivityGradingInterfaceProps {
  activityId: string;
  classId: string;
  maxScore?: number;
  isClassTeacher: boolean;
}

export default function ActivityGradingInterface({
  activityId,
  classId,
  maxScore = 100,
  isClassTeacher,
}: ActivityGradingInterfaceProps) {
  return (
    <ActivityGrading
      activityId={activityId}
      classId={classId}
      maxScore={maxScore}
      isClassTeacher={isClassTeacher}
    />
  );
}
