import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/trpc/react';

interface ActivityLessonPlanFilterProps {
  onFilterChange: (lessonPlanId: string | null) => void;
  classId?: string;
}

/**
 * ActivityLessonPlanFilter component
 * 
 * This component provides a dropdown to filter activities by lesson plan
 * 
 * @param onFilterChange Callback function when filter changes
 * @param classId Optional class ID to filter lesson plans
 */
export function ActivityLessonPlanFilter({ onFilterChange, classId }: ActivityLessonPlanFilterProps) {
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<string | null>(null);

  // Fetch lesson plans for the class
  const { data: lessonPlans, isLoading } = api.lessonPlan.getByClass.useQuery(
    { classId: classId || '' },
    { enabled: !!classId }
  );

  // Handle filter change
  const handleLessonPlanChange = (value: string) => {
    const lessonPlanId = value === 'all' ? null : value;
    setSelectedLessonPlanId(lessonPlanId);
    onFilterChange(lessonPlanId);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="lesson-plan-filter">Lesson Plan</Label>
      <Select
        value={selectedLessonPlanId || 'all'}
        onValueChange={handleLessonPlanChange}
        disabled={isLoading || !lessonPlans || lessonPlans.length === 0}
      >
        <SelectTrigger id="lesson-plan-filter" className="w-full">
          <SelectValue placeholder="Filter by lesson plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lesson Plans</SelectItem>
          {lessonPlans?.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {plan.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
