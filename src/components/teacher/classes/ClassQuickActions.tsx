'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  Award, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface ClassQuickActionsProps {
  classId: string;
  className?: string;
}

/**
 * ClassQuickActions component for displaying quick action cards
 * 
 * Features:
 * - Responsive grid layout
 * - Visual indicators for actions (icons, colors)
 * - Consistent card design
 * - Touch-friendly buttons
 */
export function ClassQuickActions({ classId, className }: ClassQuickActionsProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  
  const quickActions: QuickAction[] = [
    {
      id: 'take-attendance',
      label: 'Take Attendance',
      description: 'Record student attendance for today',
      icon: <Calendar className="h-5 w-5" />,
      href: `/teacher/classes/${classId}/attendance`,
      color: 'primary',
      variant: 'default'
    },
    {
      id: 'create-activity',
      label: 'Create Activity',
      description: 'Add a new learning activity',
      icon: <FileText className="h-5 w-5" />,
      href: `/teacher/content-studio?classId=${classId}`,
      color: 'secondary',
      variant: 'outline'
    },
    {
      id: 'create-assessment',
      label: 'Create Assessment',
      description: 'Add a new assessment',
      icon: <ClipboardList className="h-5 w-5" />,
      href: `/teacher/classes/${classId}/assessments/new`,
      color: 'secondary',
      variant: 'outline'
    },
    {
      id: 'message-students',
      label: 'Message Students',
      description: 'Send a message to the class',
      icon: <MessageSquare className="h-5 w-5" />,
      href: `/teacher/classes/${classId}/messages`,
      color: 'secondary',
      variant: 'outline'
    }
  ];
  
  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4",
      className
    )}>
      {quickActions.map((action) => (
        <Card key={action.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-full",
                action.color === 'primary' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary/10 text-secondary"
              )}>
                {action.icon}
              </div>
              <CardTitle className="text-base">{action.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{action.description}</CardDescription>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant={action.variant || 'default'} 
              className="w-full"
              onClick={() => router.push(action.href)}
            >
              {action.label}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
