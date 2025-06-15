'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Assessment {
  id: string;
  title: string;
  dueDate: Date | string;
  category: string;
  maxScore?: number | null;
  submissionsCount?: number;
}

interface UpcomingAssessmentsProps {
  classId: string;
  assessments: Assessment[];
}

export function UpcomingAssessments({ classId, assessments }: UpcomingAssessmentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Upcoming Assessments</CardTitle>
          <CardDescription>
            Assessments due in the next 14 days
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <span className="mr-2">View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No upcoming assessments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-start justify-between p-3 border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/campus/classes/${classId}/assessments/${assessment.id}`}
                      className="font-medium hover:underline"
                    >
                      {assessment.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{assessment.category}</Badge>
                      {assessment.maxScore && (
                        <span className="text-xs text-muted-foreground">
                          {assessment.maxScore} points
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                    {typeof assessment.dueDate === 'string'
                      ? assessment.dueDate
                      : format(new Date(assessment.dueDate), 'MMM d, yyyy')}
                  </div>
                  {assessment.submissionsCount !== undefined && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {assessment.submissionsCount} submissions
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
