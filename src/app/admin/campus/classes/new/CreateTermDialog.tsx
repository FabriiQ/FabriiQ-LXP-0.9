'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/feedback/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { TermType, TermPeriod, SystemStatus } from "@prisma/client";
import { TRPCProvider } from "@/trpc/provider";

// Define interfaces for the component
interface AcademicCycleInfo {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date | null;
}

// Define the Term interface to match what's expected in CreateClassForm
interface Term {
  id: string;
  name: string;
  code: string;
  description: string | null;
  termType: TermType;
  termPeriod: TermPeriod;
  status: SystemStatus;
  startDate: Date;
  endDate: Date | null;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  schedulePatternId: string | null;
  academicCycle: {
    id: string;
    name: string;
    code: string;
    startDate: Date;
    endDate: Date | null;
  };
}

interface CreateTermDialogProps {
  courseId: string;
  academicCycleId: string;
  onTermCreated: (newTerm: Term) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicCycles: AcademicCycleInfo[];
}

export function CreateTermDialog({
  courseId,
  academicCycleId,
  onTermCreated,
  open,
  onOpenChange,
  academicCycles
}: CreateTermDialogProps) {
  return (
    <TRPCProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <TermDialogContent
            courseId={courseId}
            academicCycleId={academicCycleId}
            onTermCreated={onTermCreated}
            onOpenChange={onOpenChange}
            academicCycles={academicCycles}
          />
        </DialogContent>
      </Dialog>
    </TRPCProvider>
  );
}

type TermDialogContentProps = Omit<CreateTermDialogProps, 'open'>;

function TermDialogContent({
  courseId,
  academicCycleId,
  onTermCreated,
  onOpenChange,
  academicCycles
}: TermDialogContentProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  // Find the selected academic cycle
  const selectedAcademicCycle = academicCycles.find(ac => ac.id === academicCycleId);

  const createTerm = api.term.create.useMutation({
    onSuccess: (data) => {
      // Find the academic cycle from the provided academicCycles
      const academicCycle = academicCycles.find(ac => ac.id === academicCycleId);
      if (!academicCycle) {
        toast({
          title: "Error",
          description: "Academic cycle not found",
          variant: "error",
        });
        return;
      }

      // Create a complete Term object with academicCycle info
      const completeTermData: Term = {
        ...data,
        academicCycle: {
          id: academicCycle.id,
          name: academicCycle.name,
          code: academicCycle.code,
          startDate: academicCycle.startDate,
          endDate: academicCycle.endDate
        }
      } as Term; // Cast to Term to satisfy TypeScript

      toast({
        title: "Success",
        description: "Term created successfully",
      });
      onTermCreated(completeTermData);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
      });
      return;
    }

    // Validate dates are within academic cycle
    if (selectedAcademicCycle) {
      const cycleStartDate = new Date(selectedAcademicCycle.startDate);
      const cycleEndDate = selectedAcademicCycle.endDate ? new Date(selectedAcademicCycle.endDate) : null;

      if (startDate < cycleStartDate) {
        toast({
          title: "Error",
          description: `Term start date must be on or after academic cycle start date (${format(cycleStartDate, 'MMM dd, yyyy')})`,
          variant: "error",
        });
        return;
      }

      if (cycleEndDate && endDate > cycleEndDate) {
        toast({
          title: "Error",
          description: `Term end date must be on or before academic cycle end date (${format(cycleEndDate, 'MMM dd, yyyy')})`,
          variant: "error",
        });
        return;
      }
    }

    // Generate a unique code with timestamp to avoid conflicts
    const timestamp = new Date().getTime().toString().slice(-6);
    const termCode = `${name.toUpperCase().replace(/\s+/g, '-')}-${timestamp}`;

    // Submit the form
    createTerm.mutate({
      name,
      code: termCode,
      startDate,
      endDate,
      courseId,
      academicCycleId,
      termType: TermType.SEMESTER,
      termPeriod: TermPeriod.FALL,
      status: "ACTIVE"
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Term</DialogTitle>
      </DialogHeader>

      {selectedAcademicCycle && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-800 mb-1">Academic Cycle: {selectedAcademicCycle.name}</h4>
          <p className="text-sm text-blue-600">
            <span className="font-medium">Valid date range:</span> {format(new Date(selectedAcademicCycle.startDate), 'MMM dd, yyyy')} - {selectedAcademicCycle.endDate ? format(new Date(selectedAcademicCycle.endDate), 'MMM dd, yyyy') : 'No end date'}
          </p>
          <p className="text-xs text-blue-500 mt-1">Term dates must be within this academic cycle's date range.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name">Term Name</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter term name"
            required
          />
        </div>
        <div className="space-y-2">
          <label>Start Date</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            required
            fromDate={selectedAcademicCycle ? new Date(selectedAcademicCycle.startDate) : undefined}
            toDate={selectedAcademicCycle?.endDate ? new Date(selectedAcademicCycle.endDate) : undefined}
            helperText={selectedAcademicCycle ? `Must be on or after ${format(new Date(selectedAcademicCycle.startDate), 'MMM dd, yyyy')}` : undefined}
          />
        </div>
        <div className="space-y-2">
          <label>End Date</label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            required
            fromDate={startDate || (selectedAcademicCycle ? new Date(selectedAcademicCycle.startDate) : undefined)}
            toDate={selectedAcademicCycle?.endDate ? new Date(selectedAcademicCycle.endDate) : undefined}
            helperText={selectedAcademicCycle?.endDate ? `Must be on or before ${format(new Date(selectedAcademicCycle.endDate), 'MMM dd, yyyy')}` : undefined}
          />
        </div>
        <CreateButton type="submit" loading={createTerm.isLoading}>
          Create Term
        </CreateButton>
      </form>
    </>
  );
}
