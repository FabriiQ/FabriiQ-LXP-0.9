'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft } from 'lucide-react';
import { SystemTeacherForm } from '@/app/admin/system/teachers/SystemTeacherForm';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { UserType } from '@prisma/client';

export default function CreateSystemTeacherPage() {
  const { data: session } = useSession();

  // Get all campuses for the dropdown
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery();

  // Get all subjects for the dropdown
  const { data: subjects, isLoading: isLoadingSubjects } = api.subject.getAllSubjects.useQuery();

  // Check if user is authenticated and is a system admin
  if (!session?.user || session.user.userType !== UserType.SYSTEM_ADMIN) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Create Teacher"
            description="Add a new teacher to the system"
          />
        </div>
        <Card>
          <CardContent className="p-6">
            <p>You must be signed in as a system administrator to create teachers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/system/teachers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teachers
            </Link>
          </Button>
          <PageHeader
            title="Create Teacher"
            description="Add a new teacher to the system"
          />
        </div>
      </div>

      <SystemTeacherForm
        userId={session.user.id}
        campuses={campuses || []}
        subjects={subjects || []}
        isLoadingCampuses={isLoadingCampuses}
        isLoadingSubjects={isLoadingSubjects}
      />
    </div>
  );
}
