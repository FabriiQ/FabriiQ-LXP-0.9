import { BaseActivity, generateId } from './base';
import { EssayRubric } from '../../../question-bank/models/types';

export interface EssayActivity extends BaseActivity {
  activityType: 'essay';
  prompt: string;
  wordCountMin?: number;
  wordCountMax?: number;
  rubric?: EssayRubric;
  // Add any other essay-specific properties here if needed in the future
}

export function createDefaultEssayActivity(): EssayActivity {
  const defaultRubric: EssayRubric = {
    criteria: [
      {
        id: generateId(),
        name: 'Content',
        description: 'Quality and relevance of content',
        points: 10,
        levels: [
          { id: generateId(), name: 'Excellent', description: 'Comprehensive and insightful', points: 10 },
          { id: generateId(), name: 'Good', description: 'Relevant and well-developed', points: 8 },
          { id: generateId(), name: 'Needs Improvement', description: 'Limited relevance or development', points: 4 },
        ],
      },
      {
        id: generateId(),
        name: 'Organization',
        description: 'Structure and flow',
        points: 5,
        levels: [
          { id: generateId(), name: 'Excellent', description: 'Clear and logical structure', points: 5 },
          { id: generateId(), name: 'Good', description: 'Mostly clear structure', points: 3 },
          { id: generateId(), name: 'Needs Improvement', description: 'Poorly organized', points: 1 },
        ],
      },
    ],
    totalPoints: 15,
  };

  return {
    id: generateId(),
    title: 'New Essay Activity',
    description: 'Students will write an essay based on the provided prompt.',
    instructions: 'Please read the prompt carefully and write a well-structured essay. Pay attention to the rubric for grading criteria.',
    activityType: 'essay',
    prompt: 'Discuss the impact of technology on modern society.',
    wordCountMin: 300,
    wordCountMax: 800,
    rubric: defaultRubric,
    isGradable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      aiGenerated: false,
      difficulty: 'medium',
      estimatedTime: 60, // 60 minutes
      learningObjectives: ['Develop critical thinking skills.', 'Practice written communication.'],
    },
  };
}
