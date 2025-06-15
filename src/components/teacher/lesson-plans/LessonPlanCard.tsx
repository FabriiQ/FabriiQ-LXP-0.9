'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LessonPlanStatus, LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';

// Status badge component
export const StatusBadge = ({ status }: { status: LessonPlanStatus }) => {
  const getStatusColor = () => {
    switch (status) {
      case LessonPlanStatus.DRAFT:
        return 'bg-gray-200 text-gray-800';
      case LessonPlanStatus.SUBMITTED:
        return 'bg-blue-200 text-blue-800';
      case LessonPlanStatus.COORDINATOR_APPROVED:
        return 'bg-purple-200 text-purple-800';
      case LessonPlanStatus.APPROVED:
        return 'bg-green-200 text-green-800';
      case LessonPlanStatus.REJECTED:
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case LessonPlanStatus.DRAFT:
        return 'Draft';
      case LessonPlanStatus.SUBMITTED:
        return 'Submitted';
      case LessonPlanStatus.COORDINATOR_APPROVED:
        return 'Coordinator Approved';
      case LessonPlanStatus.APPROVED:
        return 'Approved';
      case LessonPlanStatus.REJECTED:
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Badge className={getStatusColor()}>
      {getStatusText()}
    </Badge>
  );
};

// Type for lesson plan card props
export interface LessonPlanCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: LessonPlanStatus;
  startDate: Date;
  endDate: Date;
  planType: LessonPlanType;
  className: string;
  subjectName?: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSubmit?: (id: string) => void;
}

// Lesson plan card component
export const LessonPlanCard = ({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  planType,
  className,
  subjectName,
  onView,
  onEdit,
  onSubmit
}: LessonPlanCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="line-clamp-2">
          {description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class:</span>
            <span className="font-medium">{className}</span>
          </div>
          {subjectName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subject:</span>
              <span className="font-medium">{subjectName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{planType === LessonPlanType.WEEKLY ? 'Weekly' : 'Monthly'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium">
              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onView(id)}>
          View
        </Button>
        <div className="space-x-2">
          {status === LessonPlanStatus.DRAFT && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
                Edit
              </Button>
              {onSubmit && (
                <Button variant="default" size="sm" onClick={() => onSubmit(id)}>
                  Submit
                </Button>
              )}
            </>
          )}
          {status === LessonPlanStatus.REJECTED && (
            <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
              Edit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
