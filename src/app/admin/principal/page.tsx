import { Metadata } from 'next';
import { PrincipalDashboardClient } from '@/components/principal/PrincipalDashboardClient';

export const metadata: Metadata = {
  title: 'Principal Dashboard',
  description: 'Campus-wide analytics and performance monitoring for principals',
};

/**
 * Principal Dashboard Page
 * 
 * This is the main dashboard page for the principal portal.
 * It provides a comprehensive overview of campus performance metrics.
 * It uses a client component for interactive elements.
 */
export default function PrincipalDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Principal Dashboard
      </h1>
      <PrincipalDashboardClient />
    </div>
  );
}
