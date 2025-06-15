'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/atoms/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { BookOpen, GraduationCap, Mail, Phone } from 'lucide-react';
import { TeacherStatusToggle } from './teacher-status-toggle';

interface TeacherProfileCardProps {
  teacher: any;
  showStatusToggle?: boolean;
}

export function TeacherProfileCard({ teacher, showStatusToggle = false }: TeacherProfileCardProps) {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://avatar.vercel.sh/${teacher.user?.name}`} alt={teacher.user?.name || 'Teacher'} />
            <AvatarFallback>{teacher.user?.name?.substring(0, 2).toUpperCase() || 'T'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{teacher.user?.name || 'Unnamed'}</CardTitle>
            <CardDescription>{teacher.specialization || 'Teacher'}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{teacher.user?.email || 'No email'}</span>
          </div>

          {teacher.user?.phoneNumber && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{teacher.user.phoneNumber}</span>
            </div>
          )}

          <div className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{teacher.subjectQualifications?.length || 0} subject qualifications</span>
          </div>

          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{teacher.assignments?.length || 0} class assignments</span>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Status</h4>
            {showStatusToggle ? (
              <TeacherStatusToggle
                teacherId={teacher.id}
                initialStatus={teacher.user?.status || 'INACTIVE'}
              />
            ) : (
              <Badge variant={teacher.user?.status === 'ACTIVE' ? 'success' : 'destructive'}>
                {teacher.user?.status || 'UNKNOWN'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
