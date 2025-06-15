'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/core/button';
import { PageLayout } from '@/components/layout/page-layout';
import { ChevronLeft as ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

// Use dynamic import for better performance
const DynamicMultiStepActivityForm = dynamic(
  () => import('@/components/shared/entities/activities/MultiStepActivityForm').then(mod => ({ default: mod.MultiStepActivityForm })),
  {
    loading: () => <div className="animate-pulse p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading activity form...</div>,
    ssr: false
  }
);

export default function NewActivityPage() {
  const params = useParams();
  const classId = params?.id as string;

  return (
    <PageLayout title="Create New Activity">
      <div className="flex items-center mb-6">
        <Link href={`/admin/campus/classes/${classId}/activities`} className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Activity</h1>
      </div>

      <DynamicMultiStepActivityForm classId={classId} />
    </PageLayout>
  );
}