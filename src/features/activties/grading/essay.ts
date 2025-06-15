import { EssayActivity } from '../models/essay';
import { GradingResult, QuestionResult, ActivitySettings } from '../models/base'; // Added ActivitySettings for typing
import { EssayGradingAgent, AgentGradingOutput } from '../../agents/specialized/EssayGradingAgent';

// It's useful to define what settings an EssayActivity might have,
// even if it's extending a generic ActivitySettings.
interface EssayActivitySettings extends ActivitySettings {
  passingPercentage?: number;
  // Potentially other essay-specific settings like:
  // allowResubmission?: boolean;
  // aiGradingSensitivity?: 'strict' | 'balanced' | 'lenient';
}

export async function gradeEssayActivity(
  activity: EssayActivity,
  submissionText: string
): Promise<GradingResult> {
  if (!activity.rubric) {
    console.error('Cannot grade essay activity: No rubric provided for activity ID:', activity.id);
    throw new Error('Cannot grade essay activity: No rubric provided.');
  }
  if (!activity.isGradable) {
    console.warn('Attempted to grade non-gradable activity ID:', activity.id);
    // Return a default non-graded result or throw error
    // For now, throwing error as per original logic
    throw new Error('Activity is not set as gradable.');
  }

  const agent = new EssayGradingAgent();
  console.log(`Starting AI grading for activity: ${activity.title}`);
  const agentResult: AgentGradingOutput = await agent.gradeEssay(submissionText, activity.rubric);
  console.log(`AI grading completed for activity: ${activity.title}. Score: ${agentResult.totalScore}/${agentResult.maxScore}`);

  // Map AgentGradingOutput to GradingResult
  let detailedFeedback = `Overall Feedback from AI Assistant: ${agentResult.overallFeedback || 'N/A'}\n\n--- Criteria Breakdown ---\n`;
  agentResult.criteriaResults.forEach(cr => {
    detailedFeedback += `Criterion: ${cr.criterionName || 'Unnamed Criterion'}\n`;
    detailedFeedback += `Achieved Level: ${cr.achievedLevelName || 'N/A'}\n`;
    detailedFeedback += `Score: ${cr.score} / ${cr.maxPoints}\n`;
    detailedFeedback += `AI Feedback: ${cr.feedback || 'No specific feedback provided.'}\n---\n`;
  });

  // Accessing settings safely
  const activitySettings = activity.settings as EssayActivitySettings | undefined;
  const passingPercentage = activitySettings?.passingPercentage || 60; // Default 60% if not set

  // For an essay, there's effectively one "question" (the essay itself)
  const questionResults: QuestionResult[] = [
    {
      questionId: activity.id, // Using activity ID as the "question" ID for this context
      isCorrect: (agentResult.totalScore / agentResult.maxScore) * 100 >= passingPercentage,
      points: agentResult.totalScore,
      maxPoints: agentResult.maxScore,
      feedback: detailedFeedback, // Store detailed breakdown here
      explanation: agentResult.overallFeedback, // Or use for overall summary
      // Note: `selectedOptionId` and `correctOptionId` are not applicable here.
    },
  ];

  const passed = (agentResult.totalScore / agentResult.maxScore) * 100 >= passingPercentage;

  return {
    score: agentResult.totalScore,
    maxScore: agentResult.maxScore,
    percentage: (agentResult.totalScore / agentResult.maxScore) * 100,
    passed: passed,
    questionResults: questionResults,
    overallFeedback: agentResult.overallFeedback, // This is the AI's overall summary
    completedAt: new Date(),
  };
}
