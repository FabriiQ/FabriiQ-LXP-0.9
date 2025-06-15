'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Bell,
  FileText,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isOnline } from '@/features/coordinator/offline/sync';

export interface BottomNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
  notification?: boolean;
}

export function CoordinatorBottomNav() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    schedules: 0,
    lessonPlans: 0,
    rewards: 0
  });
  const [online, setOnline] = useState(isOnline());

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
    // In a real app, this would be a real API call or subscription
    const fetchNotifications = async () => {
      if (online) {
        // Simulate API call with random values for demo
        setNotifications({
          teachers: Math.floor(Math.random() * 5),
          students: Math.floor(Math.random() * 3),
          classes: Math.floor(Math.random() * 2),
          schedules: Math.floor(Math.random() * 2),
          lessonPlans: Math.floor(Math.random() * 3),
          rewards: Math.floor(Math.random() * 2)
        });
      }
    };

    fetchNotifications();

    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [online]);

  const items: BottomNavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: '/admin/coordinator'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Teachers',
      href: '/admin/coordinator/teachers',
      badge: notifications.teachers,
      notification: notifications.teachers > 0
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: 'Students',
      href: '/admin/coordinator/students',
      badge: notifications.students,
      notification: notifications.students > 0
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Courses',
      href: '/admin/coordinator/courses',
      badge: notifications.classes,
      notification: notifications.classes > 0
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'Rewards',
      href: '/admin/coordinator/teacher-rewards',
      badge: notifications.rewards,
      notification: notifications.rewards > 0
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Lesson Plans',
      href: '/admin/coordinator/lesson-plans',
      badge: notifications.lessonPlans,
      notification: notifications.lessonPlans > 0
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Schedule',
      href: '/admin/coordinator/schedules',
      badge: notifications.schedules,
      notification: notifications.schedules > 0
    }
  ];

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-[100] flex h-16 items-center justify-around border-t bg-background px-2 md:hidden',
      'pb-safe', // Add safe area padding for notched devices
      !online && 'border-t-amber-200 bg-amber-50/20' // Visual indicator for offline mode
    )}>
      {items.map((item) => {
        const isActive = pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex h-full w-full flex-col items-center justify-center space-y-1 px-2 py-1 transition-colors touch-target',
              isActive
                ? 'text-primary after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-8 after:-translate-x-1/2 after:rounded-t-full after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              'relative h-6 w-6',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.icon}
              {item.notification && (
                <Badge
                  variant="destructive"
                  className="absolute -right-2 -top-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
