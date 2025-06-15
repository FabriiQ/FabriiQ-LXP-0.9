





"use client";

import React from 'react';
import { UserType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

function MetricCard({ title, value, description, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  userType: UserType;
  metrics?: {
    [key: string]: {
      value: string | number;
      description?: string;
    };
  };
}

/**
 * A reusable dashboard metrics component that displays role-specific metrics
 */
export function DashboardMetrics({ userType, metrics }: DashboardMetricsProps) {
  // Default metrics based on user role
  const getDefaultMetrics = () => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return {
          institutions: { value: 5, description: 'Total institutions' },
          campuses: { value: 12, description: 'Total campuses' },
          users: { value: 1250, description: 'Total users' },
          courses: { value: 87, description: 'Active courses' }
        };
      case 'CAMPUS_ADMIN':
        return {
          teachers: { value: 45, description: 'Active teachers' },
          students: { value: 850, description: 'Enrolled students' },
          classes: { value: 32, description: 'Active classes' },
          programs: { value: 8, description: 'Active programs' }
        };
      case 'CAMPUS_COORDINATOR':
        return {
          programs: { value: 4, description: 'Managed programs' },
          courses: { value: 16, description: 'Active courses' },
          teachers: { value: 18, description: 'Assigned teachers' },
          students: { value: 320, description: 'Enrolled students' }
        };
      case 'CAMPUS_TEACHER':
        return {
          classes: { value: 5, description: 'Active classes' },
          students: { value: 120, description: 'Enrolled students' },
          assignments: { value: 8, description: 'Pending assignments' },
          assessments: { value: 3, description: 'Upcoming assessments' }
        };
      case 'CAMPUS_STUDENT':
        return {
          courses: { value: 6, description: 'Enrolled courses' },
          assignments: { value: 4, description: 'Pending assignments' },
          assessments: { value: 2, description: 'Upcoming assessments' },
          attendance: { value: '95%', description: 'Attendance rate' }
        };
      case 'CAMPUS_PARENT':
        return {
          children: { value: 2, description: 'Registered children' },
          meetings: { value: 1, description: 'Upcoming meetings' },
          reports: { value: 3, description: 'New reports' },
          messages: { value: 5, description: 'Unread messages' }
        };
      default:
        return {
          notifications: { value: 3, description: 'Unread notifications' },
          tasks: { value: 5, description: 'Pending tasks' },
          messages: { value: 2, description: 'Unread messages' },
          updates: { value: 4, description: 'System updates' }
        };
    }
  };

  const displayMetrics = metrics || getDefaultMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Object.entries(displayMetrics).map(([key, metric]) => (
        <MetricCard
          key={key}
          title={key.charAt(0).toUpperCase() + key.slice(1)}
          value={metric.value}
          description={metric.description}
        />
      ))}
    </div>
  );
}