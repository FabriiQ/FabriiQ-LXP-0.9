'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Plus, Check, BookOpen, Search, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: SystemStatus;
  courseId?: string;
}

interface SubjectAssociationProps {
  courseId: string;
  onSubjectsChange?: () => void;
}

export function SubjectAssociation({ courseId, onSubjectsChange }: SubjectAssociationProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all subjects
  const { data: allSubjectsData, isLoading: isLoadingAllSubjects } = api.subject.getAllSubjects.useQuery();

  // Fetch subjects already associated with this course
  const { data: courseSubjectsData, isLoading: isLoadingCourseSubjects, refetch: refetchCourseSubjects } = 
    api.course.listSubjects.useQuery({ courseId }, { enabled: !!courseId });

  // Associate subjects mutation
  const associateSubjectsMutation = api.course.associateSubjects.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subjects associated successfully",
        variant: "success",
      });
      refetchCourseSubjects();
      setIsDialogOpen(false);
      setSelectedSubjectIds([]);
      if (onSubjectsChange) {
        onSubjectsChange();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to associate subjects",
        variant: "error",
      });
      setIsSubmitting(false);
    }
  });

  // Filter subjects that are not already associated with the course
  const availableSubjects = allSubjectsData?.filter(subject => 
    !courseSubjectsData?.subjects.some(courseSubject => courseSubject.id === subject.id) &&
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Handle association submission
  const handleAssociateSubjects = async () => {
    if (selectedSubjectIds.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one subject to associate",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    await associateSubjectsMutation.mutateAsync({
      courseId,
      subjectIds: selectedSubjectIds
    });
  };

  // Reset selected subjects when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setSelectedSubjectIds([]);
      setSearchTerm('');
    }
  }, [isDialogOpen]);

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={!courseId}
      >
        <Plus className="h-4 w-4 mr-2" />
        Associate Existing Subjects
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Associate Existing Subjects</DialogTitle>
            <DialogDescription>
              Select subjects to associate with this course.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {isLoadingAllSubjects || isLoadingCourseSubjects ? (
              <div className="flex justify-center p-4">
                <p>Loading subjects...</p>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">
                  {searchTerm ? "No matching subjects found" : "No available subjects to associate"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSubjects.map((subject) => (
                  <Card key={subject.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={selectedSubjectIds.includes(subject.id)}
                          onCheckedChange={() => toggleSubjectSelection(subject.id)}
                        />
                        <div>
                          <Label 
                            htmlFor={`subject-${subject.id}`}
                            className="font-medium cursor-pointer flex items-center"
                          >
                            <BookOpen className="h-4 w-4 mr-2 text-primary" />
                            {subject.name}
                          </Label>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>Code: {subject.code}</span>
                            <span>•</span>
                            <span>Credits: {subject.credits}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={subject.status === SystemStatus.ACTIVE ? "success" : "secondary"}>
                        {subject.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssociateSubjects} 
              disabled={selectedSubjectIds.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Associating..." : "Associate Selected Subjects"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
