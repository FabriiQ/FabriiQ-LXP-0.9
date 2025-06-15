import { useState, type FC } from "react";
import { Card } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/forms/select";
import { api } from "@/utils/api";
import { SystemStatus } from "@prisma/client";

interface PrerequisiteConfigProps {
  courseId: string;
  initialPrerequisites?: string[];
}

interface PrerequisiteData {
  courseId: string;
  prerequisiteId: string;
}

// Define the Course type based on your API response
interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  program: {
    code: string;
    name: string;
    id: string;
  };
  _count: {
    campusOfferings: number;
    subjects: number;
  };
}

export const PrerequisiteConfig: FC<PrerequisiteConfigProps> = ({ courseId, initialPrerequisites = [] }) => {
  const [prerequisites, setPrerequisites] = useState<string[]>(initialPrerequisites);
  const { data: coursesData } = api.course.list.useQuery({
    status: SystemStatus.ACTIVE
  });

  const addPrerequisiteMutation = api.course.addPrerequisite.useMutation();
  const removePrerequisiteMutation = api.course.removePrerequisite.useMutation();

  const handleAddPrerequisite = async (prerequisiteId: string) => {
    const prerequisiteData: PrerequisiteData = {
      courseId,
      prerequisiteId
    };
    await addPrerequisiteMutation.mutateAsync(prerequisiteData);
    setPrerequisites([...prerequisites, prerequisiteId]);
  };

  const handleRemovePrerequisite = async (prerequisiteId: string) => {
    await removePrerequisiteMutation.mutateAsync({
      courseId,
      prerequisiteId
    });
    setPrerequisites(prerequisites.filter(id => id !== prerequisiteId));
  };

  const renderCourseOptions = (courses: Course[]) => {
    return courses.map((course: Course) => ({
      value: course.id,
      label: `${course.code} - ${course.name}`
    }));
  };

  const handleCourseSelect = (course: Course) => {
    if (course.id) {
      handleAddPrerequisite(course.id);
    }
  };

  if (!coursesData?.courses) {
    return null;
  }

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div>
          <Select onValueChange={(value) => {
            const course = coursesData.courses.find(c => c.id === value);
            if (course) {
              handleCourseSelect(course);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a prerequisite course" />
            </SelectTrigger>
            <SelectContent>
              {coursesData.courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {prerequisites.map(prerequisiteId => {
            const course = coursesData.courses.find(c => c.id === prerequisiteId);
            if (!course) return null;

            return (
              <div key={prerequisiteId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{course.code} - {course.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemovePrerequisite(prerequisiteId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

