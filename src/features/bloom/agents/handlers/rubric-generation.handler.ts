/**
 * Rubric Generation Agent Handler
 * 
 * This file contains the handler for the rubric generation agent.
 */

import { AgentState } from '@/features/agents';
import { 
  BloomsTaxonomyLevel, 
  RubricType, 
  RubricGenerationRequest,
  Rubric,
  RubricCriterion,
  PerformanceLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';

/**
 * Handler for the rubric generation agent
 * 
 * This handler processes requests to generate rubrics aligned with Bloom's Taxonomy levels
 * based on learning outcomes.
 */
export async function handleRubricGeneration(
  agent: AgentState,
  params: {
    request: RubricGenerationRequest;
    learningOutcomes: Array<{
      id: string;
      statement: string;
      bloomsLevel: BloomsTaxonomyLevel;
    }>;
    existingRubrics?: Rubric[];
  }
): Promise<any> {
  const { request, learningOutcomes, existingRubrics = [] } = params;
  
  // Generate a rubric based on the request and learning outcomes
  const rubric = generateRubric(request, learningOutcomes, existingRubrics);
  
  // Generate an explanation for the rubric
  const explanation = generateExplanation(rubric, learningOutcomes);
  
  return {
    rubric,
    explanation
  };
}

/**
 * Generate a rubric based on the request and learning outcomes
 */
function generateRubric(
  request: RubricGenerationRequest,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  existingRubrics: Rubric[]
): Rubric {
  const {
    title,
    type = RubricType.ANALYTIC,
    bloomsLevels,
    maxScore = 100,
    criteriaCount = learningOutcomes.length,
    performanceLevelCount = 4,
    subject,
    topic,
    gradeLevel
  } = request;
  
  // Generate performance levels
  const performanceLevels = generatePerformanceLevels(performanceLevelCount, maxScore);
  
  // Generate criteria based on learning outcomes
  const criteria = generateCriteria(
    learningOutcomes,
    bloomsLevels,
    criteriaCount,
    performanceLevels
  );
  
  // Calculate Bloom's distribution
  const bloomsDistribution = calculateBloomsDistribution(criteria);
  
  return {
    id: `rubric-${Date.now()}`,
    title,
    description: `Rubric for ${title}`,
    type,
    maxScore,
    bloomsDistribution,
    criteria,
    performanceLevels,
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
 * Generate performance levels for the rubric
 */
function generatePerformanceLevels(
  count: number,
  maxScore: number
): PerformanceLevel[] {
  const levels: PerformanceLevel[] = [];
  
  // Define level names based on count
  const levelNames = count === 3 
    ? ['Beginning', 'Developing', 'Proficient']
    : count === 4
      ? ['Beginning', 'Developing', 'Proficient', 'Exemplary']
      : Array.from({ length: count }, (_, i) => `Level ${i + 1}`);
  
  // Define colors for the levels
  const colors = [
    '#FF6B6B', // Red
    '#FFD166', // Yellow
    '#06D6A0', // Green
    '#118AB2', // Blue
    '#073B4C'  // Dark Blue
  ];
  
  // Calculate score range for each level
  const scorePerLevel = maxScore / count;
  
  // Generate each level
  for (let i = 0; i < count; i++) {
    levels.push({
      id: `level-${i + 1}`,
      name: levelNames[i],
      description: generateLevelDescription(i, count),
      scoreRange: {
        min: Math.round(i * scorePerLevel),
        max: Math.round((i + 1) * scorePerLevel)
      },
      color: colors[i % colors.length]
    });
  }
  
  return levels;
}

/**
 * Generate a description for a performance level
 */
function generateLevelDescription(index: number, totalLevels: number): string {
  const levelDescriptions = [
    [
      'Shows limited understanding and needs significant improvement.',
      'Demonstrates basic understanding with some areas needing improvement.',
      'Exhibits thorough understanding and meets all expectations.'
    ],
    [
      'Shows limited understanding and needs significant improvement.',
      'Demonstrates basic understanding with some areas needing improvement.',
      'Exhibits thorough understanding and meets all expectations.',
      'Exceeds expectations with exceptional quality and insight.'
    ],
    [
      'Shows minimal understanding of concepts.',
      'Demonstrates partial understanding with significant gaps.',
      'Shows adequate understanding with minor gaps.',
      'Demonstrates thorough understanding of all concepts.',
      'Exhibits exceptional insight and mastery beyond expectations.'
    ]
  ];
  
  // Select the appropriate description set based on total levels
  const descriptionSet = totalLevels <= 3 ? levelDescriptions[0] :
                         totalLevels === 4 ? levelDescriptions[1] :
                         levelDescriptions[2];
  
  // Return the description for this level, or a generic one if not available
  return descriptionSet[index] || `Performance at level ${index + 1} out of ${totalLevels}`;
}

/**
 * Generate criteria based on learning outcomes
 */
function generateCriteria(
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>,
  bloomsLevels: BloomsTaxonomyLevel[],
  criteriaCount: number,
  performanceLevels: PerformanceLevel[]
): RubricCriterion[] {
  const criteria: RubricCriterion[] = [];
  
  // Use learning outcomes as criteria if available
  for (let i = 0; i < Math.min(criteriaCount, learningOutcomes.length); i++) {
    const outcome = learningOutcomes[i];
    
    criteria.push({
      id: `criterion-${i + 1}`,
      name: generateCriterionName(outcome.statement),
      description: outcome.statement,
      bloomsLevel: outcome.bloomsLevel,
      weight: 1,
      performanceLevels: generateCriterionPerformanceLevels(
        outcome.bloomsLevel,
        performanceLevels
      )
    });
  }
  
  // Add additional criteria if needed
  if (criteria.length < criteriaCount) {
    // Determine which Bloom's levels to use for additional criteria
    const additionalLevels = bloomsLevels.length > 0 
      ? bloomsLevels 
      : Object.values(BloomsTaxonomyLevel);
    
    for (let i = criteria.length; i < criteriaCount; i++) {
      const bloomsLevel = additionalLevels[i % additionalLevels.length];
      
      criteria.push({
        id: `criterion-${i + 1}`,
        name: `${BLOOMS_LEVEL_METADATA[bloomsLevel].name} Skills`,
        description: `Demonstrates ${bloomsLevel.toLowerCase()} skills related to the topic`,
        bloomsLevel,
        weight: 1,
        performanceLevels: generateCriterionPerformanceLevels(
          bloomsLevel,
          performanceLevels
        )
      });
    }
  }
  
  return criteria;
}

/**
 * Generate a name for a criterion based on a learning outcome statement
 */
function generateCriterionName(statement: string): string {
  // Extract the first 30 characters of the statement
  const shortStatement = statement.substring(0, 30);
  
  // If the statement is shorter than 30 characters, use it as is
  if (shortStatement.length < 30) {
    return shortStatement;
  }
  
  // Otherwise, find the last space before the 30th character
  const lastSpace = shortStatement.lastIndexOf(' ');
  
  // If no space is found, just use the first 30 characters
  if (lastSpace === -1) {
    return `${shortStatement}...`;
  }
  
  // Otherwise, use the text up to the last space
  return `${shortStatement.substring(0, lastSpace)}...`;
}

/**
 * Generate performance levels for a criterion
 */
function generateCriterionPerformanceLevels(
  bloomsLevel: BloomsTaxonomyLevel,
  rubricPerformanceLevels: PerformanceLevel[]
): {
  levelId: string;
  description: string;
  score: number;
}[] {
  return rubricPerformanceLevels.map((level, index) => {
    return {
      levelId: level.id,
      description: generateCriterionLevelDescription(bloomsLevel, index, rubricPerformanceLevels.length),
      score: level.scoreRange.max
    };
  });
}

/**
 * Generate a description for a criterion performance level
 */
function generateCriterionLevelDescription(
  bloomsLevel: BloomsTaxonomyLevel,
  levelIndex: number,
  totalLevels: number
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // description generation using LLM capabilities in a real implementation
  
  const levelDescriptions = {
    [BloomsTaxonomyLevel.REMEMBER]: [
      'Shows minimal ability to recall basic facts and concepts.',
      'Can recall some basic facts and concepts with assistance.',
      'Recalls most basic facts and concepts accurately.',
      'Demonstrates complete and accurate recall of all facts and concepts.'
    ],
    [BloomsTaxonomyLevel.UNDERSTAND]: [
      'Shows minimal understanding of concepts and ideas.',
      'Demonstrates partial understanding of main concepts.',
      'Shows good understanding of most concepts and can explain them.',
      'Exhibits thorough understanding and can explain concepts in own words.'
    ],
    [BloomsTaxonomyLevel.APPLY]: [
      'Unable to apply concepts to solve problems.',
      'Can apply concepts to solve simple problems with guidance.',
      'Applies concepts to solve most problems independently.',
      'Skillfully applies concepts to solve complex problems in new situations.'
    ],
    [BloomsTaxonomyLevel.ANALYZE]: [
      'Unable to break down information into component parts.',
      'Can identify some components but struggles to see relationships.',
      'Breaks down most information and identifies relationships.',
      'Thoroughly analyzes complex information and identifies subtle relationships.'
    ],
    [BloomsTaxonomyLevel.EVALUATE]: [
      'Unable to make judgments based on criteria.',
      'Makes simple judgments with limited justification.',
      'Makes reasonable judgments with adequate justification.',
      'Makes sophisticated judgments with thorough, insightful justification.'
    ],
    [BloomsTaxonomyLevel.CREATE]: [
      'Unable to produce original work or ideas.',
      'Produces work that shows limited originality.',
      'Creates original work that demonstrates creativity.',
      'Produces highly innovative, original work of exceptional quality.'
    ]
  };
  
  // Get the descriptions for this Bloom's level
  const descriptions = levelDescriptions[bloomsLevel] || [];
  
  // If we have a description for this level, use it
  if (levelIndex < descriptions.length) {
    return descriptions[levelIndex];
  }
  
  // Otherwise, generate a generic description
  const levelQuality = levelIndex === 0 ? 'minimal' :
                      levelIndex === totalLevels - 1 ? 'exceptional' :
                      `level ${levelIndex + 1}`;
  
  return `Demonstrates ${levelQuality} ${bloomsLevel.toLowerCase()} skills.`;
}

/**
 * Calculate the Bloom's distribution for a set of criteria
 */
function calculateBloomsDistribution(criteria: RubricCriterion[]): Record<BloomsTaxonomyLevel, number> {
  const distribution: Partial<Record<BloomsTaxonomyLevel, number>> = {};
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  
  // Calculate the percentage for each Bloom's level
  criteria.forEach(criterion => {
    const level = criterion.bloomsLevel;
    const percentage = (criterion.weight / totalWeight) * 100;
    
    distribution[level] = (distribution[level] || 0) + percentage;
  });
  
  // Ensure all Bloom's levels are represented
  Object.values(BloomsTaxonomyLevel).forEach(level => {
    distribution[level] = distribution[level] || 0;
  });
  
  return distribution as Record<BloomsTaxonomyLevel, number>;
}

/**
 * Generate an explanation for the rubric
 */
function generateExplanation(
  rubric: Rubric,
  learningOutcomes: Array<{
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }>
): string {
  // This is a simplified implementation that would be replaced with a more sophisticated
  // explanation generation using LLM capabilities in a real implementation
  
  const bloomsLevelsUsed = Object.entries(rubric.bloomsDistribution)
    .filter(([_, percentage]) => percentage > 0)
    .map(([level]) => BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name)
    .join(', ');
  
  return `This ${rubric.type.toLowerCase()} rubric is designed to assess ${rubric.criteria.length} criteria aligned with ${bloomsLevelsUsed} cognitive levels from Bloom's Taxonomy. It includes ${rubric.performanceLevels.length} performance levels with a maximum score of ${rubric.maxScore} points.`;
}
