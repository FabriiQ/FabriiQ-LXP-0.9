"use client";

import React from 'react';
import { UserType } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/data-display/card';

interface DashboardGreetingProps {
  userName: string;
  userType: UserType;
}

/**
 * A reusable dashboard greeting component that displays a personalized greeting
 * based on the user's name and role.
 */
export function DashboardGreeting({ userName, userType }: DashboardGreetingProps) {
  // Get role-specific greeting
  const getRoleGreeting = () => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return 'System Administrator';
      case 'SYSTEM_MANAGER':
        return 'System Manager';
      case 'CAMPUS_ADMIN':
        return 'Campus Administrator';
      case 'CAMPUS_COORDINATOR':
        return 'Campus Coordinator';
      case 'CAMPUS_TEACHER':
        return 'Teacher';
      case 'CAMPUS_STUDENT':
        return 'Student';
      case 'CAMPUS_PARENT':
        return 'Parent';
      default:
        return 'User';
    }
  };

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h1 className="text-3xl font-bold mb-2">
          {getTimeBasedGreeting()}, {userName}!
        </h1>
        <p className="text-muted-foreground">
          Welcome to your {getRoleGreeting()} dashboard. Here's an overview of your activities and important information.
        </p>
      </CardContent>
    </Card>
  );
}