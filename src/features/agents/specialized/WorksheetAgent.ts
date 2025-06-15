import { AgentState, AgentTool, MemoryType } from '../core/types';
import { createPrintLayoutTool } from '../tools/printLayoutTool';
import { createQuestionGeneratorTool } from '../tools/questionGeneratorTool';
import { createTopicDataTool } from '../tools/topicDataTool';
import { v4 as uuidv4 } from 'uuid';

/**
 * Worksheet template types
 */
export enum WorksheetTemplateType {
  STANDARD = 'standard',
  PRACTICE = 'practice',
  ASSESSMENT = 'assessment',
  REVIEW = 'review',
  HOMEWORK = 'homework',
}

/**
 * Worksheet configuration
 */
export interface WorksheetConfig {
  title?: string;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  includeAnswerKey?: boolean;
  templateType?: WorksheetTemplateType;
  standards?: string[];
  instructions?: string;
}

/**
 * Creates a specialized worksheet agent with print layout optimization
 */
export const createWorksheetAgent = (baseAgent: AgentState): AgentState => {
  // Add worksheet-specific tools
  const worksheetTools: AgentTool[] = [
    createPrintLayoutTool(),
    createQuestionGeneratorTool(),
    createTopicDataTool(),
    {
      name: 'createWorksheetTemplate',
      description: 'Creates a worksheet template based on the specified configuration',
      parameters: {
        config: 'Worksheet configuration object',
      },
      execute: async (params: Record<string, any>): Promise<any> => {
        const config = params.config as WorksheetConfig;

        // Create a basic worksheet template
        return {
          id: uuidv4(),
          title: config.title || `Worksheet: ${config.topic || 'Untitled'}`,
          subject: config.subject || 'General',
          topic: config.topic || 'General',
          gradeLevel: config.gradeLevel || 'K-12',
          difficultyLevel: config.difficultyLevel || 'medium',
          templateType: config.templateType || WorksheetTemplateType.STANDARD,
          sections: [
            {
              id: uuidv4(),
              title: 'Instructions',
              content: config.instructions || `Complete the following ${config.questionCount || 10} questions.`,
              type: 'instructions',
            },
            {
              id: uuidv4(),
              title: 'Questions',
              type: 'questions',
              placeholder: `[Questions will be generated here. Expected count: ${config.questionCount || 10}]`,
            },
          ],
          metadata: {
            standards: config.standards || [],
            includeAnswerKey: config.includeAnswerKey !== undefined ? config.includeAnswerKey : true,
            createdAt: Date.now(),
          },
        };
      },
    },
    {
      name: 'generateAnswerKey',
      description: 'Generates an answer key for a worksheet',
      parameters: {
        questions: 'Array of questions with answers',
        format: 'Format of the answer key (simple, detailed)',
      },
      execute: async (params: Record<string, any>): Promise<any> => {
        const { questions, format = 'simple' } = params;

        if (!Array.isArray(questions)) {
          throw new Error('Questions parameter must be an array');
        }

        // Generate answer key based on format
        if (format === 'simple') {
          return {
            answerKey: questions.map((q, index) => ({
              questionNumber: index + 1,
              answer: q.answer,
            })),
            format: 'simple',
          };
        } else {
          return {
            answerKey: questions.map((q, index) => ({
              questionNumber: index + 1,
              answer: q.answer,
              explanation: q.explanation || 'No explanation provided',
            })),
            format: 'detailed',
          };
        }
      },
    },
  ];

  // Add worksheet-specific system prompt enhancement
  const worksheetSystemPrompt = `
    You are a specialized worksheet creation agent designed to create high-quality educational worksheets.
    Focus on creating content that is:
    1. Print-friendly with proper spacing and layout
    2. Age-appropriate for the target grade level
    3. Aligned with educational standards
    4. Engaging and visually appealing
    5. Structured with clear sections and instructions

    You have access to tools for:
    - Optimizing print layout
    - Generating various question types
    - Retrieving topic data
    - Creating worksheet templates
    - Generating answer keys

    When creating worksheets:
    1. First understand the subject, topic, and grade level
    2. Use the createWorksheetTemplate tool to create a basic structure
    3. Use the getTopicData tool to retrieve relevant educational standards and content
    4. Use the generateQuestions tool to create appropriate questions
    5. Use the optimizePrintLayout tool to format the worksheet for printing
    6. If requested, use the generateAnswerKey tool to create an answer key

    ${baseAgent.metadata.systemPrompt || ''}
  `;

  // Add initial memories
  const initialMemories = [
    {
      type: MemoryType.LONG_TERM,
      key: 'worksheet-templates',
      value: {
        standard: {
          sections: ['Instructions', 'Questions'],
          questionTypes: ['multiple-choice', 'fill-in-blank', 'short-answer'],
        },
        practice: {
          sections: ['Instructions', 'Examples', 'Practice Questions'],
          questionTypes: ['multiple-choice', 'fill-in-blank', 'matching'],
        },
        assessment: {
          sections: ['Instructions', 'Assessment Questions'],
          questionTypes: ['multiple-choice', 'short-answer', 'essay'],
        },
        review: {
          sections: ['Instructions', 'Key Concepts', 'Review Questions'],
          questionTypes: ['multiple-choice', 'true-false', 'matching'],
        },
        homework: {
          sections: ['Instructions', 'Homework Questions', 'Additional Resources'],
          questionTypes: ['multiple-choice', 'fill-in-blank', 'problem-solving'],
        },
      },
      metadata: {
        category: 'templates',
        importance: 0.8,
      },
      timestamp: Date.now(),
    },
    {
      type: MemoryType.LONG_TERM,
      key: 'worksheet-best-practices',
      value: [
        'Include clear instructions at the top of the worksheet',
        'Use consistent formatting throughout the worksheet',
        'Include adequate space for student responses',
        'Group similar question types together',
        'Include a mix of question types for varied engagement',
        'Ensure questions progress from easier to more challenging',
        'Include a header with title, subject, and space for student name',
        'Number all questions sequentially',
        'Use appropriate font size (12pt minimum for print)',
        'Include page numbers for multi-page worksheets',
      ],
      metadata: {
        category: 'best-practices',
        importance: 0.9,
      },
      timestamp: Date.now(),
    },
  ];

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...worksheetTools],
    memory: [...baseAgent.memory, ...initialMemories],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: worksheetSystemPrompt,
      specialization: 'worksheet',
      capabilities: [
        'print layout optimization',
        'question generation',
        'answer key creation',
        'educational standards alignment',
        'template creation',
        'topic data retrieval',
      ],
    },
  };
};
