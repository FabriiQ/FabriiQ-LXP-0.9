/**
 * tRPC Topic Mastery Hook
 * 
 * This hook provides access to Topic Mastery tRPC endpoints.
 */

import { useState } from 'react';
import { api } from '@/utils/api';
import { 
  TopicMasteryData, 
  StudentMasteryAnalytics,
  ClassMasteryAnalytics,
  BloomsTaxonomyLevel
} from '../types';
import { 
  MasteryPartitionType,
  MasteryPartitionOptions,
  PartitionedMasteryData
} from '../services';

/**
 * Hook for using Topic Mastery tRPC endpoints
 */
export function useTrpcMastery() {
  // State for loading status
  const [isLoadingMastery, setIsLoadingMastery] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingPartitions, setIsLoadingPartitions] = useState(false);

  // tRPC queries
  const getTopicMasteryQuery = api.mastery.getTopicMastery.useQuery;
  const getStudentAnalyticsQuery = api.mastery.getStudentAnalytics.useQuery;
  const getClassAnalyticsQuery = api.mastery.getClassAnalytics.useQuery;
  const getPartitionedMasteryQuery = api.mastery.getPartitionedMastery.useQuery;
  const getMultiPartitionMasteryQuery = api.mastery.getMultiPartitionMastery.useQuery;

  // tRPC mutations
  const updateMasteryFromAssessmentMutation = api.mastery.updateMasteryFromAssessment.useMutation();

  /**
   * Get topic mastery data for a student
   */
  const getTopicMastery = (
    studentId: string,
    topicId: string
  ) => {
    return getTopicMasteryQuery(
      { studentId, topicId },
      {
        enabled: !!studentId && !!topicId,
        onError: (error) => {
          console.error('Error getting topic mastery:', error);
        }
      }
    );
  };

  /**
   * Get student mastery analytics
   */
  const getStudentAnalytics = (
    studentId: string,
    subjectId?: string
  ) => {
    return getStudentAnalyticsQuery(
      { studentId, subjectId },
      {
        enabled: !!studentId,
        onError: (error) => {
          console.error('Error getting student analytics:', error);
        }
      }
    );
  };

  /**
   * Get class mastery analytics
   */
  const getClassAnalytics = (
    classId: string,
    subjectId?: string
  ) => {
    return getClassAnalyticsQuery(
      { classId, subjectId },
      {
        enabled: !!classId,
        onError: (error) => {
          console.error('Error getting class analytics:', error);
        }
      }
    );
  };

  /**
   * Get partitioned mastery data
   */
  const getPartitionedMastery = (
    options: MasteryPartitionOptions
  ) => {
    return getPartitionedMasteryQuery(
      options,
      {
        enabled: !!options.partitionType,
        onError: (error) => {
          console.error('Error getting partitioned mastery:', error);
        }
      }
    );
  };

  /**
   * Get multi-partition mastery data
   */
  const getMultiPartitionMastery = (
    partitions: MasteryPartitionOptions[]
  ) => {
    return getMultiPartitionMasteryQuery(
      partitions,
      {
        enabled: partitions.length > 0,
        onError: (error) => {
          console.error('Error getting multi-partition mastery:', error);
        }
      }
    );
  };

  /**
   * Update topic mastery from assessment result
   */
  const updateMasteryFromAssessment = async (
    assessmentResultId: string
  ): Promise<TopicMasteryData> => {
    try {
      const result = await updateMasteryFromAssessmentMutation.mutateAsync({
        assessmentResultId
      });
      
      return result;
    } catch (error) {
      console.error('Error updating mastery from assessment:', error);
      throw error;
    }
  };

  /**
   * Get global leaderboard
   */
  const getGlobalLeaderboard = (limit: number = 10) => {
    return getPartitionedMasteryQuery(
      {
        partitionType: 'global',
        limit
      },
      {
        onError: (error) => {
          console.error('Error getting global leaderboard:', error);
        }
      }
    );
  };

  /**
   * Get subject leaderboard
   */
  const getSubjectLeaderboard = (subjectId: string, limit: number = 10) => {
    return getPartitionedMasteryQuery(
      {
        partitionType: 'subject',
        subjectId,
        limit
      },
      {
        enabled: !!subjectId,
        onError: (error) => {
          console.error('Error getting subject leaderboard:', error);
        }
      }
    );
  };

  /**
   * Get topic leaderboard
   */
  const getTopicLeaderboard = (topicId: string, limit: number = 10) => {
    return getPartitionedMasteryQuery(
      {
        partitionType: 'topic',
        topicId,
        limit
      },
      {
        enabled: !!topicId,
        onError: (error) => {
          console.error('Error getting topic leaderboard:', error);
        }
      }
    );
  };

  /**
   * Get class leaderboard
   */
  const getClassLeaderboard = (classId: string, limit: number = 10) => {
    return getPartitionedMasteryQuery(
      {
        partitionType: 'class',
        classId,
        limit
      },
      {
        enabled: !!classId,
        onError: (error) => {
          console.error('Error getting class leaderboard:', error);
        }
      }
    );
  };

  /**
   * Get Bloom's level leaderboard
   */
  const getBloomsLevelLeaderboard = (bloomsLevel: BloomsTaxonomyLevel, limit: number = 10) => {
    return getPartitionedMasteryQuery(
      {
        partitionType: 'bloomsLevel',
        bloomsLevel,
        limit
      },
      {
        enabled: !!bloomsLevel,
        onError: (error) => {
          console.error('Error getting Bloom\'s level leaderboard:', error);
        }
      }
    );
  };

  /**
   * Get all leaderboards for a student dashboard
   */
  const getStudentDashboardLeaderboards = (
    studentId: string,
    subjectId?: string,
    topicId?: string,
    classId?: string
  ) => {
    const partitions: MasteryPartitionOptions[] = [
      { partitionType: 'global', limit: 10 }
    ];
    
    if (subjectId) {
      partitions.push({ partitionType: 'subject', subjectId, limit: 10 });
    }
    
    if (topicId) {
      partitions.push({ partitionType: 'topic', topicId, limit: 10 });
    }
    
    if (classId) {
      partitions.push({ partitionType: 'class', classId, limit: 10 });
    }
    
    // Add Bloom's level partitions
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      partitions.push({ partitionType: 'bloomsLevel', bloomsLevel: level, limit: 5 });
    });
    
    return getMultiPartitionMasteryQuery(
      partitions,
      {
        enabled: !!studentId,
        onError: (error) => {
          console.error('Error getting student dashboard leaderboards:', error);
        }
      }
    );
  };

  return {
    // Topic mastery
    getTopicMastery,
    
    // Analytics
    getStudentAnalytics,
    getClassAnalytics,
    
    // Partitioned mastery
    getPartitionedMastery,
    getMultiPartitionMastery,
    
    // Leaderboards
    getGlobalLeaderboard,
    getSubjectLeaderboard,
    getTopicLeaderboard,
    getClassLeaderboard,
    getBloomsLevelLeaderboard,
    getStudentDashboardLeaderboards,
    
    // Mutations
    updateMasteryFromAssessment,
    
    // Loading states
    isLoadingMastery,
    isLoadingAnalytics,
    isLoadingPartitions,
  };
}
