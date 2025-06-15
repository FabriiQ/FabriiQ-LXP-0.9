/**
 * Activity Templates Hook
 * 
 * This hook provides functionality for working with activity templates in React components.
 */

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  ActivityTemplate, 
  ActivityType, 
  ActivitySetting,
  Activity,
  ActivityGenerationRequest,
  ActivitySequence,
  ActivityRecommendation
} from '../types';
import { BloomsTaxonomyLevel } from '../types';
import { BLOOMS_LEVEL_METADATA } from '../constants/bloom-levels';

/**
 * Hook for working with activity templates
 */
export function useActivityTemplates() {
  // State for available templates
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  
  // State for current activity
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error message
  const [error, setError] = useState<string | null>(null);
  
  // Filter templates by Bloom's level
  const filterTemplatesByLevel = useCallback((level: BloomsTaxonomyLevel) => {
    return templates.filter(template => template.bloomsLevel === level);
  }, [templates]);
  
  // Filter templates by setting
  const filterTemplatesBySetting = useCallback((setting: ActivitySetting) => {
    return templates.filter(template => template.setting === setting);
  }, [templates]);
  
  // Filter templates by type
  const filterTemplatesByType = useCallback((type: ActivityType) => {
    return templates.filter(template => template.type === type);
  }, [templates]);
  
  // Filter templates by multiple criteria
  const filterTemplates = useCallback((
    criteria: {
      bloomsLevel?: BloomsTaxonomyLevel;
      setting?: ActivitySetting;
      type?: ActivityType;
      subject?: string;
      gradeLevel?: string;
      searchTerm?: string;
    }
  ) => {
    return templates.filter(template => {
      // Check Bloom's level
      if (criteria.bloomsLevel && template.bloomsLevel !== criteria.bloomsLevel) {
        return false;
      }
      
      // Check setting
      if (criteria.setting && template.setting !== criteria.setting) {
        return false;
      }
      
      // Check type
      if (criteria.type && template.type !== criteria.type) {
        return false;
      }
      
      // Check subject
      if (criteria.subject && template.subject !== criteria.subject) {
        return false;
      }
      
      // Check grade level
      if (criteria.gradeLevel && template.gradeLevel && 
          !template.gradeLevel.includes(criteria.gradeLevel)) {
        return false;
      }
      
      // Check search term
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        return (
          template.title.toLowerCase().includes(term) ||
          template.description.toLowerCase().includes(term) ||
          template.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [templates]);
  
  // Load templates (mock implementation)
  const loadTemplates = useCallback(async (
    criteria?: {
      bloomsLevel?: BloomsTaxonomyLevel;
      setting?: ActivitySetting;
      type?: ActivityType;
      subject?: string;
      gradeLevel?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock templates
      const mockTemplates: ActivityTemplate[] = [
        {
          id: '1',
          title: 'Vocabulary Flashcards',
          description: 'Create flashcards for key vocabulary terms',
          type: ActivityType.INDIVIDUAL,
          setting: ActivitySetting.IN_CLASS,
          bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
          estimatedDuration: 20,
          materials: ['Index cards', 'Markers'],
          instructions: 'Create flashcards with the term on one side and the definition on the other.',
          assessmentStrategy: 'Peer review of flashcards',
          differentiation: {
            advanced: 'Include etymology and related words',
            struggling: 'Provide a word bank and sentence frames'
          },
          tags: ['vocabulary', 'flashcards', 'memory'],
          subject: 'Language Arts',
          gradeLevel: ['Elementary', 'Middle School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Concept Mapping',
          description: 'Create a concept map to show relationships between ideas',
          type: ActivityType.INDIVIDUAL,
          setting: ActivitySetting.IN_CLASS,
          bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
          estimatedDuration: 30,
          materials: ['Large paper', 'Markers', 'Sticky notes'],
          instructions: 'Create a concept map that shows how the main ideas are connected.',
          assessmentStrategy: 'Rubric-based assessment of concept map',
          differentiation: {
            advanced: 'Include cross-disciplinary connections',
            struggling: 'Provide a partially completed map'
          },
          tags: ['concept map', 'relationships', 'understanding'],
          subject: 'Science',
          gradeLevel: ['Middle School', 'High School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Problem-Based Learning Challenge',
          description: 'Apply concepts to solve a real-world problem',
          type: ActivityType.GROUP,
          setting: ActivitySetting.IN_CLASS,
          bloomsLevel: BloomsTaxonomyLevel.APPLY,
          estimatedDuration: 45,
          groupSize: 4,
          materials: ['Research materials', 'Presentation supplies'],
          instructions: 'Work in groups to solve the provided real-world problem using the concepts we\'ve learned.',
          assessmentStrategy: 'Rubric-based assessment of solution and presentation',
          differentiation: {
            advanced: 'Add complexity with additional constraints',
            struggling: 'Provide guiding questions and resources'
          },
          tags: ['problem-solving', 'application', 'real-world'],
          subject: 'Mathematics',
          gradeLevel: ['Middle School', 'High School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          title: 'Text Analysis',
          description: 'Analyze a text for themes, patterns, and literary devices',
          type: ActivityType.INDIVIDUAL,
          setting: ActivitySetting.HOMEWORK,
          bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
          estimatedDuration: 40,
          materials: ['Text', 'Annotation guide'],
          instructions: 'Analyze the provided text for themes, patterns, and literary devices. Annotate the text and write a short analysis.',
          assessmentStrategy: 'Rubric-based assessment of annotations and analysis',
          differentiation: {
            advanced: 'Compare with another text',
            struggling: 'Provide a structured annotation guide'
          },
          tags: ['analysis', 'literature', 'annotation'],
          subject: 'Language Arts',
          gradeLevel: ['High School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '5',
          title: 'Debate Preparation',
          description: 'Evaluate arguments and prepare for a structured debate',
          type: ActivityType.GROUP,
          setting: ActivitySetting.IN_CLASS,
          bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
          estimatedDuration: 60,
          groupSize: 4,
          materials: ['Research materials', 'Note-taking supplies'],
          instructions: 'Research both sides of the issue and prepare arguments and counter-arguments for a structured debate.',
          assessmentStrategy: 'Rubric-based assessment of arguments and debate performance',
          differentiation: {
            advanced: 'Address more complex ethical considerations',
            struggling: 'Provide argument templates and resources'
          },
          tags: ['debate', 'evaluation', 'argumentation'],
          subject: 'Social Studies',
          gradeLevel: ['Middle School', 'High School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '6',
          title: 'Creative Project',
          description: 'Create an original work that demonstrates understanding of concepts',
          type: ActivityType.INDIVIDUAL,
          setting: ActivitySetting.HYBRID,
          bloomsLevel: BloomsTaxonomyLevel.CREATE,
          estimatedDuration: 90,
          materials: ['Art supplies', 'Digital tools', 'Presentation materials'],
          instructions: 'Create an original work that demonstrates your understanding of the key concepts. This could be a story, artwork, model, video, or other creative product.',
          assessmentStrategy: 'Rubric-based assessment of creativity, accuracy, and presentation',
          differentiation: {
            advanced: 'Incorporate multiple concepts or disciplines',
            struggling: 'Provide templates or examples'
          },
          tags: ['creative', 'project', 'original'],
          subject: 'Art',
          gradeLevel: ['Elementary', 'Middle School', 'High School'],
          createdById: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];
      
      // Filter templates based on criteria
      let filteredTemplates = mockTemplates;
      
      if (criteria) {
        filteredTemplates = filterTemplates({
          ...criteria
        });
      }
      
      setTemplates(filteredTemplates);
    } catch (err) {
      setError('Failed to load activity templates');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filterTemplates]);
  
  // Create activity from template
  const createActivityFromTemplate = useCallback((
    templateId: string,
    customizations: {
      title?: string;
      description?: string;
      duration?: number;
      instructions?: string;
      learningOutcomeIds: string[];
      subjectId: string;
      topicId?: string;
      classId: string;
      rubricId?: string;
      lessonPlanId?: string;
    }
  ) => {
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      setError('Template not found');
      return;
    }
    
    // Create new activity from template
    const newActivity: Activity = {
      id: uuidv4(),
      title: customizations.title || template.title,
      description: customizations.description || template.description,
      type: template.type,
      setting: template.setting,
      bloomsLevel: template.bloomsLevel,
      learningOutcomeIds: customizations.learningOutcomeIds,
      duration: customizations.duration || template.estimatedDuration,
      groupSize: template.groupSize,
      materials: template.materials,
      instructions: customizations.instructions || template.instructions,
      rubricId: customizations.rubricId,
      lessonPlanId: customizations.lessonPlanId,
      subjectId: customizations.subjectId,
      topicId: customizations.topicId,
      classId: customizations.classId,
      createdById: '', // Will be set when saved
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentActivity(newActivity);
    return newActivity;
  }, [templates]);
  
  // Generate activity (mock implementation)
  const generateActivity = useCallback(async (request: ActivityGenerationRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get metadata for the Bloom's level
      const levelMetadata = BLOOMS_LEVEL_METADATA[request.bloomsLevel];
      
      // Create a new activity
      const newActivity: Activity = {
        id: uuidv4(),
        title: request.title || `${levelMetadata.name} Level Activity`,
        description: `An activity designed to develop ${levelMetadata.name.toLowerCase()} skills`,
        type: request.type || ActivityType.INDIVIDUAL,
        setting: request.setting || ActivitySetting.IN_CLASS,
        bloomsLevel: request.bloomsLevel,
        learningOutcomeIds: request.learningOutcomeIds,
        duration: request.duration || 30,
        groupSize: request.type === ActivityType.GROUP ? request.groupSize || 4 : undefined,
        materials: ['Handouts', 'Writing materials'],
        instructions: `This activity focuses on ${levelMetadata.description.toLowerCase()}.`,
        subjectId: 'subject-1', // This would be the actual subject ID
        topicId: request.topic ? 'topic-1' : undefined, // This would be the actual topic ID
        classId: 'class-1', // This would be the actual class ID
        createdById: '', // Will be set when saved
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentActivity(newActivity);
      return newActivity;
    } catch (err) {
      setError('Failed to generate activity');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get activity recommendations (mock implementation)
  const getActivityRecommendations = useCallback(async (
    studentId?: string,
    classId?: string,
    topicId?: string,
    bloomsLevel?: BloomsTaxonomyLevel
  ): Promise<ActivityRecommendation[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock recommendations
      const mockRecommendations: ActivityRecommendation[] = [
        {
          studentId,
          classId,
          topicId: topicId || 'topic-1',
          bloomsLevel: bloomsLevel || BloomsTaxonomyLevel.APPLY,
          activityType: ActivityType.INDIVIDUAL,
          setting: ActivitySetting.IN_CLASS,
          reason: 'Based on mastery gaps in application skills',
          suggestedTemplateIds: ['3'],
        },
        {
          studentId,
          classId,
          topicId: topicId || 'topic-1',
          bloomsLevel: bloomsLevel || BloomsTaxonomyLevel.ANALYZE,
          activityType: ActivityType.GROUP,
          setting: ActivitySetting.IN_CLASS,
          reason: 'To strengthen analytical thinking through collaboration',
          suggestedTemplateIds: ['4'],
        },
      ];
      
      return mockRecommendations;
    } catch (err) {
      setError('Failed to get activity recommendations');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Create activity sequence for lesson plan (mock implementation)
  const createActivitySequence = useCallback(async (
    lessonPlanId: string,
    learningOutcomeIds: string[],
    duration: number
  ): Promise<ActivitySequence | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock activity sequence
      const mockSequence: ActivitySequence = {
        lessonPlanId,
        activities: [
          {
            activityId: '1',
            orderIndex: 0,
            duration: 10,
            bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
            phase: 'introduction',
          },
          {
            activityId: '2',
            orderIndex: 1,
            duration: 15,
            bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
            phase: 'development',
          },
          {
            activityId: '3',
            orderIndex: 2,
            duration: 20,
            bloomsLevel: BloomsTaxonomyLevel.APPLY,
            phase: 'practice',
          },
          {
            activityId: '4',
            orderIndex: 3,
            duration: 15,
            bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
            phase: 'assessment',
          },
          {
            activityId: '5',
            orderIndex: 4,
            duration: 10,
            bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
            phase: 'conclusion',
          },
        ],
        totalDuration: 70,
        bloomsDistribution: {
          [BloomsTaxonomyLevel.REMEMBER]: 14,
          [BloomsTaxonomyLevel.UNDERSTAND]: 21,
          [BloomsTaxonomyLevel.APPLY]: 29,
          [BloomsTaxonomyLevel.ANALYZE]: 21,
          [BloomsTaxonomyLevel.EVALUATE]: 14,
          [BloomsTaxonomyLevel.CREATE]: 0,
        },
      };
      
      return mockSequence;
    } catch (err) {
      setError('Failed to create activity sequence');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    // State
    templates,
    currentActivity,
    isLoading,
    error,
    
    // Actions
    loadTemplates,
    filterTemplatesByLevel,
    filterTemplatesBySetting,
    filterTemplatesByType,
    filterTemplates,
    createActivityFromTemplate,
    generateActivity,
    getActivityRecommendations,
    createActivitySequence,
  };
}
