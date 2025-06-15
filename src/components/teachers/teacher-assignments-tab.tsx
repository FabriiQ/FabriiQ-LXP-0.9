'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { BookOpen, Calendar, Users } from 'lucide-react';

interface TeacherAssignmentsTabProps {
  teacher: any;
}

export function TeacherAssignmentsTab({ teacher }: TeacherAssignmentsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Class Assignments</CardTitle>
          <CardDescription>Classes this teacher is assigned to</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.assignments && teacher.assignments.length > 0 ? (
            <div className="space-y-4">
              {teacher.assignments.map((assignment: any) => (
                <div key={assignment.id} className="p-4 border rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{assignment.class?.name || 'Unknown Class'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.class?.code || 'No code'} - {assignment.isPrimary ? 'Home Teacher' : 'Subject Teacher'}
                      </p>
                    </div>
                    <Badge variant={assignment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Since {format(new Date(assignment.startDate), 'MMM dd, yyyy')}</span>
                    </div>

                    {assignment.endDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Until {format(new Date(assignment.endDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{assignment.class?.studentCount || 0} students</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/system/classes/${assignment.classId}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Class
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No class assignments found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Schedule</CardTitle>
          <CardDescription>Weekly teaching schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Schedule information will be displayed here.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/admin/system/teachers/${teacher.id}/schedule`}>
              <Calendar className="h-4 w-4 mr-2" />
              View Full Schedule
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
