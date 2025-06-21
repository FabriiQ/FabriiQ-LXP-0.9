import { EssayAIGradingService } from './essay-ai-grading.service';
import { AIGradingMode, EssaySubmission, EssayGradingCriterion } from '../types/essay';

/**
 * Automatic Grading Service
 * Handles automatic AI grading when essays are submitted
 */
export class AutomaticGradingService {
  private aiGradingService: EssayAIGradingService;

  constructor() {
    this.aiGradingService = new EssayAIGradingService();
  }

  /**
   * Process essay submission and trigger automatic grading if enabled
   */
  async processSubmission(
    submission: EssaySubmission,
    assessmentSettings: {
      aiGradingMode?: AIGradingMode;
      rubric?: EssayGradingCriterion[];
      question?: {
        text: string;
        sampleAnswer?: string;
        keywordsConcepts?: string[];
      };
    }
  ): Promise<{
    shouldGradeAutomatically: boolean;
    gradingResult?: any;
    error?: string;
  }> {
    try {
      // Check if automatic grading is enabled
      if (assessmentSettings.aiGradingMode !== AIGradingMode.AUTOMATIC) {
        return { shouldGradeAutomatically: false };
      }

      // Validate required data for AI grading
      if (!assessmentSettings.rubric || assessmentSettings.rubric.length === 0) {
        console.warn('Cannot perform automatic grading: No rubric defined');
        return { 
          shouldGradeAutomatically: false,
          error: 'No rubric defined for automatic grading'
        };
      }

      if (!assessmentSettings.question?.text) {
        console.warn('Cannot perform automatic grading: No question text');
        return { 
          shouldGradeAutomatically: false,
          error: 'No question text available for automatic grading'
        };
      }

      console.log('Starting automatic AI grading for submission:', submission.id);

      // Perform AI grading
      const gradingResult = await this.aiGradingService.gradeEssay(
        submission.content,
        assessmentSettings.question.text,
        assessmentSettings.rubric,
        assessmentSettings.question.sampleAnswer,
        assessmentSettings.question.keywordsConcepts
      );

      console.log('Automatic AI grading completed:', {
        submissionId: submission.id,
        score: gradingResult.overallScore,
        confidence: gradingResult.confidence
      });

      return {
        shouldGradeAutomatically: true,
        gradingResult
      };

    } catch (error) {
      console.error('Error in automatic grading:', error);
      return {
        shouldGradeAutomatically: false,
        error: `Automatic grading failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check if automatic grading should be triggered for an assessment
   */
  shouldTriggerAutomaticGrading(aiGradingMode?: AIGradingMode): boolean {
    return aiGradingMode === AIGradingMode.AUTOMATIC;
  }

  /**
   * Format AI grading result for database storage
   */
  formatGradingResultForStorage(gradingResult: any): {
    criteriaScores: Array<{
      criterionId: string;
      score: number;
      feedback?: string;
    }>;
    overallFeedback?: string;
    totalScore: number;
    aiGrading: any;
  } {
    return {
      criteriaScores: gradingResult.criteriaScores.map((cs: any) => ({
        criterionId: cs.criterionId,
        score: cs.score,
        feedback: cs.feedback
      })),
      overallFeedback: gradingResult.overallFeedback,
      totalScore: gradingResult.overallScore,
      aiGrading: gradingResult
    };
  }

  /**
   * Generate notification message for automatic grading
   */
  generateGradingNotification(
    studentName: string,
    assessmentTitle: string,
    score: number,
    maxScore: number
  ): {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } {
    const percentage = Math.round((score / maxScore) * 100);
    
    let type: 'success' | 'warning' | 'info' = 'info';
    if (percentage >= 80) type = 'success';
    else if (percentage >= 60) type = 'warning';

    return {
      title: 'Essay Automatically Graded',
      message: `${studentName}'s essay for "${assessmentTitle}" has been automatically graded: ${score}/${maxScore} (${percentage}%)`,
      type
    };
  }

  /**
   * Check if manual review is recommended based on AI confidence
   */
  shouldRecommendManualReview(
    gradingResult: any,
    confidenceThreshold: number = 0.7
  ): {
    recommendReview: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let recommendReview = false;

    // Check overall confidence
    if (gradingResult.confidence < confidenceThreshold) {
      recommendReview = true;
      reasons.push(`Low AI confidence (${Math.round(gradingResult.confidence * 100)}%)`);
    }

    // Check individual criteria confidence
    const lowConfidenceCriteria = gradingResult.criteriaScores.filter(
      (cs: any) => cs.confidence < confidenceThreshold
    );
    
    if (lowConfidenceCriteria.length > 0) {
      recommendReview = true;
      reasons.push(`${lowConfidenceCriteria.length} criteria with low confidence`);
    }

    // Check for extreme scores (very high or very low)
    const percentage = (gradingResult.overallScore / gradingResult.maxScore) * 100;
    if (percentage >= 95 || percentage <= 20) {
      recommendReview = true;
      reasons.push(`Extreme score (${Math.round(percentage)}%)`);
    }

    // Check for inconsistent criteria scores
    const scores = gradingResult.criteriaScores.map((cs: any) => 
      (cs.score / cs.maxScore) * 100
    );
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    if (maxScore - minScore > 50) {
      recommendReview = true;
      reasons.push('Inconsistent performance across criteria');
    }

    return { recommendReview, reasons };
  }

  /**
   * Create review recommendation for teachers
   */
  createReviewRecommendation(
    submissionId: string,
    gradingResult: any,
    confidenceThreshold?: number
  ): {
    submissionId: string;
    recommendManualReview: boolean;
    reasons: string[];
    priority: 'high' | 'medium' | 'low';
    suggestedActions: string[];
  } {
    const { recommendReview, reasons } = this.shouldRecommendManualReview(
      gradingResult,
      confidenceThreshold
    );

    let priority: 'high' | 'medium' | 'low' = 'low';
    const suggestedActions: string[] = [];

    if (recommendReview) {
      // Determine priority based on reasons
      if (reasons.some(r => r.includes('Extreme score') || r.includes('Low AI confidence'))) {
        priority = 'high';
        suggestedActions.push('Review AI grading carefully');
        suggestedActions.push('Consider manual re-grading');
      } else {
        priority = 'medium';
        suggestedActions.push('Quick review recommended');
      }

      if (reasons.some(r => r.includes('criteria with low confidence'))) {
        suggestedActions.push('Focus on criteria with low confidence scores');
      }

      if (reasons.some(r => r.includes('Inconsistent performance'))) {
        suggestedActions.push('Review criteria alignment and scoring consistency');
      }
    } else {
      suggestedActions.push('AI grading appears reliable');
      suggestedActions.push('Optional spot check recommended');
    }

    return {
      submissionId,
      recommendManualReview: recommendReview,
      reasons,
      priority,
      suggestedActions
    };
  }
}
