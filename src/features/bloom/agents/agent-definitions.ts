/**
 * Bloom's Taxonomy Agent Definitions
 *
 * This file defines agents for Bloom's Taxonomy, rubrics, and topic mastery
 * that will be registered with the central agent orchestration system.
 */

// Import the agent handlers
import {
  handleBloomsClassification,
  handleRubricGeneration,
  handleActivityGeneration,
  handleMasteryAnalysis
} from './handlers';

// Define our own AgentDefinition type since it's not exported from the core types
interface AgentDefinition {
  type: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  promptTemplate: string;
  handler?: Function;
}
import {
  BloomsTaxonomyLevel,
  RubricType,
  BloomsClassificationResult,
  Rubric,
  RubricGenerationRequest,
  ActivityGenerationRequest,
  Activity
} from '../types';

/**
 * Bloom's Taxonomy Classification Agent
 *
 * This agent classifies content according to Bloom's Taxonomy levels
 * and provides suggestions for improvement.
 */
export const bloomsClassificationAgentDefinition: AgentDefinition = {
  type: 'blooms-classification',
  name: 'Bloom\'s Taxonomy Classification',
  description: 'Classifies content according to Bloom\'s Taxonomy levels and provides suggestions for improvement',
  handler: handleBloomsClassification,
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content to classify'
      },
      contentType: {
        type: 'string',
        enum: ['learning_outcome', 'question', 'activity', 'assessment'],
        description: 'The type of content being classified'
      },
      targetLevel: {
        type: 'string',
        enum: Object.values(BloomsTaxonomyLevel),
        description: 'The target Bloom\'s level for the content'
      }
    },
    required: ['content']
  },
  outputSchema: {
    type: 'object',
    properties: {
      classification: {
        type: 'object',
        properties: {
          bloomsLevel: {
            type: 'string',
            enum: Object.values(BloomsTaxonomyLevel)
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1
          },
          suggestedVerbs: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          suggestedImprovements: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      suggestions: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      improvedContent: {
        type: 'string'
      }
    }
  },
  promptTemplate: `
You are an expert in educational assessment and Bloom's Taxonomy. Your task is to analyze the following {{contentType}} and classify it according to Bloom's Taxonomy cognitive levels.

Bloom's Taxonomy Levels:
- Remember: Recall facts and basic concepts. Action verbs: Define, List, Recall, Identify, Name, Recognize, State.
- Understand: Explain ideas or concepts. Action verbs: Explain, Interpret, Summarize, Classify, Compare, Contrast, Discuss.
- Apply: Use information in new situations. Action verbs: Apply, Calculate, Demonstrate, Develop, Implement, Solve, Use.
- Analyze: Draw connections among ideas. Action verbs: Analyze, Categorize, Differentiate, Examine, Investigate, Organize, Outline.
- Evaluate: Justify a stand or decision. Action verbs: Assess, Critique, Evaluate, Judge, Justify, Recommend, Support.
- Create: Produce new or original work. Action verbs: Create, Design, Develop, Compose, Construct, Formulate, Generate.

Content to analyze:
"""
{{content}}
"""

Please provide a detailed analysis including:
1. The Bloom's Taxonomy level that best matches this content
2. Your confidence in this classification (0.0 to 1.0)
3. Key words or phrases that indicate this level
4. Suggested action verbs that would be appropriate for this level
5. Suggestions for improving the content

{{#if targetLevel}}
The target Bloom's level for this content is {{targetLevel}}. If the content doesn't match this level, please provide specific suggestions to align it with the {{targetLevel}} level.
{{/if}}

Format your response as JSON with the following structure:
{
  "bloomsLevel": "LEVEL_NAME",
  "confidence": 0.0 to 1.0,
  "indicators": ["list", "of", "indicators"],
  "suggestedVerbs": ["list", "of", "verbs"],
  "suggestions": ["list", "of", "suggestions"],
  "improvedContent": "improved version of the content"
}
`
};

/**
 * Rubric Generation Agent
 *
 * This agent generates rubrics aligned with Bloom's Taxonomy levels
 * based on learning outcomes and assessment criteria.
 */
export const rubricGenerationAgentDefinition: AgentDefinition = {
  type: 'rubric-generation',
  name: 'Rubric Generation',
  description: 'Generates rubrics aligned with Bloom\'s Taxonomy levels based on learning outcomes and assessment criteria',
  handler: handleRubricGeneration,
  inputSchema: {
    type: 'object',
    properties: {
      request: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: Object.values(RubricType)
          },
          bloomsLevels: {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            }
          },
          learningOutcomeIds: {
            type: 'array',
            items: { type: 'string' }
          },
          maxScore: { type: 'number' },
          criteriaCount: { type: 'number' },
          performanceLevelCount: { type: 'number' },
          subject: { type: 'string' },
          topic: { type: 'string' },
          gradeLevel: { type: 'string' }
        },
        required: ['title', 'type', 'bloomsLevels', 'learningOutcomeIds', 'maxScore']
      },
      learningOutcomes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            statement: { type: 'string' },
            bloomsLevel: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            }
          }
        }
      },
      existingRubrics: {
        type: 'array',
        items: {
          type: 'object',
          // Simplified Rubric schema for input
        }
      }
    },
    required: ['request', 'learningOutcomes']
  },
  outputSchema: {
    type: 'object',
    properties: {
      rubric: {
        type: 'object',
        // Simplified Rubric schema for output
      },
      explanation: { type: 'string' }
    }
  },
  promptTemplate: `
You are an expert in educational assessment and rubric design. Your task is to generate a high-quality rubric aligned with Bloom's Taxonomy levels based on the following specifications.

Rubric Request:
- Title: {{request.title}}
- Type: {{request.type}}
- Maximum Score: {{request.maxScore}}
- Bloom's Levels: {{#each request.bloomsLevels}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Subject: {{request.subject}}
- Topic: {{request.topic}}
- Grade Level: {{request.gradeLevel}}

Learning Outcomes:
{{#each learningOutcomes}}
- ID: {{this.id}}, Level: {{this.bloomsLevel}}, Statement: {{this.statement}}
{{/each}}

{{#if existingRubrics}}
Here are some existing rubrics for reference:
{{#each existingRubrics}}
Rubric: {{this.title}}
Type: {{this.type}}
Criteria:
{{#each this.criteria}}
- {{this.name}} ({{this.bloomsLevel}}): {{this.description}}
{{/each}}
Performance Levels:
{{#each this.performanceLevels}}
- {{this.name}}: {{this.description}} ({{this.scoreRange.min}}-{{this.scoreRange.max}})
{{/each}}
{{/each}}
{{/if}}

Please generate a comprehensive rubric with the following:
1. A clear title and description
2. {{request.criteriaCount}} criteria aligned with the specified Bloom's levels
3. {{request.performanceLevelCount}} performance levels with clear descriptions
4. Appropriate score ranges for each performance level
5. Alignment between criteria and learning outcomes

For each criterion:
- Provide a name that clearly indicates what is being assessed
- Write a detailed description that explains what students should demonstrate
- Assign a Bloom's Taxonomy level
- Create descriptions for each performance level that are specific and measurable
- Assign appropriate scores for each performance level

Format your response as JSON with the following structure:
{
  "title": "Rubric Title",
  "description": "Rubric Description",
  "type": "{{request.type}}",
  "maxScore": {{request.maxScore}},
  "criteria": [
    {
      "name": "Criterion Name",
      "description": "Criterion Description",
      "bloomsLevel": "BLOOM_LEVEL",
      "weight": 1.0,
      "learningOutcomeIds": ["outcome_id1", "outcome_id2"],
      "performanceLevels": [
        {
          "levelName": "Level Name",
          "description": "Level Description",
          "score": 0
        }
      ]
    }
  ],
  "performanceLevels": [
    {
      "name": "Level Name",
      "description": "Level Description",
      "minScore": 0,
      "maxScore": 0
    }
  ]
}
`
};

