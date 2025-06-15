'use client';

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

interface LessonPlanSelectorProps {
  classId: string;
  value?: string;
  onChange: (lessonPlanId: string, lessonPlanData?: any) => void;
  disabled?: boolean;
}

export function LessonPlanSelector({
  classId,
  value,
  onChange,
  disabled = false,
}: LessonPlanSelectorProps) {
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<string>(value || '');

  // Fetch lesson plans for the class
  const { data: lessonPlansData, isLoading } = api.lessonPlan.getByClass.useQuery(
    {
      classId,
      // Don't filter by status for now, we'll filter in the UI
      page: 1,
      pageSize: 100,
    },
    {
      enabled: !!classId,
    }
  );

  // Extract lesson plans from the response
  const lessonPlans = lessonPlansData?.lessonPlans || [];

  // Handle selection change
  const handleChange = (lessonPlanId: string) => {
    setSelectedLessonPlanId(lessonPlanId);

    // Find the selected lesson plan data
    const selectedLessonPlan = lessonPlans.find(plan => plan.id === lessonPlanId);

    // Call the onChange handler with the lesson plan ID and data
    onChange(lessonPlanId, selectedLessonPlan);
  };

  // Update the selected value if the prop changes
  useEffect(() => {
    if (value && value !== selectedLessonPlanId) {
      setSelectedLessonPlanId(value);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="lessonPlan">Lesson Plan</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Select
          value={selectedLessonPlanId}
          onValueChange={handleChange}
          disabled={disabled || !lessonPlans || lessonPlans.length === 0}
        >
          <SelectTrigger id="lessonPlan">
            <SelectValue placeholder="Select a lesson plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {lessonPlans.map((lessonPlan) => (
              <SelectItem
                key={lessonPlan.id}
                value={lessonPlan.id || ''}
              >
                {lessonPlan.title || `Lesson Plan ${lessonPlan.id?.substring(0, 8) || 'Unknown'}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground">
        Selecting a lesson plan will automatically populate subject, topics, and learning outcomes.
      </p>
    </div>
  );
}
