import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/trpc/react';

interface AssessmentLessonPlanFilterProps {
  onFilterChange: (lessonPlanId: string | null) => void;
  classId?: string;
}

export function AssessmentLessonPlanFilter({ onFilterChange, classId }: AssessmentLessonPlanFilterProps) {
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
      <Label htmlFor="lessonPlanFilter">Lesson Plan</Label>
      <Select
        value={selectedLessonPlanId || 'all'}
        onValueChange={handleLessonPlanChange}
        disabled={isLoading || !classId}
      >
        <SelectTrigger id="lessonPlanFilter" className="w-full">
          <SelectValue placeholder="All Lesson Plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lesson Plans</SelectItem>
          {lessonPlans?.items?.map((lessonPlan) => (
            <SelectItem key={lessonPlan.id} value={lessonPlan.id}>
              {lessonPlan.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
