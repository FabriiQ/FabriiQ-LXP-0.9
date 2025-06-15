'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

export default function CoordinatorTransfersPage() {
  const router = useRouter();
  
  // Get current user's campus ID
  const { data: userData, isLoading } = api.user.getCurrent.useQuery();
  const campusId = userData?.primaryCampusId;

  useEffect(() => {
    if (!isLoading && campusId) {
      // Redirect to the campus admin transfers page
      router.push('/admin/campus/transfers');
    }
  }, [isLoading, campusId, router]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-center h-64">
        <p>Redirecting to transfers page...</p>
      </div>
    </div>
  );
}
