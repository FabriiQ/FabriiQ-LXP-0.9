/**
 * Bloom's Taxonomy Classification Agent Handler
 *
 * This file contains the handler for the Bloom's Taxonomy classification agent.
 */

import { AgentState, AgentResponse, MemoryType } from '@/features/agents';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '../../constants/action-verbs';
import {
  classifyContentWithLLM,
  generateImprovedContentWithLLM
} from '../../utils/llm-service';

/**
 * Handler for the Bloom's Taxonomy classification agent
 *
 * This handler processes requests to classify content according to Bloom's Taxonomy levels
 * and provides suggestions for improvement.
 *
 * This handler is integrated with the features/agents orchestration system.
 */
export async function handleBloomsClassification(
  _agent: AgentState,
  params: {
    content: string;
    contentType?: 'learning_outcome' | 'question' | 'activity' | 'assessment';
    targetLevel?: BloomsTaxonomyLevel;
  }
): Promise<AgentResponse> {
  const { content, contentType = 'learning_outcome', targetLevel } = params;

  try {
    // Use LLM to analyze the content and determine the Bloom's level
    const llmClassification = await classifyContentWithLLM(content, contentType);

    // Generate suggestions for improvement
    const suggestions = generateSuggestions(content, llmClassification.bloomsLevel, targetLevel);

    // Generate improved content if a target level is specified
    let improvedContent = content;
    let improvementExplanation = '';

    if (targetLevel) {
      const improvement = await generateImprovedContentWithLLM(
        content,
        llmClassification.bloomsLevel,
        targetLevel,
        contentType
      );

      improvedContent = improvement.improvedContent;
      improvementExplanation = improvement.explanation;
    }

    const result = {
      classification: {
        bloomsLevel: llmClassification.bloomsLevel,
        confidence: llmClassification.confidence,
        suggestedVerbs: llmClassification.suggestedVerbs,
        explanation: llmClassification.explanation,
        suggestedImprovements: suggestions.improvements
      },
      suggestions: suggestions.general,
      improvedContent,
      improvementExplanation
    };

    // Return the result in the format expected by the agent orchestration system
    return {
      message: {
        id: Date.now().toString(),
        role: 'agent',
        content: JSON.stringify(result),
        timestamp: Date.now(),
      },
      updatedMemory: [
        {
          type: MemoryType.SHORT_TERM,
          key: `bloom-classification-${Date.now()}`,
          value: {
            content,
            contentType,
            targetLevel,
            result
          },
          timestamp: Date.now(),
        }
      ]
    };
  } catch (error) {
    console.error('Error in Bloom\'s classification agent:', error);

    // Fall back to rule-based classification if LLM fails
    const analysis = analyzeContent(content);
    const suggestions = generateSuggestions(content, analysis.bloomsLevel, targetLevel);
    const improvedContent = targetLevel ?
      generateImprovedContent(content, analysis.bloomsLevel, targetLevel) :
      content;

    const fallbackResult = {
      classification: {
        bloomsLevel: analysis.bloomsLevel,
        confidence: analysis.confidence,
        suggestedVerbs: getSuggestedVerbs(analysis.bloomsLevel),
        suggestedImprovements: suggestions.improvements,
        explanation: "Classification based on rule-based analysis (LLM unavailable)"
      },
      suggestions: suggestions.general,
      improvedContent,
      improvementExplanation: "Content improved using rule-based approach (LLM unavailable)"
    };

    // Return the fallback result in the format expected by the agent orchestration system
    return {
      message: {
        id: Date.now().toString(),
        role: 'agent',
        content: JSON.stringify(fallbackResult),
        timestamp: Date.now(),
      },
      updatedMemory: [
        {
          type: MemoryType.SHORT_TERM,
          key: `bloom-classification-fallback-${Date.now()}`,
          value: {
            content,
            contentType,
            targetLevel,
            result: fallbackResult
          },
          timestamp: Date.now(),
        }
      ]
    };
  }
}

/**
 * Analyze content to determine the Bloom's level
 */
