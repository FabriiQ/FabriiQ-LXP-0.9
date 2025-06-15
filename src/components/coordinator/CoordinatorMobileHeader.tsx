'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { WifiOff, Wifi } from '@/components/ui/icons/custom-icons';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { isOnline } from '@/features/coordinator/offline/sync';

interface CoordinatorMobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export function CoordinatorMobileHeader({
  title,
  showBackButton = false,
  backUrl = '/admin/coordinator'
}: CoordinatorMobileHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [online, setOnline] = useState(isOnline());
  const [notificationCount, setNotificationCount] = useState(0);

  // Determine title based on pathname if not provided
  const pageTitle = title || getPageTitle(pathname || '');

  // Update online status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Simulate fetching notifications
  useEffect(() => {
    if (online) {
      // Simulate API call with random values for demo
      setNotificationCount(Math.floor(Math.random() * 10));
    }
  }, [online]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={cn(
      "flex items-center justify-between p-3 border-b md:hidden",
      !online && "bg-amber-50/20 border-b-amber-200"
    )}>
      <div className="flex items-center">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push(backUrl)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
        {!online && (
          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={session?.user?.name || 'User'} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name}</span>
                <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {online ? (
                <>
                  <Wifi className="mr-2 h-4 w-4 text-green-600" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="mr-2 h-4 w-4 text-amber-600" />
                  <span>Offline Mode</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Helper function to determine page title based on pathname
function getPageTitle(pathname: string): string {
  if (pathname === '/admin/coordinator') return 'Dashboard';
  if (pathname.includes('/teachers')) return 'Teachers';
  if (pathname.includes('/students')) return 'Students';
  if (pathname.includes('/classes')) return 'Classes';
  if (pathname.includes('/schedules')) return 'Schedule';
  return 'Coordinator Portal';
}
