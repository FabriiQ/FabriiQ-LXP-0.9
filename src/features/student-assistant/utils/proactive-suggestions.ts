'use client';

import { StudentAssistantContext, LearningGoal, DiscussedConcept } from '../types';

/**
 * Types of proactive suggestions
 */
export enum SuggestionType {
  LEARNING_GOAL_REMINDER = 'learning_goal_reminder',
  CONCEPT_REVIEW = 'concept_review',
  CONFUSION_FOLLOWUP = 'confusion_followup',
  LEARNING_PATH = 'learning_path',
  DEADLINE_REMINDER = 'deadline_reminder',
  SPACED_REPETITION = 'spaced_repetition'
}

/**
 * Proactive suggestion interface
 */
export interface ProactiveSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created: Date;
  expires?: Date;
  relatedConcept?: string;
  relatedGoalId?: string;
  actionText?: string;
  actionData?: Record<string, any>;
}

/**
 * Generates proactive suggestions based on context
 *
 * @param context The student assistant context
 * @returns Array of proactive suggestions
 */
export function generateProactiveSuggestions(context: StudentAssistantContext): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];
  const now = new Date();

  // Add learning goal reminders
  if (context.learningGoals?.length) {
    const upcomingGoals = context.learningGoals
      .filter(goal => !goal.completed && goal.targetDate && goal.targetDate > now)
      .sort((a, b) => a.targetDate!.getTime() - b.targetDate!.getTime())
      .slice(0, 2);

    upcomingGoals.forEach(goal => {
      const daysUntilDue = Math.ceil((goal.targetDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 7) {
        suggestions.push({
          id: `goal_${goal.id}`,
          type: SuggestionType.LEARNING_GOAL_REMINDER,
          title: 'Learning Goal Reminder',
          description: `Your goal "${goal.description}" is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Current progress: ${goal.progress || 0}%.`,
          priority: daysUntilDue <= 2 ? 'high' : 'medium',
          created: now,
          relatedGoalId: goal.id,
          actionText: 'Review Goal',
          actionData: { goalId: goal.id }
        });
      }
    });
  }

  // Add concept review suggestions based on spaced repetition
  if (context.discussedConcepts && context.discussedConcepts.length > 0) {
    const conceptsForReview = getConceptsForSpacedRepetition(context.discussedConcepts);

    conceptsForReview.forEach(concept => {
      suggestions.push({
        id: `review_${concept.name.replace(/\s+/g, '_')}`,
        type: SuggestionType.SPACED_REPETITION,
        title: 'Time for Review',
        description: `It's a good time to review "${concept.name}" to strengthen your memory.`,
        priority: 'medium',
        created: now,
        relatedConcept: concept.name,
        actionText: 'Start Review',
        actionData: { concept: concept.name }
      });
    });
  }

  // Add confusion follow-up suggestions
  if (context.confusionAreas?.length) {
    const unresolvedConfusion = context.confusionAreas
      .filter(area => !area.resolved)
      .sort((a, b) => b.lastDetected.getTime() - a.lastDetected.getTime())[0];

    if (unresolvedConfusion) {
      const daysSinceDetection = Math.floor((now.getTime() - unresolvedConfusion.lastDetected.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceDetection >= 1 && daysSinceDetection <= 7) {
        suggestions.push({
          id: `confusion_${unresolvedConfusion.topic.substring(0, 20).replace(/\s+/g, '_')}`,
          type: SuggestionType.CONFUSION_FOLLOWUP,
          title: 'Follow-up on Difficult Topic',
          description: `You seemed to have difficulty with "${unresolvedConfusion.topic}". Would you like to revisit this?`,
          priority: unresolvedConfusion.level === 'high' ? 'high' : 'medium',
          created: now,
          relatedConcept: unresolvedConfusion.topic,
          actionText: 'Get Help',
          actionData: { topic: unresolvedConfusion.topic }
        });
      }
    }
  }

  // Add learning path suggestions if we have enough discussed concepts
  if (context.discussedConcepts && context.discussedConcepts.length >= 5) {
    const learningPathSuggestion = generateLearningPathSuggestion(context.discussedConcepts);

    if (learningPathSuggestion) {
      suggestions.push(learningPathSuggestion);
    }
  }

  // Add deadline reminders for activities
  if (context.currentActivity) {
    // This would require integration with the activity API to get deadlines
    // For now, we'll just add a placeholder
    if (context.currentActivity.id) {
      suggestions.push({
        id: `activity_${context.currentActivity.id}`,
        type: SuggestionType.DEADLINE_REMINDER,
        title: 'Activity Deadline',
        description: `Don't forget to complete "${context.currentActivity.title}" before the deadline.`,
        priority: 'medium',
        created: now,
        actionText: 'View Activity',
        actionData: { activityId: context.currentActivity.id }
      });
    }
  }

  return suggestions;
}

/**
 * Determines which concepts should be reviewed based on spaced repetition principles
 *
 * @param discussedConcepts Array of concepts that have been discussed
 * @returns Array of concepts that should be reviewed
 */
function getConceptsForSpacedRepetition(discussedConcepts: DiscussedConcept[]): DiscussedConcept[] {
  const now = new Date();
  const conceptsForReview: DiscussedConcept[] = [];

  discussedConcepts.forEach(concept => {
    const daysSinceLastDiscussed = Math.floor((now.getTime() - concept.lastDiscussed.getTime()) / (1000 * 60 * 60 * 24));

    // Apply spaced repetition intervals based on discussion count
    // 1st review: 1 day, 2nd: 3 days, 3rd: 7 days, 4th: 14 days, 5th: 30 days
    const intervals = [1, 3, 7, 14, 30];
    const discussionCount = Math.min(concept.discussionCount, intervals.length) - 1;
    const targetInterval = intervals[discussionCount];

    // If it's time for review based on the interval
    if (daysSinceLastDiscussed >= targetInterval && daysSinceLastDiscussed <= targetInterval + 2) {
      conceptsForReview.push(concept);
    }
  });

  return conceptsForReview;
}

/**
 * Generates a learning path suggestion based on discussed concepts
 *
 * @param discussedConcepts Array of concepts that have been discussed
 * @returns A learning path suggestion or null
 */
function generateLearningPathSuggestion(discussedConcepts: DiscussedConcept[]): ProactiveSuggestion | null {
  // Group concepts by subject
  const conceptsBySubject = new Map<string, DiscussedConcept[]>();

  discussedConcepts.forEach(concept => {
    if (concept.subjectId) {
      if (!conceptsBySubject.has(concept.subjectId)) {
        conceptsBySubject.set(concept.subjectId, []);
      }
      conceptsBySubject.get(concept.subjectId)!.push(concept);
    }
  });

  // Find the subject with the most concepts
  let primarySubjectId: string | undefined;
  let maxConceptCount = 0;

  conceptsBySubject.forEach((concepts, subjectId) => {
    if (concepts.length > maxConceptCount) {
      maxConceptCount = concepts.length;
      primarySubjectId = subjectId;
    }
  });

  if (!primarySubjectId || maxConceptCount < 3) {
    return null;
  }

  // Get the concepts for the primary subject
  const primaryConcepts = conceptsBySubject.get(primarySubjectId)!;

  // Sort by mastery level (low to high)
  const sortedConcepts = [...primaryConcepts].sort((a, b) => {
    const masteryOrder = { low: 0, medium: 1, high: 2, undefined: 3 };
    return (masteryOrder[a.mastery || 'undefined'] || 3) - (masteryOrder[b.mastery || 'undefined'] || 3);
  });

  // Get the top 3 concepts to focus on
  const focusConcepts = sortedConcepts.slice(0, 3).map(c => c.name).join(', ');

  return {
    id: `learning_path_${primarySubjectId}`,
    type: SuggestionType.LEARNING_PATH,
    title: 'Personalized Learning Path',
    description: `Based on your recent activity, I've created a learning path focusing on: ${focusConcepts}`,
    priority: 'medium',
    created: new Date(),
    actionText: 'View Path',
    actionData: { subjectId: primarySubjectId, concepts: sortedConcepts.slice(0, 3).map(c => c.name) }
  };
}
