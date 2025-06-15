import React from 'react';
import { Metadata } from 'next';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';

export const metadata: Metadata = {
  title: "Bloom's Taxonomy Analytics | Teacher Dashboard",
  description: "Analyze student performance across Bloom's Taxonomy cognitive levels"
};

interface BloomsAnalyticsLayoutProps {
  children: React.ReactNode;
  params: {
    classId: string;
  };
}

export default function BloomsAnalyticsLayout({ children, params }: BloomsAnalyticsLayoutProps) {
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
