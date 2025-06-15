'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';

interface TeacherOverviewTabProps {
  teacher: any;
}

export function TeacherOverviewTab({ teacher }: TeacherOverviewTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
              <dd className="mt-1">{teacher.user?.name || 'Not provided'}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1">{teacher.user?.email || 'Not provided'}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Specialization</dt>
              <dd className="mt-1">{teacher.specialization || 'Not specified'}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">System ID</dt>
              <dd className="mt-1 text-xs font-mono">{teacher.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Class Assignments</CardTitle>
            <CardDescription>Classes this teacher is assigned to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teacher.assignments && teacher.assignments.length > 0 ? (
                teacher.assignments.slice(0, 3).map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{assignment.class.name}</p>
                      <p className="text-sm text-muted-foreground">Since {format(new Date(assignment.startDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <Badge>{assignment.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No class assignments</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href="#" onClick={() => document.querySelector('[data-value="classes"]')?.click()}>
                View all assignments
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Subject Qualifications</CardTitle>
            <CardDescription>Subjects this teacher is qualified to teach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teacher.subjectQualifications && teacher.subjectQualifications.length > 0 ? (
                teacher.subjectQualifications.slice(0, 3).map((qualification: any) => (
                  <div key={qualification.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{qualification.subject.name}</p>
                      <p className="text-sm text-muted-foreground">Level: {qualification.level}</p>
                    </div>
                    <Badge variant={qualification.isVerified ? 'success' : 'secondary'}>
                      {qualification.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No subject qualifications</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href="#" onClick={() => document.querySelector('[data-value="subjects"]')?.click()}>
                View all qualifications
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
