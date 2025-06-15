/**
 * Topic Mastery Hook
 * 
 * This hook provides functionality for working with topic mastery in React components.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  TopicMasteryData, 
  AssessmentResultData,
  MasteryLevel,
  StudentMasteryAnalytics,
  ClassMasteryAnalytics
} from '../types';
import { BloomsTaxonomyLevel } from '../types';
import { 
  DEFAULT_MASTERY_THRESHOLDS,
  DEFAULT_MASTERY_DECAY_CONFIG,
  MASTERY_LEVEL_COLORS,
  MASTERY_LEVEL_DESCRIPTIONS
} from '../constants/mastery-thresholds';
import { 
  initializeMasteryFromResult,
  applyMasteryDecay,
  updateMasteryLevels,
  calculateOverallMastery,
  getMasteryLevel,
  calculateStudentMasteryAnalytics,
  calculateClassMasteryAnalytics
} from '../utils/mastery-helpers';

/**
 * Hook for working with topic mastery
 */
export function useTopicMastery(
  studentId?: string,
  topicId?: string,
  initialMastery?: TopicMasteryData
) {
  // State for mastery data
  const [masteryData, setMasteryData] = useState<TopicMasteryData | null>(initialMastery || null);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error message
  const [error, setError] = useState<string | null>(null);
  
  // State for assessment history
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResultData[]>([]);
  
  // Calculate mastery level
  const masteryLevel = useMemo(() => {
    if (!masteryData) return MasteryLevel.NOVICE;
    return getMasteryLevel(masteryData.overallMastery);
  }, [masteryData]);
  
  // Get mastery level color
  const masteryColor = useMemo(() => {
    return MASTERY_LEVEL_COLORS[masteryLevel];
  }, [masteryLevel]);
  
  // Get mastery level description
  const masteryDescription = useMemo(() => {
    return MASTERY_LEVEL_DESCRIPTIONS[masteryLevel];
  }, [masteryLevel]);
  
  // Calculate Bloom's level breakdown
  const bloomsLevelBreakdown = useMemo(() => {
    if (!masteryData) return null;
    
    return Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
      acc[level] = {
        level,
        percentage: masteryData[level],
        masteryLevel: getMasteryLevel(masteryData[level]),
        color: MASTERY_LEVEL_COLORS[getMasteryLevel(masteryData[level])]
      };
      return acc;
    }, {} as Record<BloomsTaxonomyLevel, {
      level: BloomsTaxonomyLevel;
      percentage: number;
      masteryLevel: MasteryLevel;
      color: string;
    }>);
  }, [masteryData]);
  
  // Load mastery data (mock implementation)
  const loadMasteryData = useCallback(async () => {
    if (!studentId || !topicId) {
      setError('Student ID and Topic ID are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock mastery data
      const mockMastery: TopicMasteryData = {
        id: `mastery-${studentId}-${topicId}`,
        studentId,
        topicId,
        subjectId: 'subject-1', // Mock subject ID
        [BloomsTaxonomyLevel.REMEMBER]: 85,
        [BloomsTaxonomyLevel.UNDERSTAND]: 80,
        [BloomsTaxonomyLevel.APPLY]: 75,
        [BloomsTaxonomyLevel.ANALYZE]: 70,
        [BloomsTaxonomyLevel.EVALUATE]: 65,
        [BloomsTaxonomyLevel.CREATE]: 60,
        overallMastery: 72.5,
        lastAssessmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };
      
      // Mock assessment history
      const mockHistory: AssessmentResultData[] = [
        {
          id: 'result-1',
          assessmentId: 'assessment-1',
          studentId,
          topicId,
          subjectId: 'subject-1',
          bloomsLevelScores: {
            [BloomsTaxonomyLevel.REMEMBER]: { score: 8, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.UNDERSTAND]: { score: 7, maxScore: 10, questionCount: 5 },
          },
          totalScore: 15,
          maxScore: 20,
          percentage: 75,
          completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: 'result-2',
          assessmentId: 'assessment-2',
          studentId,
          topicId,
          subjectId: 'subject-1',
          bloomsLevelScores: {
            [BloomsTaxonomyLevel.REMEMBER]: { score: 9, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.UNDERSTAND]: { score: 8, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.APPLY]: { score: 7, maxScore: 10, questionCount: 5 },
          },
          totalScore: 24,
          maxScore: 30,
          percentage: 80,
          completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        },
        {
          id: 'result-3',
          assessmentId: 'assessment-3',
          studentId,
          topicId,
          subjectId: 'subject-1',
          bloomsLevelScores: {
            [BloomsTaxonomyLevel.REMEMBER]: { score: 9, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.UNDERSTAND]: { score: 8, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.APPLY]: { score: 8, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.ANALYZE]: { score: 7, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.EVALUATE]: { score: 6, maxScore: 10, questionCount: 5 },
            [BloomsTaxonomyLevel.CREATE]: { score: 6, maxScore: 10, questionCount: 5 },
          },
          totalScore: 44,
          maxScore: 60,
          percentage: 73.3,
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      ];
      
      setMasteryData(mockMastery);
      setAssessmentHistory(mockHistory);
    } catch (err) {
      setError('Failed to load mastery data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, topicId]);
  
  // Update mastery with a new assessment result
  const updateMasteryWithResult = useCallback((result: AssessmentResultData) => {
    setMasteryData(prev => {
      if (!prev) {
        return initializeMasteryFromResult(result);
      }
      
      return updateMasteryLevels(prev, result);
    });
    
    // Add to assessment history
    setAssessmentHistory(prev => [...prev, result]);
  }, []);
  
  // Apply decay to mastery
  const applyDecay = useCallback(() => {
    setMasteryData(prev => {
      if (!prev) return null;
      return applyMasteryDecay(prev);
    });
  }, []);
  
  // Reset mastery data
  const resetMastery = useCallback(() => {
    setMasteryData(null);
    setAssessmentHistory([]);
  }, []);
  
  // Load mastery data on mount if IDs are provided
  useEffect(() => {
    if (studentId && topicId && !initialMastery) {
      loadMasteryData();
    }
  }, [studentId, topicId, initialMastery, loadMasteryData]);
  
  // Calculate student mastery analytics (mock implementation)
  const getStudentAnalytics = useCallback(async (): Promise<StudentMasteryAnalytics | null> => {
    if (!studentId) {
      setError('Student ID is required');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock topic masteries for the student
      const mockTopicMasteries: TopicMasteryData[] = [
        // Current topic mastery
        ...(masteryData ? [masteryData] : []),
        
        // Other topic masteries
        {
          id: `mastery-${studentId}-topic-2`,
          studentId,
          topicId: 'topic-2',
          subjectId: 'subject-1',
          [BloomsTaxonomyLevel.REMEMBER]: 90,
          [BloomsTaxonomyLevel.UNDERSTAND]: 85,
          [BloomsTaxonomyLevel.APPLY]: 80,
          [BloomsTaxonomyLevel.ANALYZE]: 75,
          [BloomsTaxonomyLevel.EVALUATE]: 70,
          [BloomsTaxonomyLevel.CREATE]: 65,
          overallMastery: 77.5,
          lastAssessmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: `mastery-${studentId}-topic-3`,
          studentId,
          topicId: 'topic-3',
          subjectId: 'subject-2',
          [BloomsTaxonomyLevel.REMEMBER]: 80,
          [BloomsTaxonomyLevel.UNDERSTAND]: 75,
          [BloomsTaxonomyLevel.APPLY]: 70,
          [BloomsTaxonomyLevel.ANALYZE]: 65,
          [BloomsTaxonomyLevel.EVALUATE]: 60,
          [BloomsTaxonomyLevel.CREATE]: 55,
          overallMastery: 67.5,
          lastAssessmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];
      
      return calculateStudentMasteryAnalytics(
        studentId,
        'John Doe', // Mock student name
        mockTopicMasteries
      );
    } catch (err) {
      setError('Failed to load student analytics');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId, masteryData]);
  
  // Calculate class mastery analytics (mock implementation)
  const getClassAnalytics = useCallback(async (classId: string): Promise<ClassMasteryAnalytics | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock student masteries for the class
      const mockStudentMasteries = [
        {
          studentId: 'student-1',
          topicMasteries: [
            {
              id: 'mastery-student-1-topic-1',
              studentId: 'student-1',
              topicId: 'topic-1',
              subjectId: 'subject-1',
              [BloomsTaxonomyLevel.REMEMBER]: 85,
              [BloomsTaxonomyLevel.UNDERSTAND]: 80,
              [BloomsTaxonomyLevel.APPLY]: 75,
              [BloomsTaxonomyLevel.ANALYZE]: 70,
              [BloomsTaxonomyLevel.EVALUATE]: 65,
              [BloomsTaxonomyLevel.CREATE]: 60,
              overallMastery: 72.5,
              lastAssessmentDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        {
          studentId: 'student-2',
          topicMasteries: [
            {
              id: 'mastery-student-2-topic-1',
              studentId: 'student-2',
              topicId: 'topic-1',
              subjectId: 'subject-1',
              [BloomsTaxonomyLevel.REMEMBER]: 90,
              [BloomsTaxonomyLevel.UNDERSTAND]: 85,
              [BloomsTaxonomyLevel.APPLY]: 80,
              [BloomsTaxonomyLevel.ANALYZE]: 75,
              [BloomsTaxonomyLevel.EVALUATE]: 70,
              [BloomsTaxonomyLevel.CREATE]: 65,
              overallMastery: 77.5,
              lastAssessmentDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];
      
      return calculateClassMasteryAnalytics(
        classId,
        'Class 101', // Mock class name
        mockStudentMasteries
      );
    } catch (err) {
      setError('Failed to load class analytics');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    // State
    masteryData,
    isLoading,
    error,
    assessmentHistory,
    
    // Derived values
    masteryLevel,
    masteryColor,
    masteryDescription,
    bloomsLevelBreakdown,
    
    // Actions
    loadMasteryData,
    updateMasteryWithResult,
    applyDecay,
    resetMastery,
    getStudentAnalytics,
    getClassAnalytics,
    
    // Utility functions
    initializeMasteryFromResult,
    applyMasteryDecay,
    updateMasteryLevels,
    calculateOverallMastery,
    getMasteryLevel,
  };
}
