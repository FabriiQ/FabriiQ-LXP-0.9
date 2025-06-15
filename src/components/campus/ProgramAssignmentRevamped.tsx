'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Program, ProgramCampus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/atoms/badge";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { useToast } from "@/components/ui/feedback/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";
import { Search, Plus, Check, Calendar, BookOpen, School } from "lucide-react";
// Import only what we need from tabs
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/utils/format";

interface ProgramWithAssignment extends Program {
  isAssigned?: boolean;
  assignmentId?: string;
  startDate?: Date;
  endDate?: Date | null;
  institutionName?: string; // Add institution name for display
}

interface ProgramAssignmentRevampedProps {
  campusId: string;
  allPrograms: Program[];
  assignedPrograms: (ProgramCampus & {
    program: Program;
  })[];
  campus: {
    id: string;
    institutionId: string;
  };
}

export function ProgramAssignmentRevamped({
  campusId,
  allPrograms,
  assignedPrograms,
  campus,
}: ProgramAssignmentRevampedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithAssignment | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'assign' | 'unassign'>('assign');

  // Combine all programs with assignment status
  const [programs, setPrograms] = useState<ProgramWithAssignment[]>([]);

  // Initialize programs with assignment status
  useEffect(() => {
    const assignedProgramIds = new Set(assignedPrograms.map(ap => ap.programId));

    // Fetch institution information for programs
    const fetchInstitutionInfo = async () => {
      try {
        // Get all unique institution IDs from programs
        const institutionIds = new Set(allPrograms.map(p => p.institutionId));

        // Fetch institution names (in a real app, this would be an API call)
        // For now, we'll just use a simple mapping
        const institutionNames: Record<string, string> = {};

        // Add institution names to programs
        const programsWithStatus = allPrograms.map(program => {
          const isAssigned = assignedProgramIds.has(program.id);
          const assignment = isAssigned
            ? assignedPrograms.find(ap => ap.programId === program.id)
            : undefined;

          return {
            ...program,
            isAssigned,
            assignmentId: assignment?.id,
            startDate: assignment?.startDate,
            endDate: assignment?.endDate,
            institutionName: program.institutionId === campus.institutionId
              ? 'This Institution'
              : `Institution ${program.institutionId.slice(0, 6)}`,
          };
        });

        setPrograms(programsWithStatus);
      } catch (error) {
        console.error('Error fetching institution info:', error);
      }
    };

    fetchInstitutionInfo();
  }, [allPrograms, assignedPrograms, campus.institutionId]);

  // Calculate program counts for each category
  const programCounts = {
    all: programs.length,
    assigned: programs.filter(p => p.isAssigned).length,
    unassigned: programs.filter(p => !p.isAssigned).length,
    thisInstitution: programs.filter(p => p.institutionId === campus.institutionId).length,
    otherInstitutions: programs.filter(p => p.institutionId !== campus.institutionId).length,
  };

  // Filter programs based on search term and active tab
  const filteredPrograms = programs.filter(program => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.institutionName && program.institutionName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "assigned") return matchesSearch && program.isAssigned;
    if (activeTab === "unassigned") return matchesSearch && !program.isAssigned;
    if (activeTab === "this-institution") return matchesSearch && program.institutionId === campus.institutionId;
    if (activeTab === "other-institutions") return matchesSearch && program.institutionId !== campus.institutionId;

    return matchesSearch;
  });

  // Use the TRPC mutation to assign a program to a campus
  const assignProgram = api.campus.assignProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program assigned successfully",
        variant: "success",
      });
      setSelectedProgram(null);
      setStartDate(new Date());
      setEndDate(undefined);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign program",
        variant: "error",
      });
    },
    onSettled: () => {
      setIsAssigning(false);
    }
  });

  // Use the TRPC mutation to unassign a program from a campus
  const unassignProgram = api.campus.unassignProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program unassigned successfully",
        variant: "success",
      });
      setSelectedProgram(null);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unassign program",
        variant: "error",
      });
    },
    onSettled: () => {
      setIsAssigning(false);
    }
  });

  // Handle program selection
  const handleSelectProgram = async (program: ProgramWithAssignment) => {
    setSelectedProgram(program);

    if (!program.isAssigned) {
      // If not assigned, set default dates for assignment
      setStartDate(new Date());
      setEndDate(undefined);
    }
  };

  // Show confirmation dialog for assignment
  const handleShowAssignConfirmation = () => {
    if (!selectedProgram) return;
    setConfirmAction('assign');
    setShowConfirmDialog(true);
  };

  // Handle confirm assignment
  const handleConfirmAssignment = async () => {
    if (!selectedProgram) return;

    try {
      setIsAssigning(true);
      setShowConfirmDialog(false);

      await assignProgram.mutateAsync({
        campusId,
        programId: selectedProgram.id,
        startDate,
        endDate,
      });

      // Update the local state to reflect the change
      setPrograms(prev =>
        prev.map(p =>
          p.id === selectedProgram.id
            ? { ...p, isAssigned: true, startDate, endDate }
            : p
        )
      );

    } catch (error) {
      console.error("Error assigning program:", error);
    }
  };

  // Show confirmation dialog for unassignment
  const handleShowUnassignConfirmation = () => {
    if (!selectedProgram) return;
    setConfirmAction('unassign');
    setShowConfirmDialog(true);
  };

  // Handle unassign program
  const handleUnassignProgram = async () => {
    if (!selectedProgram) return;

    try {
      setIsAssigning(true);
      setShowConfirmDialog(false);

      await unassignProgram.mutateAsync({
        campusId,
        programId: selectedProgram.id,
      });

      // Update the local state to reflect the change
      setPrograms(prev =>
        prev.map(p =>
          p.id === selectedProgram.id
            ? { ...p, isAssigned: false, startDate: undefined, endDate: undefined }
            : p
        )
      );

    } catch (error) {
      console.error("Error unassigning program:", error);
    }
  };

  // Handle cancel assignment
  const handleCancelAssignment = () => {
    setSelectedProgram(null);
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'assign' ? 'Assign Program' : 'Unassign Program'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'assign'
                ? `Are you sure you want to assign ${selectedProgram?.name} to this campus?`
                : `Are you sure you want to unassign ${selectedProgram?.name} from this campus? This may affect classes and courses.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === 'assign' ? handleConfirmAssignment : handleUnassignProgram}
              disabled={isAssigning}
              className={confirmAction === 'unassign' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isAssigning
                ? (confirmAction === 'assign' ? 'Assigning...' : 'Unassigning...')
                : (confirmAction === 'assign' ? 'Assign' : 'Unassign')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Search and filter */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full">
            <TabsTrigger value="all">All <Badge variant="outline" className="ml-1">{programCounts.all}</Badge></TabsTrigger>
            <TabsTrigger value="assigned">Assigned <Badge variant="outline" className="ml-1">{programCounts.assigned}</Badge></TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned <Badge variant="outline" className="ml-1">{programCounts.unassigned}</Badge></TabsTrigger>
            <TabsTrigger value="this-institution">This Inst. <Badge variant="outline" className="ml-1">{programCounts.thisInstitution}</Badge></TabsTrigger>
            <TabsTrigger value="other-institutions">Other <Badge variant="outline" className="ml-1">{programCounts.otherInstitutions}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Program assignment dialog */}
      {selectedProgram && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedProgram.isAssigned ? "Program Details" : "Assign Program"}</span>
              <Badge variant={selectedProgram.isAssigned ? "secondary" : "outline"}>
                {selectedProgram.code}
              </Badge>
            </CardTitle>
            <CardDescription>
              {selectedProgram.isAssigned
                ? `${selectedProgram.name} is currently assigned to this campus`
                : `Assign ${selectedProgram.name} to this campus`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProgram.isAssigned ? (
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Start Date: {formatDate(selectedProgram.startDate!)}</span>
                </div>
                {selectedProgram.endDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>End Date: {formatDate(selectedProgram.endDate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <DatePicker date={startDate} setDate={setStartDate} disabled={isAssigning} />
                  <p className="text-xs text-muted-foreground">
                    When will this program start at this campus?
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <DatePicker date={endDate} setDate={setEndDate} disabled={isAssigning} />
                  <p className="text-xs text-muted-foreground">
                    When will this program end at this campus? Leave blank for indefinite.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancelAssignment} disabled={isAssigning}>
              {selectedProgram.isAssigned ? "Close" : "Cancel"}
            </Button>
            {selectedProgram.isAssigned ? (
              <Button
                variant="destructive"
                onClick={handleShowUnassignConfirmation}
                disabled={isAssigning}
              >
                {isAssigning ? "Unassigning..." : "Unassign Program"}
              </Button>
            ) : (
              <Button
                onClick={handleShowAssignConfirmation}
                disabled={isAssigning}
              >
                {isAssigning ? "Assigning..." : "Assign Program"}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Programs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                program.isAssigned ? "bg-primary/5 border-primary/20" : ""
              }`}
              onClick={() => handleSelectProgram(program)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {program.name}
                    {program.institutionId !== campus.institutionId && program.institutionName && (
                      <span className="text-xs text-muted-foreground block">
                        From: {program.institutionName}
                      </span>
                    )}
                  </CardTitle>
                  <Badge variant={program.isAssigned ? "secondary" : "outline"}>
                    {program.code}
                  </Badge>
                </div>
                <CardDescription>{program.type}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <School className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Level: {program.level}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Duration: {program.duration} {program.duration === 1 ? 'year' : 'years'}</span>
                  </div>
                  {program.isAssigned && program.startDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Start: {formatDate(program.startDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  variant={program.isAssigned ? "secondary" : "default"}
                  className="w-full"
                  size="sm"
                >
                  {program.isAssigned ? (
                    <><Check className="h-4 w-4 mr-2" /> Assigned</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Assign Program</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No programs found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm
                ? "Try adjusting your search or filters"
                : "No programs available for this institution"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
