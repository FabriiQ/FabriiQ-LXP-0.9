import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/atoms/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
import { Badge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { 
  TeacherData, 
  TeacherAction, 
  UserRole, 
  getEnabledActionsForRole 
} from './types';
import { Mail, Phone, MapPin, BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeacherCardProps {
  teacher: TeacherData;
  userRole: UserRole;
  viewMode?: 'full' | 'compact' | 'list';
  actions?: TeacherAction[];
  onAction?: (action: TeacherAction, teacher: TeacherData) => void;
  className?: string;
}

/**
 * TeacherCard component
 * 
 * Displays a teacher's information in a card format.
 * Adapts based on the user's role and the specified view mode.
 */
const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  userRole,
  viewMode = 'full',
  actions,
  onAction,
  className
}) => {
  // Use provided actions or get default actions for the user role
  const enabledActions = actions || getEnabledActionsForRole(userRole);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      case 'DELETED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  // Handle action click
  const handleAction = (action: TeacherAction) => {
    if (onAction) {
      onAction(action, teacher);
    }
  };

  // Render compact view
  if (viewMode === 'compact') {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={teacher.avatar} alt={teacher.name} />
            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{teacher.name}</CardTitle>
            <CardDescription className="text-xs truncate">{teacher.email}</CardDescription>
          </div>
          <Badge className={cn("text-xs", getStatusColor(teacher.status))}>
            {teacher.status}
          </Badge>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2 pt-2">
          {enabledActions.includes(TeacherAction.VIEW) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleAction(TeacherAction.VIEW)}
            >
              View
            </Button>
          )}
          {enabledActions.includes(TeacherAction.EDIT) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAction(TeacherAction.EDIT)}
            >
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Render list view
  if (viewMode === 'list') {
    return (
      <Card className={cn("w-full flex flex-row items-center p-4", className)}>
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={teacher.avatar} alt={teacher.name} />
          <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium">{teacher.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 mr-1" />
            <span className="truncate">{teacher.email}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center mx-4">
          {teacher.campusName && (
            <div className="flex items-center text-sm text-muted-foreground mr-4">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{teacher.campusName}</span>
            </div>
          )}
          {teacher.subjectQualifications && (
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              <span>{teacher.subjectQualifications.length} subjects</span>
            </div>
          )}
        </div>
        <Badge className={cn("mr-4", getStatusColor(teacher.status))}>
          {teacher.status}
        </Badge>
        <div className="flex gap-2">
          {enabledActions.includes(TeacherAction.VIEW) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleAction(TeacherAction.VIEW)}
            >
              View
            </Button>
          )}
          {enabledActions.includes(TeacherAction.EDIT) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAction(TeacherAction.EDIT)}
            >
              Edit
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Render full view (default)
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={teacher.avatar} alt={teacher.name} />
            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{teacher.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {teacher.email}
            </CardDescription>
            {teacher.phone && (
              <CardDescription className="flex items-center mt-1">
                <Phone className="h-3.5 w-3.5 mr-1" />
                {teacher.phone}
              </CardDescription>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <Badge className={getStatusColor(teacher.status)}>
            {teacher.status}
          </Badge>
          {teacher.campusName && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {teacher.campusName}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Role-specific content */}
        {(userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && (
          <>
            {teacher.subjectQualifications && teacher.subjectQualifications.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Subject Qualifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjectQualifications.map(subject => (
                    <Badge key={subject.id} variant="outline" className="text-xs">
                      {subject.subjectName}
                      {subject.level && ` (${subject.level})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {teacher.classCount !== undefined && (
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span>{teacher.classCount} Classes</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        {enabledActions.includes(TeacherAction.VIEW) && (
          <Button 
            variant="ghost" 
            onClick={() => handleAction(TeacherAction.VIEW)}
          >
            View
          </Button>
        )}
        {enabledActions.includes(TeacherAction.EDIT) && (
          <Button 
            variant="outline" 
            onClick={() => handleAction(TeacherAction.EDIT)}
          >
            Edit
          </Button>
        )}
        {enabledActions.includes(TeacherAction.DELETE) && (
          <Button 
            variant="destructive" 
            onClick={() => handleAction(TeacherAction.DELETE)}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TeacherCard;
