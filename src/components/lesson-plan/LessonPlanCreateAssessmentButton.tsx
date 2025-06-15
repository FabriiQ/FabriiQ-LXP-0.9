'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';
import { AssessmentCategory, GradingType } from '@/server/api/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LessonPlanCreateAssessmentButtonProps {
  lessonPlanId: string;
  classId: string;
  disabled?: boolean;
}

export function LessonPlanCreateAssessmentButton({
  lessonPlanId,
  classId,
  disabled = false,
}: LessonPlanCreateAssessmentButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>(AssessmentCategory.QUIZ);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch lesson plan data for assessment
  const { data, isLoading: isDataLoading } = api.lessonPlan.getLessonPlanDataForAssessment.useQuery(
    { lessonPlanId },
    { enabled: isDialogOpen }
  );

  const handleCreateAssessment = () => {
    setIsLoading(true);

    // Navigate to the assessment creation page with pre-filled data
    const queryParams = new URLSearchParams({
      lessonPlanId,
      category: assessmentCategory,
      prefill: 'true'
    });

    router.push(`/admin/campus/classes/${classId}/assessments/new?${queryParams.toString()}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
      >
        <ClipboardList className="h-4 w-4" />
        <span>Create Assessment</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Assessment from Lesson Plan</DialogTitle>
            <DialogDescription>
              Choose the type of assessment you want to create based on this lesson plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assessmentCategory">Assessment Category</Label>
              <Select
                value={assessmentCategory}
                onValueChange={(value) => setAssessmentCategory(value as AssessmentCategory)}
                disabled={isDataLoading}
              >
                <SelectTrigger id="assessmentCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isDataLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {data && (
              <div className="text-sm text-muted-foreground">
                <p>This will create a new assessment with the following details:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Title: {data.prefillData.title}</li>
                  <li>Subject: {data.lessonPlan.subject?.name || 'Not specified'}</li>
                  <li>Class: {data.lessonPlan.class?.name || 'Not specified'}</li>
                  <li>Instructions: Based on lesson plan learning objectives</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssessment} disabled={isLoading || isDataLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Assessment Creator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
