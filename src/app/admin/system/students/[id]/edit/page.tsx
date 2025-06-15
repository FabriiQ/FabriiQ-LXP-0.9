'use client';


import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { EditStudentForm } from './edit-student-form';

export default function EditStudentPage() {
  const params = useParams();
  const studentId = params.id as string;

  // Fetch student details
  const { data: student, isLoading: isLoadingStudent } = api.systemAnalytics.getStudentById.useQuery(
    { id: studentId },
    {
      enabled: !!studentId,
      retry: 1,
    }
  );

  if (isLoadingStudent) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <PageHeader
          title="Student Not Found"
          description="The requested student could not be found."
        />
        <Button asChild>
          <Link href="/admin/system/students">Back to Students</Link>
        </Button>
      </div>
    );
  }

  // Extract profile data and handle type safety
  const profileData = student.profile || {};
  const profileDataObj = typeof profileData === 'object' ? profileData : {};

  // Extract first and last name
  let firstName = '';
  let lastName = '';

  if (student.name) {
    const nameParts = student.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  // Get profile data safely
  const getProfileValue = (key: string) => {
    return profileDataObj && typeof profileDataObj === 'object' && key in profileDataObj
      ? (profileDataObj as any)[key]
      : '';
  };

  // Get guardian info safely
  const guardianInfo = getProfileValue('guardianInfo') || {};
  const guardianInfoObj = typeof guardianInfo === 'object' ? guardianInfo : {};

  // Prepare student data for the form
  const studentData = {
    id: student.id,
    name: student.name || '',
    email: student.email || '',
    phoneNumber: '', // Student doesn't have phoneNumber directly
    firstName,
    lastName,
    enrollmentNumber: getProfileValue('enrollmentNumber') || '',
    dateOfBirth: getProfileValue('dateOfBirth') ? new Date(getProfileValue('dateOfBirth')).toISOString().split('T')[0] : '',
    gender: getProfileValue('gender') || '',
    address: getProfileValue('address') || '',
    city: getProfileValue('city') || '',
    state: getProfileValue('state') || '',
    postalCode: getProfileValue('postalCode') || '',
    country: getProfileValue('country') || '',
    emergencyContactName: guardianInfoObj && 'name' in guardianInfoObj ? (guardianInfoObj as any).name : '',
    emergencyContactPhone: guardianInfoObj && 'phone' in guardianInfoObj ? (guardianInfoObj as any).phone : '',
    emergencyContactRelationship: guardianInfoObj && 'relationship' in guardianInfoObj ? (guardianInfoObj as any).relationship : '',
    notes: getProfileValue('notes') || '',
    status: student.status,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/system/students/${studentId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Student Profile</h1>
        </div>
      </div>

      <EditStudentForm
        student={studentData}
        userId={student.id}
      />
    </div>
  );
}
