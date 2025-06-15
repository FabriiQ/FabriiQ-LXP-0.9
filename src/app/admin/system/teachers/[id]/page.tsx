'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { TeacherProfileCard } from '@/components/teachers/teacher-profile-card';
import { TeacherOverviewTab } from '@/components/teachers/teacher-overview-tab';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Card, CardContent } from '@/components/ui/data-display/card';

export default function SystemTeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch teacher details
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getTeacherById.useQuery(
    { id: teacherId },
    {
      enabled: !!teacherId,
      retry: 1,
    }
  );

  if (isLoadingTeacher) {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <PageHeader
          title="Teacher Not Found"
          description="The requested teacher could not be found."
        />
        <Button asChild>
          <Link href="/admin/system/teachers">Back to Teachers</Link>
        </Button>
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
            title={`Teacher: ${teacher.user?.name || 'Unnamed'}`}
            description={teacher.user?.email || 'No email provided'}
          />
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/system/teachers/${teacherId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <TeacherProfileCard teacher={teacher} showStatusToggle={true} />

        {/* Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <TeacherOverviewTab teacher={teacher} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}