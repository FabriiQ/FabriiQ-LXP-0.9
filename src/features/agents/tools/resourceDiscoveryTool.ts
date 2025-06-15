import { AgentTool } from '../core/types';
import axios from 'axios';

/**
 * Resource type enum
 */
export enum ResourceType {
  FILE = 'FILE',
  FOLDER = 'FOLDER',
  LINK = 'LINK',
}

/**
 * Resource access enum
 */
export enum ResourceAccess {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC',
}

/**
 * Resource interface
 */
export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url?: string;
  access: ResourceAccess;
  ownerId: string;
  parentId?: string;
  tags: string[];
  settings?: Record<string, any>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a tool for retrieving resources
 */
export const createResourceDiscoveryTool = (): AgentTool => {
  return {
    name: 'getResources',
    description: 'Retrieves educational resources based on various criteria',
    parameters: {
      resourceIds: 'Optional array of specific resource IDs to retrieve',
      ownerId: 'Optional owner ID to filter resources by',
      parentId: 'Optional parent folder ID to filter resources by',
      type: 'Optional resource type to filter by (FILE, FOLDER, LINK)',
      access: 'Optional access level to filter by (PRIVATE, SHARED, PUBLIC)',
      tags: 'Optional array of tags to filter resources by',
      search: 'Optional search term to filter resources by title or description',
      limit: 'Maximum number of resources to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        resourceIds, 
        ownerId, 
        parentId, 
        type, 
        access, 
        tags,
        search,
        limit = 10,
        skip = 0
      } = params;
      
      try {
        let endpoint = '/api/resources';
        let queryParams: Record<string, any> = {
          limit,
          skip
        };
        
        // Build query parameters based on provided filters
        if (resourceIds && Array.isArray(resourceIds)) {
          queryParams.ids = resourceIds.join(',');
        }
        
        if (ownerId) {
          queryParams.ownerId = ownerId;
        }
        
        if (parentId) {
          queryParams.parentId = parentId;
        }
        
        if (type) {
          queryParams.type = type;
        }
        
        if (access) {
          queryParams.access = access;
        }
        
        if (tags && Array.isArray(tags)) {
          queryParams.tags = tags.join(',');
        }
        
        if (search) {
          queryParams.search = search;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve resources: ${response.statusText}`);
        }
        
        const resources = response.data.resources || [];
        
        return {
          resources,
          metadata: {
            total: response.data.total || resources.length,
            returned: resources.length,
            filters: {
              resourceIds,
              ownerId,
              parentId,
              type,
              access,
              tags,
              search,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || resources.length) > skip + resources.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving resources:', error);
        throw new Error(`Resource retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for searching resources
 */
export const createResourceSearchTool = (): AgentTool => {
  return {
    name: 'searchResources',
    description: 'Searches for educational resources based on keywords and filters',
    parameters: {
      searchTerm: 'Search term to find resources',
      resourceTypes: 'Optional array of resource types to filter by (FILE, FOLDER, LINK)',
      accessLevels: 'Optional array of access levels to filter by (PRIVATE, SHARED, PUBLIC)',
      tags: 'Optional array of tags to filter resources by',
      ownerId: 'Optional owner ID to filter resources by',
      limit: 'Maximum number of results to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        searchTerm, 
        resourceTypes, 
        accessLevels, 
        tags,
        ownerId,
        limit = 10,
        skip = 0
      } = params;
      
      if (!searchTerm) {
        throw new Error('Search term is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = '/api/resources/search';
        const queryParams: Record<string, any> = {
          search: searchTerm,
          limit,
          skip
        };
        
        if (resourceTypes && Array.isArray(resourceTypes)) {
          queryParams.types = resourceTypes.join(',');
        }
        
        if (accessLevels && Array.isArray(accessLevels)) {
          queryParams.access = accessLevels.join(',');
        }
        
        if (tags && Array.isArray(tags)) {
          queryParams.tags = tags.join(',');
        }
        
        if (ownerId) {
          queryParams.ownerId = ownerId;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to search resources: ${response.statusText}`);
        }
        
        const resources = response.data.resources || [];
        
        return {
          searchTerm,
          resources,
          metadata: {
            total: response.data.total || resources.length,
            returned: resources.length,
            filters: {
              resourceTypes,
              accessLevels,
              tags,
              ownerId,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || resources.length) > skip + resources.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error searching resources:', error);
        throw new Error(`Resource search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving resource details
 */
export const createResourceDetailsTool = (): AgentTool => {
  return {
    name: 'getResourceDetails',
    description: 'Retrieves detailed information about a specific resource',
    parameters: {
      resourceId: 'ID of the resource to retrieve details for',
      includePermissions: 'Whether to include permission information (default: false)',
      includeChildren: 'Whether to include child resources for folders (default: false)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        resourceId, 
        includePermissions = false,
        includeChildren = false
      } = params;
      
      if (!resourceId) {
        throw new Error('Resource ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = `/api/resources/${resourceId}`;
        const queryParams: Record<string, any> = {
          includePermissions,
          includeChildren
        };
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve resource details: ${response.statusText}`);
        }
        
        return {
          resource: response.data.resource,
          children: response.data.children || [],
          permissions: response.data.permissions || [],
          metadata: {
            includePermissions,
            includeChildren,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving resource details:', error);
        throw new Error(`Resource details retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving resources by topic
 */
export const createTopicResourcesTool = (): AgentTool => {
  return {
    name: 'getTopicResources',
    description: 'Retrieves educational resources related to specific topics',
    parameters: {
      topicIds: 'Array of topic IDs to retrieve resources for',
      resourceTypes: 'Optional array of resource types to filter by (FILE, FOLDER, LINK)',
      accessLevels: 'Optional array of access levels to filter by (PRIVATE, SHARED, PUBLIC)',
      limit: 'Maximum number of resources to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        topicIds, 
        resourceTypes, 
        accessLevels,
        limit = 10,
        skip = 0
      } = params;
      
      if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
        throw new Error('At least one topic ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = '/api/topics/resources';
        const queryParams: Record<string, any> = {
          topicIds: topicIds.join(','),
          limit,
          skip
        };
        
        if (resourceTypes && Array.isArray(resourceTypes)) {
          queryParams.types = resourceTypes.join(',');
        }
        
        if (accessLevels && Array.isArray(accessLevels)) {
          queryParams.access = accessLevels.join(',');
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve topic resources: ${response.statusText}`);
        }
        
        const resources = response.data.resources || [];
        
        return {
          topicIds,
          resources,
          metadata: {
            total: response.data.total || resources.length,
            returned: resources.length,
            filters: {
              resourceTypes,
              accessLevels,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || resources.length) > skip + resources.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving topic resources:', error);
        throw new Error(`Topic resources retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};
