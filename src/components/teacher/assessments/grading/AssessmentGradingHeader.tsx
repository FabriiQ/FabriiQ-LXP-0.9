"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Users } from "lucide-react";

interface AssessmentGradingHeaderProps {
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

export function AssessmentGradingHeader({
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
}: AssessmentGradingHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Grading</CardTitle>
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
            {isBatchGrading ? (
              <>
                <Users className="h-4 w-4 mr-2" />
                Individual Grading
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4 mr-2" />
                Batch Grading
              </>
            )}
          </Button>
        </div>

        {!isBatchGrading && (
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All Students
            </TabsTrigger>
            <TabsTrigger value="graded" className="flex-1">
              Graded
            </TabsTrigger>
            <TabsTrigger value="ungraded" className="flex-1">
              Ungraded
            </TabsTrigger>
          </TabsList>
        )}
      </CardContent>
    </Card>
  );
}
