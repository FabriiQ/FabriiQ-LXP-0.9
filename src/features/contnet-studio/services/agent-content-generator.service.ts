/**
 * Agent-based Content Generator Service
 *
 * This service handles the generation of AI-powered content for the AI Content Studio
 * using the multi-agent orchestration system. It provides a unified interface for
 * generating different types of content using specialized agents.
 */

import { ActivityPurpose } from '@/server/api/constants';
import { getActivityTypeDisplayName, mapActivityTypeToId } from '@/features/activties';
import {
  AgentOrchestratorProvider,
  AgentType,
  createAssessmentAgent,
  createContentRefinementAgent,
  AgentRegistry,
  AgentState
} from '@/features/agents';

// Simple utility functions to replace data-normalization imports
const generateId = () => `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Define the parameters for content generation
export interface ContentGenerationParams {
  subject: string;
  subjectId: string;
  topic?: string;
  topicId?: string;
  topicIds?: string[];
  activityType: string;
  activityPurpose: ActivityPurpose;
  numQuestions: number;
  difficultyLevel: string;
  prompt: string;
  teacherId: string;
  classId?: string;
  // Detailed topic information
  topicDescription?: string;
  topicContext?: string;
  learningOutcomes?: string;
}

// Define ActivityData interface
interface ActivityData {
  id: string;
  title: string;
  description?: string;
  activityType: string;
  [key: string]: any;
}

/**
 * Generate content using the multi-agent orchestration system
 * This function integrates with the activities architecture and uses specialized agents
 */
export async function generateContent(params: ContentGenerationParams): Promise<ActivityData> {
  try {
    console.log('Generating content with agents using params:', params);

    // Get topic information from parameters
    let topicContext = params.topicContext || '';
    let topicDescription = params.topicDescription || '';
    let learningOutcomes = params.learningOutcomes || '';

    // Map the activity type to an activity type ID using the bridge utility
    const activityTypeId = mapActivityTypeToId(params.activityType, params.activityPurpose);

    console.log(`Mapped activity type ${params.activityType} to activity type ID ${activityTypeId} for purpose ${params.activityPurpose}`);

    // Create base content structure
    let rawContent: Record<string, any> = {
      id: generateId(),
      title: `${params.difficultyLevel.charAt(0).toUpperCase() + params.difficultyLevel.slice(1)} ${getActivityTypeDisplayName(activityTypeId)}${params.topic ? ` on ${params.topic}` : ''}`,
      description: `A ${params.difficultyLevel} level ${getActivityTypeDisplayName(activityTypeId).toLowerCase()} activity with ${params.numQuestions} questions${params.topic ? ` about ${params.topic}` : ''}.`,
      type: params.activityType,
      activityType: activityTypeId,
      purpose: params.activityPurpose,
      instructions: 'Read each question carefully and select the best answer.',
      timeEstimate: 30,
      points: params.numQuestions * 10,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: params.teacherId,
      tags: [
        params.difficultyLevel,
        getActivityTypeDisplayName(activityTypeId),
        ...(params.topic ? params.topic.split(',').map(t => t.trim()) : [])
      ],
      capabilities: {
        isGradable: params.activityPurpose === ActivityPurpose.ASSESSMENT,
        hasSubmission: true,
        hasInteraction: true,
        hasRealTimeComponents: false
      },
      topicContext: topicContext,
      topicDescription: topicDescription,
      learningOutcomes: learningOutcomes,
      version: 1
    };

    // Log the activity type mapping for debugging
    console.log('Agent Content Generator: Activity type mapping details:', {
      originalType: params.activityType,
      mappedType: activityTypeId,
      purpose: params.activityPurpose,
      displayName: getActivityTypeDisplayName(activityTypeId)
    });

    // Create an enhanced prompt for the agent
    const enhancedPrompt = createEnhancedPrompt(params, activityTypeId);
    console.log('Enhanced prompt for agent:', enhancedPrompt);

    try {
      // Use the agent orchestration system to generate content with real-time data
      const agentGeneratedContent = await generateContentWithAgents(
        enhancedPrompt,
        params,
        activityTypeId
      );

      // Merge the agent-generated content with our base structure
      rawContent = {
        ...rawContent,
        ...agentGeneratedContent,
        // Preserve metadata about the generation
        generationPrompt: enhancedPrompt,
        generationModel: "gemini-2.0-flash",
        generationTimestamp: new Date().toISOString()
      };

      // Add config for backward compatibility
      rawContent.config = {
        ...agentGeneratedContent,
        isGradable: rawContent.isGradable
      };

      // Log that we're using real-time data
      console.log('Using real-time data from agent generation');

    } catch (agentError) {
      console.error('Error calling agent service:', agentError);
      // Instead of falling back to mock content, rethrow the error
      throw agentError;
    }

    // Log the raw content for debugging
    console.log('Raw content from agent generation:', rawContent);

    return rawContent as ActivityData;
  } catch (error) {
    console.error('Error generating content with agents:', error);
    throw error;
  }
}

/**
 * Generate content using the multi-agent orchestration system and Google Generative AI
 */
async function generateContentWithAgents(
  prompt: string,
  params: ContentGenerationParams,
  activityTypeId: string
): Promise<Record<string, any>> {
  // Determine which agent type to use based on the activity type and purpose
  let primaryAgentType = AgentType.ASSESSMENT;

  // For learning activities, use the content refinement agent
  if (params.activityPurpose === ActivityPurpose.LEARNING) {
    primaryAgentType = AgentType.CONTENT_REFINEMENT;
  }

  // Get the agent registry instance
  const registry = AgentRegistry.getInstance();

  // Create a base agent state
  const baseAgentState: AgentState = {
    id: generateId(),
    type: primaryAgentType,
    status: 'idle',
    messages: [],
    memory: [],
    tools: [],
    metadata: {
      systemPrompt: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Store the name in metadata since AgentState doesn't have a name property
      name: `${params.activityPurpose} ${activityTypeId} Generator`
    }
  };

  // Create the appropriate agent based on the activity type
  let agent: AgentState;

  if (primaryAgentType === AgentType.ASSESSMENT) {
    agent = createAssessmentAgent(baseAgentState);
  } else {
    agent = createContentRefinementAgent(baseAgentState);
  }

  // Prepare the agent configuration for the specific activity
  const agentConfig = {
    title: params.topic || 'Untitled Activity',
    subject: params.subject,
    topic: params.topic,
    gradeLevel: 'K-12', // Default value, could be parameterized
    difficultyLevel: params.difficultyLevel as 'easy' | 'medium' | 'hard',
    questionCount: params.numQuestions,
    timeLimit: 30, // Default value, could be parameterized
    assessmentType: params.activityPurpose === ActivityPurpose.ASSESSMENT ? 'summative' : 'formative',
    passingScore: 70, // Default value, could be parameterized
    includeRubric: params.activityPurpose === ActivityPurpose.ASSESSMENT,
    instructions: params.prompt || 'Complete the following questions.',
  };

  // Log agent processing
  console.log('Processing with agent:', agent.type);
  console.log('Agent configuration:', agentConfig);

  try {
    // Use Google Generative AI to generate content
    // Import the Google Generative AI library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    // Try to get the API key from environment variables
    // For client-side code, we need to use NEXT_PUBLIC_ prefix
    let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // If not found and we're on the server, try the server-side variable
    if (!apiKey && typeof window === 'undefined') {
      apiKey = process.env.GEMINI_API_KEY;
    }

    // For backward compatibility, try the old variable names
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    }

    if (apiKey) {
      console.log('Using Gemini API key from environment:', apiKey.substring(0, 10) + '...');
    } else {
      console.error('Gemini API key not found in environment variables');
      throw new Error('Gemini API key not found in environment variables');
    }

    // Validate the API key format
    if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
      console.error('Invalid Gemini API key format');
      throw new Error('Invalid Gemini API key format');
    }

    console.log('Gemini API key validation passed');

    console.log('Calling Gemini API with API key:', apiKey.substring(0, 10) + '...');

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the correct model name for Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('Initialized Gemini API with model: gemini-2.0-flash');

    // Log additional debug information
    console.log('GoogleGenerativeAI client initialized with configuration:', {
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 4),
      modelName: "gemini-2.0-flash"
    });

    // Create a structured prompt for the AI model based on the activity type
    const structuredPrompt = createStructuredPromptForActivityType(prompt, params, activityTypeId);
    console.log('Sending structured prompt to Gemini API...');

    // Generate content with better error handling
    let aiResponse: string;
    try {
      console.log('Sending request to Gemini API...');

      // Log the first 200 characters of the prompt for debugging
      console.log('Prompt preview (first 200 chars):', structuredPrompt.substring(0, 200) + '...');

      // Make the API call with explicit error handling
      const result = await model.generateContent(structuredPrompt);

      // Check if we have a valid result object
      if (!result || !result.response) {
        console.error('Invalid response object from Gemini API');
        throw new Error('Invalid response object from Gemini API');
      }

      // Extract the text response
      aiResponse = result.response.text();
      console.log('Received response from Gemini API:', aiResponse.substring(0, 100) + '...');

      // Check if we got a valid response
      if (!aiResponse || aiResponse.trim() === '') {
        console.error('Empty response received from Gemini API');
        throw new Error('Empty response received from Gemini API');
      }

      // Log success for debugging
      console.log('Successfully received and validated Gemini API response');
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError);
      // Log more details about the error
      if (apiError instanceof Error) {
        console.error('Error name:', apiError.name);
        console.error('Error message:', apiError.message);
        console.error('Error stack:', apiError.stack);
      } else {
        console.error('Non-Error object thrown:', apiError);
      }
      // Rethrow with more context
      throw new Error(`Gemini API error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }

    // Parse the response as JSON
    try {
      // Clean the response if it's wrapped in a markdown code block
      let cleanedResponse = aiResponse;

      // Check if the response starts with a markdown code block
      if (aiResponse.trim().startsWith('```')) {
        console.log('Detected markdown code block in response, cleaning it up');
        // Extract the JSON content from the markdown code block
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedResponse = jsonMatch[1].trim();
          console.log('Extracted JSON from markdown code block');
        } else {
          console.warn('Could not extract JSON from markdown code block');
        }
      }

      const aiGeneratedContent = JSON.parse(cleanedResponse);
      console.log('Successfully parsed AI response as JSON');

      // Process the AI-generated content with the agent for refinement
      const refinedContent = await refineContentWithAgent(aiGeneratedContent, agent, params, activityTypeId);

      return refinedContent;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error using Gemini API or agent processing:', error);

    // Instead of falling back to simulated response, throw the error to be handled by the caller
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Gemini API Error: ${errorMessage}. Please check your API key and try again.`);
  }
}

/**
 * Creates a structured prompt for the AI model based on the activity type
 */
function createStructuredPromptForActivityType(
  basePrompt: string,
  params: ContentGenerationParams,
  activityTypeId: string
): string {
  // Start with the base prompt
  let structuredPrompt = basePrompt;

  // Add activity-specific formatting instructions based on the activity type
  structuredPrompt += `\n\nFormat the response as a JSON object with the following structure. DO NOT wrap the JSON in markdown code blocks (like \`\`\`json). Return ONLY the raw JSON:\n`;

  switch (activityTypeId) {
    case 'multiple-choice':
      structuredPrompt += `
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here",
      "options": [
        { "id": "a", "text": "Correct option", "isCorrect": true, "feedback": "Explanation why this is correct" },
        { "id": "b", "text": "Incorrect option 1", "isCorrect": false, "feedback": "Explanation why this is incorrect" },
        { "id": "c", "text": "Incorrect option 2", "isCorrect": false, "feedback": "Explanation why this is incorrect" },
        { "id": "d", "text": "Incorrect option 3", "isCorrect": false, "feedback": "Explanation why this is incorrect" }
      ],
      "explanation": "Detailed explanation of the correct answer",
      "hint": "A hint that guides without giving away the answer"
    }
    // Repeat for each question
  ],
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "showFeedbackImmediately": true,
  "attemptsAllowed": 2
}`;
      break;
    case 'true-false':
      structuredPrompt += `
{
  "questions": [
    {
      "id": "q1",
      "text": "Statement to evaluate as true or false",
      "isTrue": true, // or false
      "explanation": "Detailed explanation of why the statement is true/false",
      "hint": "A hint that guides without giving away the answer"
    }
    // Repeat for each question
  ],
  "shuffleQuestions": true,
  "showFeedbackImmediately": true,
  "attemptsAllowed": 2
}`;
      break;
    case 'fill-in-the-blanks':
      structuredPrompt += `
{
  "questions": [
    {
      "id": "q1",
      "text": "This is a sentence with a {{blank1}} that needs to be filled in.",
      "blanks": [
        {
          "id": "blank1",
          "correctAnswers": ["word", "term", "phrase"], // List of acceptable answers
          "caseSensitive": false
        }
      ],
      "explanation": "Explanation of the correct answer",
      "hint": "A hint that guides without giving away the answer"
    }
    // Repeat for each question
  ],
  "shuffleQuestions": false,
  "showFeedbackImmediately": true,
  "attemptsAllowed": 2
}`;
      break;
    case 'flash-cards':
      structuredPrompt += `
{
  "cards": [
    {
      "id": "card1",
      "front": {
        "text": "Question or term on the front of the card"
      },
      "back": {
        "text": "Answer or definition on the back of the card"
      },
      "tags": ["tag1", "tag2"],
      "difficulty": "${params.difficultyLevel}"
    }
    // Repeat for each card
  ],
  "randomizeOrder": true,
  "showProgressBar": true,
  "enableSpacedRepetition": false,
  "enableSelfAssessment": true,
  "categories": ["category1", "category2"]
}`;
      break;
    default:
      // Generic format for other activity types
      structuredPrompt += `
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here",
      "options": [
        { "id": "a", "text": "Correct option", "isCorrect": true, "feedback": "Explanation why this is correct" },
        { "id": "b", "text": "Incorrect option 1", "isCorrect": false, "feedback": "Explanation why this is incorrect" },
        { "id": "c", "text": "Incorrect option 2", "isCorrect": false, "feedback": "Explanation why this is incorrect" },
        { "id": "d", "text": "Incorrect option 3", "isCorrect": false, "feedback": "Explanation why this is incorrect" }
      ],
      "explanation": "Detailed explanation of the correct answer",
      "hint": "A hint that guides without giving away the answer"
    }
    // Repeat for each question
  ],
  "showFeedbackImmediately": true
}`;
  }

  return structuredPrompt;
}

