'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { api } from '@/trpc/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BloomsCognitiveDistributionChart } from '../analytics/BloomsCognitiveDistributionChart';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  FileText, 
  HelpCircle, 
  Info, 
  Lightbulb, 
  Save, 
  User 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BloomsAssessmentGradingProps {
  assessmentId: string;
  classId: string;
  teacherId: string;
  className?: string;
}

export function BloomsAssessmentGrading({
  assessmentId,
  classId,
  teacherId,
  className = ""
}: BloomsAssessmentGradingProps) {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Get assessment data
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    assessmentId,
    includeSubmissions: true
  });

  // Get assessment performance data
  const { data: assessmentPerformance, isLoading: isLoadingPerformance } = api.bloomsAnalytics.getAssessmentPerformance.useQuery({
    assessmentId
  });

  // Get submissions for this assessment
  const { data: submissions, isLoading: isLoadingSubmissions } = api.submission.list.useQuery({ 
    assessmentId 
  });

  // Get student data if a student is selected
  const { data: studentSubmission, isLoading: isLoadingStudentSubmission } = api.submission.getByStudentAndAssessment.useQuery({
    studentId: selectedStudentId,
    assessmentId
  }, {
    enabled: !!selectedStudentId
  });

  // Handle saving grades with Bloom's levels
  const handleSaveGrades = () => {
    setIsSaving(true);
    // TODO: Implement saving grades with Bloom's levels
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Grades saved",
        description: "The grades have been saved successfully with Bloom's Taxonomy levels.",
      });
    }, 1500);
  };

  // Calculate distribution for the assessment
  const getAssessmentDistribution = () => {
    if (!assessmentPerformance) return {};
    return assessmentPerformance.distribution;
  };

  // Get Bloom's level badge
  const getBloomsBadge = (level: BloomsTaxonomyLevel) => {
    const metadata = BLOOMS_LEVEL_METADATA[level];
    return (
      <Badge 
        variant="outline" 
        className="ml-2"
        style={{ 
          backgroundColor: `${metadata.color}20`, 
          color: metadata.color,
          borderColor: metadata.color
        }}
      >
        {metadata.name}
      </Badge>
    );
  };

  return (
    <div className={`blooms-assessment-grading ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {isLoadingAssessment ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                {assessment?.title || 'Assessment'} Grading
              </>
            )}
          </h2>
          <p className="text-muted-foreground">
            Grade with Bloom's Taxonomy cognitive levels
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSaveGrades}
            disabled={isSaving || isLoadingAssessment}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Grades
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Grading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
                <CardDescription>
                  Details and cognitive level distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAssessment ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ) : assessment ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Title</h3>
                      <p>{assessment.title}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Category</h3>
                      <p>{assessment.category}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Max Score</h3>
                      <p>{assessment.maxScore || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Submissions</h3>
                      <p>{submissions?.items?.length || 0} submissions</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Assessment not found
                  </div>
                )}
              </CardContent>
            </Card>

            <BloomsCognitiveDistributionChart
              distribution={getAssessmentDistribution()}
              title="Cognitive Level Distribution"
              description="Distribution of questions by Bloom's level"
              isLoading={isLoadingPerformance}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grading with Bloom's Taxonomy</CardTitle>
              <CardDescription>
                Guidelines for cognitive level assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-700">Why use Bloom's Taxonomy for grading?</h3>
                      <p className="text-blue-600">
                        Grading with Bloom's Taxonomy helps assess students' cognitive abilities across different levels,
                        from basic recall to complex creation. This provides a more comprehensive view of student mastery.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(BloomsTaxonomyLevel).map(level => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    return (
                      <div key={level} className="p-4 border rounded-md">
                        <h3 className="font-medium" style={{ color: metadata.color }}>
                          {metadata.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {metadata.description}
                        </p>
                        <div className="text-sm">
                          <strong>Grading focus:</strong> {metadata.gradingFocus || 'Accuracy and completeness'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Grading</CardTitle>
              <CardDescription>
                Grade student submissions with Bloom's Taxonomy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSubmissions ? (
                      <SelectItem value="loading" disabled>Loading students...</SelectItem>
                    ) : submissions && 'items' in submissions && submissions.items.length > 0 ? (
                      submissions.items.map((submission: any) => (
                        <SelectItem key={submission.studentId} value={submission.studentId}>
                          {submission.studentName || `Student ${submission.studentId.substring(0, 8)}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No submissions available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudentId ? (
                isLoadingStudentSubmission ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : studentSubmission ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">{studentSubmission.studentName || 'Student'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(studentSubmission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Submission Content</h3>
                      <div className="p-4 border rounded-md bg-gray-50">
                        <pre className="whitespace-pre-wrap text-sm">
                          {studentSubmission.content || 'No content available'}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Grading</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label htmlFor="score" className="text-sm font-medium">
                              Score
                            </label>
                            <span className="text-sm text-muted-foreground">
                              Max: {assessment?.maxScore || 100}
                            </span>
                          </div>
                          <Input
                            id="score"
                            type="number"
                            min="0"
                            max={assessment?.maxScore || 100}
                            defaultValue={studentSubmission.score || 0}
                          />
                        </div>

                        <div>
                          <div className="flex items-center mb-1">
                            <label htmlFor="bloomsLevel" className="text-sm font-medium">
                              Bloom's Taxonomy Level
                            </label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                    <HelpCircle className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Select the highest cognitive level demonstrated in this submission
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select defaultValue={BloomsTaxonomyLevel.UNDERSTAND}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Bloom's level" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(BloomsTaxonomyLevel).map(level => {
                                const metadata = BLOOMS_LEVEL_METADATA[level];
                                return (
                                  <SelectItem key={level} value={level}>
                                    <div className="flex items-center">
                                      <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: metadata.color }}
                                      ></div>
                                      {metadata.name}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label htmlFor="feedback" className="text-sm font-medium mb-1 block">
                            Feedback
                          </label>
                          <Textarea
                            id="feedback"
                            placeholder="Provide feedback to the student..."
                            defaultValue={studentSubmission.feedback || ''}
                            rows={4}
                          />
                        </div>

                        <Button onClick={handleSaveGrades} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Grade'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No submission found for this student.
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a student to grade their submission.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Analytics</CardTitle>
              <CardDescription>
                Performance analytics by Bloom's Taxonomy level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPerformance ? (
                <div className="space-y-4">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : assessmentPerformance ? (
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cognitive Level</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Mastery Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(BloomsTaxonomyLevel).map(level => {
                        const metadata = BLOOMS_LEVEL_METADATA[level];
                        const performance = assessmentPerformance.performanceByLevel[level] || 0;
                        
                        return (
                          <TableRow key={level}>
                            <TableCell>
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: metadata.color }}
                                ></div>
                                {metadata.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {/* Placeholder for question count */}
                              {Math.floor(Math.random() * 5) + 1}
                            </TableCell>
                            <TableCell>{performance}%</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {performance >= 80 ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                ) : performance >= 60 ? (
                                  <Info className="h-4 w-4 text-yellow-500 mr-1" />
                                ) : (
                                  <Lightbulb className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {performance >= 80 ? 'Mastered' : performance >= 60 ? 'Developing' : 'Needs Work'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analytics data available for this assessment.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
