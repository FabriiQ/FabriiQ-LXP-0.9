'use client';

import { StudentShell } from '@/components/ui/specialized/role-based/student-shell';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/register-sw';
import { GlobalLoadingIndicator } from '@/components/ui/loading-indicator';
import { ContextChangeToast } from '@/components/ui/context-toast';
import { isClassSpecificPage } from '@/utils/path-utils';
import { StudentAssistantProvider } from '@/features/student-assistant';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Check if user is authenticated and is a student
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const userType = session.user.userType;
      // If not a student type, redirect to appropriate dashboard
      if (userType && userType !== 'CAMPUS_STUDENT' && userType !== 'STUDENT') {
        console.log('User is not a student, redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  // Handle navigation
  const handleNavigate = (path: string) => {
    router.push(`/student${path}`);
  };

  // Get notifications count (placeholder for now)
  const notificationsCount = 0;

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student portal...</p>
        </div>
      </div>
    );
  }

  // Check if we're on a class-specific page
  const isClassPage = isClassSpecificPage(pathname || '');

  // For class-specific pages, don't wrap with StudentShell to avoid navigation conflicts
  // TEMP: Removed ViewTransitionProvider to troubleshoot loading issues
  if (isClassPage) {
    return (
      <StudentAssistantProvider>
        {/* Main content */}
        {children}
      </StudentAssistantProvider>
    );
  }

  // For non-class pages, use the StudentShell
  return (
    <StudentShell
      user={{
        name: session?.user?.name || 'Student',
        email: session?.user?.email || '',
        avatar: '', // Use a default avatar or leave empty
      }}
      title="Student Portal"
      onNavigate={handleNavigate}
      currentPath={pathname || ''}
      notifications={notificationsCount}
    >
      {/* Global components for navigation experience */}
      <GlobalLoadingIndicator />
      <ContextChangeToast />

      {/* Wrap content with StudentAssistantProvider */}
      <StudentAssistantProvider>
        {/* Main content */}
        {children}
      </StudentAssistantProvider>
    </StudentShell>
  );
}
