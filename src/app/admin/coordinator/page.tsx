import { Metadata } from 'next';
import { CoordinatorDashboardClient } from '@/components/coordinator/CoordinatorDashboardClient';

export const metadata: Metadata = {
  title: 'Coordinator Dashboard',
  description: 'Manage programs, teachers, and students with real-time analytics',
};

/**
 * Coordinator Dashboard Page
 * 
 * This is the main dashboard page for the coordinator portal.
 * It uses a client component for interactive elements.
 */
export default function CoordinatorDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Coordinator Dashboard
      </h1>
      <CoordinatorDashboardClient />
    </div>
  );
}
