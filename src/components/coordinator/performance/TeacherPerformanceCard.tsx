'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WifiOff } from '@/components/ui/icons/custom-icons';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface TeacherPerformanceCardProps {
  teacher: {
    id: string;
    name: string;
    profileImage?: string;
    subjects: string[];
    activityCount: number;
    activityPercentage: number;
    improvementRate: number;
    classPerformance: number;
  };
  onSelect: () => void;
  isSelected: boolean;
  isOffline?: boolean;
}

export function TeacherPerformanceCard({
  teacher,
  onSelect,
  isSelected,
  isOffline = false
}: TeacherPerformanceCardProps) {
  const { isMobile } = useResponsive();

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Teacher info */}
        <div className={cn(
          "flex gap-4",
          isMobile ? "flex-col items-center text-center" : "items-center"
        )}>
          <Avatar className={cn(
            "h-12 w-12",
            isMobile && "mx-auto"
          )}>
            <AvatarImage src={teacher.profileImage} alt={teacher.name} />
            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>

          <div className={cn(
            isMobile ? "text-center w-full" : "flex-1"
          )}>
            <h3 className="font-medium">{teacher.name}</h3>
            <p className="text-sm text-muted-foreground">{teacher.subjects.join(', ')}</p>
          </div>

          {!isMobile && (
            <Button variant="ghost" size="sm">
              View Profile
            </Button>
          )}
        </div>

        {/* Offline indicator */}
        {isOffline && (
          <div className="mt-2 flex items-center justify-center">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Data
            </Badge>
          </div>
        )}

        {/* Performance metrics */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>Activity Creation</span>
              <span className="font-medium">{teacher.activityCount}</span>
            </div>
            <Progress value={teacher.activityPercentage} className="h-2 mt-1" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Student Improvement</span>
              <span className="font-medium">{teacher.improvementRate}%</span>
            </div>
            <Progress value={teacher.improvementRate} className="h-2 mt-1" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Class Performance</span>
              <span className="font-medium">{teacher.classPerformance}%</span>
            </div>
            <Progress value={teacher.classPerformance} className="h-2 mt-1" />
          </div>
        </div>

        {/* Mobile-only action button */}
        {isMobile && (
          <Button className="w-full mt-4" variant="outline" size="sm">
            View Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
