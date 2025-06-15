/**
 * Bloom's Taxonomy Hook
 * 
 * This hook provides functionality for working with Bloom's Taxonomy in React components.
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  BloomsTaxonomyLevel, 
  BloomsDistribution,
  ActionVerb,
  BloomsClassificationResult,
  BloomsCurriculumAnalysis
} from '../types';
import { 
  BLOOMS_LEVEL_METADATA, 
  ORDERED_BLOOMS_LEVELS, 
  DEFAULT_BLOOMS_DISTRIBUTION 
} from '../constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL, ALL_ACTION_VERBS } from '../constants/action-verbs';
import { 
  getBloomsLevelMetadata, 
  getActionVerbsForLevel,
  getRandomActionVerbsForLevel,
  isDistributionBalanced,
  calculateBloomsDistribution,
  analyzeCurriculumBalance
} from '../utils/bloom-helpers';

/**
 * Hook for working with Bloom's Taxonomy
 */
export function useBloomsTaxonomy() {
  // State for selected Bloom's level
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel | null>(null);
  
  // State for Bloom's distribution
  const [distribution, setDistribution] = useState<BloomsDistribution>(DEFAULT_BLOOMS_DISTRIBUTION);
  
  // State for suggested action verbs
  const [suggestedVerbs, setSuggestedVerbs] = useState<ActionVerb[]>([]);
  
  // Get metadata for all Bloom's levels
  const allLevelsMetadata = useMemo(() => 
    ORDERED_BLOOMS_LEVELS.map(level => BLOOMS_LEVEL_METADATA[level]),
    []
  );
  
  // Get metadata for selected level
  const selectedLevelMetadata = useMemo(() => 
    selectedLevel ? BLOOMS_LEVEL_METADATA[selectedLevel] : null,
    [selectedLevel]
  );
  
  // Check if distribution is balanced
  const isBalanced = useMemo(() => 
    isDistributionBalanced(distribution),
    [distribution]
  );
  
  // Update the selected Bloom's level
  const selectLevel = useCallback((level: BloomsTaxonomyLevel) => {
    setSelectedLevel(level);
    
    // Update suggested verbs when level changes
    setSuggestedVerbs(getRandomActionVerbsForLevel(level, 5));
  }, []);
  
  // Update the distribution for a specific level
  const updateDistribution = useCallback((level: BloomsTaxonomyLevel, percentage: number) => {
    setDistribution(prev => ({
      ...prev,
      [level]: percentage
    }));
  }, []);
  
  // Update the entire distribution
  const setFullDistribution = useCallback((newDistribution: BloomsDistribution) => {
    setDistribution(newDistribution);
  }, []);
  
  // Reset distribution to default
  const resetDistribution = useCallback(() => {
    setDistribution(DEFAULT_BLOOMS_DISTRIBUTION);
  }, []);
  
  // Get more suggested verbs for the current level
  const refreshSuggestedVerbs = useCallback(() => {
    if (selectedLevel) {
      setSuggestedVerbs(getRandomActionVerbsForLevel(selectedLevel, 5));
    }
  }, [selectedLevel]);
  
  // Search for action verbs across all levels
  const searchActionVerbs = useCallback((searchTerm: string): ActionVerb[] => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ALL_ACTION_VERBS.filter(verb => 
      verb.verb.toLowerCase().includes(lowerSearchTerm)
    );
  }, []);
  
  // Classify content by Bloom's level (mock implementation)
  const classifyContent = useCallback(async (content: string): Promise<BloomsClassificationResult> => {
    // This would typically call an API or service
    // Mock implementation for now
    const words = content.toLowerCase().split(/\s+/);
    
    // Simple keyword-based classification
    const levelScores: Record<BloomsTaxonomyLevel, number> = {
      [BloomsTaxonomyLevel.REMEMBER]: 0,
      [BloomsTaxonomyLevel.UNDERSTAND]: 0,
      [BloomsTaxonomyLevel.APPLY]: 0,
      [BloomsTaxonomyLevel.ANALYZE]: 0,
      [BloomsTaxonomyLevel.EVALUATE]: 0,
      [BloomsTaxonomyLevel.CREATE]: 0,
    };
    
    // Check for verbs from each level
    for (const [level, verbs] of Object.entries(ACTION_VERBS_BY_LEVEL)) {
      for (const verb of verbs) {
        if (words.includes(verb.verb.toLowerCase())) {
          levelScores[level as BloomsTaxonomyLevel] += 1;
        }
      }
    }
    
    // Find the level with the highest score
    let highestScore = 0;
    let classifiedLevel = BloomsTaxonomyLevel.REMEMBER;
    
    for (const [level, score] of Object.entries(levelScores)) {
      if (score > highestScore) {
        highestScore = score;
        classifiedLevel = level as BloomsTaxonomyLevel;
      }
    }
    
    // If no clear classification, default to UNDERSTAND
    if (highestScore === 0) {
      classifiedLevel = BloomsTaxonomyLevel.UNDERSTAND;
    }
    
    // Get suggested verbs for the classified level
    const verbs = getRandomActionVerbsForLevel(classifiedLevel, 3);
    
    return {
      content,
      bloomsLevel: classifiedLevel,
      confidence: highestScore > 0 ? Math.min(0.5 + (highestScore * 0.1), 0.9) : 0.5,
      suggestedVerbs: verbs.map(v => v.verb),
      suggestedImprovements: [
        `Consider using more specific action verbs for ${BLOOMS_LEVEL_METADATA[classifiedLevel].name} level thinking.`
      ]
    };
  }, []);
  
  // Analyze curriculum balance
  const analyzeCurriculum = useCallback((
    subjectId: string,
    subjectName: string,
    subjectDistribution: BloomsDistribution,
    topicAnalysis?: Array<{
      topicId: string;
      topicName: string;
      distribution: BloomsDistribution;
    }>
  ): BloomsCurriculumAnalysis => {
    return analyzeCurriculumBalance(
      subjectId,
      subjectName,
      subjectDistribution,
      topicAnalysis
    );
  }, []);
  
  return {
    // State
    selectedLevel,
    distribution,
    suggestedVerbs,
    
    // Derived values
    allLevelsMetadata,
    selectedLevelMetadata,
    isBalanced,
    orderedLevels: ORDERED_BLOOMS_LEVELS,
    
    // Actions
    selectLevel,
    updateDistribution,
    setFullDistribution,
    resetDistribution,
    refreshSuggestedVerbs,
    searchActionVerbs,
    classifyContent,
    analyzeCurriculum,
    
    // Utility functions
    getBloomsLevelMetadata,
    getActionVerbsForLevel,
    getRandomActionVerbsForLevel,
    isDistributionBalanced,
    calculateBloomsDistribution,
  };
}
