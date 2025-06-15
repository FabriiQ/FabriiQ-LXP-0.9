'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';
import { ClassBottomNav } from '@/components/teacher/navigation/ClassBottomNav';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Award,
  BarChart,
  LayoutGrid,
  Medal,
  BookMarked,
  Gift,
  Coins,
  Brain,
  LineChart,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ClassLayoutProps {
  children: React.ReactNode;
}

export default function ClassLayout({ children }: ClassLayoutProps) {
  // Use the useParams hook for client components
  const params = useParams();
  const classId = params.classId as string;

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/teacher/classes/${classId}`,
      icon: LayoutGrid,
    },
    {
      id: 'students',
      name: 'Students',
      href: `/teacher/classes/${classId}/students`,
      icon: Users,
    },
    {
      id: 'subjects',
      name: 'Subjects',
      href: `/teacher/classes/${classId}/subjects`,
      icon: BookOpen,
    },
    {
      id: 'activities',
      name: 'Activities',
      href: `/teacher/classes/${classId}/activities`,
      icon: FileText,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      href: `/teacher/classes/${classId}/assessments`,
      icon: ClipboardList,
    },
    {
      id: 'lesson-plans',
      name: 'Lesson Plans',
      href: `/teacher/classes/${classId}/lesson-plans`,
      icon: BookMarked,
    },
    {
      id: 'attendance',
      name: 'Attendance',
      href: `/teacher/classes/${classId}/attendance`,
      icon: Calendar,
    },
    {
      id: 'grades',
      name: 'Grades',
      href: `/teacher/classes/${classId}/grades`,
      icon: Award,
    },
    {
      id: 'rewards',
      name: 'Rewards',
      href: `/teacher/classes/${classId}/rewards`,
      icon: Coins,
    },
    {
      id: 'reports',
      name: 'Reports',
      href: `/teacher/classes/${classId}/reports`,
      icon: BarChart,
    },
    {
      id: 'bloom-analytics',
      name: 'Bloom\'s Analytics',
      href: `/teacher/classes/${classId}/bloom-analytics`,
      icon: Brain,
    },
    {
      id: 'bloom-reports',
      name: 'Bloom\'s Reports',
      href: `/teacher/classes/${classId}/bloom-reports`,
      icon: LineChart,
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      href: `/teacher/classes/${classId}/leaderboard`,
      icon: Medal,
    },
  ];

  return (
    <div className="h-full flex relative">
      {/* Class Navigation - responsive (handles mobile/desktop internally) */}
      <ClassNav tabs={tabs} />

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-6 pt-16 md:pt-4">
        <ErrorBoundary
          fallback={
            <div className="p-4 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong while loading this page. Please try refreshing.
                </AlertDescription>
              </Alert>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
