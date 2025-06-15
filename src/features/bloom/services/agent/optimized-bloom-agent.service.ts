/**
 * Optimized Bloom's Taxonomy Agent Service
 * 
 * This service provides optimized agent functionality for Bloom's Taxonomy related tasks.
 * It includes caching, parallel processing, and optimized prompts.
 */

import { AgentService } from '@/features/agent/services/agent.service';
import { BloomsTaxonomyLevel, BloomsDistribution } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { MemoryCache } from '@/server/api/utils/memory-cache';

// Create a cache for agent responses
const agentResponseCache = new MemoryCache<any>("blooms:agent", 30 * 60 * 1000); // 30 minutes

/**
 * Optimized Bloom's Taxonomy Agent Service
 */
export class OptimizedBloomAgentService {
  private agentService: AgentService;

  constructor(agentService: AgentService) {
    this.agentService = agentService;
  }

  /**
   * Generate action verbs for a specific Bloom's Taxonomy level
   * @param level Bloom's Taxonomy level
   * @param subject Optional subject context
   * @param count Number of verbs to generate
   * @returns Array of action verbs
   */
  async generateActionVerbs(
    level: BloomsTaxonomyLevel,
    subject?: string,
    count: number = 10
  ): Promise<string[]> {
    // Generate cache key
    const cacheKey = `action_verbs:${level}:${subject || 'general'}:${count}`;
    
    // Check cache
    const cachedResponse = agentResponseCache.get<string[]>(cacheKey);
    if (cachedResponse) {
      console.log(`[OptimizedBloomAgentService] Cache hit for action verbs: ${level}`);
      return cachedResponse;
    }
    
    console.log(`[OptimizedBloomAgentService] Cache miss for action verbs: ${level}`);
    
    // Prepare optimized prompt
    const levelMetadata = BLOOMS_LEVEL_METADATA[level];
    const prompt = `
      Generate ${count} specific action verbs for the "${levelMetadata.name}" level of Bloom's Taxonomy${subject ? ` in the context of ${subject}` : ''}.
      
      The "${levelMetadata.name}" level is about ${levelMetadata.description}.
      
      Return ONLY a JSON array of strings with no explanation or additional text. For example: ["verb1", "verb2", "verb3"]
    `;
    
    try {
      // Call agent with optimized prompt
      const response = await this.agentService.getCompletion({
        prompt,
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 200, // Limit token usage
        response_format: { type: "json_object" } // Force JSON response
      });
      
      // Parse response
      let verbs: string[] = [];
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          verbs = parsedResponse;
        } else if (parsedResponse.verbs && Array.isArray(parsedResponse.verbs)) {
          verbs = parsedResponse.verbs;
        }
      } catch (error) {
        console.error('Error parsing action verbs response:', error);
        // Fallback to simple string splitting if JSON parsing fails
        verbs = response
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length > 0);
      }
      
      // Limit to requested count
      verbs = verbs.slice(0, count);
      
      // Cache the result
      agentResponseCache.set(cacheKey, verbs, 24 * 60 * 60 * 1000); // 24 hours
      
      return verbs;
    } catch (error) {
      console.error('Error generating action verbs:', error);
      throw error;
    }
  }

  /**
   * Generate learning outcomes for a specific topic and Bloom's level
   * @param topic Topic name
   * @param level Bloom's Taxonomy level
   * @param count Number of learning outcomes to generate
   * @returns Array of learning outcomes
   */
  async generateLearningOutcomes(
    topic: string,
    level: BloomsTaxonomyLevel,
    count: number = 3
  ): Promise<string[]> {
    // Generate cache key
    const cacheKey = `learning_outcomes:${topic}:${level}:${count}`;
    
    // Check cache
    const cachedResponse = agentResponseCache.get<string[]>(cacheKey);
    if (cachedResponse) {
      console.log(`[OptimizedBloomAgentService] Cache hit for learning outcomes: ${topic}, ${level}`);
      return cachedResponse;
    }
    
    console.log(`[OptimizedBloomAgentService] Cache miss for learning outcomes: ${topic}, ${level}`);
    
    // Prepare optimized prompt
    const levelMetadata = BLOOMS_LEVEL_METADATA[level];
    const prompt = `
      Generate ${count} specific learning outcomes for the topic "${topic}" at the "${levelMetadata.name}" level of Bloom's Taxonomy.
      
      The "${levelMetadata.name}" level is about ${levelMetadata.description}.
      
      Each learning outcome should:
      1. Start with an action verb appropriate for the "${levelMetadata.name}" level
      2. Be specific and measurable
      3. Focus on what the student will be able to do
      4. Be relevant to the topic "${topic}"
      
      Return ONLY a JSON array of strings with no explanation or additional text. For example: ["outcome1", "outcome2", "outcome3"]
    `;
    
    try {
      // Call agent with optimized prompt
      const response = await this.agentService.getCompletion({
        prompt,
        temperature: 0.5,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });
      
      // Parse response
      let outcomes: string[] = [];
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          outcomes = parsedResponse;
        } else if (parsedResponse.outcomes && Array.isArray(parsedResponse.outcomes)) {
          outcomes = parsedResponse.outcomes;
        }
      } catch (error) {
        console.error('Error parsing learning outcomes response:', error);
        // Fallback to simple string splitting if JSON parsing fails
        outcomes = response
          .split('\n')
          .map(o => o.replace(/^\d+\.\s*/, '').trim())
          .filter(o => o.length > 0)
          .slice(0, count);
      }
      
      // Cache the result
      agentResponseCache.set(cacheKey, outcomes, 12 * 60 * 60 * 1000); // 12 hours
      
      return outcomes;
    } catch (error) {
      console.error('Error generating learning outcomes:', error);
      throw error;
    }
  }

  /**
   * Generate intervention suggestions based on cognitive gaps
   * @param subject Subject name
   * @param gaps Array of cognitive gaps
   * @returns Array of intervention suggestions
   */
  async generateInterventionSuggestions(
    subject: string,
    gaps: Array<{ level: BloomsTaxonomyLevel; gap: number }>
  ): Promise<string[]> {
    // Generate cache key
    const cacheKey = `intervention_suggestions:${subject}:${JSON.stringify(gaps)}`;
    
    // Check cache
    const cachedResponse = agentResponseCache.get<string[]>(cacheKey);
    if (cachedResponse) {
      console.log(`[OptimizedBloomAgentService] Cache hit for intervention suggestions: ${subject}`);
      return cachedResponse;
    }
    
    console.log(`[OptimizedBloomAgentService] Cache miss for intervention suggestions: ${subject}`);
    
    // Prepare optimized prompt
    const gapsDescription = gaps
      .map(g => `${BLOOMS_LEVEL_METADATA[g.level].name}: ${g.gap}% gap`)
      .join(', ');
    
    const prompt = `
      Generate specific intervention suggestions for a class studying "${subject}" with the following cognitive gaps:
      ${gapsDescription}
      
      For each significant gap, provide:
      1. A specific teaching strategy to address the gap
      2. An activity that targets the specific cognitive level
      3. A resource recommendation if applicable
      
      Return ONLY a JSON array of strings with no explanation or additional text. Each string should be a complete intervention suggestion.
    `;
    
    try {
      // Call agent with optimized prompt
      const response = await this.agentService.getCompletion({
        prompt,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
      
      // Parse response
      let suggestions: string[] = [];
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          suggestions = parsedResponse;
        } else if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
          suggestions = parsedResponse.suggestions;
        }
      } catch (error) {
        console.error('Error parsing intervention suggestions response:', error);
        // Fallback to simple string splitting if JSON parsing fails
        suggestions = response
          .split('\n')
          .map(s => s.replace(/^\d+\.\s*/, '').trim())
          .filter(s => s.length > 0);
      }
      
      // Cache the result
      agentResponseCache.set(cacheKey, suggestions, 6 * 60 * 60 * 1000); // 6 hours
      
      return suggestions;
    } catch (error) {
      console.error('Error generating intervention suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate a recommended Bloom's distribution for a subject and grade level
   * @param subject Subject name
   * @param gradeLevel Grade level
   * @returns Recommended Bloom's distribution
   */
  async generateRecommendedDistribution(
    subject: string,
    gradeLevel: number
  ): Promise<BloomsDistribution> {
    // Generate cache key
    const cacheKey = `recommended_distribution:${subject}:${gradeLevel}`;
    
    // Check cache
    const cachedResponse = agentResponseCache.get<BloomsDistribution>(cacheKey);
    if (cachedResponse) {
      console.log(`[OptimizedBloomAgentService] Cache hit for recommended distribution: ${subject}, grade ${gradeLevel}`);
      return cachedResponse;
    }
    
    console.log(`[OptimizedBloomAgentService] Cache miss for recommended distribution: ${subject}, grade ${gradeLevel}`);
    
    // Prepare optimized prompt
    const prompt = `
      Generate a recommended Bloom's Taxonomy distribution for "${subject}" at grade level ${gradeLevel}.
      
      Consider:
      - Age-appropriate cognitive development
      - Subject-specific requirements
      - Educational best practices
      
      Return ONLY a JSON object with the following structure:
      {
        "REMEMBER": percentage,
        "UNDERSTAND": percentage,
        "APPLY": percentage,
        "ANALYZE": percentage,
        "EVALUATE": percentage,
        "CREATE": percentage
      }
      
      Ensure percentages are integers and sum to 100.
    `;
    
    try {
      // Call agent with optimized prompt
      const response = await this.agentService.getCompletion({
        prompt,
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });
      
      // Parse response
      let distribution: BloomsDistribution;
      try {
        distribution = JSON.parse(response);
        
        // Validate distribution
        const levels = Object.values(BloomsTaxonomyLevel);
        let total = 0;
        
        for (const level of levels) {
          if (typeof distribution[level] !== 'number') {
            distribution[level] = 0;
          }
          distribution[level] = Math.round(distribution[level]);
          total += distribution[level];
        }
        
        // Adjust if total is not 100
        if (total !== 100) {
          const adjustment = 100 - total;
          distribution[BloomsTaxonomyLevel.UNDERSTAND] += adjustment;
        }
      } catch (error) {
        console.error('Error parsing recommended distribution response:', error);
        // Fallback to default distribution
        distribution = {
          [BloomsTaxonomyLevel.REMEMBER]: 20,
          [BloomsTaxonomyLevel.UNDERSTAND]: 25,
          [BloomsTaxonomyLevel.APPLY]: 25,
          [BloomsTaxonomyLevel.ANALYZE]: 15,
          [BloomsTaxonomyLevel.EVALUATE]: 10,
          [BloomsTaxonomyLevel.CREATE]: 5
        };
      }
      
      // Cache the result
      agentResponseCache.set(cacheKey, distribution, 30 * 24 * 60 * 60 * 1000); // 30 days
      
      return distribution;
    } catch (error) {
      console.error('Error generating recommended distribution:', error);
      throw error;
    }
  }
}
