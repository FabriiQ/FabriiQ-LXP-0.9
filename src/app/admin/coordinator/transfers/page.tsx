import { Metadata } from 'next';
import { CoordinatorTransfersClient } from '@/components/coordinator/CoordinatorTransfersClient';

export const metadata: Metadata = {
  title: 'Student Transfers',
  description: 'Manage student transfers between classes and campuses',
};

/**
 * Student Transfers Page
 * 
 * This page allows coordinators to manage student transfers between classes and campuses.
 * It reuses existing transfer components from the campus admin portal.
 */
export default function CoordinatorTransfersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Student Transfers
      </h1>
      <CoordinatorTransfersClient />
    </div>
  );
}
