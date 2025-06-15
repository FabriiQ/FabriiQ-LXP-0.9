import { Metadata } from 'next';
import { NotificationCenter } from '@/components/coordinator/NotificationCenter';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'View and manage notifications for the coordinator portal',
};

/**
 * Notifications Page
 * 
 * This page displays notifications for the coordinator.
 * It uses a client component for interactive elements.
 */
export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Notifications
      </h1>
      <NotificationCenter />
    </div>
  );
}
