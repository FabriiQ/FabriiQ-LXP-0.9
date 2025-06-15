"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { ActivityPurpose } from "@prisma/client";
import { useState } from "react";

interface ExportControlsProps {
  worksheetId: string;
}

export function ExportControls({ worksheetId }: ExportControlsProps) {
  const [classId, setClassId] = useState<string>("");
  const [activityType, setActivityType] = useState<ActivityPurpose>(ActivityPurpose.LEARNING);
  const [isGradable, setIsGradable] = useState<boolean>(false);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [passingScore, setPassingScore] = useState<number>(60);
  
  const { toast } = useToast();
  
  // Fetch classes for the teacher
  const { data: classes, isLoading: isLoadingClasses } = api.class.getTeacherClasses.useQuery();
  
  // Mutation for converting worksheet to activity
  const { mutate: convertToActivity, isLoading: isConverting } = api.worksheet.convertToActivity.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worksheet has been converted to an activity.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert worksheet to activity.",
        variant: "destructive",
      });
    },
  });
  
  const handleExport = () => {
    if (!classId) {
      toast({
        title: "Error",
        description: "Please select a class.",
        variant: "destructive",
      });
      return;
    }
    
    convertToActivity({
      worksheetId,
      classId,
      activityType,
      isGradable: activityType === ActivityPurpose.ASSESSMENT ? true : isGradable,
      maxScore: isGradable ? maxScore : undefined,
      passingScore: isGradable ? passingScore : undefined,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class">Select Class</Label>
            {isLoadingClasses ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="activityType">Activity Type</Label>
            <Select 
              value={activityType} 
              onValueChange={(value) => {
                setActivityType(value as ActivityPurpose);
                if (value === ActivityPurpose.ASSESSMENT) {
                  setIsGradable(true);
                }
              }}
            >
              <SelectTrigger id="activityType">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ActivityPurpose.LEARNING}>Learning Activity</SelectItem>
                <SelectItem value={ActivityPurpose.ASSESSMENT}>Assessment</SelectItem>
                <SelectItem value={ActivityPurpose.PRACTICE}>Practice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {activityType !== ActivityPurpose.ASSESSMENT && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGradable"
                checked={isGradable}
                onChange={(e) => setIsGradable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isGradable">Make Gradable</Label>
            </div>
          )}
          
          {isGradable && (
            <>
              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score</Label>
                <input
                  type="number"
                  id="maxScore"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score</Label>
                <input
                  type="number"
                  id="passingScore"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  min="1"
                  max={maxScore}
                />
              </div>
            </>
          )}
          
          <Button 
            className="w-full mt-2" 
            onClick={handleExport}
            disabled={isConverting || !classId}
          >
            {isConverting ? "Converting..." : "Export to Activity"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
