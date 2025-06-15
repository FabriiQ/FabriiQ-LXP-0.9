'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap } from 'lucide-react';

interface TeacherQualificationsTabProps {
  teacher: any;
}

export function TeacherQualificationsTab({ teacher }: TeacherQualificationsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subject Qualifications</CardTitle>
          <CardDescription>Subjects this teacher is qualified to teach</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.subjectQualifications && teacher.subjectQualifications.length > 0 ? (
            <div className="space-y-4">
              {teacher.subjectQualifications.map((qualification: any) => (
                <div key={qualification.id} className="flex items-start justify-between p-3 border rounded">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{qualification.subject?.name || 'Unknown Subject'}</p>
                      <p className="text-sm text-muted-foreground">
                        {qualification.level || 'No level specified'}
                      </p>
                    </div>
                  </div>
                  <Badge>{qualification.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No subject qualifications found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Qualifications</CardTitle>
          <CardDescription>Degrees and certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teacher.qualifications ? (
              <div className="space-y-2">
                {teacher.qualifications.split('\n').map((qualification: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded">
                    <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p>{qualification}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No academic qualifications found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>Professional certifications and licenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teacher.certifications ? (
              <div className="space-y-2">
                {teacher.certifications.split('\n').map((certification: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded">
                    <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p>{certification}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No certifications found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
