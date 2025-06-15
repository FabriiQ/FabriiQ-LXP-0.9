import React from 'react';
import { Metadata } from 'next';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';

export const metadata: Metadata = {
  title: "Performance Analytics | Teacher Dashboard",
  description: "Academic performance metrics and trends for your class"
};

interface PerformanceAnalyticsLayoutProps {
  children: React.ReactNode;
  params: {
    classId: string;
  };
}

export default function PerformanceAnalyticsLayout({ children, params }: PerformanceAnalyticsLayoutProps) {
  // Create tabs for the ClassNav component
  const tabs = [
    {
      id: 'analytics',
      name: 'Analytics',
      href: `/teacher/classes/${params.classId}/analytics`,
      icon: () => <span>📊</span>,
    },
    // Add other tabs as needed
  ];

  return (
    <div>
      <ClassNav tabs={tabs} />
      {children}
    </div>
  );
}
