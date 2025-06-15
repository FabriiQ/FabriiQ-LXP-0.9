/**
 * Activity Generation Agent Handler
 * 
 * This file contains the handler for the activity generation agent.
 */

import { AgentState } from '@/features/agents';
import { 
  BloomsTaxonomyLevel, 
  ActivityGenerationRequest,
  Activity,
  Rubric
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '../../constants/action-verbs';

/**
 * Handler for the activity generation agent
 * 
 * This handler processes requests to generate activities aligned with Bloom's Taxonomy levels
 * based on learning outcomes.
 */
export async function handleActivityGeneration(
  agent: AgentState,
  params: {
    request: ActivityGenerationRequest;
    learningOutcomes: Array<{
      id: string;
      statement: string;
      bloomsLevel: BloomsTaxonomyLevel;
    }>;
    existingActivities?: Activity[];
  }
): Promise<any> {
  const { request, learningOutcomes, existingActivities = [] } = params;
  
  // Generate an activity based on the request and learning outcomes
  const activity = generateActivity(request, learningOutcomes, existingActivities);
  
  // Generate a rubric if requested
  const rubric = request.includeRubric ? 
    generateRubric(activity, learningOutcomes) : 
    undefined;
  
  // Generate an explanation for the activity
  const explanation = generateExplanation(activity, learningOutcomes, rubric);
  
  return {
    activity,
    rubric,
    explanation
  };
}

/**
 * Generate an activity based on the request and learning outcomes
 */
function generateActivity(
  request: ActivityGenerationRequest,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  existingActivities: Activity[]
): Activity {
  const {
    title,
    bloomsLevel,
    type = 'interactive',
    setting = 'classroom',
    duration = 30,
    groupSize = 1,
    subject,
    topic,
    gradeLevel
  } = request;
  
  // Generate a title if not provided
  const activityTitle = title || generateActivityTitle(bloomsLevel, learningOutcomes, topic);
  
  // Generate a description based on the learning outcomes and Bloom's level
  const description = generateActivityDescription(bloomsLevel, learningOutcomes, topic);
  
  // Generate materials based on the activity type and setting
  const materials = generateMaterials(type, setting, bloomsLevel);
  
  // Generate instructions based on the activity type, setting, and Bloom's level
  const instructions = generateInstructions(type, setting, bloomsLevel, learningOutcomes);
  
  return {
    id: `activity-${Date.now()}`,
    title: activityTitle,
    description,
    type,
    setting,
    bloomsLevel,
    duration,
    groupSize,
    materials,
    instructions,
    metadata: {
      subject,
      topic,
      gradeLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Generate a title for an activity
 */
function generateActivityTitle(
  bloomsLevel: BloomsTaxonomyLevel,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  topic?: string
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // title generation using LLM capabilities in a real implementation
  
  // Get a random action verb for the Bloom's level
  const verbs = ACTION_VERBS_BY_LEVEL[bloomsLevel] || [];
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)] || 'Explore';
  
  // Capitalize the first letter of the verb
  const capitalizedVerb = randomVerb.charAt(0).toUpperCase() + randomVerb.slice(1);
  
  // Use the topic if provided, otherwise extract a topic from the learning outcomes
  const activityTopic = topic || extractTopicFromLearningOutcomes(learningOutcomes);
  
  return `${capitalizedVerb} ${activityTopic}`;
}

/**
 * Extract a topic from learning outcomes
 */
function extractTopicFromLearningOutcomes(
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>
): string {
  // If no learning outcomes are provided, return a generic topic
  if (learningOutcomes.length === 0) {
    return 'the Topic';
  }
  
  // Extract the first 3 words after the first verb in the first learning outcome
  const statement = learningOutcomes[0].statement;
  const words = statement.split(' ');
  
  // Find the first verb (assuming it's one of the first 3 words)
  let verbIndex = -1;
  for (let i = 0; i < Math.min(3, words.length); i++) {
    const word = words[i].toLowerCase();
    if (isVerb(word)) {
      verbIndex = i;
      break;
    }
  }
  
  // If no verb is found, use words 1-4
  if (verbIndex === -1) {
    return words.slice(1, Math.min(5, words.length)).join(' ');
  }
  
  // Otherwise, use the 3 words after the verb
  return words.slice(verbIndex + 1, Math.min(verbIndex + 4, words.length)).join(' ');
}

/**
 * Check if a word is a verb
 */
function isVerb(word: string): boolean {
  // This is a simplified implementation that checks if the word is in any of the action verb lists
  return Object.values(ACTION_VERBS_BY_LEVEL).some(verbs => 
    verbs.some(verb => verb.toLowerCase() === word.toLowerCase())
  );
}

/**
 * Generate a description for an activity
 */
function generateActivityDescription(
  bloomsLevel: BloomsTaxonomyLevel,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  topic?: string
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // description generation using LLM capabilities in a real implementation
  
  const levelMetadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
  const topicName = topic || extractTopicFromLearningOutcomes(learningOutcomes);
  
  return `This activity helps students develop ${levelMetadata.name.toLowerCase()} skills related to ${topicName}. It focuses on ${levelMetadata.description.toLowerCase()}.`;
}

/**
 * Generate materials for an activity
 */
function generateMaterials(
  type: string,
  setting: string,
  bloomsLevel: BloomsTaxonomyLevel
): string[] {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // materials generation using LLM capabilities in a real implementation
  
  const commonMaterials = ['Textbook', 'Notebook', 'Pencils'];
  
  // Add materials based on the activity type
  const typeMaterials = type === 'interactive' ? ['Whiteboard', 'Markers'] :
                        type === 'discussion' ? ['Discussion prompts', 'Timer'] :
                        type === 'project' ? ['Project materials', 'Rubric'] :
                        [];
  
  // Add materials based on the setting
  const settingMaterials = setting === 'classroom' ? ['Handouts'] :
                          setting === 'online' ? ['Computer', 'Internet access'] :
                          setting === 'hybrid' ? ['Tablets', 'Digital resources'] :
                          [];
  
  // Add materials based on the Bloom's level
  const levelMaterials = bloomsLevel === BloomsTaxonomyLevel.ANALYZE ? ['Analysis worksheet'] :
                        bloomsLevel === BloomsTaxonomyLevel.EVALUATE ? ['Evaluation criteria'] :
                        bloomsLevel === BloomsTaxonomyLevel.CREATE ? ['Creative supplies'] :
                        [];
  
  return [...commonMaterials, ...typeMaterials, ...settingMaterials, ...levelMaterials];
}

/**
 * Generate instructions for an activity
 */
function generateInstructions(
  type: string,
  setting: string,
  bloomsLevel: BloomsTaxonomyLevel,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // instructions generation using LLM capabilities in a real implementation
  
  const levelMetadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
  
  // Generate steps based on the Bloom's level
  const steps = [
    `Step 1: Introduction to the topic`,
    `Step 2: ${levelMetadata.name} activity - Students will ${levelMetadata.description.toLowerCase()}`,
    `Step 3: Group discussion and reflection`,
    `Step 4: Assessment and feedback`
  ];
  
  return steps.join('\n');
}

/**
 * Generate a rubric for an activity
 */
function generateRubric(
  activity: Activity,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>
): Rubric {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // rubric generation using LLM capabilities in a real implementation
  
  // Generate criteria based on the learning outcomes
  const criteria = learningOutcomes.map((outcome, index) => ({
    id: `criterion-${index + 1}`,
    name: `Criterion ${index + 1}`,
    description: outcome.statement,
    bloomsLevel: outcome.bloomsLevel,
    weight: 1,
    performanceLevels: [
      {
        levelId: 'level-1',
        description: 'Beginning',
        score: 1
      },
      {
        levelId: 'level-2',
        description: 'Developing',
        score: 2
      },
      {
        levelId: 'level-3',
        description: 'Proficient',
        score: 3
      },
      {
        levelId: 'level-4',
        description: 'Exemplary',
        score: 4
      }
    ]
  }));
  
  // Calculate Bloom's distribution
  const bloomsDistribution: Record<BloomsTaxonomyLevel, number> = {} as Record<BloomsTaxonomyLevel, number>;
  
  Object.values(BloomsTaxonomyLevel).forEach(level => {
    bloomsDistribution[level] = 0;
  });
  
  criteria.forEach(criterion => {
    bloomsDistribution[criterion.bloomsLevel] += (1 / criteria.length) * 100;
  });
  
  return {
    id: `rubric-${Date.now()}`,
    title: `Rubric for ${activity.title}`,
    description: `Rubric for assessing ${activity.title}`,
    type: 'ANALYTIC',
    maxScore: criteria.length * 4,
    bloomsDistribution,
    criteria,
    performanceLevels: [
      {
        id: 'level-1',
        name: 'Beginning',
        description: 'Shows limited understanding and needs significant improvement.',
        scoreRange: { min: 1, max: 1 },
        color: '#FF6B6B'
      },
      {
        id: 'level-2',
        name: 'Developing',
        description: 'Demonstrates basic understanding with some areas needing improvement.',
        scoreRange: { min: 2, max: 2 },
        color: '#FFD166'
      },
      {
        id: 'level-3',
        name: 'Proficient',
        description: 'Exhibits thorough understanding and meets all expectations.',
        scoreRange: { min: 3, max: 3 },
        color: '#06D6A0'
      },
      {
        id: 'level-4',
        name: 'Exemplary',
        description: 'Exceeds expectations with exceptional quality and insight.',
        scoreRange: { min: 4, max: 4 },
        color: '#118AB2'
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Generate an explanation for the activity
 */
function generateExplanation(
  activity: Activity,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  rubric?: Rubric
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // explanation generation using LLM capabilities in a real implementation
  
  const levelMetadata = BLOOMS_LEVEL_METADATA[activity.bloomsLevel];
  
  let explanation = `This ${activity.type} activity is designed to help students develop ${levelMetadata.name.toLowerCase()} skills. It focuses on ${levelMetadata.description.toLowerCase()} through a ${activity.setting} setting.`;
  
  if (rubric) {
    explanation += ` A rubric with ${rubric.criteria.length} criteria is provided to assess student performance.`;
  }
  
  return explanation;
}
