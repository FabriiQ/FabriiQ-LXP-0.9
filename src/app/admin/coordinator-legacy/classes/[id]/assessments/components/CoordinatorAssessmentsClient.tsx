'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CoordinatorAssessmentsClientProps {
  classId: string;
  className: string;
  assessments: any[];
}

export function CoordinatorAssessmentsClient({
  classId,
  className,
  assessments,
}: CoordinatorAssessmentsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{className}</h1>
          <p className="text-muted-foreground">Manage class assessments</p>
        </div>
        <Button asChild>
          <Link href={`/admin/coordinator/classes/${classId}/assessments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Link>
        </Button>
      </div>

      {/* Assessment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assessments created for this class
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.filter(a => new Date(a.dueDate) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assessments due in the future
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.filter(a => new Date(a.dueDate) < new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assessments that are past due
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No assessments view */}
      {assessments.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No assessments yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first assessment to evaluate student progress.
          </p>
          <Link href={`/admin/coordinator/classes/${classId}/assessments/new`}>
            <Button>
              Create Assessment
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assessment List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.type}</TableCell>
                    <TableCell>
                      {format(new Date(assessment.dueDate), 'MMM dd yyyy')}
                    </TableCell>
                    <TableCell>{assessment.createdBy?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assessment.status === 'ACTIVE'
                            ? 'default'
                            : assessment.status === 'DRAFT'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {assessment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/coordinator/classes/${classId}/assessments/${assessment.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
