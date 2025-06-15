'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    description?: string;
    activityType: string;
    subject?: string;
    topic?: string;
    createdAt: string;
    dueDate?: string;
    status: 'draft' | 'published' | 'archived';
    completionRate?: number;
    averageScore?: number;
    lessonPlan?: {
      id: string;
      title: string;
    };
  };
  className?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAssign?: (id: string) => void;
}

/**
 * ActivityCard component for displaying activity information
 *
 * Features:
 * - Consistent card design
 * - Status badge
 * - Completion and score metrics
 * - Action buttons
 * - Dropdown menu for additional actions
 */
export function ActivityCard({
  activity,
  className,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onAssign
}: ActivityCardProps) {
  const router = useRouter();

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get activity type icon
  const getActivityTypeIcon = () => {
    switch (activity.activityType.toLowerCase()) {
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      case 'quiz':
      case 'multiple choice':
        return <CheckCircle className="h-4 w-4" />;
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (activity.status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor()}>
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </Badge>
              {activity.lessonPlan && (
                <Badge variant="outline">
                  Lesson Plan
                </Badge>
              )}
            </div>
            <CardTitle className="line-clamp-1">{activity.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {activity.description || `${activity.activityType} activity`}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(activity.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Activity
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(activity.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Activity
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(activity.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onAssign && activity.status === 'draft' && (
                <DropdownMenuItem onClick={() => onAssign(activity.id)}>
                  <Users className="mr-2 h-4 w-4" />
                  Assign to Class
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(activity.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              {getActivityTypeIcon()}
              <span>{activity.activityType}</span>
            </div>

            {activity.subject && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{activity.subject}</span>
              </div>
            )}

            {activity.dueDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(activity.dueDate)}</span>
              </div>
            )}
          </div>

          {activity.completionRate !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completion Rate</span>
                <span className="font-medium">{activity.completionRate}%</span>
              </div>
              <Progress value={activity.completionRate} className="h-2" />
            </div>
          )}

          {activity.averageScore !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Score</span>
                <span className="font-medium">{activity.averageScore}%</span>
              </div>
              <Progress value={activity.averageScore} className="h-2" />
            </div>
          )}

          {activity.lessonPlan && (
            <div className="text-sm">
              <span className="text-muted-foreground">Part of: </span>
              <span className="font-medium">{activity.lessonPlan.title}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onView && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(activity.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        )}

        {onEdit && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(activity.id)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
