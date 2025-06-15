'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/forms/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { UserType } from "@prisma/client";

interface Coordinator {
  id: string;
  name: string;
  email: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface AssignProgramToCoordinatorProps {
  coordinators: Coordinator[];
  programs: Program[];
  campuses: Campus[];
  onSuccess?: () => void;
}

export function AssignProgramToCoordinator({
  coordinators,
  programs,
  campuses,
  onSuccess
}: AssignProgramToCoordinatorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [role, setRole] = useState<string>("PROGRAM_COORDINATOR");
  const [responsibilities, setResponsibilities] = useState<string>("");

  const assignProgram = api.coordinator.assignProgram.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: `Program assigned to coordinator successfully with ${data.coursesAssigned || 0} courses`,
          variant: "success",
        });

        // Reset form
        setSelectedCoordinator("");
        setSelectedProgram("");
        setSelectedCampus("");
        setRole("PROGRAM_COORDINATOR");
        setResponsibilities("");

        if (onSuccess) {
          onSuccess();
        }
      } else if (data.alreadyAssigned) {
        toast({
          title: "Warning",
          description: data.message || "Program is already assigned to this coordinator",
          variant: "warning",
        });
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign program",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoordinator || !selectedProgram || !selectedCampus) {
      toast({
        title: "Error",
        description: "Please select a coordinator, program, and campus",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await assignProgram.mutateAsync({
        coordinatorId: selectedCoordinator,
        programId: selectedProgram,
        campusId: selectedCampus,
        role,
        responsibilities: responsibilities.split('\n').filter(r => r.trim() !== ""),
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error assigning program:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Program to Coordinator</CardTitle>
        <CardDescription>
          Assign a program at a specific campus to a coordinator
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coordinator">Coordinator</Label>
            <Select
              value={selectedCoordinator}
              onValueChange={setSelectedCoordinator}
            >
              <SelectTrigger id="coordinator">
                <SelectValue placeholder="Select a coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((coordinator) => (
                  <SelectItem key={coordinator.id} value={coordinator.id}>
                    {coordinator.name} ({coordinator.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
            >
              <SelectTrigger id="program">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campus">Campus</Label>
            <Select
              value={selectedCampus}
              onValueChange={setSelectedCampus}
            >
              <SelectTrigger id="campus">
                <SelectValue placeholder="Select a campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name} ({campus.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROGRAM_COORDINATOR">Program Coordinator</SelectItem>
                <SelectItem value="PROGRAM_DIRECTOR">Program Director</SelectItem>
                <SelectItem value="PROGRAM_ASSISTANT">Program Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
            <Textarea
              id="responsibilities"
              placeholder="Enter responsibilities, one per line"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner size="sm" /> : "Assign Program"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
