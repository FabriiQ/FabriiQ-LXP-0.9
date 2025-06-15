'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  ChevronRight,
  Edit,
  Trash,
  Copy,
  Eye,
  BookOpen,
  FileText,
  PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Activity type definition
interface Activity {
  id: string;
  title: string;
  description?: string;
  status: string;
  type?: string;
  activityType?: string;
  dueDate?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  subjectId?: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActivityCardProps {
  activity: Activity;
  classId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

/**
 * ActivityCard component for displaying an activity in the teacher portal
 *
 * Features:
 * - Responsive design
 * - Dark/light theme support
 * - Action buttons for edit, delete, duplicate
 * - Visual indicators for activity type and status
 */
export function ActivityCard({
  activity,
  classId,
  onEdit,
  onDelete,
  onDuplicate
}: ActivityCardProps) {
  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No date set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Get activity type icon
  const getTypeIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'quiz':
      case 'assessment':
        return <FileText className="h-4 w-4" />;
      case 'assignment':
        return <PenTool className="h-4 w-4" />;
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col transition-colors hover:border-primary/50 dark:hover:border-primary/30 dark:bg-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 text-foreground">{activity.title}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1 dark:bg-background/50 text-foreground">
            {getTypeIcon(activity.type)}
            <span>{activity.type || 'Activity'}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-2 flex-grow">
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {activity.description}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {activity.subject && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{activity.subject.name}</span>
            </div>
          )}

          {activity.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due: {formatDate(activity.dueDate)}</span>
            </div>
          )}

          {activity.startDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Start: {formatDate(activity.startDate)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t flex justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title="Edit"
            className="text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground h-8 w-8"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            title="Duplicate"
            className="text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground h-8 w-8"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Duplicate</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Delete"
            className="text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground h-8 w-8"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="transition-colors hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
        >
          <Link href={`/teacher/classes/${classId}/activities/${activity.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            <span>View</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
