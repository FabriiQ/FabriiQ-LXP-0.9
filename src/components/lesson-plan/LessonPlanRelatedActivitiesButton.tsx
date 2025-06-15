import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface LessonPlanRelatedActivitiesButtonProps {
  lessonPlanId: string;
  classId: string;
}

export function LessonPlanRelatedActivitiesButton({
  lessonPlanId,
  classId,
}: LessonPlanRelatedActivitiesButtonProps) {
  const router = useRouter();

  const handleViewActivities = () => {
    // Navigate to the activities page with the lessonPlanId filter
    router.push(`/admin/campus/classes/${classId}/activities?lessonPlanId=${lessonPlanId}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
      onClick={handleViewActivities}
    >
      <ExternalLink className="h-4 w-4" />
      <span>View Related Activities</span>
    </Button>
  );
}
