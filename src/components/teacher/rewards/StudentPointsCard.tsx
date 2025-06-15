'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Award,
  TrendingUp,
  ChevronRight,
  Calendar,
  Clock,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

export interface StudentPointsData {
  id: string;
  name: string;
  profileImage?: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  level?: number;
  lastPointsAwarded?: {
    amount: number;
    source: string;
    description: string;
    timestamp: Date;
  };
}

interface StudentPointsCardProps {
  student: StudentPointsData;
  onViewHistory?: (studentId: string) => void;
  className?: string;
}

export function StudentPointsCard({
  student,
  onViewHistory,
  className
}: StudentPointsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={student.profileImage} alt={student.name} />
              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{student.name}</CardTitle>
              {student.level && (
                <CardDescription className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Level {student.level}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-lg text-amber-600">{student.totalPoints || 0}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>This Week</span>
            </div>
            <div className="font-semibold text-sm">{student.weeklyPoints} points</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>This Month</span>
            </div>
            <div className="font-semibold text-sm">{student.monthlyPoints} points</div>
          </div>
        </div>

        {student.lastPointsAwarded ? (
          <div className="mt-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last awarded:</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="px-1 py-0 h-5 text-xs">
                  +{student.lastPointsAwarded.amount}
                </Badge>
                <span className="truncate max-w-[150px]">
                  {student.lastPointsAwarded.description}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {formatDistanceToNow(student.lastPointsAwarded.timestamp, { addSuffix: true })}
                    </p>
                    <p className="text-xs">Source: {student.lastPointsAwarded.source}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>No points awarded yet</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-muted-foreground text-xs">
                Award points to this student to see their history
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 w-full sm:w-auto"
          onClick={() => onViewHistory?.(student.id)}
        >
          View History
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Grid component to display multiple student cards
interface StudentPointsGridProps {
  students: StudentPointsData[];
  onViewHistory?: (studentId: string) => void;
  className?: string;
}

export function StudentPointsGrid({
  students,
  onViewHistory,
  className
}: StudentPointsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4", className)}>
      {students.map(student => (
        <StudentPointsCard
          key={student.id}
          student={student}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
}
