'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EditGradingSettingsPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.classId || '';

  // Fetch class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId
  });

  // Loading state
  if (isLoadingClass) {
    return (
      <div className="container mx-auto py-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Error state
  if (!classDetails) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load class details</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Grading settings have been updated successfully.",
    });
    router.push(`/teacher/classes/${classId}/grades`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/teacher/classes/${classId}/grades`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Class Grades
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Edit Grading Settings"
        description={`Configure grading settings for ${classDetails.name}`}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Grading Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-6">
            Configure how grades are calculated for this class. These settings will apply to all activities and assessments.
          </p>

          <div className="space-y-6">
            {/* Placeholder for grading settings form */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-md">
              <p className="text-center text-gray-500">
                Grading settings configuration form will be implemented here.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/teacher/classes/${classId}/grades`}>Cancel</Link>
              </Button>
              <Button onClick={handleSave}>Save Settings</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
