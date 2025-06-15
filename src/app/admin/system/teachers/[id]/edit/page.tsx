'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft } from 'lucide-react';
import { SystemTeacherForm } from '@/app/admin/system/teachers/SystemTeacherForm';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { UserType } from '@prisma/client';
import { useToast } from '@/components/ui/feedback/toast';
import { useEffect, useState } from 'react';

export default function EditSystemTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const teacherId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);

  // Get teacher details
  const { data: teacher, isLoading: isLoadingTeacher, error } = api.teacher.getTeacherById.useQuery(
    { id: teacherId },
    {
      enabled: !!teacherId,
      retry: 1,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load teacher: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Get all campuses for the dropdown
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery();

  // Get all subjects for the dropdown
  const { data: subjects, isLoading: isLoadingSubjects } = api.subject.getAllSubjects.useQuery();

  useEffect(() => {
    if (!isLoadingTeacher && !isLoadingCampuses && !isLoadingSubjects) {
      setIsLoading(false);
    }
  }, [isLoadingTeacher, isLoadingCampuses, isLoadingSubjects]);

  // Check if user is authenticated and is a system admin
  if (!session?.user || session.user.userType !== UserType.SYSTEM_ADMIN) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Edit Teacher"
            description="Update teacher information"
          />
        </div>
        <Card>
          <CardContent className="p-6">
            <p>You must be signed in as a system administrator to edit teachers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Edit Teacher"
            description="Loading teacher information..."
          />
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Loading teacher information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Edit Teacher"
            description="Error loading teacher"
          />
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Error loading teacher information. Please try again.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => router.push('/admin/system/teachers')}
            >
              Back to Teachers
            </Button>
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
            <Link href={`/admin/system/teachers/${teacherId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teacher Profile
            </Link>
          </Button>
          <PageHeader
            title={`Edit Teacher: ${teacher.user?.name || 'Unnamed'}`}
            description="Update teacher information"
          />
        </div>
      </div>

      <SystemTeacherForm
        userId={session.user.id}
        campuses={campuses || []}
        subjects={subjects || []}
        isLoadingCampuses={isLoadingCampuses}
        isLoadingSubjects={isLoadingSubjects}
        teacherId={teacherId}
        initialData={teacher}
      />
    </div>
  );
}
