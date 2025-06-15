'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  MapPin,
  BookOpen,
  Calendar,
  Clock,
  School,
  Edit,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileDetailsProps {
  teacher: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    bio?: string;
    location?: string;
    joinedDate?: string;
    subjects?: { id: string; name: string }[];
    classCount?: number;
    studentCount?: number;
    language?: string;
    timezone?: string;
  };
  isEditable?: boolean;
  onEdit?: () => void;
  className?: string;
}

/**
 * ProfileDetails component for displaying teacher profile information
 *
 * Features:
 * - Avatar with fallback
 * - Bio and contact information
 * - Teaching statistics
 * - Subject badges
 * - Edit functionality if editable
 */
export function ProfileDetails({
  teacher,
  isEditable = false,
  onEdit,
  className
}: ProfileDetailsProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="relative">
        {isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit profile</span>
          </Button>
        )}

        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            {teacher.image && <AvatarImage src={teacher.image} alt={teacher.name} />}
            <AvatarFallback className="text-xl">{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>

          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl">{teacher.name}</CardTitle>
            {teacher.email && (
              <CardDescription className="flex items-center justify-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{teacher.email}</span>
              </CardDescription>
            )}
            {teacher.location && (
              <CardDescription className="flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{teacher.location}</span>
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bio */}
        {teacher.bio && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">About</h3>
            <p className="text-sm">{teacher.bio}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <School className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{teacher.classCount || 0}</span>
            <span className="text-xs text-muted-foreground">Classes</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{teacher.subjects?.length || 0}</span>
            <span className="text-xs text-muted-foreground">Subjects</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <Users className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{teacher.studentCount || 0}</span>
            <span className="text-xs text-muted-foreground">Students</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{teacher.joinedDate ? formatDate(teacher.joinedDate).split(' ')[0] : 'N/A'}</span>
            <span className="text-xs text-muted-foreground">Joined</span>
          </div>
        </div>

        {/* Subjects */}
        {teacher.subjects && teacher.subjects.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map(subject => (
                <Badge key={subject.id} variant="secondary">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Language:</span>
              <span>{teacher.language || 'English'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Timezone:</span>
              <span>{teacher.timezone || 'UTC'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Joined:</span>
              <span>{teacher.joinedDate ? formatDate(teacher.joinedDate) : 'Unknown'}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {isEditable && (
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
