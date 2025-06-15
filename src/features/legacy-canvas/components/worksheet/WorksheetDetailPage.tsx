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
  const { mutate: convertToActivity, isLoading: isConverting } = api.worksheet.convertToActivity.useMutation({
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
      maxScore: isGradable ? maxScore : undefined,
      passingScore: isGradable ? passingScore : undefined,
    });
  };

  // Render worksheet content
  const renderWorksheetContent = () => {
    try {
      const content = worksheet.content;

      return (
        <div className="space-y-6">
          {/* Instructions Section */}
          {content.sections?.find((s: any) => s.type === "instructions") && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p>{content.sections.find((s: any) => s.type === "instructions").content}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions Section */}
          {content.sections?.find((s: any) => s.type === "questions") && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              {content.sections
                .find((s: any) => s.type === "questions")
                .questions.map((question: any, index: number) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="font-semibold mr-2">{index + 1}.</span>
                          <div>
                            <p className="font-medium">{question.question}</p>

                            {/* Multiple Choice */}
                            {question.type === "multiple_choice" && (
                              <div className="mt-2 space-y-2">
                                {question.options.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center">
                                    <input
                                      type="radio"
                                      id={`q${index}-opt${optIndex}`}
                                      name={`question-${index}`}
                                      className="mr-2"
                                      disabled
                                    />
                                    <label htmlFor={`q${index}-opt${optIndex}`}>
                                      {option}
                                      {optIndex === question.correctAnswer && (
                                        <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                                      )}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Short Answer */}
                            {question.type === "short_answer" && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded"
                                  placeholder="Enter your answer"
                                  disabled
                                />
                                <p className="text-sm mt-1 text-muted-foreground">
                                  Expected answer: <span className="font-medium">{question.expectedAnswer}</span>
                                </p>
                              </div>
                            )}

                            {/* True/False */}
                            {question.type === "true_false" && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`q${index}-true`}
                                    name={`question-${index}`}
                                    className="mr-2"
                                    disabled
                                  />
                                  <label htmlFor={`q${index}-true`}>
                                    True
                                    {question.correctAnswer === true && (
                                      <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                                    )}
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`q${index}-false`}
                                    name={`question-${index}`}
                                    className="mr-2"
                                    disabled
                                  />
                                  <label htmlFor={`q${index}-false`}>
                                    False
                                    {question.correctAnswer === false && (
                                      <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                                    )}
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Fill in the Blank */}
                            {question.type === "fill_in_blank" && (
                              <div className="mt-2">
                                <p className="mb-2">{question.question.replace("___", "________")}</p>
                                <p className="text-sm text-muted-foreground">
                                  Expected answer: <span className="font-medium">{question.expectedAnswer}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      );
    } catch (error) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error rendering worksheet content: {(error as Error).message}</p>
          </CardContent>
        </Card>
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

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export to Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Select Class</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherClasses?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select value={activityType} onValueChange={setActivityType}>
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isGradable"
                    checked={isGradable}
                    onCheckedChange={(checked) => setIsGradable(checked as boolean)}
                  />
                  <Label htmlFor="isGradable">Make this activity gradable</Label>
                </div>

                {isGradable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">Maximum Score</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={maxScore}
                        onChange={(e) => setMaxScore(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Passing Score</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleConvertToActivity}
                  disabled={isConverting || !selectedClassId}
                >
                  {isConverting ? "Converting..." : "Convert to Activity"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