function analyzeContent(content: string): {
  bloomsLevel: BloomsTaxonomyLevel;
  confidence: number;
  keywords: string[];
} {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // analysis using LLM capabilities in a real implementation

  // Convert content to lowercase for case-insensitive matching
  const lowerContent = content.toLowerCase();

  // Check for keywords associated with each Bloom's level
  const levelMatches = Object.values(BloomsTaxonomyLevel).map(level => {
    const verbs = ACTION_VERBS_BY_LEVEL[level] || [];
    const matchCount = verbs.filter(verb => lowerContent.includes(verb.verb.toLowerCase())).length;
    return { level, matchCount };
  });

  // Sort by match count (descending)
  levelMatches.sort((a, b) => b.matchCount - a.matchCount);

  // Get the level with the most matches
  const bestMatch = levelMatches[0];

  // Calculate confidence based on the difference between the best match and the second best
  const secondBest = levelMatches[1];
  const confidenceFactor = secondBest.matchCount > 0 ?
    (bestMatch.matchCount - secondBest.matchCount) / bestMatch.matchCount :
    1;

  // If no matches were found, default to UNDERSTAND with low confidence
  if (bestMatch.matchCount === 0) {
    return {
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      confidence: 0.5,
      keywords: []
    };
  }

  // Get the keywords that matched
  const matchedKeywords = ACTION_VERBS_BY_LEVEL[bestMatch.level]
    .filter(verb => lowerContent.includes(verb.verb.toLowerCase()))
    .map(verb => verb.verb);

  return {
    bloomsLevel: bestMatch.level,
    confidence: Math.min(0.5 + confidenceFactor * 0.5, 0.95), // Scale confidence between 0.5 and 0.95
    keywords: matchedKeywords
  };
}

/**
 * Generate suggestions for improving the content
 */
function generateSuggestions(
  _content: string,
  currentLevel: BloomsTaxonomyLevel,
  targetLevel?: BloomsTaxonomyLevel
): {
  general: string[];
  improvements: string[];
} {
  const general: string[] = [];
  const improvements: string[] = [];

  // Add general suggestions
  general.push('Use specific action verbs that align with the intended cognitive level');
  general.push('Ensure the content is clear and measurable');

  // If a target level is specified and it's different from the current level
  if (targetLevel && targetLevel !== currentLevel) {
    const currentLevelMetadata = BLOOMS_LEVEL_METADATA[currentLevel];
    const targetLevelMetadata = BLOOMS_LEVEL_METADATA[targetLevel];

    // Determine if we need to move up or down the taxonomy
    const isMovingUp = targetLevelMetadata.order > currentLevelMetadata.order;

    if (isMovingUp) {
      improvements.push(`Replace lower-level verbs with ${targetLevel.toLowerCase()} level verbs`);
      improvements.push(`Add components that require ${targetLevelMetadata.description.toLowerCase()}`);
    } else {
      improvements.push(`Simplify the content to focus on ${targetLevelMetadata.description.toLowerCase()}`);
      improvements.push(`Use more straightforward verbs appropriate for the ${targetLevel.toLowerCase()} level`);
    }

    // Add suggested verbs
    const suggestedVerbs = getSuggestedVerbs(targetLevel);
    improvements.push(`Consider using verbs like: ${suggestedVerbs.join(', ')}`);
  } else {
    // Suggestions for improving within the same level
    improvements.push('Be more specific about what students should be able to do');
    improvements.push('Ensure the content is measurable and observable');
  }

  return { general, improvements };
}

/**
 * Generate improved content based on the target level
 */
function generateImprovedContent(
  content: string,
  currentLevel: BloomsTaxonomyLevel,
  targetLevel: BloomsTaxonomyLevel
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // content generation using LLM capabilities in a real implementation

  // If the current level is already the target level, return the original content
  if (currentLevel === targetLevel) {
    return content;
  }

  // Get suggested verbs for the target level
  const suggestedVerbs = getSuggestedVerbs(targetLevel);
  const randomVerb = suggestedVerbs[Math.floor(Math.random() * suggestedVerbs.length)];

  // Simple transformation: replace the first word with a suggested verb
  // In a real implementation, this would be much more sophisticated
  const words = content.split(' ');
  words[0] = randomVerb;

  return words.join(' ');
}

/**
 * Get suggested verbs for a Bloom's level
 */
function getSuggestedVerbs(level: BloomsTaxonomyLevel): string[] {
  const verbs = ACTION_VERBS_BY_LEVEL[level] || [];

  // Return a random selection of verbs (up to 5)
  const shuffled = [...verbs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5).map(verb => verb.verb);
}
