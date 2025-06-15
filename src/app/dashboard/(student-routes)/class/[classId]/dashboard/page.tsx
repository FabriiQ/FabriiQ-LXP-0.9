'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect handler for dashboard/student/class/[classId]/dashboard path
 * 
 * This component redirects requests to /dashboard/student/class/[classId]/dashboard
 * to /student/class/[id]/dashboard to fix navigation issues
 * 
 * Using a route group (student-routes) to isolate this route from conflicting with
 * the main student routes that use [id] instead of [classId]
 */
export default function ClassDashboardRedirectPage() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Get the class ID from params
    const classId = params?.classId as string;
    
    // Redirect to the correct path
    if (classId) {
      router.replace(`/student/class/${classId}/dashboard`);
    } else {
      // Fallback to student classes page if no class ID
      router.replace('/student/classes');
    }
  }, [params, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to class dashboard...</p>
    </div>
  );
}
