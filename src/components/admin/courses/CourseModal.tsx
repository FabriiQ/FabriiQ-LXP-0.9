// CourseModal component
import { Modal } from "@/components/ui/feedback/modal";
import { CourseForm } from "./CourseForm";
import { PrerequisiteConfig } from "./PrerequisiteConfig";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/navigation/tabs";
import { api } from "@/utils/api";
import { toast } from "@/components/ui/feedback/toast";
import { SystemStatus } from "@/server/api/constants";

// Define the interface to match what CourseForm expects
interface CourseFormData {
  code: string;
  name: string;
  description?: string;
  level: number;
  credits: number;
  programId: string;
  status: SystemStatus;
  objectives: Array<{ description: string }>;
  resources: Array<{
    name: string;
    url: string;
    type: string;
    description?: string;
    isRequired: boolean;
  }>;
  syllabus?: Record<string, unknown>;
}

type CourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
};

export const CourseModal = ({ isOpen, onClose, courseId }: CourseModalProps) => {
  // Use trpc context
  const utils = api.useContext();

  // Fetch course data if editing
  const { data: courseData } = api.course.get.useQuery(
    { id: courseId! },
    { enabled: !!courseId }
  );

  // Create mutation
  const createMutation = api.course.create.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      toast({
        title: "Success",
        description: "Course created successfully",
        variant: "success"
      });
      onClose();
    },
  });

  // Update mutation
  const updateMutation = api.course.update.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      toast({
        title: "Success",
        description: "Course updated successfully",
        variant: "success"
      });
      onClose();
    },
  });

  // Handle form submission
  const handleSubmit = async (data: CourseFormData) => {
    if (courseId) {
      await updateMutation.mutateAsync({ id: courseId, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Transform API response to match CourseForm's expected format
  const formattedCourseData: CourseFormData | undefined = courseData?.course ? {
    code: courseData.course.code,
    name: courseData.course.name,
    description: courseData.course.description || '',
    level: courseData.course.level,
    credits: courseData.course.credits,
    programId: courseData.course.program.id,
    status: courseData.course.status as unknown as SystemStatus, // Cast to the correct SystemStatus type
    objectives: ((courseData.course.settings as Record<string, unknown>)?.objectives as Array<{ description: string }>) || [{ description: '' }],
    resources: ((courseData.course.settings as Record<string, unknown>)?.resources as Array<{
      name: string;
      url: string;
      type: string;
      description?: string;
      isRequired: boolean;
    }>) || [{
      name: '',
      url: '',
      type: 'TEXTBOOK',
      isRequired: false
    }],
    syllabus: courseData.course.syllabus as Record<string, unknown> || {}
  } : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">
          {courseId ? "Edit Course" : "Add Course"}
        </h2>

        {courseId ? (
          <Tabs defaultValue="details" className="w-full max-h-[70vh] overflow-hidden flex flex-col">
            <TabsList id="course-tabs" className="w-full">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4 overflow-y-auto">
              <CourseForm
                initialData={formattedCourseData}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isLoading}
              />
            </TabsContent>
            <TabsContent value="prerequisites" className="mt-4 overflow-y-auto">
              <PrerequisiteConfig
                courseId={courseId}
                initialPrerequisites={courseData?.course.prerequisites?.map(p => p.prerequisiteId) || []}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <CourseForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isLoading}
          />
        )}
      </div>
    </Modal>
  );
};
