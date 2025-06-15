'use client';

import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/features/teacher-assistant/components/AnalyticsDashboard';
import { Loader2 } from 'lucide-react';

/**
 * Teacher Assistant Analytics Page
 */
export default function TeacherAssistantAnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
