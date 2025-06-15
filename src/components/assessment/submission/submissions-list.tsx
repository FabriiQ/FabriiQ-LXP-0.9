'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/atoms/button';
import { Badge } from '~/components/ui/atoms/badge';
import { DataTable } from '~/components/ui/data-display/data-table';
import { SearchBar } from '~/components/ui/search-bar';
import { formatDate } from '~/lib/utils';
import { api } from '~/trpc/react';
import { useToast } from '~/components/ui/feedback/toast';
import { FileText, ArrowLeft, BarChart2, Download } from 'lucide-react';
import { SubmissionStatus } from '~/server/api/constants';

interface SubmissionsListProps {
  assessmentId: string;
}

export function SubmissionsList({ assessmentId }: SubmissionsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch assessment details
  const { data: assessment, isLoading } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Loading submissions...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Assessment not found.</p>
      </div>
    );
  }

  // Filter submissions based on search query and status
  const filteredSubmissions = assessment.submissions?.filter((submission: any) => {
    const matchesSearch = submission.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Submission columns for the data table
  const submissionColumns = [
    {
      header: "Student",
      accessorKey: "student.user.name",
      cell: ({ row }: any) => row.original.student?.user?.name || "-",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge 
          variant={
            row.original.status === SubmissionStatus.GRADED ? 'success' :
            row.original.status === SubmissionStatus.SUBMITTED ? 'info' :
            row.original.status === SubmissionStatus.LATE ? 'warning' : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: ({ row }: any) => row.original.score !== null ? `${row.original.score}/${assessment.maxScore}` : "-",
    },
    {
      header: "Submitted At",
      accessorKey: "submittedAt",
      cell: ({ row }: any) => row.original.submittedAt ? formatDate(row.original.submittedAt) : "-",
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${row.original.id}`)}
          >
            <FileText className="mr-1 h-4 w-4" />
            View
          </Button>
          {row.original.status !== SubmissionStatus.GRADED && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${row.original.id}/grade`)}
            >
              <BarChart2 className="mr-1 h-4 w-4" />
              Grade
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/assessments/${assessmentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment
        </Button>
      </div>
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchBar
            placeholder="Search students..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            className="w-full sm:w-[300px]"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Statuses</option>
            {Object.values(SubmissionStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            // Export functionality would be implemented here
            toast({
              title: "Export initiated",
              description: "Submissions data is being exported",
              variant: "info",
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Submissions
        </Button>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p>No submissions found.</p>
        </div>
      ) : (
        <DataTable
          columns={submissionColumns}
          data={filteredSubmissions}
          emptyMessage="No submissions found."
        />
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSubmissions.length} of {assessment.submissions?.length || 0} submissions
        </p>
      </div>
    </div>
  );
} 