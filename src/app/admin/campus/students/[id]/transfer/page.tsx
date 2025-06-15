'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { ArrowLeft } from '@/components/ui/icons';

import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { StudentTransferForm } from '@/components/shared/entities/students/StudentTransferForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentTransferPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const studentId = params.id as string;

  // Get student data
  const { data: studentData, isLoading: isLoadingStudent } = api.user.getById.useQuery(
    studentId,
    { enabled: !!studentId }
  );

  // Get current user's campus ID
  const { data: userData } = api.user.getCurrent.useQuery();
  const currentCampusId = userData?.primaryCampusId || '';

  // Get student's current enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = api.enrollment.getEnrollmentsByStudent.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get available classes in the current campus
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery(
    {
      courseCampusId: undefined,
      termId: undefined,
      status: 'ACTIVE',
    },
    { enabled: !!currentCampusId }
  );

  // Get available campuses
  const { data: campusesData, isLoading: isLoadingCampuses } = api.campus.getAll.useQuery();

  // Format student's current classes
  const currentClasses = enrollmentsData?.enrollments
    ? enrollmentsData.enrollments.map(enrollment => ({
        id: enrollment.class.id,
        name: enrollment.class.name,
        code: enrollment.class.code,
        campusId: currentCampusId,
      }))
    : [];

  // Format available classes
  const availableClasses = classesData?.items
    ? classesData.items.map(cls => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        campusId: cls.campusId,
      }))
    : [];

  // Format available campuses
  const availableCampuses = campusesData
    ? campusesData.map((campus: { id: string; name: string; status: string }) => ({
        id: campus.id,
        name: campus.name,
        code: campus.id.substring(0, 6), // Use a substring of ID as code if not available
      }))
    : [];

  const studentName = studentData?.name || 'Student';
  const userId = session?.user?.id || '';

  const isLoading = isLoadingStudent || isLoadingEnrollments || isLoadingClasses || isLoadingCampuses;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/campus/students/${studentId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Transfer Student</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/campus/students/${studentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Transfer Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer {studentName}</CardTitle>
          <CardDescription>Transfer the student to a different class or campus</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="class">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="class">Class Transfer</TabsTrigger>
              <TabsTrigger value="campus">Campus Transfer</TabsTrigger>
            </TabsList>

            <TabsContent value="class">
              <StudentTransferForm
                studentId={studentId}
                studentName={studentName}
                transferType="class"
                currentClasses={currentClasses}
                availableClasses={availableClasses}
                userId={userId}
                onSuccess={() => router.push(`/admin/campus/students/${studentId}`)}
              />
            </TabsContent>

            <TabsContent value="campus">
              <StudentTransferForm
                studentId={studentId}
                studentName={studentName}
                transferType="campus"
                currentCampusId={currentCampusId}
                availableCampuses={availableCampuses}
                availableClasses={availableClasses}
                userId={userId}
                onSuccess={() => router.push(`/admin/campus/students/${studentId}`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