/**
 * Refines the AI-generated content using the agent
 */
async function refineContentWithAgent(
  aiGeneratedContent: Record<string, any>,
  agent: AgentState,
  params: ContentGenerationParams,
  activityTypeId: string
): Promise<Record<string, any>> {
  console.log('Refining content with agent:', agent.type);

  // In a real implementation, we would use the agent's tools to refine the content
  // For now, we'll just enhance the content with some additional metadata

  // Add agent-specific enhancements based on the agent type
  if (agent.type === AgentType.ASSESSMENT) {
    // Add assessment-specific enhancements
    if (activityTypeId === 'multiple-choice' && aiGeneratedContent.questions) {
      // Ensure each question has a difficulty level
      aiGeneratedContent.questions = aiGeneratedContent.questions.map((question: any, index: number) => {
        return {
          ...question,
          difficulty: question.difficulty || params.difficultyLevel,
          points: question.points || 1,
          // Add cognitive level (Bloom's taxonomy)
          cognitiveLevel: question.cognitiveLevel || ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'][index % 6],
          // Add alignment to standards if available
          alignedStandards: question.alignedStandards || []
        };
      });

      // Add assessment metadata
      aiGeneratedContent.metadata = {
        ...aiGeneratedContent.metadata,
        assessmentType: params.activityPurpose === ActivityPurpose.ASSESSMENT ? 'summative' : 'formative',
        passingScore: 70,
        timeLimit: 30,
        difficultyDistribution: calculateDifficultyDistribution(aiGeneratedContent.questions),
        cognitiveDistribution: calculateCognitiveDistribution(aiGeneratedContent.questions)
      };
    }
  } else if (agent.type === AgentType.CONTENT_REFINEMENT) {
    // Add content refinement enhancements
    aiGeneratedContent.metadata = {
      ...aiGeneratedContent.metadata,
      readabilityScore: calculateReadabilityScore(aiGeneratedContent),
      engagementLevel: 'high',
      accessibilityFeatures: ['clear-language', 'structured-content', 'consistent-formatting'],
      targetAudience: 'students'
    };
  }

  return aiGeneratedContent;
}

