'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';
import { ActivityPurpose, LearningActivityType, AssessmentType } from '@/server/api/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LessonPlanCreateActivityButtonProps {
  lessonPlanId: string;
  classId: string;
  disabled?: boolean;
}

export function LessonPlanCreateActivityButton({
  lessonPlanId,
  classId,
  disabled = false,
}: LessonPlanCreateActivityButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityPurpose, setActivityPurpose] = useState<ActivityPurpose>(ActivityPurpose.LEARNING);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch lesson plan data for activity
  const { data, isLoading: isDataLoading } = api.lessonPlan.getLessonPlanDataForActivity.useQuery(
    { lessonPlanId },
    { enabled: isDialogOpen }
  );

  const handleCreateActivity = () => {
    setIsLoading(true);

    // Navigate to the activity creation page with pre-filled data
    const queryParams = new URLSearchParams({
      lessonPlanId,
      purpose: activityPurpose,
      prefill: 'true'
    });

    router.push(`/admin/campus/classes/${classId}/activities/new?${queryParams.toString()}`);
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
        <Plus className="h-4 w-4" />
        <span>Create Activity</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Activity from Lesson Plan</DialogTitle>
            <DialogDescription>
              Choose the type of activity you want to create based on this lesson plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activityPurpose">Activity Purpose</Label>
              <Select
                value={activityPurpose}
                onValueChange={(value) => setActivityPurpose(value as ActivityPurpose)}
                disabled={isDataLoading}
              >
                <SelectTrigger id="activityPurpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ActivityPurpose.LEARNING}>Learning Activity</SelectItem>
                  <SelectItem value={ActivityPurpose.PRACTICE}>Practice Activity</SelectItem>
                  <SelectItem value={ActivityPurpose.ASSESSMENT}>Assessment Activity</SelectItem>
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
                <p>This will create a new activity with the following details:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Title: {data.prefillData.title}</li>
                  <li>Subject: {data.lessonPlan.subject?.name || 'Not specified'}</li>
                  <li>Class: {data.lessonPlan.class?.name || 'Not specified'}</li>
                  <li>Learning Objectives: {data.prefillData.learningObjectives.length}</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateActivity} disabled={isLoading || isDataLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Activity Creator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
