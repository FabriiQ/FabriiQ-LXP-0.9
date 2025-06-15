import { AgentTool } from '../core/types';
import axios from 'axios';

/**
 * Subject topic interface
 */
export interface SubjectTopic {
  id: string;
  code: string;
  title: string;
  description?: string;
  context?: string;
  learningOutcomes?: string;
  nodeType: string;
  orderIndex: number;
  estimatedMinutes?: number;
  competencyLevel?: string;
  keywords: string[];
  subjectId: string;
  parentTopicId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Learning objective interface
 */
export interface LearningObjective {
  id: string;
  description: string;
  taxonomyLevel: string;
  standards?: string[];
}

/**
 * Creates a tool for retrieving subject topics
 */
export const createTopicDataTool = (): AgentTool => {
  return {
    name: 'getTopicData',
    description: 'Retrieves topic data including learning objectives',
    parameters: {
      topicId: 'ID of the specific topic to retrieve',
      subjectId: 'Optional subject ID to retrieve topics for',
      nodeType: 'Optional node type to filter by (CHAPTER, TOPIC, SUBTOPIC)',
      parentTopicId: 'Optional parent topic ID to filter by',
      includeSubtopics: 'Whether to include subtopics (default: false)',
      includeParentTopics: 'Whether to include parent topics (default: false)',
      includeLearningObjectives: 'Whether to include learning objectives (default: true)',
      search: 'Optional search term to filter topics by title or description',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        topicId, 
        subjectId, 
        nodeType, 
        parentTopicId,
        includeSubtopics = false,
        includeParentTopics = false,
        includeLearningObjectives = true,
        search
      } = params;
      
      if (!topicId && !subjectId && !search) {
        throw new Error('At least one of topicId, subjectId, or search must be provided');
      }
      
      try {
        let endpoint = '';
        let queryParams: Record<string, any> = {
          includeSubtopics,
          includeParentTopics,
          includeLearningObjectives
        };
        
        // Determine the appropriate API endpoint and parameters
        if (topicId) {
          endpoint = `/api/subject-topics/${topicId}`;
        } else {
          endpoint = '/api/subject-topics';
          
          if (subjectId) {
            queryParams.subjectId = subjectId;
          }
          
          if (nodeType) {
            queryParams.nodeType = nodeType;
          }
          
          if (parentTopicId) {
            queryParams.parentTopicId = parentTopicId;
          }
          
          if (search) {
            queryParams.search = search;
          }
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve topic data: ${response.statusText}`);
        }
        
        // Handle both single topic and multiple topics responses
        const topics = topicId ? [response.data.topic] : (response.data.topics || []);
        
        return {
          topics,
          metadata: {
            count: topics.length,
            filters: {
              topicId,
              subjectId,
              nodeType,
              parentTopicId,
              search,
            },
            includeSubtopics,
            includeParentTopics,
            includeLearningObjectives,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving topic data:', error);
        throw new Error(`Topic data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving curriculum structure
 */
export const createCurriculumStructureTool = (): AgentTool => {
  return {
    name: 'getCurriculumStructure',
    description: 'Retrieves curriculum structure including subjects, topics, and learning objectives',
    parameters: {
      subjectId: 'ID of the subject to retrieve curriculum structure for',
      includeTopics: 'Whether to include topics (default: true)',
      includeSubtopics: 'Whether to include subtopics (default: true)',
      includeLearningObjectives: 'Whether to include learning objectives (default: true)',
      maxDepth: 'Maximum depth of the topic hierarchy to retrieve (default: 3)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        subjectId, 
        includeTopics = true,
        includeSubtopics = true,
        includeLearningObjectives = true,
        maxDepth = 3
      } = params;
      
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = `/api/subjects/${subjectId}/structure`;
        const queryParams: Record<string, any> = {
          includeTopics,
          includeSubtopics,
          includeLearningObjectives,
          maxDepth
        };
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve curriculum structure: ${response.statusText}`);
        }
        
        return {
          subjectId,
          subject: response.data.subject,
          structure: response.data.structure,
          metadata: {
            topicCount: response.data.topicCount,
            subtopicCount: response.data.subtopicCount,
            learningObjectiveCount: response.data.learningObjectiveCount,
            maxDepth,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving curriculum structure:', error);
        throw new Error(`Curriculum structure retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving learning objectives
 */
export const createLearningObjectivesTool = (): AgentTool => {
  return {
    name: 'getLearningObjectives',
    description: 'Retrieves learning objectives for topics',
    parameters: {
      topicIds: 'Array of topic IDs to retrieve learning objectives for',
      taxonomyLevel: 'Optional taxonomy level to filter by (e.g., REMEMBER, UNDERSTAND, APPLY)',
      search: 'Optional search term to filter learning objectives',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { topicIds, taxonomyLevel, search } = params;
      
      if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
        throw new Error('At least one topic ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = '/api/learning-objectives';
        const queryParams: Record<string, any> = {
          topicIds: topicIds.join(',')
        };
        
        if (taxonomyLevel) {
          queryParams.taxonomyLevel = taxonomyLevel;
        }
        
        if (search) {
          queryParams.search = search;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve learning objectives: ${response.statusText}`);
        }
        
        const objectives = response.data.objectives || [];
        
        return {
          topicIds,
          objectives,
          metadata: {
            count: objectives.length,
            filters: {
              taxonomyLevel,
              search,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving learning objectives:', error);
        throw new Error(`Learning objectives retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for searching topics
 */
export const createTopicSearchTool = (): AgentTool => {
  return {
    name: 'searchTopics',
    description: 'Searches for topics across subjects',
    parameters: {
      searchTerm: 'Search term to find topics',
      subjectIds: 'Optional array of subject IDs to limit the search',
      nodeTypes: 'Optional array of node types to filter by (CHAPTER, TOPIC, SUBTOPIC)',
      limit: 'Maximum number of results to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        searchTerm, 
        subjectIds, 
        nodeTypes,
        limit = 10,
        skip = 0
      } = params;
      
      if (!searchTerm) {
        throw new Error('Search term is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = '/api/subject-topics/search';
        const queryParams: Record<string, any> = {
          search: searchTerm,
          limit,
          skip
        };
        
        if (subjectIds && Array.isArray(subjectIds)) {
          queryParams.subjectIds = subjectIds.join(',');
        }
        
        if (nodeTypes && Array.isArray(nodeTypes)) {
          queryParams.nodeTypes = nodeTypes.join(',');
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to search topics: ${response.statusText}`);
        }
        
        const topics = response.data.topics || [];
        
        return {
          searchTerm,
          topics,
          metadata: {
            total: response.data.total || topics.length,
            returned: topics.length,
            filters: {
              subjectIds,
              nodeTypes,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || topics.length) > skip + topics.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error searching topics:', error);
        throw new Error(`Topic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};
