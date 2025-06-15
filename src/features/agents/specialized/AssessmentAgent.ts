import { AgentState, AgentTool, MemoryType } from '../core/types';
import { createPrintLayoutTool } from '../tools/printLayoutTool';
import { createQuestionGeneratorTool } from '../tools/questionGeneratorTool';
import { createTopicDataTool } from '../tools/topicDataTool';
import { v4 as uuidv4 } from 'uuid';

/**
 * Assessment types
 */
export enum AssessmentType {
  QUIZ = 'quiz',
  TEST = 'test',
  EXAM = 'exam',
  DIAGNOSTIC = 'diagnostic',
  FORMATIVE = 'formative',
  SUMMATIVE = 'summative',
}

/**
 * Assessment configuration
 */
export interface AssessmentConfig {
  title?: string;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  timeLimit?: number; // in minutes
  assessmentType?: AssessmentType;
  passingScore?: number; // percentage
  includeRubric?: boolean;
  standards?: string[];
  instructions?: string;
}

/**
 * Creates a specialized assessment agent with question generation capabilities
 */
export const createAssessmentAgent = (baseAgent: AgentState): AgentState => {
  // Add assessment-specific tools
  const assessmentTools: AgentTool[] = [
    createPrintLayoutTool(),
    createQuestionGeneratorTool(),
    createTopicDataTool(),
    {
      name: 'createAssessmentTemplate',
      description: 'Creates an assessment template based on the specified configuration',
      parameters: {
        config: 'Assessment configuration object',
      },
      execute: async (params: Record<string, any>): Promise<any> => {
        const config = params.config as AssessmentConfig;

        // Create a basic assessment template
        return {
          id: uuidv4(),
          title: config.title || `${config.assessmentType || 'Assessment'}: ${config.topic || 'Untitled'}`,
          subject: config.subject || 'General',
          topic: config.topic || 'General',
          gradeLevel: config.gradeLevel || 'K-12',
          difficultyLevel: config.difficultyLevel || 'medium',
          assessmentType: config.assessmentType || AssessmentType.QUIZ,
          timeLimit: config.timeLimit || 30,
          passingScore: config.passingScore || 70,
          sections: [
            {
              id: uuidv4(),
              title: 'Instructions',
              content: config.instructions || `Complete the following ${config.questionCount || 10} questions within ${config.timeLimit || 30} minutes.`,
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
            includeRubric: config.includeRubric !== undefined ? config.includeRubric : true,
            createdAt: Date.now(),
          },
        };
      },
    },
    {
      name: 'generateRubric',
      description: 'Generates a scoring rubric for an assessment',
      parameters: {
        questions: 'Array of questions with point values',
        passingScore: 'Passing score percentage (default: 70)',
        gradingScale: 'Optional custom grading scale',
      },
      execute: async (params: Record<string, any>): Promise<any> => {
        const { questions, passingScore = 70, gradingScale } = params;

        if (!Array.isArray(questions)) {
          throw new Error('Questions parameter must be an array');
        }

        // Calculate total possible points
        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        // Generate default grading scale if not provided
        const defaultGradingScale = [
          { grade: 'A', minPercentage: 90, description: 'Excellent understanding of all concepts' },
          { grade: 'B', minPercentage: 80, description: 'Good understanding of most concepts' },
          { grade: 'C', minPercentage: 70, description: 'Satisfactory understanding of key concepts' },
          { grade: 'D', minPercentage: 60, description: 'Limited understanding of concepts' },
          { grade: 'F', minPercentage: 0, description: 'Insufficient understanding of concepts' },
        ];

        // Generate scoring guide for each question
        const scoringGuide = questions.map((q, index) => ({
          questionNumber: index + 1,
          points: q.points || 1,
          fullCreditCriteria: `Complete and correct answer that demonstrates full understanding`,
          partialCreditCriteria: q.partialCreditCriteria || 'Partially correct answer with minor errors',
          noCreditCriteria: 'Incorrect answer or no response',
        }));

        return {
          totalPoints,
          passingPoints: Math.ceil(totalPoints * passingScore / 100),
          passingPercentage: passingScore,
          gradingScale: gradingScale || defaultGradingScale,
          scoringGuide,
          metadata: {
            questionCount: questions.length,
            createdAt: Date.now(),
          },
        };
      },
    },
    {
      name: 'analyzeAssessmentDifficulty',
      description: 'Analyzes the difficulty distribution of an assessment',
      parameters: {
        questions: 'Array of questions with difficulty levels',
      },
      execute: async (params: Record<string, any>): Promise<any> => {
        const { questions } = params;

        if (!Array.isArray(questions)) {
          throw new Error('Questions parameter must be an array');
        }

        // Count questions by difficulty
        const difficultyCount = {
          easy: 0,
          medium: 0,
          hard: 0,
          unknown: 0,
        };

        questions.forEach(q => {
          const difficulty = q.difficulty?.toLowerCase() || 'unknown';
          if (difficulty in difficultyCount) {
            difficultyCount[difficulty as keyof typeof difficultyCount]++;
          } else {
            difficultyCount.unknown++;
          }
        });

        // Calculate percentages
        const total = questions.length;
        const difficultyPercentage = {
          easy: Math.round((difficultyCount.easy / total) * 100),
          medium: Math.round((difficultyCount.medium / total) * 100),
          hard: Math.round((difficultyCount.hard / total) * 100),
          unknown: Math.round((difficultyCount.unknown / total) * 100),
        };

        // Determine if the distribution is balanced
        const isBalanced = (
          difficultyPercentage.easy >= 20 &&
          difficultyPercentage.medium >= 30 &&
          difficultyPercentage.hard >= 10 &&
          difficultyPercentage.hard <= 40
        );

        return {
          difficultyCount,
          difficultyPercentage,
          isBalanced,
          recommendations: isBalanced
            ? ['The assessment has a good balance of difficulty levels']
            : generateBalanceRecommendations(difficultyPercentage),
          metadata: {
            questionCount: total,
            createdAt: Date.now(),
          },
        };
      },
    },
  ];

  // Add assessment-specific system prompt enhancement
  const assessmentSystemPrompt = `
    You are a specialized assessment creation agent designed to create high-quality educational assessments.
    Focus on creating assessments that are:
    1. Aligned with educational standards and learning objectives
    2. Appropriate for the target grade level
    3. Balanced in terms of difficulty
    4. Clear and unambiguous in instructions and questions
    5. Comprehensive in coverage of the topic

    You have access to tools for:
    - Generating various question types
    - Optimizing print layout
    - Retrieving topic data
    - Creating assessment templates
    - Generating scoring rubrics
    - Analyzing assessment difficulty

    When creating assessments:
    1. First understand the subject, topic, and grade level
    2. Use the createAssessmentTemplate tool to create a basic structure
    3. Use the getTopicData tool to retrieve relevant educational standards and content
    4. Use the generateQuestions tool to create appropriate questions
    5. Use the analyzeAssessmentDifficulty tool to ensure balanced difficulty
    6. Use the generateRubric tool to create a scoring guide
    7. Use the optimizePrintLayout tool to format the assessment for printing

    ${baseAgent.metadata.systemPrompt || ''}
  `;

  // Add initial memories
  const initialMemories = [
    {
      type: MemoryType.LONG_TERM,
      key: 'assessment-types',
      value: {
        quiz: {
          description: 'Short assessment with fewer questions, typically used for formative assessment',
          questionCount: '5-15',
          timeLimit: '10-20 minutes',
          questionTypes: ['multiple-choice', 'true-false', 'short-answer'],
        },
        test: {
          description: 'Medium-length assessment covering specific topics',
          questionCount: '15-30',
          timeLimit: '30-60 minutes',
          questionTypes: ['multiple-choice', 'short-answer', 'essay', 'matching'],
        },
        exam: {
          description: 'Comprehensive assessment covering multiple topics or units',
          questionCount: '30-100',
          timeLimit: '60-180 minutes',
          questionTypes: ['multiple-choice', 'short-answer', 'essay', 'problem-solving'],
        },
        diagnostic: {
          description: 'Assessment to identify knowledge gaps and learning needs',
          questionCount: '20-40',
          timeLimit: '30-60 minutes',
          questionTypes: ['multiple-choice', 'short-answer', 'skill demonstration'],
        },
        formative: {
          description: 'Ongoing assessment to monitor learning progress',
          questionCount: '5-15',
          timeLimit: '10-30 minutes',
          questionTypes: ['multiple-choice', 'short-answer', 'reflection'],
        },
        summative: {
          description: 'Final assessment to evaluate learning outcomes',
          questionCount: '30-60',
          timeLimit: '60-120 minutes',
          questionTypes: ['multiple-choice', 'essay', 'project', 'portfolio'],
        },
      },
      metadata: {
        category: 'assessment-types',
        importance: 0.8,
      },
      timestamp: Date.now(),
    },
    {
      type: MemoryType.LONG_TERM,
      key: 'assessment-best-practices',
      value: [
        'Align questions with learning objectives',
        'Include a mix of question types and difficulty levels',
        'Provide clear instructions and expectations',
        'Use consistent formatting and question structure',
        'Include appropriate time limits for completion',
        'Ensure questions are free from bias and cultural assumptions',
        'Include a clear scoring rubric',
        'Provide space for student identification and date',
        'Number all questions sequentially',
        'Group similar question types together',
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
    tools: [...baseAgent.tools, ...assessmentTools],
    memory: [...baseAgent.memory, ...initialMemories],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: assessmentSystemPrompt,
      specialization: 'assessment',
      capabilities: [
        'question generation',
        'print layout optimization',
        'answer key creation',
        'rubric generation',
        'difficulty balancing',
        'topic data retrieval',
        'assessment template creation',
      ],
    },
  };
};

/**
 * Generates recommendations for balancing assessment difficulty
 */
function generateBalanceRecommendations(percentages: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (percentages.easy < 20) {
    recommendations.push('Add more easy questions to build confidence and assess basic knowledge');
  } else if (percentages.easy > 40) {
    recommendations.push('Reduce the number of easy questions to increase assessment rigor');
  }

  if (percentages.medium < 30) {
    recommendations.push('Add more medium difficulty questions to assess core understanding');
  } else if (percentages.medium > 60) {
    recommendations.push('Reduce the number of medium difficulty questions for better differentiation');
  }

  if (percentages.hard < 10) {
    recommendations.push('Add more challenging questions to assess higher-order thinking');
  } else if (percentages.hard > 40) {
    recommendations.push('Reduce the number of difficult questions to improve accessibility');
  }

  if (percentages.unknown > 0) {
    recommendations.push('Specify difficulty levels for all questions');
  }

  return recommendations;
}
