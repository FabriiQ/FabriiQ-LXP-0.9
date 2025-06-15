'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedGradingComponent } from '@/features/activties/components/grading/UnifiedGradingComponent';
import { MasteryUpdateHandler } from '../mastery/MasteryUpdateHandler';
import { TopicMasteryCard } from '../mastery/TopicMasteryCard';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Info } from 'lucide-react';

interface ActivityGradingWithMasteryProps {
  activityId: string;
  studentId: string;
  classId: string;
}

/**
 * ActivityGradingWithMastery
 * 
 * This component combines activity grading with topic mastery visualization.
 * It shows the grading interface and updates topic mastery when grading is completed.
 */
export function ActivityGradingWithMastery({
  activityId,
  studentId,
  classId
}: ActivityGradingWithMasteryProps) {
  const [activeTab, setActiveTab] = useState<'grading' | 'mastery'>('grading');
  const [activityGradeId, setActivityGradeId] = useState<string | null>(null);
  const [masteryId, setMasteryId] = useState<string | null>(null);
  
  // Fetch activity data
  const { data: activity, isLoading: isLoadingActivity } = api.activity.getById.useQuery(
    { id: activityId },
    { enabled: !!activityId }
  );
  
  // Fetch existing activity grade
  const { data: existingGrade, isLoading: isLoadingGrade } = api.activityGrade.getByActivityAndStudent.useQuery(
    { activityId, studentId },
    { enabled: !!activityId && !!studentId }
  );
  
  // Fetch topic mastery data
  const { data: topicMastery, isLoading: isLoadingMastery } = api.topicMastery.getByTopicAndStudent.useQuery(
    { 
      topicId: activity?.topicId || '', 
      studentId 
    },
    { 
      enabled: !!activity?.topicId && !!studentId,
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
    { id: activity?.topicId || '' },
    { enabled: !!activity?.topicId }
  );
  
  // Fetch subject data
  const { data: subject } = api.subject.getById.useQuery(
    { id: activity?.subjectId || '' },
    { enabled: !!activity?.subjectId }
  );
  
  // Handle grading completion
  const handleGradingComplete = (gradeId: string) => {
    setActivityGradeId(gradeId);
    // Switch to mastery tab after grading is complete
    setActiveTab('mastery');
  };
  
  // Handle mastery update
  const handleMasteryUpdated = (newMasteryId: string) => {
    setMasteryId(newMasteryId);
  };
  
  const isLoading = isLoadingActivity || isLoadingGrade || isLoadingMastery;
  
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
          ) : activity ? (
            <>
              <UnifiedGradingComponent
                activityId={activityId}
                studentId={studentId}
                classId={classId}
                existingGrade={existingGrade}
                onGradingComplete={handleGradingComplete}
              />
              
              {/* Hidden mastery update handler */}
              {existingGrade && (
                <MasteryUpdateHandler 
                  activityGradeId={existingGrade.id} 
                  onMasteryUpdated={handleMasteryUpdated}
                />
              )}
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Activity not found</AlertTitle>
              <AlertDescription>
                The activity you're trying to grade could not be found.
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
