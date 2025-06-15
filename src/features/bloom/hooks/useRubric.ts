/**
 * Rubric Hook
 * 
 * This hook provides functionality for working with rubrics in React components.
 */

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Rubric, 
  RubricType, 
  RubricCriteria, 
  PerformanceLevel,
  RubricTemplate,
  RubricGenerationRequest,
  RubricFeedback
} from '../types';
import { BloomsTaxonomyLevel } from '../types';
import { 
  calculateRubricMaxScore,
  calculateRubricScore,
  getPerformanceLevelForScore,
  createDefaultPerformanceLevels,
  createDefaultCriteriaForBloomsLevel,
  calculateRubricBloomsDistribution,
  generateRubricFeedback
} from '../utils/rubric-helpers';

/**
 * Hook for working with rubrics
 */
export function useRubric(initialRubric?: Partial<Rubric>) {
  // State for the current rubric
  const [rubric, setRubric] = useState<Partial<Rubric>>({
    title: '',
    description: '',
    type: RubricType.ANALYTIC,
    maxScore: 100,
    criteria: [],
    performanceLevels: [],
    learningOutcomeIds: [],
    ...initialRubric
  });
  
  // State for available templates
  const [templates, setTemplates] = useState<RubricTemplate[]>([]);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error message
  const [error, setError] = useState<string | null>(null);
  
  // Calculate the Bloom's distribution for the current rubric
  const bloomsDistribution = useMemo(() => {
    if (!rubric.criteria || rubric.criteria.length === 0) {
      return {};
    }
    
    return calculateRubricBloomsDistribution(rubric as Rubric);
  }, [rubric.criteria]);
  
  // Initialize a new rubric
  const initializeRubric = useCallback((
    title: string,
    type: RubricType = RubricType.ANALYTIC,
    maxScore: number = 100
  ) => {
    // Create default performance levels
    const performanceLevels = createDefaultPerformanceLevels(maxScore);
    
    // Create a new rubric
    setRubric({
      id: uuidv4(), // Temporary ID until saved
      title,
      description: '',
      type,
      maxScore,
      criteria: [],
      performanceLevels,
      learningOutcomeIds: [],
      createdById: '', // Will be set when saved
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, []);
  
  // Update rubric properties
  const updateRubricProperties = useCallback((properties: Partial<Rubric>) => {
    setRubric(prev => ({
      ...prev,
      ...properties,
      updatedAt: new Date()
    }));
  }, []);
  
  // Add a criteria to the rubric
  const addCriteria = useCallback((
    name: string,
    description: string,
    bloomsLevel: BloomsTaxonomyLevel,
    weight: number = 1,
    learningOutcomeIds: string[] = []
  ) => {
    // Create a new criteria
    const newCriteria: RubricCriteria = {
      id: uuidv4(),
      name,
      description,
      bloomsLevel,
      weight,
      learningOutcomeIds,
      performanceLevels: rubric.performanceLevels?.map(level => ({
        levelId: level.id,
        description: '',
        score: level.scoreRange.min
      })) || []
    };
    
    // Add the criteria to the rubric
    setRubric(prev => ({
      ...prev,
      criteria: [...(prev.criteria || []), newCriteria],
      updatedAt: new Date()
    }));
  }, [rubric.performanceLevels]);
  
  // Add a default criteria for a Bloom's level
  const addDefaultCriteriaForBloomsLevel = useCallback((
    bloomsLevel: BloomsTaxonomyLevel,
    weight: number = 1
  ) => {
    // Get default criteria for the Bloom's level
    const defaultCriteria = createDefaultCriteriaForBloomsLevel(bloomsLevel, weight);
    
    // Add the criteria to the rubric
    setRubric(prev => {
      const newCriteria: RubricCriteria = {
        id: uuidv4(),
        ...defaultCriteria,
        performanceLevels: prev.performanceLevels?.map((level, index) => ({
          levelId: level.id,
          description: defaultCriteria.performanceLevels[index]?.description || '',
          score: defaultCriteria.performanceLevels[index]?.score || level.scoreRange.min
        })) || []
      };
      
      return {
        ...prev,
        criteria: [...(prev.criteria || []), newCriteria],
        updatedAt: new Date()
      };
    });
  }, []);
  
  // Update a criteria
  const updateCriteria = useCallback((
    criteriaId: string,
    updates: Partial<RubricCriteria>
  ) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria?.map(criteria => 
        criteria.id === criteriaId
          ? { ...criteria, ...updates }
          : criteria
      ) || [],
      updatedAt: new Date()
    }));
  }, []);
  
  // Remove a criteria
  const removeCriteria = useCallback((criteriaId: string) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria?.filter(criteria => criteria.id !== criteriaId) || [],
      updatedAt: new Date()
    }));
  }, []);
  
  // Add a performance level
  const addPerformanceLevel = useCallback((
    name: string,
    description: string,
    minScore: number,
    maxScore: number,
    color?: string
  ) => {
    // Create a new performance level
    const newLevel: PerformanceLevel = {
      id: uuidv4(),
      name,
      description,
      scoreRange: { min: minScore, max: maxScore },
      color
    };
    
    // Add the level to the rubric
    setRubric(prev => {
      // Add the level
      const updatedLevels = [...(prev.performanceLevels || []), newLevel];
      
      // Sort levels by min score
      updatedLevels.sort((a, b) => a.scoreRange.min - b.scoreRange.min);
      
      // Update criteria to include the new level
      const updatedCriteria = prev.criteria?.map(criteria => ({
        ...criteria,
        performanceLevels: [
          ...criteria.performanceLevels,
          {
            levelId: newLevel.id,
            description: '',
            score: newLevel.scoreRange.min
          }
        ]
      })) || [];
      
      return {
        ...prev,
        performanceLevels: updatedLevels,
        criteria: updatedCriteria,
        updatedAt: new Date()
      };
    });
  }, []);
  
  // Update a performance level
  const updatePerformanceLevel = useCallback((
    levelId: string,
    updates: Partial<PerformanceLevel>
  ) => {
    setRubric(prev => ({
      ...prev,
      performanceLevels: prev.performanceLevels?.map(level => 
        level.id === levelId
          ? { 
              ...level, 
              ...updates,
              scoreRange: updates.scoreRange || level.scoreRange
            }
          : level
      ) || [],
      updatedAt: new Date()
    }));
  }, []);
  
  // Remove a performance level
  const removePerformanceLevel = useCallback((levelId: string) => {
    setRubric(prev => {
      // Remove the level
      const updatedLevels = prev.performanceLevels?.filter(level => level.id !== levelId) || [];
      
      // Update criteria to remove the level
      const updatedCriteria = prev.criteria?.map(criteria => ({
        ...criteria,
        performanceLevels: criteria.performanceLevels.filter(level => level.levelId !== levelId)
      })) || [];
      
      return {
        ...prev,
        performanceLevels: updatedLevels,
        criteria: updatedCriteria,
        updatedAt: new Date()
      };
    });
  }, []);
  
  // Update a criteria performance level
  const updateCriteriaPerformanceLevel = useCallback((
    criteriaId: string,
    levelId: string,
    description: string,
    score: number
  ) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria?.map(criteria => 
        criteria.id === criteriaId
          ? {
              ...criteria,
              performanceLevels: criteria.performanceLevels.map(level => 
                level.levelId === levelId
                  ? { ...level, description, score }
                  : level
              )
            }
          : criteria
      ) || [],
      updatedAt: new Date()
    }));
  }, []);
  
  // Load templates (mock implementation)
  const loadTemplates = useCallback(async (
    subject?: string,
    gradeLevel?: string,
    bloomsLevels?: BloomsTaxonomyLevel[]
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock templates
      const mockTemplates: RubricTemplate[] = [
        {
          id: '1',
          title: 'Basic Essay Rubric',
          description: 'A simple rubric for evaluating essays',
          type: RubricType.ANALYTIC,
          category: 'Writing',
          gradeLevel: 'High School',
          subject: 'English',
          bloomsLevels: [BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE],
          criteria: [
            createDefaultCriteriaForBloomsLevel(BloomsTaxonomyLevel.ANALYZE),
            createDefaultCriteriaForBloomsLevel(BloomsTaxonomyLevel.EVALUATE)
          ],
          performanceLevels: createDefaultPerformanceLevels(100, 4),
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Science Lab Report Rubric',
          description: 'Rubric for evaluating science lab reports',
          type: RubricType.ANALYTIC,
          category: 'Science',
          gradeLevel: 'Middle School',
          subject: 'Science',
          bloomsLevels: [BloomsTaxonomyLevel.APPLY, BloomsTaxonomyLevel.ANALYZE],
          criteria: [
            createDefaultCriteriaForBloomsLevel(BloomsTaxonomyLevel.APPLY),
            createDefaultCriteriaForBloomsLevel(BloomsTaxonomyLevel.ANALYZE)
          ],
          performanceLevels: createDefaultPerformanceLevels(100, 4),
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Filter templates based on parameters
      let filteredTemplates = mockTemplates;
      
      if (subject) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.subject?.toLowerCase().includes(subject.toLowerCase())
        );
      }
      
      if (gradeLevel) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.gradeLevel?.toLowerCase().includes(gradeLevel.toLowerCase())
        );
      }
      
      if (bloomsLevels && bloomsLevels.length > 0) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.bloomsLevels.some(level => bloomsLevels.includes(level))
        );
      }
      
      setTemplates(filteredTemplates);
    } catch (err) {
      setError('Failed to load rubric templates');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Apply a template
  const applyTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      setError('Template not found');
      return;
    }
    
    // Create performance levels from template
    const performanceLevels = template.performanceLevels.map(level => ({
      ...level,
      id: uuidv4()
    }));
    
    // Create criteria from template
    const criteria = template.criteria.map(criteria => {
      const newCriteria: RubricCriteria = {
        id: uuidv4(),
        name: criteria.name,
        description: criteria.description,
        bloomsLevel: criteria.bloomsLevel,
        weight: criteria.weight,
        learningOutcomeIds: [],
        performanceLevels: performanceLevels.map((level, index) => ({
          levelId: level.id,
          description: criteria.performanceLevels[index]?.description || '',
          score: criteria.performanceLevels[index]?.score || level.scoreRange.min
        }))
      };
      
      return newCriteria;
    });
    
    // Update the rubric with the template
    setRubric(prev => ({
      ...prev,
      title: prev.title || template.title,
      description: prev.description || template.description,
      type: template.type,
      performanceLevels,
      criteria,
      updatedAt: new Date()
    }));
  }, [templates]);
  
  // Generate a rubric (mock implementation)
  const generateRubric = useCallback(async (request: RubricGenerationRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create performance levels
      const performanceLevels = createDefaultPerformanceLevels(
        request.maxScore,
        request.performanceLevelCount || 4
      );
      
      // Create criteria based on Bloom's levels
      const criteria: RubricCriteria[] = [];
      
      for (const level of request.bloomsLevels) {
        const defaultCriteria = createDefaultCriteriaForBloomsLevel(
          level,
          1 / request.bloomsLevels.length
        );
        
        const newCriteria: RubricCriteria = {
          id: uuidv4(),
          ...defaultCriteria,
          learningOutcomeIds: request.learningOutcomeIds.filter((_, i) => i % 2 === 0), // Mock assignment
          performanceLevels: performanceLevels.map((level, index) => ({
            levelId: level.id,
            description: defaultCriteria.performanceLevels[index]?.description || '',
            score: defaultCriteria.performanceLevels[index]?.score || level.scoreRange.min
          }))
        };
        
        criteria.push(newCriteria);
      }
      
      // Update the rubric
      setRubric({
        id: uuidv4(), // Temporary ID until saved
        title: request.title,
        description: `Rubric for ${request.title}`,
        type: request.type,
        maxScore: request.maxScore,
        criteria,
        performanceLevels,
        learningOutcomeIds: request.learningOutcomeIds,
        createdById: '', // Will be set when saved
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      setError('Failed to generate rubric');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get feedback on the current rubric
  const getRubricFeedback = useCallback((): RubricFeedback | null => {
    if (!rubric.id || !rubric.criteria || rubric.criteria.length === 0) {
      return null;
    }
    
    return generateRubricFeedback(rubric as Rubric);
  }, [rubric]);
  
  return {
    // State
    rubric,
    templates,
    isLoading,
    error,
    bloomsDistribution,
    
    // Actions
    initializeRubric,
    updateRubricProperties,
    addCriteria,
    addDefaultCriteriaForBloomsLevel,
    updateCriteria,
    removeCriteria,
    addPerformanceLevel,
    updatePerformanceLevel,
    removePerformanceLevel,
    updateCriteriaPerformanceLevel,
    loadTemplates,
    applyTemplate,
    generateRubric,
    getRubricFeedback,
    
    // Utility functions
    calculateRubricMaxScore,
    calculateRubricScore,
    getPerformanceLevelForScore,
    createDefaultPerformanceLevels,
    createDefaultCriteriaForBloomsLevel,
    calculateRubricBloomsDistribution,
  };
}
