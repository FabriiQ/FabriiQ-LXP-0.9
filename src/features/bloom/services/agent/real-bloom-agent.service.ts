/**
 * Real Bloom's Taxonomy Agent Service
 *
 * This service provides real AI-powered functionality for Bloom's Taxonomy related tasks
 * using Google's Generative AI (Gemini) model.
 */

import { BloomsTaxonomyLevel, LearningOutcomeFramework } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { FRAMEWORK_PROMPTS, DEFAULT_FRAMEWORK } from '../../constants/learning-outcome-frameworks';
import { MemoryCache } from '@/server/api/utils/memory-cache';

// Create a cache for agent responses
const agentResponseCache = new MemoryCache<any>("blooms:agent", 30 * 60 * 1000); // 30 minutes

// Cache version to invalidate old responses when prompt format changes
const CACHE_VERSION = "v2.0"; // Updated to clear old JSON-formatted responses

/**
 * Real Bloom's Taxonomy Agent Service using Google Generative AI
 */
export class RealBloomAgentService {
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
    // Generate cache key with version
    const cacheKey = `${CACHE_VERSION}:action_verbs:${level}:${subject || 'general'}:${count}`;

    // Check cache
    const cachedResponse = agentResponseCache.get<string[]>(cacheKey);
    if (cachedResponse) {
      console.log(`[RealBloomAgentService] Cache hit for action verbs: ${level}`);
      return cachedResponse;
    }

    console.log(`[RealBloomAgentService] Cache miss for action verbs: ${level}`);

    // Prepare optimized prompt
    const levelMetadata = BLOOMS_LEVEL_METADATA[level];
    const prompt = `
      Generate ${count} specific action verbs for the "${levelMetadata.name}" level of Bloom's Taxonomy${subject ? ` in the context of ${subject}` : ''}.

      The "${levelMetadata.name}" level is about ${levelMetadata.description}.

      Return ONLY a JSON array of strings with no explanation or additional text. For example: ["verb1", "verb2", "verb3"]
    `;

