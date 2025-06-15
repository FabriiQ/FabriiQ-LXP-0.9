'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Plus, Pencil, BookOpen, X } from "lucide-react";
import { SubjectAssociation } from "./SubjectAssociation";
import { api } from "@/trpc/react";
import { SystemStatus } from "@/server/api/constants";
import { useToast } from "@/components/ui/feedback/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubjectForm } from "@/components/admin/subjects/SubjectForm";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubjectListProps {
  courseId: string;
  onSubjectsChange?: () => void;
}

export function SubjectList({ courseId, onSubjectsChange }: SubjectListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Fetch subjects for this course
  const { data: subjectsData, isLoading, refetch } = api.course.listSubjects.useQuery(
    { courseId },
    { enabled: !!courseId }
  );

  // Handle opening the edit dialog
  const handleEditSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setIsEditDialogOpen(true);
  };

  // Handle closing dialogs and refreshing data
  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedSubjectId(null);
    refetch().then(() => {
      if (onSubjectsChange) {
        onSubjectsChange();
      }
    });
  };

  // Get the selected subject for editing
  const selectedSubject = subjectsData?.subjects.find(
    (subject) => subject.id === selectedSubjectId
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Course Subjects</h3>
        <div className="flex space-x-2">
          <SubjectAssociation
            courseId={courseId}
            onSubjectsChange={() => refetch()}
          />
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={!courseId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Subject
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <p>Loading subjects...</p>
        </div>
      ) : subjectsData?.subjects && subjectsData.subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectsData.subjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    {subject.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Code: {subject.code}
                  </p>
                </div>
                <Badge variant={subject.status === SystemStatus.ACTIVE ? "success" : "secondary"}>
                  {subject.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    Credits: {subject.credits}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSubject(subject.id)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No subjects added to this course yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={!courseId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to this course. Subjects are used to organize course content.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-1">
              <SubjectForm
                initialData={{ courseId }}
                onSuccess={handleDialogClose}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject details.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-1">
              {selectedSubject && (
                <SubjectForm
                  initialData={{
                    code: selectedSubject.code,
                    name: selectedSubject.name,
                    credits: selectedSubject.credits,
                    courseId: selectedSubject.courseId,
                    status: selectedSubject.status,
                    syllabus: selectedSubject.syllabus || {},
                  }}
                  subjectId={selectedSubject.id}
                  onSuccess={handleDialogClose}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
