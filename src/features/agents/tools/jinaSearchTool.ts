import { AgentTool } from '../core/types';
import axios from 'axios';

// Real Jina AI API client interfaces
interface JinaSearchOptions {
  query: string;
  limit?: number;
  filter?: Record<string, any>;
  modality?: 'text' | 'image' | 'video' | 'multimodal';
}

interface JinaSearchResult {
  id: string;
  score: number;
  content: any;
  metadata: Record<string, any>;
}

/**
 * Real implementation of Jina AI search client
 * See https://jina.ai/ for more information
 */
class JinaSearchClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string = 'https://api.jina.ai/v1/search') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async search(options: JinaSearchOptions): Promise<JinaSearchResult[]> {
    try {
      const { query, limit = 5, filter, modality = 'text' } = options;

      // Prepare request payload
      const payload = {
        query,
        limit,
        filter,
        modality,
      };

      // Make API request to Jina AI
      const response = await axios.post(this.endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Process and return results
      if (response.status === 200 && response.data && response.data.results) {
        return response.data.results.map((result: any) => ({
          id: result.id,
          score: result.score,
          content: result.content,
          metadata: result.metadata || {},
        }));
      }

      // Handle empty or invalid response
      return [];
    } catch (error) {
      console.error('Error searching with Jina AI:', error);
      throw new Error(`Jina AI search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create a singleton instance of the client
// API key is loaded from environment variables
const jinaClient = new JinaSearchClient(process.env.JINA_API_KEY || '');

/**
 * Creates a tool for searching text content using Jina AI
 */
export const createJinaTextSearchTool = (): AgentTool => {
  return {
    name: 'searchText',
    description: 'Searches for text content using Jina AI semantic search',
    parameters: {
      query: 'The search query',
      limit: 'Maximum number of results to return (default: 5)',
      filter: 'Optional filters to apply to the search',
      context: 'Optional context to improve search relevance',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { query, limit, filter, context } = params;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Enhance query with context if provided
      const enhancedQuery = context ? `${query} ${context}` : query;

      try {
        const results = await jinaClient.search({
          query: enhancedQuery,
          limit,
          filter,
          modality: 'text',
        });

        return {
          results,
          metadata: {
            query: enhancedQuery,
            originalQuery: query,
            resultCount: results.length,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error in text search:', error);
        throw new Error(`Text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for searching images using Jina AI
 */
export const createJinaImageSearchTool = (): AgentTool => {
  return {
    name: 'searchImages',
    description: 'Searches for images using Jina AI visual search',
    parameters: {
      query: 'The search query (text description or image URL)',
      limit: 'Maximum number of results to return (default: 5)',
      filter: 'Optional filters to apply to the search',
      educationalUseOnly: 'Whether to restrict results to educational content only (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { query, limit, filter, educationalUseOnly = true } = params;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Add educational content filter if requested
      const enhancedFilter = educationalUseOnly
        ? { ...filter, contentType: 'educational', safeSearch: true }
        : filter;

      try {
        const results = await jinaClient.search({
          query,
          limit,
          filter: enhancedFilter,
          modality: 'image',
        });

        return {
          results,
          metadata: {
            query,
            resultCount: results.length,
            educationalUseOnly,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error in image search:', error);
        throw new Error(`Image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for searching videos using Jina AI
 */
export const createJinaVideoSearchTool = (): AgentTool => {
  return {
    name: 'searchVideos',
    description: 'Searches for videos using Jina AI video search',
    parameters: {
      query: 'The search query (text description or video URL)',
      limit: 'Maximum number of results to return (default: 5)',
      filter: 'Optional filters to apply to the search',
      maxDuration: 'Maximum video duration in seconds (default: 600)',
      educationalUseOnly: 'Whether to restrict results to educational content only (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { query, limit, filter, maxDuration = 600, educationalUseOnly = true } = params;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Add educational content and duration filters
      const enhancedFilter = {
        ...filter,
        ...(educationalUseOnly && { contentType: 'educational', safeSearch: true }),
        ...(maxDuration && { maxDuration }),
      };

      try {
        const results = await jinaClient.search({
          query,
          limit,
          filter: enhancedFilter,
          modality: 'video',
        });

        return {
          results,
          metadata: {
            query,
            resultCount: results.length,
            maxDuration,
            educationalUseOnly,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error in video search:', error);
        throw new Error(`Video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for multimodal search using Jina AI
 */
export const createJinaMultimodalSearchTool = (): AgentTool => {
  return {
    name: 'searchMultimodal',
    description: 'Searches across text, images, and videos using Jina AI multimodal search',
    parameters: {
      query: 'The search query',
      limit: 'Maximum number of results to return (default: 5)',
      filter: 'Optional filters to apply to the search',
      modalities: 'Array of modalities to include in search (default: ["text", "image", "video"])',
      educationalUseOnly: 'Whether to restrict results to educational content only (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        query,
        limit,
        filter,
        modalities = ['text', 'image', 'video'],
        educationalUseOnly = true
      } = params;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Add educational content filter if requested
      const enhancedFilter = educationalUseOnly
        ? { ...filter, contentType: 'educational', safeSearch: true }
        : filter;

      try {
        const results = await jinaClient.search({
          query,
          limit,
          filter: enhancedFilter,
          modality: 'multimodal',
        });

        // Filter results by requested modalities if specified
        const filteredResults = modalities.length < 3
          ? results.filter(result => modalities.includes(result.metadata?.type || 'text'))
          : results;

        return {
          results: filteredResults,
          metadata: {
            query,
            resultCount: filteredResults.length,
            modalities,
            educationalUseOnly,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error in multimodal search:', error);
        throw new Error(`Multimodal search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};
