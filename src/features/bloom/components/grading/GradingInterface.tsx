'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, CheckCircle, AlertCircle, FileText, BarChart, Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  BloomsTaxonomyLevel,
  RubricType
} from '../../types';
import { 
  GradingFormValues, 
  GradingContext, 
  GradableContentType,
  SubmissionStatus
} from '../../types/grading';
import { RubricGrading } from './RubricGrading';
import { CognitiveGrading } from './CognitiveGrading';
import { GradingForm } from './GradingForm';

interface GradingInterfaceProps {
  gradingContext: GradingContext;
  contentType: GradableContentType;
  initialValues?: GradingFormValues;
  onSubmit: (values: GradingFormValues) => Promise<void>;
  onCancel?: () => void;
  readOnly?: boolean;
  showRubricGrading?: boolean;
  showCognitiveGrading?: boolean;
  showSimpleGrading?: boolean;
  className?: string;
}

/**
 * GradingInterface component
 * 
 * A comprehensive interface for grading student submissions with support for
 * rubric-based grading, cognitive level grading, and simple scoring.
 */
export function GradingInterface({
  gradingContext,
  contentType,
  initialValues,
  onSubmit,
  onCancel,
  readOnly = false,
  showRubricGrading = true,
  showCognitiveGrading = true,
  showSimpleGrading = true,
  className = '',
}: GradingInterfaceProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('rubric');
  const [formValues, setFormValues] = useState<GradingFormValues>(initialValues || {
    score: 0,
    feedback: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Determine which tabs to show
  const showRubric = showRubricGrading && !!gradingContext.rubric;
  const showCognitive = showCognitiveGrading && !!gradingContext.bloomsLevels?.length;
  const showSimple = showSimpleGrading;

  // Set initial active tab based on available options
  React.useEffect(() => {
    if (showRubric) {
      setActiveTab('rubric');
    } else if (showCognitive) {
      setActiveTab('cognitive');
    } else if (showSimple) {
      setActiveTab('simple');
    }
  }, [showRubric, showCognitive, showSimple]);

  // Handle form value changes
  const handleGradeChange = (values: GradingFormValues) => {
    setFormValues(prev => {
      const newValues = { ...prev, ...values };
      setHasChanges(true);
      return newValues;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
      toast({
        title: "Grades saved successfully",
        description: "The submission has been graded.",
        variant: "success",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error saving grades",
        description: "There was an error saving the grades. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate maximum score for cognitive grading
  const calculateMaxScorePerLevel = (): Record<BloomsTaxonomyLevel, number> => {
    const maxScorePerLevel: Record<BloomsTaxonomyLevel, number> = {} as Record<BloomsTaxonomyLevel, number>;
    
    if (gradingContext.bloomsLevels) {
      const totalMaxScore = gradingContext.rubric?.maxScore || 100;
      const levelCount = gradingContext.bloomsLevels.length;
      const scorePerLevel = Math.floor(totalMaxScore / levelCount);
      
      gradingContext.bloomsLevels.forEach(level => {
        maxScorePerLevel[level] = scorePerLevel;
      });
    }
    
    return maxScorePerLevel;
  };

  // Render submission status badge
  const renderStatusBadge = () => {
    const status = gradingContext.submission.status as SubmissionStatus;
    
    switch (status) {
      case SubmissionStatus.GRADED:
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Graded</span>
          </div>
        );
      case SubmissionStatus.SUBMITTED:
        return (
          <div className="flex items-center text-blue-600">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Submitted</span>
          </div>
        );
      case SubmissionStatus.LATE:
        return (
          <div className="flex items-center text-amber-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Late</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-muted-foreground">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{status}</span>
          </div>
        );
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle>
              {readOnly ? "View Grading" : "Grade Submission"}
            </CardTitle>
            <CardDescription>
              {contentType === GradableContentType.ASSESSMENT ? "Assessment submission" : 
               contentType === GradableContentType.ACTIVITY ? "Activity submission" : 
               "Submission"} grading
            </CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {hasChanges && !readOnly && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Click "Save Grades" to save your changes.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            {showRubric && (
              <TabsTrigger value="rubric" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Rubric</span>
              </TabsTrigger>
            )}
            {showCognitive && (
              <TabsTrigger value="cognitive" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Cognitive Levels</span>
              </TabsTrigger>
            )}
            {showSimple && (
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Simple Grading</span>
              </TabsTrigger>
            )}
          </TabsList>

          {showRubric && (
            <TabsContent value="rubric">
              <RubricGrading
                rubricId={gradingContext.rubric!.id}
                rubricType={gradingContext.rubric!.type}
                criteria={gradingContext.rubric!.criteria}
                performanceLevels={gradingContext.rubric!.performanceLevels}
                maxScore={gradingContext.rubric!.maxScore}
                initialValues={initialValues}
                onGradeChange={handleGradeChange}
                readOnly={readOnly}
                showBloomsLevels={true}
              />
            </TabsContent>
          )}

          {showCognitive && (
            <TabsContent value="cognitive">
              <CognitiveGrading
                bloomsLevels={gradingContext.bloomsLevels!}
                maxScorePerLevel={calculateMaxScorePerLevel()}
                initialValues={initialValues}
                onGradeChange={handleGradeChange}
                readOnly={readOnly}
                showAnalysis={true}
              />
            </TabsContent>
          )}

          {showSimple && (
            <TabsContent value="simple">
              <GradingForm
                gradingContext={gradingContext}
                initialValues={initialValues}
                onSubmit={handleGradeChange}
                isSubmitting={isSubmitting}
                showRubricGrading={false}
                showBloomsLevels={false}
                maxScore={gradingContext.rubric?.maxScore || 100}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          <span className="text-sm font-medium">Total Score:</span>
          <span className="ml-2 text-lg font-bold">{formValues.score || 0}</span>
          <span className="ml-1 text-sm text-muted-foreground">/ {gradingContext.rubric?.maxScore || 100}</span>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}

          {!readOnly && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Grades
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
