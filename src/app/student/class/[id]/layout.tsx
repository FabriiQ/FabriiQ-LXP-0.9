'use client';

import { ReactNode } from 'react';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { useParams, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/providers/theme-provider';
import { TimeTrackingProvider } from '@/components/providers/TimeTrackingProvider';
import Link from 'next/link';
import { ChevronLeft, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StudentThemeSelector } from '@/components/student/StudentThemeSelector';
import { StudentAssistantProvider } from '@/features/student-assistant';

interface ClassLayoutProps {
  children: ReactNode;
}

/**
 * Layout for class-specific pages in the student portal
 *
 * This layout includes:
 * - StudentBottomNav for navigation
 * - Consistent back navigation with profile menu
 * - Page title area
 *
 * Features:
 * - Mental model consistency with predictable element positioning
 * - Spatial memory support with consistent back navigation
 * - Reduced cognitive load with clear location indicators
 * - Profile menu with sign out functionality
 */
export default function ClassLayout({ children }: ClassLayoutProps) {
  const params = useParams();
  const classId = params?.id as string || "";
  const { data: session } = useSession();

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <ThemeProvider>
      <TimeTrackingProvider>
        <div className="min-h-screen bg-background">
          {/* Header with back navigation and profile menu */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto p-4 flex items-center justify-between">
              <Link
                href="/student/classes"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Classes
              </Link>

              {/* Profile menu and theme selector */}
              <div className="flex items-center gap-2">
                <StudentThemeSelector />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                        <AvatarFallback>{getInitials(session?.user?.name || 'User')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.location.href = '/student/profile'}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <main className="pb-20">
            <StudentAssistantProvider>
              {children}
            </StudentAssistantProvider>
          </main>

          <StudentBottomNav classId={classId} />
        </div>
      </TimeTrackingProvider>
    </ThemeProvider>
  );
}