/**
 * Calculates the difficulty distribution of questions
 */
function calculateDifficultyDistribution(questions: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  questions.forEach(question => {
    const difficulty = question.difficulty?.toLowerCase() || 'medium';
    if (difficulty in distribution) {
      distribution[difficulty]++;
    } else {
      distribution.medium++;
    }
  });

  // Convert to percentages
  const total = questions.length;
  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

/**
 * Calculates the cognitive level distribution (Bloom's taxonomy)
 */
function calculateCognitiveDistribution(questions: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
  };

  questions.forEach(question => {
    const level = question.cognitiveLevel?.toLowerCase() || 'understand';
    if (level in distribution) {
      distribution[level]++;
    } else {
      distribution.understand++;
    }
  });

  // Convert to percentages
  const total = questions.length;
  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

/**
 * Calculates a readability score based on content complexity
 */
function calculateReadabilityScore(content: Record<string, any>): number {
  console.log('Calculating readability score for content with keys:', Object.keys(content));

  // Implement a basic readability calculation based on actual content
  let score = 75; // Base score

  try {
    // Check if we have questions to analyze
    if (content.questions && Array.isArray(content.questions) && content.questions.length > 0) {
      // Calculate average question length
      const totalLength = content.questions.reduce((sum: number, q: any) => {
        return sum + (q.text ? q.text.length : 0);
      }, 0);

      const avgLength = totalLength / content.questions.length;

      // Adjust score based on question length (longer questions are generally more complex)
      if (avgLength > 150) {
        score -= 5; // More complex
      } else if (avgLength < 50) {
        score += 5; // Less complex
      }

      // Check for explanation quality
      const hasExplanations = content.questions.every((q: any) => q.explanation && q.explanation.length > 20);
      if (hasExplanations) {
        score += 5; // Better quality with good explanations
      }
    }

    return Math.min(95, Math.max(65, score)); // Keep score between 65-95
  } catch (error) {
    console.error('Error calculating readability score:', error);
    return 75; // Return default score on error
  }
}

// Note: We've removed the isValidApiKey function and integrated the validation directly
// in the generateContentWithAgents function for simplicity

/**
 * Creates an enhanced prompt for the agent based on the parameters
 */
function createEnhancedPrompt(params: ContentGenerationParams, activityTypeId: string): string {
  const activityTypeDisplay = getActivityTypeDisplayName(activityTypeId);
  const purposeDisplay = params.activityPurpose === ActivityPurpose.LEARNING ? 'learning' : 'assessment';
  const subjectName = params.subject || 'the selected subject';
  const topicName = params.topic || 'the selected topic';

  // Extract learning outcomes if available
  const learningOutcomes = params.learningOutcomes
    ? `\nLearning Outcomes: ${params.learningOutcomes}`
    : '';

  // Extract topic description if available
  const topicDescription = params.topicDescription
    ? `\nTopic Description: ${params.topicDescription}`
    : '';

  // Extract topic context if available
  const topicContext = params.topicContext
    ? `\nTopic Context: ${params.topicContext}`
    : '';

  // Create a base prompt with detailed instructions
  let prompt = `
Create a ${params.difficultyLevel} level ${activityTypeDisplay} ${purposeDisplay} activity about ${topicName} in ${subjectName}.
${topicDescription}${topicContext}${learningOutcomes}

Generate ${params.numQuestions} questions that:
1. Test understanding of specific concepts and facts about ${topicName}
2. Are appropriate for the grade level
3. Align with the learning outcomes
4. Include clear, factual explanations for the correct answers
5. Have plausible but clearly incorrect alternative options

DO NOT create questions about the subject itself (e.g., "What is the relationship between ${topicName} and ${subjectName}?").
Instead, create questions about actual concepts, facts, and applications within ${topicName}.

For example, if the topic is "Whole Numbers", create questions about:
- Properties of whole numbers
- Operations with whole numbers
- Real-world applications of whole numbers
- Number patterns and sequences
`;

  // Add the user's custom prompt if provided
  if (params.prompt && params.prompt.trim()) {
    prompt += `\n\nAdditional instructions: ${params.prompt}`;
  }

  return prompt;
}

// Note: We've removed the createFallbackContent function since we're now showing errors
// instead of falling back to mock content

// Note: We've removed the content generator functions since we're now showing errors
// instead of falling back to mock content
