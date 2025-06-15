"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";

interface ActivityGradingHeaderProps {
  title: string;
  description: string;
  maxScore: number;
  submissionCount: number;
  totalStudents: number;
  isBatchGrading: boolean;
  isClassTeacher: boolean;
  onToggleBatchGrading: () => void;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function ActivityGradingHeader({
  title,
  description,
  maxScore,
  submissionCount,
  totalStudents,
  isBatchGrading,
  isClassTeacher,
  onToggleBatchGrading,
  activeTab,
  onTabChange,
}: ActivityGradingHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Grading</CardTitle>
        <CardDescription>
          Grade student submissions for {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium">Max Score: {maxScore}</p>
            <p className="text-sm text-gray-500">
              {submissionCount} submissions / {totalStudents} students
            </p>
          </div>
          <Button
            variant={isBatchGrading ? "secondary" : "outline"}
            onClick={onToggleBatchGrading}
          >
            {isBatchGrading ? "Cancel Batch Grading" : "Batch Grading"}
          </Button>
        </div>

        {!isBatchGrading && (
          <div className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Students</TabsTrigger>
              <TabsTrigger value="graded">
                Graded ({submissionCount})
              </TabsTrigger>
              <TabsTrigger value="ungraded">
                Ungraded ({totalStudents - submissionCount})
              </TabsTrigger>
            </TabsList>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
