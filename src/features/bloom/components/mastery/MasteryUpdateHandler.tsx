'use client';

import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { BloomsTaxonomyLevel } from '../../types';
import { api } from '@/trpc/react';

interface MasteryUpdateHandlerProps {
  activityGradeId?: string;
  assessmentResultId?: string;
  onMasteryUpdated?: (masteryId: string) => void;
}

/**
 * MasteryUpdateHandler
 * 
 * This component handles updating topic mastery when an activity or assessment is graded.
 * It can be used in both activity and assessment grading flows.
 */
export function MasteryUpdateHandler({
  activityGradeId,
  assessmentResultId,
  onMasteryUpdated
}: MasteryUpdateHandlerProps) {
  const { toast } = useToast();
  
  // Fetch activity grade data if available
  const { data: activityGrade } = api.activityGrade.getById.useQuery(
    { id: activityGradeId! },
    { enabled: !!activityGradeId }
  );
  
  // Fetch assessment result data if available
  const { data: assessmentResult } = api.assessmentResult.getById.useQuery(
    { id: assessmentResultId! },
    { enabled: !!assessmentResultId }
  );
  
  // Update topic mastery mutation
  const updateTopicMastery = api.topicMastery.updateFromResult.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Topic mastery updated',
        description: 'The student\'s topic mastery has been updated based on this result.',
        variant: 'success',
      });
      
      if (onMasteryUpdated && data?.id) {
        onMasteryUpdated(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to update topic mastery',
        description: error.message,
        variant: 'error',
      });
    }
  });
  
  // Prepare result data from activity grade
  useEffect(() => {
    if (activityGrade && activityGrade.activity?.topicId) {
      // Extract Bloom's level scores from activity grade
      const bloomsLevelScores: Record<string, { score: number; maxScore: number }> = {};
      
      // If we have detailed Bloom's level scores in the grading details
      if (activityGrade.attachments?.gradingDetails?.bloomsLevelScores) {
        const scores = activityGrade.attachments.gradingDetails.bloomsLevelScores as Record<BloomsTaxonomyLevel, number>;
        
        // Convert percentage scores to score/maxScore format
        Object.entries(scores).forEach(([level, percentage]) => {
          bloomsLevelScores[level] = {
            score: (percentage / 100) * (activityGrade.activity?.maxScore || 100),
            maxScore: activityGrade.activity?.maxScore || 100
          };
        });
      } 
      // If we only have a single Bloom's level for the activity
      else if (activityGrade.activity?.bloomsLevel) {
        bloomsLevelScores[activityGrade.activity.bloomsLevel] = {
          score: activityGrade.score || 0,
          maxScore: activityGrade.activity.maxScore || 100
        };
      }
      
      // Only update if we have Bloom's level scores
      if (Object.keys(bloomsLevelScores).length > 0) {
        updateTopicMastery.mutate({
          studentId: activityGrade.studentId,
          topicId: activityGrade.activity.topicId,
          subjectId: activityGrade.activity.subjectId || '',
          completedAt: new Date(),
          bloomsLevelScores
        });
      }
    }
  }, [activityGrade]);
  
  // Prepare result data from assessment result
  useEffect(() => {
    if (assessmentResult && assessmentResult.assessment?.topicId) {
      // Extract Bloom's level scores from assessment result
      const bloomsLevelScores: Record<string, { score: number; maxScore: number }> = {};
      
      // If we have detailed Bloom's level scores in the result details
      if (assessmentResult.details?.bloomsLevelScores) {
        const scores = assessmentResult.details.bloomsLevelScores as Record<BloomsTaxonomyLevel, number>;
        
        // Convert percentage scores to score/maxScore format
        Object.entries(scores).forEach(([level, percentage]) => {
          bloomsLevelScores[level] = {
            score: (percentage / 100) * (assessmentResult.assessment?.maxScore || 100),
            maxScore: assessmentResult.assessment?.maxScore || 100
          };
        });
      } 
      // If we only have a single Bloom's level for the assessment
      else if (assessmentResult.assessment?.bloomsLevel) {
        bloomsLevelScores[assessmentResult.assessment.bloomsLevel] = {
          score: assessmentResult.score || 0,
          maxScore: assessmentResult.assessment.maxScore || 100
        };
      }
      
      // Only update if we have Bloom's level scores
      if (Object.keys(bloomsLevelScores).length > 0) {
        updateTopicMastery.mutate({
          studentId: assessmentResult.studentId,
          topicId: assessmentResult.assessment.topicId,
          subjectId: assessmentResult.assessment.subjectId || '',
          completedAt: new Date(assessmentResult.completedAt),
          bloomsLevelScores
        });
      }
    }
  }, [assessmentResult]);
  
  // This component doesn't render anything
  return null;
}
