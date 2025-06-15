"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";

interface FixStudentsCampusAccessProps {
  campusId: string;
}

export function FixStudentsCampusAccess({ campusId }: FixStudentsCampusAccessProps) {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();
  
  const fixStudentsMutation = api.student.fixStudentCampusAccess.useMutation({
    onSuccess: (data) => {
      setIsFixing(false);
      toast({
        title: "Students Fixed",
        description: `Fixed ${data.primaryCampusUpdated} primary campus IDs and ${data.campusAccessAdded} campus access records`,
        duration: 5000,
      });
    },
    onError: (error) => {
      setIsFixing(false);
      toast({
        title: "Error fixing students",
        description: error.message,
        variant: "error",
        duration: 5000,
      });
    }
  });
  
  const handleFixStudents = async () => {
    if (isFixing) return;
    setIsFixing(true);
    
    try {
      await fixStudentsMutation.mutate({ campusId });
    } catch (error) {
      // Error is handled in the mutation callbacks
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleFixStudents} 
      disabled={isFixing}
    >
      <Wrench className="mr-2 h-4 w-4" />
      {isFixing ? "Fixing..." : "Fix Student Access"}
    </Button>
  );
} 