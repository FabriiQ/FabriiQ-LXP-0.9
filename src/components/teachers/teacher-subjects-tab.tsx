'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

interface TeacherSubjectsTabProps {
  teacher: any;
  subjects: any[];
  isAssignSubjectDialogOpen: boolean;
  setIsAssignSubjectDialogOpen: (open: boolean) => void;
  selectedSubject: string;
  setSelectedSubject: (subjectId: string) => void;
  handleAssignSubject: () => void;
}

export function TeacherSubjectsTab({
  teacher,
  subjects,
  isAssignSubjectDialogOpen,
  setIsAssignSubjectDialogOpen,
  selectedSubject,
  setSelectedSubject,
  handleAssignSubject
}: TeacherSubjectsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Subject Qualifications</CardTitle>
          <CardDescription>Subjects this teacher is qualified to teach</CardDescription>
        </div>
        <Dialog open={isAssignSubjectDialogOpen} onOpenChange={setIsAssignSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subject Qualification</DialogTitle>
              <DialogDescription>
                Select a subject this teacher is qualified to teach.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  )) || (
                    <SelectItem value="no-subjects" disabled>
                      No available subjects
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignSubjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignSubject} disabled={!selectedSubject}>
                Add Qualification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {teacher.subjectQualifications && teacher.subjectQualifications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacher.subjectQualifications.map((qualification: any) => (
                <TableRow key={qualification.id}>
                  <TableCell className="font-medium">{qualification.subject.name}</TableCell>
                  <TableCell>{qualification.level}</TableCell>
                  <TableCell>
                    {qualification.isVerified ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-amber-500 mr-2" />
                        <span>Pending</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/subjects/${qualification.subject.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Subject
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Subject Qualifications</h3>
            <p className="text-muted-foreground mb-4">
              This teacher doesn't have any subject qualifications yet.
            </p>
            <Button onClick={() => setIsAssignSubjectDialogOpen(true)}>
              Add Subject Qualification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
