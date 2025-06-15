/**
 * tRPC Bloom's Taxonomy Hook
 * 
 * This hook provides access to Bloom's Taxonomy tRPC endpoints.
 */

import { useState } from 'react';
import { api } from '@/utils/api';
import { 
  BloomsTaxonomyLevel, 
  RubricType,
  BloomsClassificationResult,
  Rubric,
  Activity
} from '../types';

/**
 * Hook for using Bloom's Taxonomy tRPC endpoints
 */
export function useTrpcBloom() {
  // State for loading status
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
  const [isAnalyzingMastery, setIsAnalyzingMastery] = useState(false);

  // tRPC mutations
  const classifyContentMutation = api.bloom.classifyContent.useMutation();
  const generateRubricMutation = api.bloom.generateRubric.useMutation();
  const generateActivityMutation = api.bloom.generateActivity.useMutation();
  const analyzeMasteryMutation = api.bloom.analyzeMastery.useMutation();

  /**
   * Classify content according to Bloom's Taxonomy
   */
  const classifyContent = async (
    content: string,
    contentType?: 'learning_outcome' | 'question' | 'activity' | 'assessment',
    targetLevel?: BloomsTaxonomyLevel
  ): Promise<{
    classification: BloomsClassificationResult;
    suggestions: string[];
    improvedContent?: string;
  }> => {
    setIsClassifying(true);
    
    try {
      const result = await classifyContentMutation.mutateAsync({
        content,
        contentType,
        targetLevel
      });
      
      return result;
    } finally {
      setIsClassifying(false);
    }
  };

  /**
   * Generate a rubric aligned with Bloom's Taxonomy
   */
  const generateRubric = async (
    title: string,
    type: RubricType,
    bloomsLevels: BloomsTaxonomyLevel[],
    learningOutcomeIds: string[],
    maxScore: number = 100,
    options?: {
      criteriaCount?: number;
      performanceLevelCount?: number;
      subject?: string;
      topic?: string;
      gradeLevel?: string;
    }
  ): Promise<{
    rubric: Rubric;
    explanation: string;
  }> => {
    setIsGeneratingRubric(true);
    
    try {
      const result = await generateRubricMutation.mutateAsync({
        request: {
          title,
          type,
          bloomsLevels,
          learningOutcomeIds,
          maxScore,
          ...options
        }
      });
      
      return result;
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  /**
   * Generate an activity aligned with Bloom's Taxonomy
   */
  const generateActivity = async (
    bloomsLevel: BloomsTaxonomyLevel,
    learningOutcomeIds: string[],
    options?: {
      title?: string;
      type?: string;
      setting?: string;
      duration?: number;
      groupSize?: number;
      subject?: string;
      topic?: string;
      gradeLevel?: string;
      includeRubric?: boolean;
    }
  ): Promise<{
    activity: Activity;
    hasRubric: boolean;
  }> => {
    setIsGeneratingActivity(true);
    
    try {
      const result = await generateActivityMutation.mutateAsync({
        bloomsLevel,
        learningOutcomeIds,
        ...options
      });
      
      return result;
    } finally {
      setIsGeneratingActivity(false);
    }
  };

  /**
   * Analyze topic mastery and provide recommendations
   */
  const analyzeMastery = async (
    studentId: string,
    topicId: string
  ): Promise<{
    analysis: {
      strengths: string[];
      weaknesses: string[];
      bloomsLevelAnalysis: Record<BloomsTaxonomyLevel, string>;
    };
    recommendations: Array<{
      type: string;
      description: string;
      bloomsLevel: BloomsTaxonomyLevel;
      priority: string;
    }>;
    suggestedActivities: Array<{
      title: string;
      description: string;
      bloomsLevel: BloomsTaxonomyLevel;
      type: string;
    }>;
  }> => {
    setIsAnalyzingMastery(true);
    
    try {
      const result = await analyzeMasteryMutation.mutateAsync({
        studentId,
        topicId
      });
      
      return result;
    } finally {
      setIsAnalyzingMastery(false);
    }
  };

  return {
    // Classification
    classifyContent,
    isClassifying,
    
    // Rubric generation
    generateRubric,
    isGeneratingRubric,
    
    // Activity generation
    generateActivity,
    isGeneratingActivity,
    
    // Mastery analysis
    analyzeMastery,
    isAnalyzingMastery,
  };
}
