/**
 * LLM Service for Bloom's Taxonomy
 * 
 * This file provides utilities for interacting with LLMs (Large Language Models)
 * to enhance the Bloom's Taxonomy feature with AI capabilities.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BloomsTaxonomyLevel } from '../types';
import { BLOOMS_LEVEL_METADATA } from '../constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '../constants/action-verbs';

/**
 * Configuration options for LLM requests
 */
export interface LLMRequestOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

/**
 * Default configuration for different types of LLM requests
 */
const DEFAULT_CONFIG = {
  classification: {
    temperature: 0.2, // Lower temperature for more consistent classification
    maxOutputTokens: 500,
    topK: 40,
    topP: 0.95,
  },
  generation: {
    temperature: 0.7, // Higher temperature for more creative generation
    maxOutputTokens: 1000,
    topK: 40,
    topP: 0.95,
  },
  analysis: {
    temperature: 0.4, // Balanced temperature for analysis
    maxOutputTokens: 800,
    topK: 40,
    topP: 0.95,
  }
};

/**
 * Get the API key for Google Generative AI
 */
async function getApiKey(): Promise<string> {
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
    throw new Error('Google Generative AI API key not found in environment variables');
  }
  
  return apiKey;
}

/**
 * Initialize the Google Generative AI model
 */
async function initializeModel(options: LLMRequestOptions = {}) {
  const apiKey = await getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
      topK: options.topK,
      topP: options.topP,
    }
  });
}

/**
 * Generate a response from the LLM
 */
export async function generateLLMResponse(
  prompt: string,
  options: LLMRequestOptions = {}
): Promise<string> {
  try {
    const model = await initializeModel(options);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw new Error(`Failed to generate LLM response: ${(error as Error).message}`);
  }
}

/**
 * Generate a structured response from the LLM
 */
export async function generateStructuredLLMResponse<T>(
  prompt: string,
  options: LLMRequestOptions = {}
): Promise<T> {
  try {
    const model = await initializeModel(options);
    
    // Add instructions to return a valid JSON object
    const structuredPrompt = `
${prompt}

IMPORTANT: Your response must be a valid JSON object that matches the expected structure.
Do not include any explanations, markdown formatting, or text outside the JSON object.
`;
    
    const result = await model.generateContent(structuredPrompt);
    const responseText = result.response.text();
    
    // Parse the JSON response
    try {
      return JSON.parse(responseText) as T;
    } catch (parseError) {
      console.error('Error parsing LLM response as JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error generating structured LLM response:', error);
    throw new Error(`Failed to generate structured LLM response: ${(error as Error).message}`);
  }
}

/**
 * Classify content according to Bloom's Taxonomy levels using LLM
 */
export async function classifyContentWithLLM(
  content: string,
  contentType: 'learning_outcome' | 'question' | 'activity' | 'assessment' = 'learning_outcome'
): Promise<{
  bloomsLevel: BloomsTaxonomyLevel;
  confidence: number;
  suggestedVerbs: string[];
  explanation: string;
}> {
  // Create a prompt for the LLM
  const prompt = createClassificationPrompt(content, contentType);
  
  // Generate a structured response
  return generateStructuredLLMResponse(
    prompt,
    DEFAULT_CONFIG.classification
  );
}

/**
 * Generate improved content based on a target Bloom's level using LLM
 */
export async function generateImprovedContentWithLLM(
  content: string,
  currentLevel: BloomsTaxonomyLevel,
  targetLevel: BloomsTaxonomyLevel,
  contentType: 'learning_outcome' | 'question' | 'activity' | 'assessment' = 'learning_outcome'
): Promise<{
  improvedContent: string;
  explanation: string;
  suggestedVerbs: string[];
}> {
  // Create a prompt for the LLM
  const prompt = createContentImprovementPrompt(content, currentLevel, targetLevel, contentType);
  
  // Generate a structured response
  return generateStructuredLLMResponse(
    prompt,
    DEFAULT_CONFIG.generation
  );
}

/**
 * Create a prompt for classifying content according to Bloom's Taxonomy levels
 */
function createClassificationPrompt(
  content: string,
  contentType: 'learning_outcome' | 'question' | 'activity' | 'assessment'
): string {
  // Create a description of Bloom's Taxonomy levels
  const bloomsLevelsDescription = Object.values(BloomsTaxonomyLevel)
    .map(level => {
      const metadata = BLOOMS_LEVEL_METADATA[level];
      const verbs = ACTION_VERBS_BY_LEVEL[level].slice(0, 5).join(', ');
      return `- ${level} (${metadata.name}): ${metadata.description}. Example verbs: ${verbs}`;
    })
    .join('\n');
  
  return `
You are an expert in educational design and Bloom's Taxonomy. Analyze the following ${contentType} and classify it according to Bloom's Taxonomy cognitive levels.

Bloom's Taxonomy Levels:
${bloomsLevelsDescription}

${contentType.toUpperCase()}: "${content}"

Analyze the ${contentType} and determine which level of Bloom's Taxonomy it primarily aligns with. Consider the cognitive processes required, the verbs used, and the overall complexity of the task.

Provide your analysis in the following JSON format:
{
  "bloomsLevel": "One of: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE",
  "confidence": "A number between 0 and 1 representing your confidence in this classification",
  "suggestedVerbs": ["List of 3-5 action verbs appropriate for this level"],
  "explanation": "A brief explanation of why you classified it at this level"
}
`;
}

/**
 * Create a prompt for improving content based on a target Bloom's level
 */
function createContentImprovementPrompt(
  content: string,
  currentLevel: BloomsTaxonomyLevel,
  targetLevel: BloomsTaxonomyLevel,
  contentType: 'learning_outcome' | 'question' | 'activity' | 'assessment'
): string {
  // Get metadata for the current and target levels
  const currentLevelMetadata = BLOOMS_LEVEL_METADATA[currentLevel];
  const targetLevelMetadata = BLOOMS_LEVEL_METADATA[targetLevel];
  
  // Get action verbs for the target level
  const targetLevelVerbs = ACTION_VERBS_BY_LEVEL[targetLevel].slice(0, 8).join(', ');
  
  return `
You are an expert in educational design and Bloom's Taxonomy. Your task is to improve the following ${contentType} by adjusting it to align with a different level of Bloom's Taxonomy.

CURRENT ${contentType.toUpperCase()}: "${content}"

CURRENT BLOOM'S LEVEL: ${currentLevel} (${currentLevelMetadata.name})
Description: ${currentLevelMetadata.description}

TARGET BLOOM'S LEVEL: ${targetLevel} (${targetLevelMetadata.name})
Description: ${targetLevelMetadata.description}
Example verbs for this level: ${targetLevelVerbs}

Please rewrite the ${contentType} to align with the target Bloom's level. Ensure that:
1. The cognitive complexity matches the target level
2. Appropriate action verbs for the target level are used
3. The content remains focused on the same subject matter
4. The language is clear, specific, and measurable

Provide your response in the following JSON format:
{
  "improvedContent": "The improved ${contentType}",
  "explanation": "A brief explanation of the changes you made and how they align with the target Bloom's level",
  "suggestedVerbs": ["List of 3-5 action verbs from the target level that would be appropriate for this content"]
}
`;
}
