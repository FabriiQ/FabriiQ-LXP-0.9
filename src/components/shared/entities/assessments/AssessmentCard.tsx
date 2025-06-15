import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Award, 
  Tag, 
  BarChart, 
  Users, 
  Home as Building 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Badge } from '@/components/ui/core/badge';
import { Button } from '@/components/ui/core/button';
import { 
  Assessment, 
  AssessmentStatus, 
  AssessmentType, 
  AssessmentGradingType 
} from './types';

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: AssessmentStatus) => {
  switch (status) {
    case AssessmentStatus.PUBLISHED:
      return 'success';
    case AssessmentStatus.DRAFT:
      return 'secondary';
    case AssessmentStatus.SCHEDULED:
      return 'warning';
    case AssessmentStatus.ARCHIVED:
      return 'outline';
    default:
      return 'default';
  }
};

// Helper function to get type badge variant
const getTypeBadgeVariant = (type: AssessmentType) => {
  switch (type) {
    case AssessmentType.QUIZ:
      return 'default';
    case AssessmentType.EXAM:
      return 'destructive';
    case AssessmentType.SURVEY:
      return 'secondary';
    case AssessmentType.ASSIGNMENT:
      return 'warning';
    case AssessmentType.PRACTICE:
      return 'outline';
    default:
      return 'default';
  }
};

// Helper function to get grading type badge variant
const getGradingTypeBadgeVariant = (gradingType: AssessmentGradingType) => {
  switch (gradingType) {
    case AssessmentGradingType.AUTOMATIC:
      return 'default';
    case AssessmentGradingType.MANUAL:
      return 'secondary';
    case AssessmentGradingType.MIXED:
      return 'warning';
    case AssessmentGradingType.NONE:
      return 'outline';
    default:
      return 'default';
  }
};

export interface AssessmentCardProps {
  assessment: Assessment;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onAnalytics?: () => void;
  onAssign?: () => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  showStats?: boolean;
  showTags?: boolean;
  showDates?: boolean;
  showCourse?: boolean;
  showClass?: boolean;
}

export function AssessmentCard({
  assessment,
  onView,
  onEdit,
  onDelete,
  onPreview,
  onPublish,
  onArchive,
  onDuplicate,
  onAnalytics,
  onAssign,
  className = '',
  compact = false,
  showActions = true,
  showStats = true,
  showTags = true,
  showDates = true,
  showCourse = true,
  showClass = true,
}: AssessmentCardProps) {
  // Format dates
  const formattedDueDate = assessment.dueDate 
    ? format(assessment.dueDate, 'MMM d, yyyy')
    : null;
  
  const formattedAvailableFrom = assessment.availableFrom 
    ? format(assessment.availableFrom, 'MMM d, yyyy')
    : null;
  
  const formattedAvailableTo = assessment.availableTo 
    ? format(assessment.availableTo, 'MMM d, yyyy')
    : null;

  return (
    <Card className={`overflow-hidden ${className} ${compact ? 'h-full' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold line-clamp-2">
              {assessment.title}
            </CardTitle>
            {!compact && assessment.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {assessment.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1 ml-2">
            <Badge variant={getStatusBadgeVariant(assessment.status) as any}>
              {assessment.status}
            </Badge>
            <Badge variant={getTypeBadgeVariant(assessment.type) as any}>
              {assessment.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {!compact && showStats && (
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{assessment.activities.length} Activities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{assessment.totalPoints} Points</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {assessment.timeLimit ? `${assessment.timeLimit} min` : 'No time limit'}
              </span>
            </div>
          </div>
        )}
        
        {compact && (
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{assessment.activities.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{assessment.totalPoints} pts</span>
            </div>
            {assessment.timeLimit && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{assessment.timeLimit} min</span>
              </div>
            )}
          </div>
        )}
        
        {!compact && showDates && (
          <div className="space-y-1 mb-4">
            {formattedDueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Due: {formattedDueDate}</span>
              </div>
            )}
            {(formattedAvailableFrom || formattedAvailableTo) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Available: {formattedAvailableFrom || 'Anytime'} 
                  {formattedAvailableTo ? ` to ${formattedAvailableTo}` : ''}
                </span>
              </div>
            )}
          </div>
        )}
        
        {!compact && showTags && assessment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            <Tag className="h-4 w-4 text-muted-foreground mr-1" />
            {assessment.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {!compact && (showCourse || showClass) && (
          <div className="space-y-1 mb-4">
            {showCourse && assessment.courseId && (
              <div className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Course: {assessment.courseId}</span>
              </div>
            )}
            {showClass && assessment.classId && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Class: {assessment.classId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-wrap gap-2 pt-2">
          {onView && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onView}
              className="flex-1 min-w-[80px]"
            >
              View
            </Button>
          )}
          
          {onEdit && assessment.status !== AssessmentStatus.ARCHIVED && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex-1 min-w-[80px]"
            >
              Edit
            </Button>
          )}
          
          {onPreview && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPreview}
              className="flex-1 min-w-[80px]"
            >
              Preview
            </Button>
          )}
          
          {onAnalytics && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAnalytics}
              className="flex-1 min-w-[80px]"
            >
              Analytics
            </Button>
          )}
          
          {onAssign && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAssign}
              className="flex-1 min-w-[80px]"
            >
              Assign
            </Button>
          )}
          
          {onPublish && assessment.status === AssessmentStatus.DRAFT && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPublish}
              className="flex-1 min-w-[80px]"
            >
              Publish
            </Button>
          )}
          
          {onArchive && assessment.status !== AssessmentStatus.ARCHIVED && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onArchive}
              className="flex-1 min-w-[80px]"
            >
              Archive
            </Button>
          )}
          
          {onDuplicate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDuplicate}
              className="flex-1 min-w-[80px]"
            >
              Duplicate
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onDelete}
              className="flex-1 min-w-[80px]"
            >
              Delete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