/**
 * Activity Generation Agent
 *
 * This agent generates activities aligned with Bloom's Taxonomy levels
 * based on learning outcomes.
 */
export const activityGenerationAgentDefinition: AgentDefinition = {
  type: 'activity-generation',
  name: 'Activity Generation',
  description: 'Generates activities aligned with Bloom\'s Taxonomy levels based on learning outcomes',
  handler: handleActivityGeneration,
  inputSchema: {
    type: 'object',
    properties: {
      request: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          bloomsLevel: {
            type: 'string',
            enum: Object.values(BloomsTaxonomyLevel)
          },
          learningOutcomeIds: {
            type: 'array',
            items: { type: 'string' }
          },
          type: { type: 'string' },
          setting: { type: 'string' },
          duration: { type: 'number' },
          groupSize: { type: 'number' },
          subject: { type: 'string' },
          topic: { type: 'string' },
          gradeLevel: { type: 'string' },
          includeRubric: { type: 'boolean' }
        },
        required: ['bloomsLevel', 'learningOutcomeIds']
      },
      learningOutcomes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            statement: { type: 'string' },
            bloomsLevel: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            }
          }
        }
      },
      existingActivities: {
        type: 'array',
        items: {
          type: 'object',
          // Simplified Activity schema for input
        }
      }
    },
    required: ['request', 'learningOutcomes']
  },
  outputSchema: {
    type: 'object',
    properties: {
      activity: {
        type: 'object',
        // Simplified Activity schema for output
      },
      rubric: {
        type: 'object',
        // Simplified Rubric schema for output
      },
      explanation: { type: 'string' }
    }
  },
  promptTemplate: `
You are an expert in educational design and Bloom's Taxonomy. Your task is to generate a high-quality learning activity aligned with Bloom's Taxonomy levels based on the following specifications.

Activity Request:
- Title: {{request.title}}
- Bloom's Level: {{request.bloomsLevel}}
- Type: {{request.type}}
- Setting: {{request.setting}}
- Duration: {{request.duration}} minutes
- Group Size: {{request.groupSize}}
- Subject: {{request.subject}}
- Topic: {{request.topic}}
- Grade Level: {{request.gradeLevel}}
- Include Rubric: {{request.includeRubric}}

Learning Outcomes:
{{#each learningOutcomes}}
- ID: {{this.id}}, Level: {{this.bloomsLevel}}, Statement: {{this.statement}}
{{/each}}

{{#if existingActivities}}
Here are some existing activities for reference:
{{#each existingActivities}}
Activity: {{this.title}}
Type: {{this.type}}
Setting: {{this.setting}}
Bloom's Level: {{this.bloomsLevel}}
Instructions: {{this.instructions}}
{{/each}}
{{/if}}

Please generate a comprehensive activity with the following:
1. A clear title and description
2. Detailed instructions for implementation
3. Required materials
4. Clear alignment with the specified Bloom's level
5. Connection to the learning outcomes
6. Assessment strategy
7. Differentiation options for advanced and struggling students

{{#if request.includeRubric}}
Also generate a simple rubric for assessing this activity with criteria aligned to the Bloom's level.
{{/if}}

Format your response as JSON with the following structure:
{
  "activity": {
    "title": "Activity Title",
    "description": "Activity Description",
    "type": "ACTIVITY_TYPE",
    "setting": "ACTIVITY_SETTING",
    "bloomsLevel": "{{request.bloomsLevel}}",
    "duration": 30,
    "groupSize": 4,
    "materials": ["Material 1", "Material 2"],
    "instructions": "Detailed instructions",
    "assessmentStrategy": "Assessment strategy",
    "differentiation": {
      "advanced": "For advanced students",
      "struggling": "For struggling students"
    },
    "learningOutcomeIds": ["outcome_id1", "outcome_id2"]
  }{{#if request.includeRubric}},
  "rubric": {
    "title": "Rubric Title",
    "criteria": [
      {
        "name": "Criterion Name",
        "description": "Criterion Description",
        "bloomsLevel": "BLOOM_LEVEL",
        "performanceLevels": [
          {
            "name": "Level Name",
            "description": "Level Description",
            "score": 0
          }
        ]
      }
    ]
  }{{/if}}
}
`
};

