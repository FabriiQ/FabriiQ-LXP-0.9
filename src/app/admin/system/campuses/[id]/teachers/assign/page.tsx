'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeftIcon } from 'lucide-react';
import { AssignTeacherDialog } from '@/components/campus/AssignTeacherDialog';
import { api } from '@/trpc/react';

interface AssignTeacherPageProps {
  params: {
    id: string;
  };
}

export default function AssignTeacherPage({ params }: AssignTeacherPageProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(true);
  
  // Fetch campus details
  const { data: campus, isLoading: campusLoading } = api.campus.getById.useQuery({
    id: params.id,
  });

  // Fetch available teachers
  const { data: availableTeachers, isLoading: teachersLoading } = api.user.getAvailableTeachers.useQuery({
    campusId: params.id,
  });

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      router.push(`/admin/system/campuses/${params.id}/teachers`);
    }
  };

  // If data is loading, show loading state
  if (campusLoading || teachersLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Assign Teacher"
            description="Loading campus details..."
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If no campus found, show error
  if (!campus) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Error"
            description="Campus not found"
          />
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/system/campuses')}>
            Return to Campuses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Assign Teacher - ${campus.name}`}
          description={`Assign a teacher to ${campus.code} campus`}
        />
      </div>

      <AssignTeacherDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        campusId={params.id}
        availableTeachers={availableTeachers?.teachers || []}
        returnUrl={`/admin/system/campuses/${params.id}/teachers`}
      />
    </div>
  );
} 