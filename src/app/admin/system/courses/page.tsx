"use client";

import { useState, type FC } from 'react';
import { useRouter } from "next/navigation";
import { CourseGrid } from "@/components/admin/courses/CourseGrid";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Card } from "@/components/ui/data-display/card";
import { SearchBar } from "@/components/ui";
import { api } from "@/utils/api";
import { SystemStatus } from "@prisma/client";
import { toast } from "@/components/ui/feedback/toast";

const CoursesPage: FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = api.course.list.useQuery({
    search: searchTerm,
    status: SystemStatus.ACTIVE,
    take: 100
  });



  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage your courses here"
        actions={
          <Button onClick={() => router.push("/admin/system/courses/create")}>
            Add Course
          </Button>
        }
      />

      <div className="container mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <SearchBar
            placeholder="Search courses..."
            className="w-[300px]"
            onSearch={setSearchTerm}
            defaultValue={searchTerm}
          />
        </div>

        <Card className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CourseGrid
              courses={data?.courses || []}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CoursesPage;