/**
 * Topic Mastery Analysis Agent
 *
 * This agent analyzes topic mastery data and provides recommendations
 * for improving student performance across Bloom's Taxonomy levels.
 */
export const topicMasteryAnalysisAgentDefinition: AgentDefinition = {
  type: 'topic-mastery-analysis',
  name: 'Topic Mastery Analysis',
  description: 'Analyzes topic mastery data and provides recommendations for improving student performance',
  handler: handleMasteryAnalysis,
  inputSchema: {
    type: 'object',
    properties: {
      studentId: { type: 'string' },
      studentName: { type: 'string' },
      topicId: { type: 'string' },
      topicName: { type: 'string' },
      subjectId: { type: 'string' },
      subjectName: { type: 'string' },
      masteryData: {
        type: 'object',
        properties: {
          overallMastery: { type: 'number' },
          bloomsLevels: {
            type: 'object',
            // Properties for each Bloom's level
          },
          assessmentHistory: {
            type: 'array',
            items: {
              type: 'object',
              // Assessment result data
            }
          }
        }
      },
      learningOutcomes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            statement: { type: 'string' },
            bloomsLevel: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            }
          }
        }
      }
    },
    required: ['studentId', 'topicId', 'masteryData']
  },
  outputSchema: {
    type: 'object',
    properties: {
      analysis: {
        type: 'object',
        properties: {
          strengths: {
            type: 'array',
            items: { type: 'string' }
          },
          weaknesses: {
            type: 'array',
            items: { type: 'string' }
          },
          bloomsLevelAnalysis: {
            type: 'object',
            // Analysis for each Bloom's level
          }
        }
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            bloomsLevel: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            },
            priority: { type: 'string' }
          }
        }
      },
      suggestedActivities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            bloomsLevel: {
              type: 'string',
              enum: Object.values(BloomsTaxonomyLevel)
            },
            type: { type: 'string' }
          }
        }
      }
    }
  },
  promptTemplate: `
You are an expert in educational assessment and Bloom's Taxonomy. Your task is to analyze the topic mastery data for a student and provide recommendations for improving their performance.

Student: {{studentName}} (ID: {{studentId}})
Topic: {{topicName}} (ID: {{topicId}})
Subject: {{subjectName}} (ID: {{subjectId}})

Mastery Data:
- Overall Mastery: {{masteryData.overallMastery}}%
- Remember Level: {{masteryData.bloomsLevels.REMEMBER}}%
- Understand Level: {{masteryData.bloomsLevels.UNDERSTAND}}%
- Apply Level: {{masteryData.bloomsLevels.APPLY}}%
- Analyze Level: {{masteryData.bloomsLevels.ANALYZE}}%
- Evaluate Level: {{masteryData.bloomsLevels.EVALUATE}}%
- Create Level: {{masteryData.bloomsLevels.CREATE}}%

Learning Outcomes:
{{#each learningOutcomes}}
- ID: {{this.id}}, Level: {{this.bloomsLevel}}, Statement: {{this.statement}}
{{/each}}

Assessment History:
{{#each masteryData.assessmentHistory}}
- Date: {{this.completedAt}}, Score: {{this.percentage}}%
{{/each}}

Please provide a detailed analysis of the student's mastery across Bloom's Taxonomy levels, including:
1. Strengths and weaknesses
2. Analysis of performance at each Bloom's level
3. Specific recommendations for improvement
4. Suggested activities to address gaps in mastery

Format your response as JSON with the following structure:
{
  "analysis": {
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "bloomsLevelAnalysis": {
      "REMEMBER": "Analysis of remember level",
      "UNDERSTAND": "Analysis of understand level",
      "APPLY": "Analysis of apply level",
      "ANALYZE": "Analysis of analyze level",
      "EVALUATE": "Analysis of evaluate level",
      "CREATE": "Analysis of create level"
    }
  },
  "recommendations": [
    {
      "type": "practice",
      "description": "Recommendation description",
      "bloomsLevel": "BLOOM_LEVEL",
      "priority": "high"
    }
  ],
  "suggestedActivities": [
    {
      "title": "Activity Title",
      "description": "Activity Description",
      "bloomsLevel": "BLOOM_LEVEL",
      "type": "ACTIVITY_TYPE"
    }
  ]
}
`
};

/**
 * Export all agent definitions
 */
export const bloomsAgentDefinitions = [
  bloomsClassificationAgentDefinition,
  rubricGenerationAgentDefinition,
  activityGenerationAgentDefinition,
  topicMasteryAnalysisAgentDefinition
];
