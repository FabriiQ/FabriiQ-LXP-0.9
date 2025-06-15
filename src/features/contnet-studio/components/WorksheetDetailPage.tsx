"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ActivityPurpose } from "@prisma/client";
import { Download, FileText, BookOpen, ClipboardCheck } from "lucide-react";

interface WorksheetDetailPageProps {
  worksheet: any;
}

export function WorksheetDetailPage({ worksheet }: WorksheetDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [activityType, setActivityType] = useState<string>(ActivityPurpose.LEARNING);
  const [isGradable, setIsGradable] = useState<boolean>(false);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [passingScore, setPassingScore] = useState<number>(60);

  // Fetch teacher's classes
  const { data: teacherClasses } = api.teacher.getTeacherClasses.useQuery(
    { teacherId: worksheet.teacherId },
    { enabled: !!worksheet.teacherId }
  );

  // Mutation for converting worksheet to activity
  const { mutate: convertToActivity } = api.aiContentStudio.convertToActivity.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Worksheet has been converted to an activity.",
        variant: "success",
      });
      router.push(`/teacher/classes/${selectedClassId}/activities/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert worksheet to activity.",
        variant: "error",
      });
    },
  });

  // Handle conversion to activity
  const handleConvertToActivity = () => {
    if (!selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class.",
        variant: "error",
      });
      return;
    }

    convertToActivity({
      worksheetId: worksheet.id,
      classId: selectedClassId,
      activityType: activityType as ActivityPurpose,
      isGradable,
      maxScore,
      passingScore,
    });
  };

  // Render worksheet content based on its structure
  const renderWorksheetContent = () => {
    try {
      const content = worksheet.content;

      if (!content || !content.sections) {
        return (
          <div className="text-muted-foreground text-center py-8">
            No content available for this worksheet.
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {content.sections.map((section: any, index: number) => {
            if (section.type === "instructions") {
              return (
                <div key={index} className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2">Instructions</h3>
                  <p>{section.content}</p>
                </div>
              );
            } else if (section.type === "questions") {
              return (
                <div key={index} className="space-y-4">
                  <h3 className="text-lg font-medium">Questions</h3>
                  {section.questions.map((question: any, qIndex: number) => {
                    return (
                      <Card key={qIndex} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <p className="font-medium">{qIndex + 1}. {question.question}</p>

                            {question.type === "multiple_choice" && (
                              <div className="space-y-2 pl-4">
                                {question.options.map((option: string, oIndex: number) => (
                                  <div key={oIndex} className="flex items-center">
                                    <input
                                      type="radio"
                                      id={`q${qIndex}-o${oIndex}`}
                                      name={`q${qIndex}`}
                                      className="mr-2"
                                      disabled
                                      defaultChecked={oIndex === question.correctAnswer}
                                    />
                                    <label htmlFor={`q${qIndex}-o${oIndex}`}>{option}</label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.type === "short_answer" && (
                              <div className="pl-4">
                                <p className="text-sm text-muted-foreground">Expected answer: {question.expectedAnswer}</p>
                                <input
                                  type="text"
                                  className="w-full p-2 mt-1 border rounded"
                                  placeholder="Enter your answer"
                                  disabled
                                />
                              </div>
                            )}

                            {question.type === "true_false" && (
                              <div className="space-y-2 pl-4">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`q${qIndex}-true`}
                                    name={`q${qIndex}`}
                                    className="mr-2"
                                    disabled
                                    defaultChecked={question.correctAnswer === true}
                                  />
                                  <label htmlFor={`q${qIndex}-true`}>True</label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`q${qIndex}-false`}
                                    name={`q${qIndex}`}
                                    className="mr-2"
                                    disabled
                                    defaultChecked={question.correctAnswer === false}
                                  />
                                  <label htmlFor={`q${qIndex}-false`}>False</label>
                                </div>
                              </div>
                            )}

                            {question.type === "fill_in_blank" && (
                              <div className="pl-4">
                                <p className="text-sm text-muted-foreground">Expected answer: {question.expectedAnswer}</p>
                                <input
                                  type="text"
                                  className="w-full p-2 mt-1 border rounded"
                                  placeholder="Fill in the blank"
                                  disabled
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            } else {
              return (
                <div key={index} className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2">{section.title || "Section"}</h3>
                  <p>{section.content}</p>
                </div>
              );
            }
          })}
        </div>
      );
    } catch (error) {
      return (
        <div className="text-destructive text-center py-8">
          <p>Error rendering worksheet content.</p>
          <p>{(error as Error).message}</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="preview">
        <TabsList className="mb-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          {renderWorksheetContent()}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Download as PDF</h3>
                  <p className="text-muted-foreground mb-4">
                    Download this worksheet as a PDF file for printing or sharing.
                  </p>
                  <Button className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Convert to Activity</h3>
                  <p className="text-muted-foreground mb-4">
                    Convert this worksheet to an activity or assessment for a class.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Select Class</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger id="class">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {teacherClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={activityType === ActivityPurpose.LEARNING ? "default" : "outline"}
                          className="flex items-center justify-center"
                          onClick={() => {
                            setActivityType(ActivityPurpose.LEARNING);
                            setIsGradable(false);
                          }}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Learning Activity
                        </Button>
                        <Button
                          variant={activityType === ActivityPurpose.ASSESSMENT ? "default" : "outline"}
                          className="flex items-center justify-center"
                          onClick={() => {
                            setActivityType(ActivityPurpose.ASSESSMENT);
                            setIsGradable(true);
                          }}
                        >
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Assessment
                        </Button>
                      </div>
                    </div>

                    {activityType === ActivityPurpose.ASSESSMENT && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isGradable"
                            checked={isGradable}
                            onCheckedChange={(checked) => setIsGradable(checked as boolean)}
                          />
                          <Label htmlFor="isGradable">Gradable</Label>
                        </div>

                        {isGradable && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="maxScore">Max Score</Label>
                              <Input
                                id="maxScore"
                                type="number"
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="passingScore">Passing Score</Label>
                              <Input
                                id="passingScore"
                                type="number"
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                                min={0}
                                max={maxScore}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleConvertToActivity}
                      disabled={!selectedClassId}
                    >
                      Convert to {activityType === ActivityPurpose.LEARNING ? "Activity" : "Assessment"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
