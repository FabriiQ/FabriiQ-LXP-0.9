import React from 'react';
import { CoordinatorClassPerformance } from '@/components/coordinator/performance/CoordinatorClassPerformance';
import { getServerAuthSession } from '@/server/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Class Performance',
  description: 'Detailed performance metrics for classes under coordinator supervision',
};

/**
 * Coordinator Class Performance Page
 *
 * This page displays detailed performance metrics for classes under coordinator supervision.
 * It's part of the admin/coordinator section and inherits the admin layout.
 */
export default async function CoordinatorClassPerformancePage() {
  const session = await getServerAuthSession();

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin');
  }

  // Check if the user is a coordinator
  if (session.user.userType !== 'COORDINATOR' && session.user.userType !== 'CAMPUS_COORDINATOR') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Class Performance
      </h1>
      <CoordinatorClassPerformance />
    </div>
  );
}
