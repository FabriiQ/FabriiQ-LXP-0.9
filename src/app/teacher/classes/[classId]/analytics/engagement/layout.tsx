import React from 'react';
import { Metadata } from 'next';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';

export const metadata: Metadata = {
  title: "Student Engagement Analytics | Teacher Dashboard",
  description: "Participation and engagement metrics for your class"
};

interface EngagementAnalyticsLayoutProps {
  children: React.ReactNode;
  params: {
    classId: string;
  };
}

export default function EngagementAnalyticsLayout({ children, params }: EngagementAnalyticsLayoutProps) {
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
