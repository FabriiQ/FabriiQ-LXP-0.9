'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BookOpen,
  Activity,
  Settings,
  Trophy
} from 'lucide-react';

interface ClassLayoutProps {
  children: ReactNode;
  classId: string;
  className?: string;
  activeTab?: string;
}

export function ClassLayout({ children, classId, className, activeTab }: ClassLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/admin/campus/classes/${classId}`,
      icon: LayoutDashboard,
    },
    {
      id: 'students',
      name: 'Students',
      href: `/admin/campus/classes/${classId}/students`,
      icon: Users,
    },
    {
      id: 'schedule',
      name: 'Schedule',
      href: `/admin/campus/classes/${classId}/schedule`,
      icon: Calendar,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      href: `/admin/campus/classes/${classId}/assessments`,
      icon: ClipboardList,
    },
    {
      id: 'activities',
      name: 'Activities',
      href: `/admin/campus/classes/${classId}/activities`,
      icon: Activity,
    },
    {
      id: 'subjects',
      name: 'Subjects',
      href: `/admin/campus/classes/${classId}/subjects`,
      icon: BookOpen,
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      href: `/admin/campus/classes/${classId}/leaderboard`,
      icon: Trophy,
    },
    {
      id: 'settings',
      name: 'Settings',
      href: `/admin/campus/classes/${classId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <nav className="w-64 border-r h-full bg-background sticky top-0">
        <div className="p-4">
          <h2 className="font-semibold">Class Navigation</h2>
        </div>
        <ul className="space-y-1 p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || pathname === tab.href;
            const Icon = tab.icon;

            return (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Main content */}
      <main className={cn("flex-1 overflow-auto", className)}>
        {children}
      </main>
    </div>
  );
}