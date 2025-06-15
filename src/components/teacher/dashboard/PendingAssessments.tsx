"use client";

import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PendingAssessmentsProps {
  teacherId: string;
}

// Update the Assessment interface to match the API response
interface Assessment {
  id: string;
  title: string;
  status: SystemStatus;
  gradingType: GradingType | null;
  subjectId: string;
  maxScore: number | null;
  weightage: number | null;
  classId: string;
  dueDate: Date;
  submissionCount: number;
  class: {
    name: string;
    studentCount: number;
  };
}

export default function PendingAssessments({ teacherId }: PendingAssessmentsProps) {
  const { data: assessments, isLoading } = api.assessment.list.useQuery({ 
    teacherId,
    limit: 5,
    status: ['PENDING', 'IN_PROGRESS']
  });

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Pending Assessments</h2>
      <div className="space-y-4">
        {assessments?.map((assessment) => (
          <Link 
            key={assessment.id}
            href={`/teacher/classes/${assessment.classId}/assessments/${assessment.id}`}
            className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{assessment.title}</h3>
                <p className="text-sm text-gray-500">{assessment.class.name}</p>
              </div>
              <Badge variant={assessment.status === 'PENDING' ? 'warning' : 'default'}>
                {assessment.status}
              </Badge>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Due: {format(new Date(assessment.dueDate), 'MMM dd, yyyy')}</span>
              <span>{assessment.submissionCount} / {assessment.class.studentCount} submissions</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}


