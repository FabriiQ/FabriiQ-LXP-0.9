'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import { CampusCoordinatorsContent } from '@/components/admin/campus/CampusCoordinatorsContent';

export default function CampusCoordinatorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Get current user and their primary campus
  const { data: user, isLoading: isLoadingUser } = api.user.getCurrent.useQuery();
  const primaryCampusId = user?.primaryCampusId;

  // Get campus details
  const { data: campus, isLoading: isLoadingCampus } = api.campus.findById.useQuery(
    { campusId: primaryCampusId as string },
    { enabled: !!primaryCampusId }
  );

  useEffect(() => {
    if (!isLoadingUser && !user) {
      toast({
        title: 'Authentication Error',
        description: 'Please sign in to access this page',
        variant: 'error',
      });
      router.push('/auth/signin');
    } else if (!isLoadingUser && !isLoadingCampus) {
      setIsLoading(false);
    }
  }, [isLoadingUser, isLoadingCampus, user, router, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!campus) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-destructive">Error</h2>
          <p>Campus not found or you don't have access to this campus.</p>
        </div>
      </div>
    );
  }

  return <CampusCoordinatorsContent campus={campus} />;
}
