'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { School, Users } from 'lucide-react';

interface TeacherClassesTabProps {
  teacher: any;
  availableClasses: any[];
  isAssignClassDialogOpen: boolean;
  setIsAssignClassDialogOpen: (open: boolean) => void;
  selectedClass: string;
  setSelectedClass: (classId: string) => void;
  handleAssignClass: () => void;
}

export function TeacherClassesTab({
  teacher,
  availableClasses,
  isAssignClassDialogOpen,
  setIsAssignClassDialogOpen,
  selectedClass,
  setSelectedClass,
  handleAssignClass
}: TeacherClassesTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Class Assignments</CardTitle>
          <CardDescription>Classes this teacher is assigned to teach</CardDescription>
        </div>
        <Dialog open={isAssignClassDialogOpen} onOpenChange={setIsAssignClassDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Users className="h-4 w-4 mr-2" />
              Assign to Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign to Class</DialogTitle>
              <DialogDescription>
                Select a class to assign this teacher to.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} ({classItem.courseCampus?.course?.name || 'Unknown course'})
                    </SelectItem>
                  )) || (
                    <SelectItem value="no-classes" disabled>
                      No available classes
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignClassDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignClass} disabled={!selectedClass}>
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {teacher.assignments && teacher.assignments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacher.assignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.class.name}</TableCell>
                  <TableCell>
                    <Badge variant={assignment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(assignment.startDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/classes/${assignment.class.id}`}>
                        <School className="h-4 w-4 mr-2" />
                        View Class
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Class Assignments</h3>
            <p className="text-muted-foreground mb-4">
              This teacher is not assigned to any classes yet.
            </p>
            <Button onClick={() => setIsAssignClassDialogOpen(true)}>
              Assign to Class
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
