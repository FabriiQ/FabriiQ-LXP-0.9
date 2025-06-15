'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/forms/select";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  expertise: string[];
  currentLoad: number;
}

interface TeacherAssignmentFormProps {
  classId: string;
  className: string;
  currentTeacherId?: string | null;
  onSuccess?: () => void;
}

export function TeacherAssignmentForm({
  classId,
  className,
  currentTeacherId,
  onSuccess
}: TeacherAssignmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(currentTeacherId || "");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch available teachers
  const { data: teachersData, isLoading: teachersLoading } = api.teacherAssignment.getAvailableTeachers.useQuery({
    classId,
  });

  // Assign teacher mutation
  const assignTeacher = api.teacherAssignment.assignTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher assigned successfully",
        variant: "success",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Unassign teacher mutation
  const unassignTeacher = api.teacherAssignment.unassignTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher unassigned successfully",
        variant: "success",
      });
      
      setSelectedTeacherId("");
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unassign teacher",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Filter teachers based on search term
  const filteredTeachers = teachersData?.teachers.filter(teacher => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      (teacher.specialization && teacher.specialization.toLowerCase().includes(searchLower)) ||
      teacher.expertise.some(exp => exp.toLowerCase().includes(searchLower))
    );
  }) || [];

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await assignTeacher.mutateAsync({
        classId,
        teacherId: selectedTeacherId,
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error assigning teacher:", error);
    }
  };

  const handleUnassign = async () => {
    setIsSubmitting(true);
    
    try {
      await unassignTeacher.mutateAsync({
        classId,
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error unassigning teacher:", error);
    }
  };

  // Set the current teacher as selected when data loads
  useEffect(() => {
    if (currentTeacherId) {
      setSelectedTeacherId(currentTeacherId);
    }
  }, [currentTeacherId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Assignment</CardTitle>
        <CardDescription>
          Assign a teacher to {className}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teachersLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Select a Teacher</h3>
              
              {filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                  {filteredTeachers.map((teacher) => (
                    <div 
                      key={teacher.id}
                      className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                        selectedTeacherId === teacher.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={teacher.name} />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {teacher.specialization && (
                          <Badge variant="outline" className="mb-1">
                            {teacher.specialization}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Current Load: {teacher.currentLoad} classes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No teachers found matching your search
                </p>
              )}
            </div>

            {teachersData?.courseInfo && (
              <div className="bg-muted p-3 rounded-md">
                <h3 className="text-sm font-medium mb-1">Course Information</h3>
                <p className="text-sm">
                  <span className="font-medium">{teachersData.courseInfo.name}</span> ({teachersData.courseInfo.code})
                </p>
                <p className="text-xs text-muted-foreground">
                  Level: {teachersData.courseInfo.level}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {currentTeacherId ? (
          <>
            <Button 
              variant="destructive" 
              onClick={handleUnassign}
              disabled={isSubmitting || unassignTeacher.isLoading}
            >
              {unassignTeacher.isLoading ? <LoadingSpinner size="sm" /> : "Unassign Teacher"}
            </Button>
            <Button 
              variant="default" 
              onClick={handleAssign}
              disabled={isSubmitting || assignTeacher.isLoading || selectedTeacherId === currentTeacherId}
            >
              {assignTeacher.isLoading ? <LoadingSpinner size="sm" /> : "Change Teacher"}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleAssign}
              disabled={isSubmitting || assignTeacher.isLoading || !selectedTeacherId}
            >
              {assignTeacher.isLoading ? <LoadingSpinner size="sm" /> : "Assign Teacher"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
