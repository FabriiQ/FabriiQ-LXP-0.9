import React from 'react';
import { Metadata } from 'next';
import { ClassNavigation } from '@/components/teacher/classes/ClassNavigation';

export const metadata: Metadata = {
  title: "Class Analytics | Teacher Dashboard",
  description: "Analytics and insights for your class"
};

interface ClassAnalyticsLayoutProps {
  children: React.ReactNode;
  params: {
    classId: string;
  };
}

export default function ClassAnalyticsLayout({ children, params }: ClassAnalyticsLayoutProps) {
  return (
    <div>
      <ClassNavigation classId={params.classId} activeTab="analytics" />
      {children}
    </div>
  );
}
