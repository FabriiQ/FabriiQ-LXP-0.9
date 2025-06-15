import { useState, type FC } from "react";
import { DataTable } from "@/components/ui";
import { Button } from "@/components/ui";
import { SearchBar } from "@/components/ui";
import { Card } from "@/components/ui";
import { api } from "@/utils/api";
import { SystemStatus } from "@prisma/client";
import { CourseModal } from "./CourseModal";
import { toast } from "@/components/ui/feedback/toast";   // Updated import path


import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

// Define types for the course data structure
interface Prerequisite {
  prerequisiteId: string;
  prerequisiteCourse: {
    code: string;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  level: number;
  program: {
    name: string;
  };
  status: SystemStatus;
  prerequisites?: Prerequisite[];
  _count?: {
    subjects: number;
  };
}

type CourseListProps = {
  onEdit?: (id: string) => void;
};

// Define the type for the row in DataTable
interface DataTableRow {
  original: Course;
}

const CourseList: FC<CourseListProps> = ({ onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>();

  const { data, isLoading } = api.course.list.useQuery({
    search: searchTerm,
    status: SystemStatus.ACTIVE,
    take: 100
  });

  const utils = api.useContext();

  const deleteMutation = api.course.delete.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const columns = [
    { header: "Code", accessorKey: "code" },
    { header: "Name", accessorKey: "name" },
    { header: "Credits", accessorKey: "credits" },
    { header: "Level", accessorKey: "level" },
    { header: "Program", accessorKey: "program.name" },
    { header: "Status", accessorKey: "status" },
    {
      header: "Actions",
      cell: ({ row }: { row: DataTableRow }) => (
        <div className="flex gap-2">
          <Link href={`/admin/system/courses/${row.original.id}`}>
            <Button
              variant="outline"
              size="sm"
            >
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCourseId(row.original.id);
              setModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
    {
      header: "Prerequisites",
      cell: ({ row }: { row: DataTableRow }) => {
        const prerequisites = row.original.prerequisites || [];
        return prerequisites.length ? (
          <div className="flex gap-1">
            {prerequisites.map((prerequisite: Prerequisite) => (
              <Badge key={prerequisite.prerequisiteId} variant="secondary">
                {prerequisite.prerequisiteCourse.code}
              </Badge>
            ))}
          </div>
        ) : null;
      }
    },
    {
      header: "Subjects",
      cell: ({ row }: { row: DataTableRow }) => (
        <Badge>{row.original._count?.subjects || 0} subjects</Badge>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SearchBar
          placeholder="Search courses..."
          className="w-[300px]"
          onSearch={setSearchTerm}
          defaultValue={searchTerm}
        />
      </div>

      <Card className="p-4">
        <DataTable
          columns={columns}
          data={data?.courses || []}
          isLoading={isLoading}
        />
      </Card>

      <CourseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCourseId(undefined);
        }}
        courseId={selectedCourseId}
      />
    </div>
  );
};

export { CourseList };
