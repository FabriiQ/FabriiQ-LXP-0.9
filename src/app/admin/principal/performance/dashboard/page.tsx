import React from 'react';
import { PrincipalPerformanceDashboard } from '@/components/principal/dashboard/PrincipalPerformanceDashboard';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Principal Performance Dashboard',
  description: 'Campus-wide performance metrics and analytics for principals',
};

/**
 * Principal Performance Dashboard Page
 *
 * This page displays comprehensive performance metrics for the entire campus.
 * It's part of the admin/principal section and inherits the admin layout.
 */
export default async function PrincipalPerformanceDashboardPage() {
  // Check authentication
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if the user is a principal or admin
  if (session.user.userType !== 'PRINCIPAL' && session.user.userType !== 'CAMPUS_ADMIN') {
    redirect('/dashboard');
  }

  // For now, we'll use a default campus ID
  // In a real implementation, you would get this from the user's session or profile
  const campusId = "default-campus-id";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Performance Dashboard
      </h1>
      <PrincipalPerformanceDashboard campusId={campusId} />
    </div>
  );
}