    try {
      // Call Google Generative AI
      const response = await this.callGeminiAI(prompt, {
        temperature: 0.3, // Lower temperature for more consistent results
        maxOutputTokens: 200, // Limit token usage
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
   * @param customPrompt Optional custom prompt to guide generation
   * @param taxonomyDistribution Optional distribution across multiple taxonomy levels
   * @param selectedActionVerbs Optional array of specific action verbs to use
   * @param framework Optional learning outcome framework to use
   * @returns Array of learning outcomes with action verb metadata
   */
  async generateLearningOutcomes(
    topic: string,
    level: BloomsTaxonomyLevel,
    count: number = 3,
    customPrompt?: string,
    taxonomyDistribution?: Record<BloomsTaxonomyLevel, number>,
    selectedActionVerbs?: string[],
    framework?: import('../../types/bloom-taxonomy').LearningOutcomeFramework
  ): Promise<Array<{ outcome: string; actionVerbs: string[]; bloomsLevel: BloomsTaxonomyLevel; framework?: string }> | string[]> {
    // Generate cache key with version - include taxonomy distribution, action verbs, and framework in cache key if provided
    const distributionKey = taxonomyDistribution ? JSON.stringify(taxonomyDistribution) : '';
    const actionVerbsKey = selectedActionVerbs ? selectedActionVerbs.join(',') : '';
    const frameworkKey = framework || 'default';
    const cacheKey = `${CACHE_VERSION}:learning_outcomes:${topic}:${level}:${count}:${customPrompt || ''}:${distributionKey}:${actionVerbsKey}:${frameworkKey}`;

    // Check cache
    const cachedResponse = agentResponseCache.get<any>(cacheKey);
    if (cachedResponse) {
      console.log(`[RealBloomAgentService] Cache hit for learning outcomes: ${topic}, ${level}`);
      return cachedResponse;
    }

    console.log(`[RealBloomAgentService] Cache miss for learning outcomes: ${topic}, ${level}`);

    // Determine if we should return structured data (when action verbs are selected or multi-taxonomy)
    const shouldReturnStructured = selectedActionVerbs?.length || (taxonomyDistribution && Object.keys(taxonomyDistribution).length > 1);

    // Prepare optimized prompt based on whether we have taxonomy distribution
    let prompt = '';

    // Get framework-specific prompt guidance
    const selectedFramework = framework || DEFAULT_FRAMEWORK;
    const frameworkPrompt = FRAMEWORK_PROMPTS[selectedFramework];

    if (taxonomyDistribution && Object.keys(taxonomyDistribution).length > 1) {
      // Multi-taxonomy generation with distribution
      prompt = this.buildDistributedPrompt(topic, count, customPrompt, taxonomyDistribution, selectedActionVerbs, selectedFramework);
    } else {
      // Single taxonomy level generation
      const levelMetadata = BLOOMS_LEVEL_METADATA[level];
      prompt = `
        Generate ${count} specific learning outcomes for the topic "${topic}" at the "${levelMetadata.name}" level of Bloom's Taxonomy.

        The "${levelMetadata.name}" level is about ${levelMetadata.description}.

        ${frameworkPrompt}

        Each learning outcome should:
        1. Start with an action verb appropriate for the "${levelMetadata.name}" level
        2. Be specific and measurable
        3. Focus on what the student will be able to do
        4. Be relevant to the topic "${topic}"
        5. Use contextually appropriate language that demonstrates real understanding
        6. Follow the ${selectedFramework} framework structure
      `;

      // Add specific action verbs if provided
      if (selectedActionVerbs && selectedActionVerbs.length > 0) {
        prompt += `\n\nSpecific action verbs to incorporate meaningfully: ${selectedActionVerbs.join(', ')}

        IMPORTANT GUIDELINES FOR ACTION VERB USAGE:
        1. Use these verbs naturally and contextually, not just mechanically
        2. When appropriate, combine multiple action verbs in a single learning outcome to create richer, more comprehensive objectives
        3. For example: "Students will analyze and evaluate different strategies..." or "Students will create and justify their design decisions..."
        4. Each outcome should demonstrate authentic cognitive processes that build upon each other
        5. Ensure the verbs work together logically and enhance the learning objective rather than just listing them
        6. Focus on meaningful integration of cognitive skills rather than forced verb inclusion`;
      }

      // Add custom prompt if provided
      if (customPrompt) {
        prompt += `\n\nAdditional context: ${customPrompt}`;
      }
    }

    // Update prompt based on whether we need structured data
    if (shouldReturnStructured) {
      prompt += `\n\nCRITICAL: Return ONLY a valid JSON array of exactly ${count} objects. Each object must have this exact structure:
      [{"outcome": "learning outcome text", "actionVerbs": ["verb1", "verb2"], "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE", "framework": "${selectedFramework}"}]

      FORMATTING REQUIREMENTS:
      1. Return ONLY valid JSON - no markdown, no backticks, no explanations
      2. Ensure the JSON is complete and properly closed with ]
      3. Each object must have all four fields: outcome, actionVerbs, bloomsLevel, framework
      4. Keep learning outcome statements concise but complete
      5. Generate exactly ${count} objects, no more, no less

      Extract the actual action verbs used in each outcome and identify the appropriate Bloom's level.
      Each "outcome" field should contain a complete, well-formed learning outcome statement.
      Example: "Students will be able to analyze the main themes in Shakespeare's Romeo and Juliet."`;
    } else {
      prompt += `\n\nIMPORTANT: Return ONLY a JSON array of complete learning outcome statements with no markdown formatting, no code blocks, and no explanation.
      Each item should be a complete, well-formed learning outcome statement, not JSON or metadata.

      Example format: ["Students will be able to analyze the main themes in Shakespeare's Romeo and Juliet.", "Students will be able to evaluate the effectiveness of different persuasive techniques.", "Students will be able to create an original short story using narrative elements."]

      DO NOT wrap the JSON in markdown code blocks or backticks.
      DO NOT include any metadata, action verbs lists, or bloom levels in the response - only the actual learning outcome statements.`;
    }

    try {
      // Call Google Generative AI with increased token limit for structured responses
      const response = await this.callGeminiAI(prompt, {
        temperature: 0.5,
        maxOutputTokens: shouldReturnStructured ? 1500 : 800, // Increased limits to prevent truncation
      });

      // Parse response
      let result: any = [];
      try {
        // Clean the response to handle markdown code blocks
        let cleanedResponse = response;

        // Remove markdown code blocks if present
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
        const match = codeBlockRegex.exec(cleanedResponse);
        if (match && match[1]) {
          cleanedResponse = match[1].trim();
        }

        // Remove any remaining backticks
        cleanedResponse = cleanedResponse.replace(/`/g, '');

        console.log('Cleaned response for parsing:', cleanedResponse.substring(0, 200) + '...');

        // Check if the response appears to be truncated or malformed
        const trimmedResponse = cleanedResponse.trim();
        const isTruncated = trimmedResponse.endsWith('"bloomsLevel') ||
                           trimmedResponse.endsWith('"framework') ||
                           trimmedResponse.endsWith('"actionVerbs') ||
                           trimmedResponse.endsWith('"outcome') ||
                           !trimmedResponse.endsWith('}]') ||
                           (trimmedResponse.includes('{') && !trimmedResponse.includes('}'));

        if (isTruncated) {
          console.warn('Response appears to be truncated, attempting to fix...');

          // Try to find the last complete object
          const lastCompleteObjectIndex = cleanedResponse.lastIndexOf('},');
          if (lastCompleteObjectIndex > 0) {
            cleanedResponse = cleanedResponse.substring(0, lastCompleteObjectIndex + 1) + '\n]';
            console.log('Fixed truncated response, new length:', cleanedResponse.length);
          } else {
            // If no complete objects found, try to close the current object
            const lastOpenBrace = cleanedResponse.lastIndexOf('{');
            if (lastOpenBrace > 0) {
              const beforeLastObject = cleanedResponse.substring(0, lastOpenBrace);
              if (beforeLastObject.trim().endsWith(',')) {
                cleanedResponse = beforeLastObject.substring(0, beforeLastObject.lastIndexOf(',')) + '\n]';
                console.log('Removed incomplete last object');
              }
            }
          }
        }

        // Additional validation: ensure the response starts with [ and ends with ]
        if (!cleanedResponse.trim().startsWith('[')) {
          cleanedResponse = '[' + cleanedResponse;
        }
        if (!cleanedResponse.trim().endsWith(']')) {
          cleanedResponse = cleanedResponse + ']';
        }

        // Parse the cleaned JSON
        const parsedResponse = JSON.parse(cleanedResponse);

        if (shouldReturnStructured) {
          // Expecting structured data
          if (Array.isArray(parsedResponse)) {
            result = parsedResponse.map(item => ({
              outcome: item.outcome || item,
              actionVerbs: item.actionVerbs || this.extractActionVerbsFromOutcome(item.outcome || item, level),
              bloomsLevel: item.bloomsLevel || level,
              framework: item.framework || selectedFramework
            }));
          }
        } else {
          // Expecting simple string array
          if (Array.isArray(parsedResponse)) {
            result = parsedResponse;
          } else if (parsedResponse.outcomes && Array.isArray(parsedResponse.outcomes)) {
            result = parsedResponse.outcomes;
          }
        }
      } catch (error) {
        console.error('Error parsing learning outcomes response:', error);
        console.log('Raw response that failed to parse:', response);

        // Fallback to simple string splitting and cleaning
        let outcomes = response
          .split('\n')
          .map(o => o.replace(/^\d+\.\s*/, '').trim())
          .filter(o => o.length > 0 && !o.includes('```') && !o.startsWith('[') && !o.endsWith(']'))
          .slice(0, count);

        // Additional cleaning for JSON-like content
        outcomes = outcomes.map(outcome => {
          // Remove JSON-like patterns
          let cleaned = outcome
            .replace(/^["']|["']$/g, '') // Remove quotes at start/end
            .replace(/^{.*?}$/, '') // Remove full JSON objects
            .replace(/^"outcome":\s*["']?|["']?\s*,?\s*"actionVerbs".*$/g, '') // Remove JSON keys
            .replace(/^\s*["']|["']\s*$/g, '') // Remove remaining quotes
            .trim();

          // If the cleaned result is empty or looks like JSON metadata, skip it
          if (!cleaned || cleaned.includes('"') || cleaned.includes('{') || cleaned.includes('}') ||
              cleaned.includes('actionVerbs') || cleaned.includes('bloomsLevel') || cleaned.includes('framework')) {
            return '';
          }

          return cleaned;
        }).filter(o => o.length > 10); // Only keep substantial outcomes

        if (shouldReturnStructured) {
          result = outcomes.map(outcome => ({
            outcome,
            actionVerbs: this.extractActionVerbsFromOutcome(outcome, level),
            bloomsLevel: level,
            framework: selectedFramework
          }));
        } else {
          result = outcomes;
        }
      }

      // Cache the result
      agentResponseCache.set(cacheKey, result, 12 * 60 * 60 * 1000); // 12 hours

      return result;
    } catch (error) {
      console.error('Error generating learning outcomes:', error);
      throw error;
    }
  }

  /**
   * Extract action verbs from a learning outcome
   * @param outcome The learning outcome text
   * @param level The Bloom's taxonomy level
   * @returns Array of extracted action verbs
   */
  private extractActionVerbsFromOutcome(outcome: string, level: BloomsTaxonomyLevel): string[] {
    if (!outcome) return [];

    // Get action verbs for this level and all levels (for cross-level detection)
    const levelVerbs = this.getActionVerbsForLevel(level);
    const allVerbs = Object.values(BloomsTaxonomyLevel).flatMap(l => this.getActionVerbsForLevel(l));

    // Extract words from the outcome, preserving original case for display
    const words = outcome.split(/\s+/).map(word => word.replace(/[^a-zA-Z]/g, ''));

    // Find matching action verbs (case-insensitive matching, but preserve original case)
    const foundVerbs: string[] = [];

    words.forEach(word => {
      const lowerWord = word.toLowerCase();

      // First check level-specific verbs
      const levelMatch = levelVerbs.find(verb => verb.toLowerCase() === lowerWord);
      if (levelMatch && !foundVerbs.some(v => v.toLowerCase() === lowerWord)) {
        foundVerbs.push(word); // Use original case from outcome
        return;
      }

      // Then check all verbs for cross-level detection
      const allMatch = allVerbs.find(verb => verb.toLowerCase() === lowerWord);
      if (allMatch && !foundVerbs.some(v => v.toLowerCase() === lowerWord)) {
        foundVerbs.push(word); // Use original case from outcome
      }
    });

    // If no verbs found, try to extract the first word as a potential verb
    if (foundVerbs.length === 0) {
      const firstWord = words[0];
      if (firstWord && firstWord.length > 2) {
        return [firstWord];
      }
    }

    // Return found verbs or default to level-appropriate verb
    return foundVerbs.length > 0 ? foundVerbs : [levelVerbs[0] || 'apply'];
  }

  /**
   * Build a distributed prompt for multi-taxonomy generation
   * @param topic Topic name
   * @param count Total number of outcomes to generate
   * @param customPrompt Optional custom prompt
   * @param taxonomyDistribution Distribution across taxonomy levels
   * @param selectedActionVerbs Optional array of specific action verbs to use
   * @param framework Learning outcome framework to use
   * @returns Formatted prompt string
   */
  private buildDistributedPrompt(
    topic: string,
    count: number,
    customPrompt: string | undefined,
    taxonomyDistribution: Record<BloomsTaxonomyLevel, number>,
    selectedActionVerbs?: string[],
    framework?: LearningOutcomeFramework
  ): string {
    // Filter out levels with 0% distribution
    const activeLevels = Object.entries(taxonomyDistribution)
      .filter(([_, percentage]) => percentage > 0)
      .map(([level, percentage]) => ({ level: level as BloomsTaxonomyLevel, percentage }));

    // Get framework-specific prompt guidance
    const selectedFramework = framework || DEFAULT_FRAMEWORK;
    const frameworkPrompt = FRAMEWORK_PROMPTS[selectedFramework];

    let prompt = `
      Generate ${count} learning outcomes for the topic "${topic}" with a cognitively balanced distribution across multiple Bloom's Taxonomy levels.

      ${frameworkPrompt}

      Distribution requirements:
    `;

    // Add distribution details for each active level
    activeLevels.forEach(({ level, percentage }) => {
      const levelMetadata = BLOOMS_LEVEL_METADATA[level];
      const outcomeCount = Math.round((percentage / 100) * count);
      const defaultVerbs = this.getActionVerbsForLevel(level).slice(0, 5);

      // Use selected action verbs if available for this level, otherwise use defaults
      const verbsToUse = selectedActionVerbs && selectedActionVerbs.length > 0
        ? selectedActionVerbs.filter(verb => defaultVerbs.some(dv => dv.toLowerCase() === verb.toLowerCase()))
        : defaultVerbs;

      prompt += `
      - ${levelMetadata.name} Level (${percentage}%): Generate approximately ${outcomeCount} outcome${outcomeCount !== 1 ? 's' : ''}
        Focus: ${levelMetadata.description}
        Action verbs to incorporate meaningfully: ${verbsToUse.length > 0 ? verbsToUse.join(', ') : defaultVerbs.join(', ')}
      `;
    });

    prompt += `

      Guidelines for cognitive balance:
      1. Ensure outcomes naturally progress from lower to higher cognitive levels
      2. Create meaningful connections between outcomes at different levels
      3. Use appropriate action verbs that truly reflect the cognitive processes
      4. Make outcomes specific, measurable, and student-centered
      5. Focus on authentic learning rather than just using specific verbs mechanically
      6. Ensure all outcomes are relevant to "${topic}"
      7. Incorporate action verbs contextually and meaningfully, not just as starting words
      8. When appropriate, combine multiple action verbs within single outcomes for richer learning objectives
      9. Create outcomes that demonstrate integrated cognitive skills and authentic learning progressions
      10. Generate complete, well-formed learning outcome statements (e.g., "Students will be able to analyze...")
      11. Do NOT generate JSON objects, metadata, or action verb lists - only the actual learning outcome statements
    `;

    // Add specific guidance for action verbs if provided
    if (selectedActionVerbs && selectedActionVerbs.length > 0) {
      prompt += `\n\nSpecific action verbs to incorporate: ${selectedActionVerbs.join(', ')}

      IMPORTANT GUIDELINES FOR MULTI-VERB INTEGRATION:
      1. Use these verbs naturally and contextually throughout the outcomes
      2. Combine verbs meaningfully within single outcomes when it enhances learning (e.g., "analyze and evaluate", "create and justify", "compare and synthesize")
      3. Ensure verb combinations represent logical cognitive progressions
      4. Focus on authentic learning processes rather than forced verb inclusion
      5. Each outcome should demonstrate integrated cognitive skills that build upon each other`;
    }

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\n\nAdditional context: ${customPrompt}`;
    }

    return prompt;
  }

  /**
   * Get action verbs for a specific Bloom's level
   * @param level Bloom's Taxonomy level
   * @returns Array of action verbs
   */
  private getActionVerbsForLevel(level: BloomsTaxonomyLevel): string[] {
    // Return some common action verbs for each level
    const verbMap: Record<BloomsTaxonomyLevel, string[]> = {
      [BloomsTaxonomyLevel.REMEMBER]: ['identify', 'recall', 'recognize', 'list', 'define', 'state'],
      [BloomsTaxonomyLevel.UNDERSTAND]: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'compare'],
      [BloomsTaxonomyLevel.APPLY]: ['apply', 'demonstrate', 'use', 'implement', 'solve', 'execute'],
      [BloomsTaxonomyLevel.ANALYZE]: ['analyze', 'examine', 'investigate', 'categorize', 'differentiate', 'deconstruct'],
      [BloomsTaxonomyLevel.EVALUATE]: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'validate'],
      [BloomsTaxonomyLevel.CREATE]: ['create', 'design', 'develop', 'construct', 'generate', 'produce']
    };

    return verbMap[level] || [];
  }

  /**
   * Call Google Generative AI (Gemini) with the given prompt
   * @param prompt The prompt to send to the AI
   * @param options Options for the AI call
   * @returns The AI response as a string
   */
  private async callGeminiAI(
    prompt: string,
    options: { temperature?: number; maxOutputTokens?: number } = {}
  ): Promise<string> {
    try {
      // Import the Google Generative AI library
      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      // Try to get the API key from environment variables
      let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      // If not found and we're on the server, try the server-side variable
      if (!apiKey && typeof window === 'undefined') {
        apiKey = process.env.GEMINI_API_KEY;
      }

      // For backward compatibility, try the old variable names
      if (!apiKey) {
        apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
      }

      if (!apiKey) {
        // Use environment checker for detailed diagnostics
        const { checkEnvironmentVariables } = await import('../../utils/env-checker');
        const envCheck = checkEnvironmentVariables();

        console.error('Environment check result:', envCheck);

        const errorMessage = envCheck.recommendations.length > 0
          ? `API key not found. ${envCheck.recommendations[0]}`
          : 'Google Generative AI API key not found in environment variables. Please set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY.';

        throw new Error(errorMessage);
      }

      console.log('Using API key:', apiKey.substring(0, 10) + '...');

      // Initialize the API client
      const genAI = new GoogleGenerativeAI(apiKey);

      // Use Gemini 2.0 Flash model with fallback
      let model: any;
      try {
        model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 1000,
          }
        });
      } catch (modelError) {
        console.warn('Gemini 2.0 Flash not available, falling back to gemini-1.5-flash');
        model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 1000,
          }
        });
      }

      // Generate content with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          const result = await model.generateContent(prompt);
          const response = result.response.text();

          if (!response || response.trim().length === 0) {
            throw new Error('Empty response from AI model');
          }

          return response;
        } catch (genError: any) {
          retries--;
          console.error(`Generation attempt failed (${3 - retries}/3):`, genError.message);

          if (retries === 0) {
            throw genError;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      throw new Error('Failed to generate content after 3 attempts');
    } catch (error: any) {
      console.error('Error calling Google Generative AI:', error);

      // Provide more specific error messages
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Google Generative AI API key. Please check your API key configuration.');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Google Generative AI quota exceeded. Please try again later.');
      } else if (error.message?.includes('MODEL_NOT_FOUND')) {
        throw new Error('Requested AI model not found. Please check model availability.');
      } else {
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
    }
  }
}
