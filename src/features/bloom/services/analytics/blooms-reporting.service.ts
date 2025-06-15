/**
 * Bloom's Taxonomy Reporting Service
 * 
 * This service provides methods for generating reports related to Bloom's Taxonomy analytics.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { 
  BloomsTaxonomyLevel,
  BloomsDistribution
} from '../../types/bloom-taxonomy';
import {
  BloomsAnalyticsReport,
  ClassBloomsPerformance,
  AssessmentComparison
} from '../../types/analytics';
import { DEFAULT_BLOOMS_DISTRIBUTION } from '../../constants/bloom-levels';
import { BloomsAnalyticsService } from './blooms-analytics.service';
import { AssessmentAnalyticsService } from './assessment-analytics.service';

export class BloomsReportingService {
  private bloomsAnalyticsService: BloomsAnalyticsService;
  private assessmentAnalyticsService: AssessmentAnalyticsService;

  constructor(private prisma: PrismaClient) {
    this.bloomsAnalyticsService = new BloomsAnalyticsService(prisma);
    this.assessmentAnalyticsService = new AssessmentAnalyticsService(prisma);
  }

  /**
   * Generate a comprehensive analytics report for a class
   * @param classId Class ID
   * @param teacherId Teacher ID
   * @param startDate Start date for report
   * @param endDate End date for report
   * @returns Comprehensive analytics report
   */
  async generateClassReport(
    classId: string,
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BloomsAnalyticsReport> {
    try {
      // Get class details
      const classDetails = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!classDetails) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found'
        });
      }

      // Get class performance
      const classPerformance = await this.bloomsAnalyticsService.getClassPerformance(
        classId,
        startDate,
        endDate
      );

      // Get assessments for this class in the date range
      const assessments = await this.prisma.assessment.findMany({
        where: {
          classId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true
        }
      });

      // Compare assessments if there are at least 2
      let assessmentComparisons: AssessmentComparison[] = [];
      if (assessments.length >= 2) {
        const assessmentIds = assessments.map(a => a.id);
        const comparison = await this.assessmentAnalyticsService.compareAssessments(assessmentIds);
        assessmentComparisons = [comparison];
      }

      // Generate cognitive balance analysis
      const cognitiveBalanceAnalysis = this.analyzeCognitiveBalance(classPerformance);

      // Generate mastery heatmap data
      const masteryHeatmapData = this.generateMasteryHeatmap(classPerformance);

      // Create report ID
      const reportId = `${classId}-${new Date().getTime()}`;

      return {
        id: reportId,
        title: `Bloom's Taxonomy Analytics for ${classDetails.name}`,
        description: `Comprehensive analytics report for the period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        createdAt: new Date(),
        classId,
        className: classDetails.name || 'Unknown Class',
        teacherId,
        teacherName: classDetails.teacher?.user?.name || 'Unknown Teacher',
        timeRange: {
          start: startDate,
          end: endDate
        },
        classPerformance,
        assessmentComparisons,
        cognitiveBalanceAnalysis,
        masteryHeatmapData
      };
    } catch (error) {
      console.error('Error generating class report:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate class report'
      });
    }
  }

  /**
   * Analyze cognitive balance based on class performance
   * @param classPerformance Class performance data
   * @returns Cognitive balance analysis
   */
  private analyzeCognitiveBalance(classPerformance: ClassBloomsPerformance) {
    // Get current distribution
    const currentDistribution = classPerformance.distribution;
    
    // Define ideal distribution (this could be customized based on grade level, subject, etc.)
    const idealDistribution: BloomsDistribution = {
      [BloomsTaxonomyLevel.REMEMBER]: 15,
      [BloomsTaxonomyLevel.UNDERSTAND]: 20,
      [BloomsTaxonomyLevel.APPLY]: 25,
      [BloomsTaxonomyLevel.ANALYZE]: 20,
      [BloomsTaxonomyLevel.EVALUATE]: 10,
      [BloomsTaxonomyLevel.CREATE]: 10
    };
    
    // Check if distribution is balanced
    const isBalanced = this.isDistributionBalanced(currentDistribution, idealDistribution);
    
    // Generate recommendations
    const recommendations = this.generateBalanceRecommendations(currentDistribution, idealDistribution);
    
    return {
      isBalanced,
      recommendations,
      currentDistribution,
      idealDistribution
    };
  }

  /**
   * Check if a distribution is balanced compared to an ideal distribution
   * @param current Current distribution
   * @param ideal Ideal distribution
   * @returns Whether the distribution is balanced
   */
  private isDistributionBalanced(
    current: BloomsDistribution,
    ideal: BloomsDistribution
  ): boolean {
    // Check if any level deviates by more than 10%
    for (const level of Object.keys(current) as BloomsTaxonomyLevel[]) {
      const deviation = Math.abs(current[level] - ideal[level]);
      if (deviation > 10) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate recommendations for balancing cognitive levels
   * @param current Current distribution
   * @param ideal Ideal distribution
   * @returns Array of recommendations
   */
  private generateBalanceRecommendations(
    current: BloomsDistribution,
    ideal: BloomsDistribution
  ): string[] {
    const recommendations: string[] = [];
    
    // Check each level
    for (const level of Object.keys(current) as BloomsTaxonomyLevel[]) {
      const deviation = current[level] - ideal[level];
      
      // If too high (more than 10% above ideal)
      if (deviation > 10) {
        recommendations.push(`Reduce focus on ${level.toLowerCase()} activities (${deviation}% above ideal)`);
      }
      // If too low (more than 10% below ideal)
      else if (deviation < -10) {
        recommendations.push(`Increase focus on ${level.toLowerCase()} activities (${Math.abs(deviation)}% below ideal)`);
      }
    }
    
    // Add general recommendations if needed
    if (recommendations.length === 0) {
      recommendations.push('Current cognitive balance is good. Maintain the current distribution of activities.');
    } else if (recommendations.length > 3) {
      // If there are many recommendations, add a summary
      recommendations.push('Consider a more balanced approach across all cognitive levels.');
    }
    
    return recommendations;
  }

  /**
   * Generate mastery heatmap data
   * @param classPerformance Class performance data
   * @returns Mastery heatmap data
   */
  private generateMasteryHeatmap(classPerformance: ClassBloomsPerformance) {
    const studentIds: string[] = [];
    const studentNames: string[] = [];
    const topicIds: string[] = [];
    const topicNames: string[] = [];
    
    // Extract student IDs and names
    classPerformance.studentPerformance.forEach(student => {
      studentIds.push(student.studentId);
      studentNames.push(student.studentName);
    });
    
    // Extract topic IDs and names
    classPerformance.topicPerformance.forEach(topic => {
      topicIds.push(topic.topicId);
      topicNames.push(topic.topicName);
    });
    
    // Create heatmap data matrix
    // Each cell represents a student's mastery of a topic (0-100)
    const heatmapData: number[][] = [];
    
    // Initialize with zeros
    for (let i = 0; i < studentIds.length; i++) {
      heatmapData.push(Array(topicIds.length).fill(0));
    }
    
    // This is a simplified approach - in a real system, you'd need to get the actual
    // mastery data for each student and topic combination
    // For now, we'll use random data for demonstration
    for (let i = 0; i < studentIds.length; i++) {
      for (let j = 0; j < topicIds.length; j++) {
        // Generate a random mastery value between 0 and 100
        heatmapData[i][j] = Math.floor(Math.random() * 101);
      }
    }
    
    return {
      studentIds,
      studentNames,
      topicIds,
      topicNames,
      heatmapData
    };
  }

  /**
   * Save a report to the database
   * @param report Report to save
   * @returns Saved report
   */
  async saveReport(report: BloomsAnalyticsReport): Promise<{ id: string }> {
    try {
      // In a real system, you'd save the report to the database
      // For now, we'll just return the report ID
      return { id: report.id };
    } catch (error) {
      console.error('Error saving report:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save report'
      });
    }
  }

  /**
   * Get a report by ID
   * @param reportId Report ID
   * @returns Report
   */
  async getReport(reportId: string): Promise<BloomsAnalyticsReport> {
    try {
      // In a real system, you'd retrieve the report from the database
      // For now, we'll throw an error
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Report retrieval not implemented'
      });
    } catch (error) {
      console.error('Error getting report:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get report'
      });
    }
  }
}
