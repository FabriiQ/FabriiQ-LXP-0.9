'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssessmentGrading } from '@/features/assessments/components/AssessmentGrading';
import { MasteryUpdateHandler } from '../mastery/MasteryUpdateHandler';
import { TopicMasteryCard } from '../mastery/TopicMasteryCard';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Info } from 'lucide-react';

interface AssessmentGradingWithMasteryProps {
  assessmentId: string;
  studentId: string;
  classId: string;
}

/**
 * AssessmentGradingWithMastery
 * 
 * This component combines assessment grading with topic mastery visualization.
 * It shows the grading interface and updates topic mastery when grading is completed.
 */
export function AssessmentGradingWithMastery({
  assessmentId,
  studentId,
  classId
}: AssessmentGradingWithMasteryProps) {
  const [activeTab, setActiveTab] = useState<'grading' | 'mastery'>('grading');
  const [assessmentResultId, setAssessmentResultId] = useState<string | null>(null);
  const [masteryId, setMasteryId] = useState<string | null>(null);
  
  // Fetch assessment data
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );
  
  // Fetch existing assessment result
  const { data: existingResult, isLoading: isLoadingResult } = api.assessmentResult.getByAssessmentAndStudent.useQuery(
    { assessmentId, studentId },
    { enabled: !!assessmentId && !!studentId }
  );
  
  // Fetch topic mastery data
  const { data: topicMastery, isLoading: isLoadingMastery } = api.topicMastery.getByTopicAndStudent.useQuery(
    { 
      topicId: assessment?.topicId || '', 
      studentId 
    },
    { 
      enabled: !!assessment?.topicId && !!studentId,
      refetchOnWindowFocus: true
    }
  );
  
  // Fetch student data
  const { data: student } = api.student.getById.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );
  
  // Fetch topic data
  const { data: topic } = api.topic.getById.useQuery(
    { id: assessment?.topicId || '' },
    { enabled: !!assessment?.topicId }
  );
  
  // Fetch subject data
  const { data: subject } = api.subject.getById.useQuery(
    { id: assessment?.subjectId || '' },
    { enabled: !!assessment?.subjectId }
  );
  
  // Handle grading completion
  const handleGradingComplete = (resultId: string) => {
    setAssessmentResultId(resultId);
    // Switch to mastery tab after grading is complete
    setActiveTab('mastery');
  };
  
  // Handle mastery update
  const handleMasteryUpdated = (newMasteryId: string) => {
    setMasteryId(newMasteryId);
  };
  
  const isLoading = isLoadingAssessment || isLoadingResult || isLoadingMastery;
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="mastery">Topic Mastery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grading" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : assessment ? (
            <>
              <AssessmentGrading
                assessmentId={assessmentId}
                studentId={studentId}
                classId={classId}
                existingResult={existingResult}
                onGradingComplete={handleGradingComplete}
              />
              
              {/* Hidden mastery update handler */}
              {existingResult && (
                <MasteryUpdateHandler 
                  assessmentResultId={existingResult.id} 
                  onMasteryUpdated={handleMasteryUpdated}
                />
              )}
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Assessment not found</AlertTitle>
              <AlertDescription>
                The assessment you're trying to grade could not be found.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="mastery" className="mt-4">
          {isLoadingMastery ? (
            <Skeleton className="h-[300px] w-full" />
          ) : topicMastery ? (
            <TopicMasteryCard
              masteryData={topicMastery}
              topicName={topic?.name || 'Unknown Topic'}
              subjectName={subject?.name || 'Unknown Subject'}
              showDetails
              showLastAssessment
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Mastery Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No mastery data is available for this topic yet. 
                  Complete the grading process to generate mastery data.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
