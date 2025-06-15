'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect handler for dashboard/student/* paths
 * 
 * This component redirects any requests to /dashboard/student/* to /student/*
 * to fix navigation issues with the student portal
 */
export default function StudentRedirectPage() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Get the path from params
    const pathSegments = params?.path as string[] || [];
    
    // Construct the new path
    const newPath = `/student/${pathSegments.join('/')}`;
    
    // Redirect to the new path
    router.replace(newPath);
  }, [params, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to student portal...</p>
    </div>
  );
}
