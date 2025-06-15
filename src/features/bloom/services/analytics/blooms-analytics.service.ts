/**
 * Bloom's Taxonomy Analytics Service
 *
 * This service provides methods for generating analytics data related to Bloom's Taxonomy.
 * Includes caching for improved performance.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  BloomsTaxonomyLevel,
  BloomsDistribution
} from '../../types/bloom-taxonomy';
import {
  ClassBloomsPerformance,
  StudentBloomsPerformance,
  TopicBloomsPerformance,
  CognitiveGap,
  InterventionSuggestion
} from '../../types/analytics';
import { DEFAULT_BLOOMS_DISTRIBUTION } from '../../constants/bloom-levels';
import {
  generateClassPerformanceCacheKey,
  bloomsAnalyticsCache
} from '../cache/blooms-cache.service';

export class BloomsAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get class performance data by Bloom's Taxonomy levels
   * @param classId Class ID
   * @param startDate Start date for analytics
   * @param endDate End date for analytics
   * @returns Class performance data
   */
  async getClassPerformance(
    classId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClassBloomsPerformance> {
    try {
      // Check cache first
      const cacheKey = generateClassPerformanceCacheKey(classId, startDate, endDate);
      const cachedData = bloomsAnalyticsCache.get<ClassBloomsPerformance>(cacheKey);

      if (cachedData) {
        console.log(`[BloomsAnalyticsService] Cache hit for class performance: ${classId}`);
        return cachedData;
      }

      console.log(`[BloomsAnalyticsService] Cache miss for class performance: ${classId}`);

      // Get class details with optimized query
      const classDetails = await this.prisma.class.findUnique({
        where: { id: classId }
      });

      // Get student enrollments for this class
      const studentEnrollments = await this.prisma.studentEnrollment.findMany({
        where: { classId },
        select: {
          id: true,
          studentId: true
        }
      });

      if (!classDetails) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found'
        });
      }

      // Get all topic masteries for students in this class
      const topicMasteries = await this.prisma.topicMastery.findMany({
        where: {
          studentId: {
            in: studentEnrollments.map(enrollment => enrollment.studentId)
          },
          ...(startDate && endDate && {
            updatedAt: {
              gte: startDate,
              lte: endDate
            }
          })
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subjectId: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // Calculate student performance
      const studentPerformance: StudentBloomsPerformance[] = [];
      const studentMap = new Map<string, StudentBloomsPerformance>();

      // Initialize student performance data
      for (const enrollment of studentEnrollments) {
        studentMap.set(enrollment.studentId, {
          studentId: enrollment.studentId,
          studentName: 'Student ' + enrollment.studentId.substring(0, 8),
          [BloomsTaxonomyLevel.REMEMBER]: 0,
          [BloomsTaxonomyLevel.UNDERSTAND]: 0,
          [BloomsTaxonomyLevel.APPLY]: 0,
          [BloomsTaxonomyLevel.ANALYZE]: 0,
          [BloomsTaxonomyLevel.EVALUATE]: 0,
          [BloomsTaxonomyLevel.CREATE]: 0,
          overallMastery: 0
        });
      }

      // Calculate topic performance
      const topicMap = new Map<string, TopicBloomsPerformance>();

      // Process topic masteries
      for (const mastery of topicMasteries) {
        // Update student performance
        const student = studentMap.get(mastery.studentId);
        if (student) {
          student[BloomsTaxonomyLevel.REMEMBER] += mastery.rememberLevel;
          student[BloomsTaxonomyLevel.UNDERSTAND] += mastery.understandLevel;
          student[BloomsTaxonomyLevel.APPLY] += mastery.applyLevel;
          student[BloomsTaxonomyLevel.ANALYZE] += mastery.analyzeLevel;
          student[BloomsTaxonomyLevel.EVALUATE] += mastery.evaluateLevel;
          student[BloomsTaxonomyLevel.CREATE] += mastery.createLevel;
          student.overallMastery += mastery.overallMastery;
        }

        // Update topic performance
        if (!topicMap.has(mastery.topicId)) {
          topicMap.set(mastery.topicId, {
            topicId: mastery.topicId,
            topicName: mastery.topic.title,
            subjectId: mastery.topic.subjectId,
            subjectName: mastery.topic.subject.name,
            averageMastery: 0,
            distribution: { ...DEFAULT_BLOOMS_DISTRIBUTION },
            masteryByLevel: {
              [BloomsTaxonomyLevel.REMEMBER]: 0,
              [BloomsTaxonomyLevel.UNDERSTAND]: 0,
              [BloomsTaxonomyLevel.APPLY]: 0,
              [BloomsTaxonomyLevel.ANALYZE]: 0,
              [BloomsTaxonomyLevel.EVALUATE]: 0,
              [BloomsTaxonomyLevel.CREATE]: 0
            },
            studentCount: 0,
            masteredCount: 0,
            partiallyMasteredCount: 0,
            notMasteredCount: 0
          });
        }

        const topic = topicMap.get(mastery.topicId)!;
        topic.studentCount++;
        topic.averageMastery += mastery.overallMastery;
        topic.masteryByLevel[BloomsTaxonomyLevel.REMEMBER] += mastery.rememberLevel;
        topic.masteryByLevel[BloomsTaxonomyLevel.UNDERSTAND] += mastery.understandLevel;
        topic.masteryByLevel[BloomsTaxonomyLevel.APPLY] += mastery.applyLevel;
        topic.masteryByLevel[BloomsTaxonomyLevel.ANALYZE] += mastery.analyzeLevel;
        topic.masteryByLevel[BloomsTaxonomyLevel.EVALUATE] += mastery.evaluateLevel;
        topic.masteryByLevel[BloomsTaxonomyLevel.CREATE] += mastery.createLevel;

        // Count mastery levels
        if (mastery.overallMastery >= 80) {
          topic.masteredCount++;
        } else if (mastery.overallMastery >= 50) {
          topic.partiallyMasteredCount++;
        } else {
          topic.notMasteredCount++;
        }
      }

      // Calculate averages for students
      const topicCount = topicMap.size;
      studentMap.forEach(student => {
        if (topicCount > 0) {
          student[BloomsTaxonomyLevel.REMEMBER] = Math.round(student[BloomsTaxonomyLevel.REMEMBER] / topicCount);
          student[BloomsTaxonomyLevel.UNDERSTAND] = Math.round(student[BloomsTaxonomyLevel.UNDERSTAND] / topicCount);
          student[BloomsTaxonomyLevel.APPLY] = Math.round(student[BloomsTaxonomyLevel.APPLY] / topicCount);
          student[BloomsTaxonomyLevel.ANALYZE] = Math.round(student[BloomsTaxonomyLevel.ANALYZE] / topicCount);
          student[BloomsTaxonomyLevel.EVALUATE] = Math.round(student[BloomsTaxonomyLevel.EVALUATE] / topicCount);
          student[BloomsTaxonomyLevel.CREATE] = Math.round(student[BloomsTaxonomyLevel.CREATE] / topicCount);
          student.overallMastery = Math.round(student.overallMastery / topicCount);
        }
        studentPerformance.push(student);
      });

      // Calculate averages for topics
      const topicPerformance: TopicBloomsPerformance[] = [];
      topicMap.forEach(topic => {
        if (topic.studentCount > 0) {
          topic.averageMastery = Math.round(topic.averageMastery / topic.studentCount);

          Object.keys(topic.masteryByLevel).forEach(level => {
            const bloomsLevel = level as BloomsTaxonomyLevel;
            topic.masteryByLevel[bloomsLevel] = Math.round(topic.masteryByLevel[bloomsLevel] / topic.studentCount);

            // Update distribution
            topic.distribution[bloomsLevel] = Math.round(topic.masteryByLevel[bloomsLevel] / 100 * 100);
          });
        }
        topicPerformance.push(topic);
      });

      // Calculate class average distribution
      const distribution: BloomsDistribution = { ...DEFAULT_BLOOMS_DISTRIBUTION };
      let averageMastery = 0;

      if (studentPerformance.length > 0) {
        // Calculate average mastery
        averageMastery = Math.round(
          studentPerformance.reduce((sum, student) => sum + student.overallMastery, 0) /
          studentPerformance.length
        );

        // Calculate distribution
        Object.keys(distribution).forEach(level => {
          const bloomsLevel = level as BloomsTaxonomyLevel;
          distribution[bloomsLevel] = Math.round(
            studentPerformance.reduce((sum, student) => sum + student[bloomsLevel], 0) /
            studentPerformance.length
          );
        });
      }

      // Identify cognitive gaps
      const cognitiveGaps = this.identifyCognitiveGaps(studentPerformance, topicPerformance);

      // Generate intervention suggestions
      const interventionSuggestions = this.generateInterventionSuggestions(cognitiveGaps);

      // Create the result object
      const result: ClassBloomsPerformance = {
        classId,
        className: classDetails.name || 'Unknown Class',
        studentCount: studentEnrollments.length || 0,
        averageMastery,
        distribution,
        studentPerformance,
        topicPerformance,
        cognitiveGaps,
        interventionSuggestions
      };

      // Cache the result (reuse the cache key from earlier)
      const cacheTTL = 5 * 60 * 1000; // 5 minutes
      bloomsAnalyticsCache.set(cacheKey, result, cacheTTL);
      console.log(`[BloomsAnalyticsService] Cached class performance for: ${classId}`);

      return result;
    } catch (error) {
      console.error('Error getting class performance:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get class performance'
      });
    }
  }

  /**
   * Identify cognitive gaps in student learning
   * @param studentPerformance Student performance data
   * @param topicPerformance Topic performance data
   * @returns Array of cognitive gaps
   */
  private identifyCognitiveGaps(
    studentPerformance: StudentBloomsPerformance[],
    topicPerformance: TopicBloomsPerformance[]
  ): CognitiveGap[] {
    const gaps: CognitiveGap[] = [];

    // For each topic, identify gaps at each Bloom's level
    topicPerformance.forEach(topic => {
      Object.keys(topic.masteryByLevel).forEach(level => {
        const bloomsLevel = level as BloomsTaxonomyLevel;
        const levelMastery = topic.masteryByLevel[bloomsLevel];

        // If average mastery for this level is below 60%, consider it a gap
        if (levelMastery < 60) {
          // Find affected students
          const affectedStudents = studentPerformance.filter(student => {
            // Student has below 60% mastery in this level
            return student[bloomsLevel] < 60;
          });

          if (affectedStudents.length > 0) {
            gaps.push({
              bloomsLevel,
              topicId: topic.topicId,
              topicName: topic.topicName,
              subjectId: topic.subjectId,
              subjectName: topic.subjectName,
              gapSize: 60 - levelMastery, // How far below the threshold
              affectedStudentCount: affectedStudents.length,
              affectedStudentIds: affectedStudents.map(student => student.studentId)
            });
          }
        }
      });
    });

    // Sort gaps by size (largest first)
    return gaps.sort((a, b) => b.gapSize - a.gapSize);
  }

  /**
   * Generate intervention suggestions for cognitive gaps
   * @param gaps Cognitive gaps
   * @returns Array of intervention suggestions
   */
  private generateInterventionSuggestions(gaps: CognitiveGap[]): InterventionSuggestion[] {
    return gaps.map(gap => {
      // Generate a unique ID for the suggestion
      const id = `${gap.topicId}-${gap.bloomsLevel}-${Date.now()}`;

      // Generate description based on Bloom's level
      let description = `Address ${gap.bloomsLevel.toLowerCase()} skills gap in ${gap.topicName}`;
      let activitySuggestions: string[] = [];
      let resourceSuggestions: string[] = [];

      // Generate suggestions based on Bloom's level
      switch (gap.bloomsLevel) {
        case BloomsTaxonomyLevel.REMEMBER:
          description = `Improve recall and memory of key concepts in ${gap.topicName}`;
          activitySuggestions = [
            'Flashcard review sessions',
            'Memory games with key terms',
            'Concept mapping exercises'
          ];
          resourceSuggestions = [
            'Create illustrated vocabulary lists',
            'Provide summary handouts',
            'Share mnemonic devices'
          ];
          break;

        case BloomsTaxonomyLevel.UNDERSTAND:
          description = `Enhance comprehension of concepts in ${gap.topicName}`;
          activitySuggestions = [
            'Guided discussions',
            'Concept explanation exercises',
            'Summarization activities'
          ];
          resourceSuggestions = [
            'Provide visual concept maps',
            'Share simplified explanations',
            'Create comparison charts'
          ];
          break;

        case BloomsTaxonomyLevel.APPLY:
          description = `Strengthen application skills for ${gap.topicName}`;
          activitySuggestions = [
            'Hands-on practice exercises',
            'Real-world problem solving',
            'Application scenarios'
          ];
          resourceSuggestions = [
            'Provide step-by-step guides',
            'Share worked examples',
            'Create practice problem sets'
          ];
          break;

        case BloomsTaxonomyLevel.ANALYZE:
          description = `Develop analytical thinking for ${gap.topicName}`;
          activitySuggestions = [
            'Comparative analysis exercises',
            'Classification activities',
            'Pattern identification tasks'
          ];
          resourceSuggestions = [
            'Provide analytical frameworks',
            'Share case studies',
            'Create analysis templates'
          ];
          break;

        case BloomsTaxonomyLevel.EVALUATE:
          description = `Build evaluation skills for ${gap.topicName}`;
          activitySuggestions = [
            'Peer review sessions',
            'Criteria-based evaluation exercises',
            'Debate activities'
          ];
          resourceSuggestions = [
            'Provide evaluation rubrics',
            'Share exemplar analyses',
            'Create decision-making frameworks'
          ];
          break;

        case BloomsTaxonomyLevel.CREATE:
          description = `Foster creative skills for ${gap.topicName}`;
          activitySuggestions = [
            'Project-based learning activities',
            'Design challenges',
            'Creative problem-solving exercises'
          ];
          resourceSuggestions = [
            'Provide creative thinking techniques',
            'Share innovation examples',
            'Create design thinking guides'
          ];
          break;
      }

      return {
        id,
        bloomsLevel: gap.bloomsLevel,
        topicId: gap.topicId,
        topicName: gap.topicName,
        targetStudentIds: gap.affectedStudentIds,
        targetStudentCount: gap.affectedStudentCount,
        description,
        activitySuggestions,
        resourceSuggestions
      };
    });
  }
}
