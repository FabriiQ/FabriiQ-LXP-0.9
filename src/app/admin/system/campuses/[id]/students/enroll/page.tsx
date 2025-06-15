'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeftIcon } from 'lucide-react';
import { EnrollStudentDialog } from '@/components/campus/EnrollStudentDialog';
import { api } from '~/trpc/react';
import { SystemStatus } from '@prisma/client';

// Define ProgramChangeType if it doesn't exist
export enum ProgramChangeType {
  NEW_ENROLLMENT = "NEW_ENROLLMENT",
  PROGRAM_TRANSFER = "PROGRAM_TRANSFER",
  PROGRAM_UPGRADE = "PROGRAM_UPGRADE",
}

// Define the type for program campus
interface ProgramCampus {
  id: string;
  programId: string;
  campusId: string;
  program: {
    name: string;
    code: string;
  };
}

interface EnrollStudentPageProps {
  params: {
    id: string;
  };
}

export default function EnrollStudentPage({ params }: EnrollStudentPageProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(true);
  
  // Fetch campus details
  const { data: campus, isLoading: campusLoading } = api.campus.getCampus.useQuery({
    id: params.id,
  });

  // Fetch available students
  const { data: availableStudents, isLoading: studentsLoading } = api.user.getAvailableStudents.useQuery({
    campusId: params.id,
  });

  // Fetch available programs
  const { data: programCampuses, isLoading: programsLoading } = 
    api.program.getProgramCampusesByCampus.useQuery({
      campusId: params.id,
      status: SystemStatus.ACTIVE,
    });

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      router.push(`/admin/system/campuses/${params.id}/students`);
    }
  };

  // If data is loading, show loading state
  if (campusLoading || studentsLoading || programsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Enroll Student"
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

  // Format program options
  const programOptions = programCampuses?.map(pc => ({
    id: pc.id,
    name: pc.program.name,
    code: pc.program.code,
  })) || [];

  const handleProgramChange = (pc: ProgramCampus) => {
    // Handle program change
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Enroll Student - ${campus.name}`}
          description={`Enroll a student to ${campus.code} campus`}
        />
      </div>

      <EnrollStudentDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        campusId={params.id}
        availableStudents={availableStudents?.students || []}
        availablePrograms={programOptions}
        returnUrl={`/admin/system/campuses/${params.id}/students`}
      />
    </div>
  );
} 
