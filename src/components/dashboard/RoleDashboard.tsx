"use client";

import React from 'react';
import { UserType } from '@prisma/client';
import { DashboardGreeting } from './DashboardGreeting';
import { DashboardMetrics } from './DashboardMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleDashboardProps {
  userName: string;
  userType: UserType;
  metrics?: {
    [key: string]: {
      value: string | number;
      description?: string;
    };
  };
  children?: React.ReactNode;
}

/**
 * A reusable role-based dashboard component that combines greeting, metrics, and custom content
 */
export function RoleDashboard({ userName, userType, metrics, children }: RoleDashboardProps) {
  // Role-specific dashboard sections
  const getRoleSections = () => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No recent activity</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'CAMPUS_ADMIN':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campus Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Performance metrics will appear here</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Staff Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Staff information will appear here</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'CAMPUS_COORDINATOR':
      case 'COORDINATOR':
        return null; // Using custom dashboard content
      case 'CAMPUS_TEACHER':
        return null; // Using custom dashboard content
      case 'CAMPUS_STUDENT':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No upcoming assignments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Grades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No recent grades</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'CAMPUS_PARENT':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Children's Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Progress information will appear here</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No upcoming events</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <DashboardGreeting userName={userName} userType={userType} />
      <DashboardMetrics userType={userType} metrics={metrics} />
      {getRoleSections()}
      {children}
    </div>
  );
}