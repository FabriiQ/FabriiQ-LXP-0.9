'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/atoms/button";
import { Card } from "~/components/ui/atoms/card";
import { Badge } from "~/components/ui/atoms/badge";
import { DataTable } from "~/components/ui/data-display/data-table";
import { SearchBar } from "~/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/forms/select";
import { formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/feedback/toast";
import { Trash2, Eye, FileEdit, Plus, FileText } from "lucide-react";
import { AssessmentCategory, SystemStatus } from "~/server/api/constants";

// Define the interface for assessments
interface Assessment {
  id: string;
  title: string;
  category?: AssessmentCategory;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  status: SystemStatus | string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    submissions: number;
  };
  subject?: {
    code: string;
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  term?: {
    id: string;
    name: string;
  };
  gradingType?: string;
  [key: string]: any;
}

export function AssessmentList() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch assessments using tRPC
  const { data: assessments, isLoading, refetch } = api.assessment.list.useQuery({
    page: 1,
    pageSize: 50,
    status: selectedStatus !== "all" ? selectedStatus as SystemStatus : undefined,
    category: selectedCategory !== "all" ? selectedCategory as AssessmentCategory : undefined,
    search: searchQuery || undefined,
  }, {
    enabled: true,
  });

  // Delete assessment mutation
  const deleteAssessment = api.assessment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment deleted successfully",
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assessment",
        variant: "error",
      });
    },
  });

  // Filter assessments based on search query and category
  const filteredAssessments = assessments?.items || [];

  // Handle assessment deletion
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this assessment?")) {
      deleteAssessment.mutate({ id });
    }
  };

  // Assessment card component for mobile view
  const AssessmentCard = ({ assessment }: { assessment: Assessment }) => (
    <Card className="mb-4 p-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">{assessment.title}</h3>
        <Badge 
          variant={
            assessment.status === SystemStatus.ACTIVE ? 'success' :
            assessment.status === SystemStatus.INACTIVE ? 'warning' : 'default'
          }
        >
          {assessment.status}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Category:</span> {assessment.category}
        </div>
        <div>
          <span className="text-muted-foreground">Max Score:</span> {assessment.maxScore}
        </div>
        <div>
          <span className="text-muted-foreground">Subject:</span> {assessment.subject?.name}
        </div>
        <div>
          <span className="text-muted-foreground">Class:</span> {assessment.class?.name}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span>Submissions: {assessment._count?.submissions || 0}</span>
        <span>Updated: {formatDate(assessment.updatedAt)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/assessments/${assessment.id}`)}
        >
          <Eye className="mr-1 h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/assessments/${assessment.id}/submissions`)}
        >
          <FileText className="mr-1 h-4 w-4" />
          Submissions
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/assessments/${assessment.id}/edit`)}
        >
          <FileEdit className="mr-1 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(assessment.id)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  );

  // Table columns
  const columns = [
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "Subject",
      accessorKey: "subject.name",
      cell: ({ row }: { row: { original: Assessment } }) => row.original.subject?.name || "-",
    },
    {
      header: "Class",
      accessorKey: "class.name",
      cell: ({ row }: { row: { original: Assessment } }) => row.original.class?.name || "-",
    },
    {
      header: "Max Score",
      accessorKey: "maxScore",
      cell: ({ row }: { row: { original: Assessment } }) => row.original.maxScore || "-",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: { row: { original: Assessment } }) => (
        <Badge 
          variant={
            row.original.status === SystemStatus.ACTIVE ? 'success' :
            row.original.status === SystemStatus.INACTIVE ? 'warning' : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Submissions",
      accessorKey: "_count.submissions",
      cell: ({ row }: { row: { original: Assessment } }) => row.original._count?.submissions || 0,
    },
    {
      header: "Last Modified",
      accessorKey: "updatedAt",
      cell: ({ row }: { row: { original: Assessment } }) => formatDate(row.original.updatedAt),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: Assessment } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${row.original.id}`)}
          >
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${row.original.id}/submissions`)}
          >
            <FileText className="mr-1 h-4 w-4" />
            Submissions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${row.original.id}/edit`)}
          >
            <FileEdit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchBar
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            className="w-full sm:w-[300px]"
          />
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(AssessmentCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(SystemStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => router.push("/admin/system/assessments/new")}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Assessment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p>Loading assessments...</p>
        </div>
      ) : (
        <>
          <div className="block sm:hidden">
            {filteredAssessments.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p>No assessments found.</p>
              </div>
            ) : (
              filteredAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment as Assessment} />
              ))
            )}
          </div>

          <div className="hidden sm:block">
            <DataTable
              columns={columns}
              data={filteredAssessments as Assessment[]}
              emptyMessage="No assessments found."
            />
          </div>

          {assessments && assessments.total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAssessments.length} of {assessments.total} assessments
              </p>
              {/* Pagination can be added here if needed */}
            </div>
          )}
        </>
      )}
    </div>
  );
} 