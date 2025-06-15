import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface LessonPlanRelatedAssessmentsButtonProps {
  lessonPlanId: string;
  classId: string;
}

export function LessonPlanRelatedAssessmentsButton({
  lessonPlanId,
  classId,
}: LessonPlanRelatedAssessmentsButtonProps) {
  const router = useRouter();

  const handleViewAssessments = () => {
    // Navigate to the assessments page with the lessonPlanId filter
    router.push(`/admin/campus/classes/${classId}/assessments?lessonPlanId=${lessonPlanId}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
      onClick={handleViewAssessments}
    >
      <ExternalLink className="h-4 w-4" />
      <span>View Related Assessments</span>
    </Button>
  );
}
