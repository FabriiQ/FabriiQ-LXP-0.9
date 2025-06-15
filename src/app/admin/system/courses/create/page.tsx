import { CourseForm } from "@/components/admin/courses/CourseForm";
import { Card } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/page-header";

export default function CreateCoursePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Course"
        description="Add a new course to your institution"
      />
      <Card className="p-6">
        <CourseForm />
      </Card>
    </div>
  );
} 