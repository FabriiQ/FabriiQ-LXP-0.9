'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Program, SystemStatus, Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExtendedProgram extends Omit<Program, 'settings' | 'curriculum'> {
  description?: string | null;
  settings?: Prisma.JsonValue | null;
  curriculum?: Prisma.JsonValue | null;
}

interface ProgramDetailProps {
  program: ExtendedProgram;
}

export function ProgramDetail({ program }: ProgramDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const deleteProgram = api.program.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program deleted successfully",
        variant: "success",
      });
      router.push("/admin/system/academic/programs");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete program",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case SystemStatus.ACTIVE:
        return "bg-green-500";
      case SystemStatus.INACTIVE:
        return "bg-yellow-500";
      case SystemStatus.ARCHIVED:
        return "bg-gray-500";
      case SystemStatus.DELETED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const settings = program.settings as any || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{program.name}</h2>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/academic/programs/${program.id}/edit`)}
          >
            Edit Program
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Program</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the program
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteProgram.mutate({ id: program.id })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Program Code</p>
              <p className="font-medium">{program.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{program.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="font-medium">{program.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{program.duration} months</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(program.status)}>
                {program.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Credit Requirements</p>
              <p className="font-medium">{settings.creditRequirements || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Concurrent Enrollment</p>
              <p className="font-medium">
                {settings.allowConcurrentEnrollment ? "Allowed" : "Not Allowed"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prerequisites</p>
              <p className="font-medium">
                {settings.requirePrerequisites ? "Required" : "Not Required"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grading Scheme</p>
              <p className="font-medium">{settings.gradingScheme || "STANDARD"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {program.description || "No description provided"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Program Curriculum</CardTitle>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/system/academic/programs/${program.id}/curriculum`)}
              >
                Manage Curriculum
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Curriculum content will be implemented in a separate component */}
            <p className="text-muted-foreground">
              Click "Manage Curriculum" to view and edit the program curriculum.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
