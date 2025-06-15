/**
 * Assessment Analytics Service for Bloom's Taxonomy
 * 
 * This service provides methods for generating analytics data related to assessments and Bloom's Taxonomy.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { 
  BloomsTaxonomyLevel,
  BloomsDistribution
} from '../../types/bloom-taxonomy';
import {
  AssessmentBloomsPerformance,
  QuestionBloomsPerformance,
  AssessmentComparison
} from '../../types/analytics';
import { DEFAULT_BLOOMS_DISTRIBUTION } from '../../constants/bloom-levels';

export class AssessmentAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get assessment performance data by Bloom's Taxonomy levels
   * @param assessmentId Assessment ID
   * @returns Assessment performance data
   */
  async getAssessmentPerformance(assessmentId: string): Promise<AssessmentBloomsPerformance> {
    try {
      // Get assessment details
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          questions: {
            select: {
              id: true,
              text: true,
              bloomsLevel: true,
              responses: {
                select: {
                  id: true,
                  isCorrect: true,
                  attemptCount: true,
                  timeSpent: true
                }
              }
            }
          },
          results: {
            select: {
              id: true,
              score: true,
              studentId: true
            }
          }
        }
      });

      if (!assessment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found'
        });
      }

      // Calculate question performance
      const questionPerformance: QuestionBloomsPerformance[] = assessment.questions.map(question => {
        const totalResponses = question.responses.length;
        const correctResponses = question.responses.filter(r => r.isCorrect).length;
        const correctRate = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
        
        const totalAttempts = question.responses.reduce((sum, r) => sum + r.attemptCount, 0);
        const averageAttempts = totalResponses > 0 ? totalAttempts / totalResponses : 0;
        
        const totalTime = question.responses.reduce((sum, r) => sum + r.timeSpent, 0);
        const averageTime = totalResponses > 0 ? totalTime / totalResponses : 0;
        
        return {
          questionId: question.id,
          questionText: question.text,
          bloomsLevel: question.bloomsLevel as BloomsTaxonomyLevel || BloomsTaxonomyLevel.REMEMBER,
          correctRate,
          averageAttempts,
          averageTime
        };
      });

      // Calculate performance by Bloom's level
      const performanceByLevel: Record<BloomsTaxonomyLevel, number> = {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0
      };

      // Count questions by level
      const questionCountByLevel: Record<BloomsTaxonomyLevel, number> = {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0
      };

      // Calculate performance by level
      questionPerformance.forEach(question => {
        performanceByLevel[question.bloomsLevel] += question.correctRate;
        questionCountByLevel[question.bloomsLevel]++;
      });

      // Calculate average performance by level
      Object.keys(performanceByLevel).forEach(level => {
        const bloomsLevel = level as BloomsTaxonomyLevel;
        if (questionCountByLevel[bloomsLevel] > 0) {
          performanceByLevel[bloomsLevel] = Math.round(
            performanceByLevel[bloomsLevel] / questionCountByLevel[bloomsLevel]
          );
        }
      });

      // Calculate distribution
      const distribution: BloomsDistribution = { ...DEFAULT_BLOOMS_DISTRIBUTION };
      
      // Calculate distribution based on question count
      const totalQuestions = assessment.questions.length;
      if (totalQuestions > 0) {
        Object.keys(distribution).forEach(level => {
          const bloomsLevel = level as BloomsTaxonomyLevel;
          distribution[bloomsLevel] = Math.round(
            (questionCountByLevel[bloomsLevel] / totalQuestions) * 100
          );
        });
      }

      // Calculate average score
      const totalScore = assessment.results.reduce((sum, result) => sum + result.score, 0);
      const averageScore = assessment.results.length > 0 ? 
        Math.round(totalScore / assessment.results.length) : 0;

      return {
        assessmentId,
        assessmentName: assessment.title || 'Unknown Assessment',
        averageScore,
        distribution,
        performanceByLevel,
        studentCount: assessment.results.length,
        questionCount: assessment.questions.length,
        questionPerformance
      };
    } catch (error) {
      console.error('Error getting assessment performance:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get assessment performance'
      });
    }
  }

  /**
   * Compare multiple assessments
   * @param assessmentIds Array of assessment IDs
   * @returns Assessment comparison data
   */
  async compareAssessments(assessmentIds: string[]): Promise<AssessmentComparison> {
    try {
      if (!assessmentIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No assessment IDs provided'
        });
      }

      // Get assessments
      const assessments = await this.prisma.assessment.findMany({
        where: {
          id: { in: assessmentIds }
        },
        include: {
          questions: {
            select: {
              id: true,
              bloomsLevel: true,
              topicId: true
            }
          },
          results: {
            select: {
              id: true,
              score: true,
              studentId: true
            }
          }
        }
      });

      if (assessments.length !== assessmentIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more assessments not found'
        });
      }

      // Initialize comparison data
      const assessmentNames = assessments.map(a => a.title || 'Unknown Assessment');
      
      const bloomsLevelComparison: Record<BloomsTaxonomyLevel, number[]> = {
        [BloomsTaxonomyLevel.REMEMBER]: [],
        [BloomsTaxonomyLevel.UNDERSTAND]: [],
        [BloomsTaxonomyLevel.APPLY]: [],
        [BloomsTaxonomyLevel.ANALYZE]: [],
        [BloomsTaxonomyLevel.EVALUATE]: [],
        [BloomsTaxonomyLevel.CREATE]: []
      };
      
      const overallScoreComparison: number[] = [];
      const studentProgressionMap: Record<string, number[]> = {};
      const topicProgressionMap: Record<string, number[]> = {};

      // Process each assessment
      for (const assessment of assessments) {
        // Calculate overall score
        const totalScore = assessment.results.reduce((sum, result) => sum + result.score, 0);
        const averageScore = assessment.results.length > 0 ? 
          Math.round(totalScore / assessment.results.length) : 0;
        overallScoreComparison.push(averageScore);

        // Calculate Bloom's level distribution
        const questionCountByLevel: Record<BloomsTaxonomyLevel, number> = {
          [BloomsTaxonomyLevel.REMEMBER]: 0,
          [BloomsTaxonomyLevel.UNDERSTAND]: 0,
          [BloomsTaxonomyLevel.APPLY]: 0,
          [BloomsTaxonomyLevel.ANALYZE]: 0,
          [BloomsTaxonomyLevel.EVALUATE]: 0,
          [BloomsTaxonomyLevel.CREATE]: 0
        };

        // Count questions by level
        assessment.questions.forEach(question => {
          const level = question.bloomsLevel as BloomsTaxonomyLevel || BloomsTaxonomyLevel.REMEMBER;
          questionCountByLevel[level]++;
        });

        // Calculate percentage for each level
        const totalQuestions = assessment.questions.length;
        if (totalQuestions > 0) {
          Object.keys(bloomsLevelComparison).forEach(level => {
            const bloomsLevel = level as BloomsTaxonomyLevel;
            bloomsLevelComparison[bloomsLevel].push(
              Math.round((questionCountByLevel[bloomsLevel] / totalQuestions) * 100)
            );
          });
        } else {
          // If no questions, set all levels to 0
          Object.keys(bloomsLevelComparison).forEach(level => {
            const bloomsLevel = level as BloomsTaxonomyLevel;
            bloomsLevelComparison[bloomsLevel].push(0);
          });
        }

        // Track student progression
        assessment.results.forEach(result => {
          if (!studentProgressionMap[result.studentId]) {
            studentProgressionMap[result.studentId] = Array(assessments.length).fill(null);
          }
          const index = assessments.indexOf(assessment);
          studentProgressionMap[result.studentId][index] = result.score;
        });

        // Track topic progression
        const topicScores: Record<string, number[]> = {};
        
        // Group questions by topic
        assessment.questions.forEach(question => {
          if (question.topicId) {
            if (!topicScores[question.topicId]) {
              topicScores[question.topicId] = [];
            }
            
            // Find results for this question
            const questionResults = assessment.results.map(result => {
              // This is a simplification - in a real system, you'd need to get the actual
              // question results for each student
              return result.score;
            });
            
            if (questionResults.length > 0) {
              const avgScore = questionResults.reduce((sum, score) => sum + score, 0) / questionResults.length;
              topicScores[question.topicId].push(avgScore);
            }
          }
        });
        
        // Calculate average score for each topic
        Object.entries(topicScores).forEach(([topicId, scores]) => {
          if (!topicProgressionMap[topicId]) {
            topicProgressionMap[topicId] = Array(assessments.length).fill(null);
          }
          
          const index = assessments.indexOf(assessment);
          if (scores.length > 0) {
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            topicProgressionMap[topicId][index] = Math.round(avgScore);
          }
        });
      }

      return {
        assessmentIds,
        assessmentNames,
        bloomsLevelComparison,
        overallScoreComparison,
        studentProgressionMap,
        topicProgressionMap
      };
    } catch (error) {
      console.error('Error comparing assessments:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to compare assessments'
      });
    }
  }
}
