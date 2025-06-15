import { EssayRubric, EssayRubricCriterion, EssayRubricLevel } from '../../question-bank/models/types';
// GradingResult and QuestionResult from base are not directly used by AgentGradingOutput,
// but might be relevant if this agent's output needs to be transformed into that structure later.
// For now, AgentGradingOutput is self-contained.
// import { GradingResult, QuestionResult } from '../../activties/models/base';

// Placeholder for LLM interaction - replace with actual service/client
async function getLlmEvaluation(prompt: string): Promise<string> {
  // Simulate LLM call
  console.log("LLM PROMPT (mocked):", prompt.substring(0, 500) + (prompt.length > 500 ? "..." : "")); // Log snippet
  // This is a mock. In reality, this would call an LLM API.
  // The response format would need to be carefully designed and parsed.
  // For example, it might return JSON with selected level_id, points, and feedback.
  if (prompt.includes("Content Criterion")) {
    return JSON.stringify({ level_name: "Good", points: 8, feedback: "The content is relevant and well-supported with examples, though some areas could be more developed." });
  }
  if (prompt.includes("Organization Criterion")) {
    return JSON.stringify({ level_name: "Excellent", points: 5, feedback: "The essay is well-organized with a clear introduction, body, and conclusion. Transitions are smooth." });
  }
  if (prompt.includes("Grammar and Mechanics")) {
    return JSON.stringify({ level_name: "Needs Improvement", points: 2, feedback: "Several grammatical errors and awkward sentences were noted. Proofreading is advised." });
  }
  // Default fallback for unmocked criteria
  return JSON.stringify({ level_name: "N/A", points: 0, feedback: "This criterion could not be evaluated by the mock." });
}

export interface AgentGradingOutput {
  totalScore: number;
  maxScore: number;
  criteriaResults: Array<{
    criterionId: string;
    criterionName: string;
    achievedLevelName?: string;
    score: number;
    maxPoints: number;
    feedback?: string;
  }>;
  overallFeedback?: string;
}

export class EssayGradingAgent {
  constructor() {
    // Initialization if needed (e.g., API keys, LLM client setup)
    console.log("EssayGradingAgent initialized.");
  }

  private constructPromptForCriterion(
    essayText: string,
    criterion: EssayRubricCriterion
  ): string {
    let prompt = `Student Essay:\n---\n${essayText}\n---\n\n`;
    prompt += `You are an AI grading assistant. Evaluate the student's essay based *only* on the following criterion:\n`;
    prompt += `Criterion: ${criterion.name}\n`;
    prompt += `Description: "${criterion.description}"\n`;
    prompt += `Maximum Points for this criterion: ${criterion.points}\n\n`;
    prompt += "Consider the following performance levels for this criterion:\n";
    criterion.levels.forEach(level => {
      prompt += `- Level: "${level.name}" (Points: ${level.points}): ${level.description}\n`;
    });
    prompt += "\nInstructions for AI:\n";
    prompt += "1. Carefully read the student's essay and the grading criterion details provided.\n";
    prompt += "2. Determine which performance level best describes the essay's performance *for this specific criterion only*.\n";
    prompt += "3. Provide specific, constructive feedback related to this criterion, explaining your reasoning for selecting the level.\n";
    prompt += "4. Respond *only* with a single JSON object in the following format (do not add any text before or after the JSON object):\n";
    prompt += `{ "level_name": "<name_of_the_chosen_level>", "points": <points_awarded_for_this_criterion_based_on_chosen_level>, "feedback": "<qualitative_feedback_for_this_criterion>" }\n`;
    prompt += "Ensure the points awarded match the points defined for the chosen level.\n";
    return prompt;
  }

  public async gradeEssay(
    essayText: string,
    rubric: EssayRubric
  ): Promise<AgentGradingOutput> {
    let totalScore = 0;
    const criteriaResults: AgentGradingOutput['criteriaResults'] = [];

    console.log(`Grading essay. Rubric has ${rubric.criteria.length} criteria. Total points: ${rubric.totalPoints}`);

    for (const criterion of rubric.criteria) {
      const prompt = this.constructPromptForCriterion(essayText, criterion);
      try {
        const llmResponseRaw = await getLlmEvaluation(prompt);
        const llmResponse = JSON.parse(llmResponseRaw) as { level_name: string; points: number; feedback: string };

        // Validate LLM response structure (basic validation)
        if (typeof llmResponse.level_name !== 'string' || typeof llmResponse.points !== 'number' || typeof llmResponse.feedback !== 'string') {
            throw new Error("LLM response did not match expected format.");
        }

        const achievedLevel = criterion.levels.find(l => l.name === llmResponse.level_name);
        let score = 0;

        if (achievedLevel) {
            // Prefer points from LLM if they are consistent with rubric, otherwise use rubric's points for the level.
            // This allows LLM to potentially award partial points if the rubric level definitions were more granular in a real scenario,
            // but for strict adherence to rubric levels, using achievedLevel.points is safer.
            // For this implementation, we'll trust the LLM's point if the level matches, else 0.
            // A more robust solution might check if llmResponse.points is one of the possible points for the criterion.
            score = llmResponse.points;
            // Or, to strictly use rubric points: score = achievedLevel.points; (and ensure llmResponse.points aligns or log discrepancy)

        } else if (llmResponse.level_name !== "N/A") {
            // LLM provided a level name not in the rubric. This is an issue.
             console.warn(`LLM returned level "${llmResponse.level_name}" not found in rubric for criterion "${criterion.name}". Awarding 0 points.`);
        }


        totalScore += score;
        criteriaResults.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          achievedLevelName: llmResponse.level_name || achievedLevel?.name, // Use LLM's reported level name
          score: score,
          maxPoints: criterion.points,
          feedback: llmResponse.feedback,
        });
      } catch (error: any) {
        console.error(`Error evaluating criterion "${criterion.name}":`, error.message);
        criteriaResults.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          achievedLevelName: 'Error processing evaluation',
          score: 0,
          maxPoints: criterion.points,
          feedback: `Failed to evaluate this criterion. Error: ${error.message || 'Unknown error'}`,
        });
      }
    }

    // Constructing a more detailed overall feedback
    let overallFeedback = `The essay achieved a total score of ${totalScore} out of ${rubric.totalPoints}.\n\nIndividual Criterion Feedback:\n`;
    criteriaResults.forEach(cr => {
        overallFeedback += `- ${cr.criterionName}: Scored ${cr.score}/${cr.maxPoints}. Level: ${cr.achievedLevelName || 'N/A'}. Feedback: ${cr.feedback}\n`;
    });
    if (totalScore >= rubric.totalPoints * 0.8) { // Example of a general comment
        overallFeedback += "\nOverall, a strong performance demonstrating good understanding and application of the required skills."
    } else if (totalScore >= rubric.totalPoints * 0.5) {
        overallFeedback += "\nOverall, a satisfactory performance, but there are areas for improvement as noted in the criteria feedback."
    } else {
        overallFeedback += "\nOverall, the essay did not meet the required standards. Please review the feedback for each criterion carefully to identify areas for improvement."
    }


    return {
      totalScore,
      maxScore: rubric.totalPoints,
      criteriaResults,
      overallFeedback,
    };
  }
}

// Example Usage (for testing purposes, would not be here in final code)
/*
async function testAgent() {
  const agent = new EssayGradingAgent();
  const sampleRubric: EssayRubric = {
    criteria: [
      {
        id: 'c1', name: 'Content Criterion', description: 'Assesses the quality, depth, and relevance of the essay\'s content, including arguments, evidence, and examples.',
        points: 10,
        levels: [
          { id: 'l1a', name: 'Excellent', description: 'Content is comprehensive, insightful, and directly relevant. Arguments are well-supported with strong evidence and examples.', points: 10 },
          { id: 'l1b', name: 'Good', description: 'Content is relevant and mostly well-developed. Arguments are generally supported with adequate evidence.', points: 8 },
          { id: 'l1c', name: 'Fair', description: 'Content is somewhat relevant but lacks depth or development. Arguments may be weak or poorly supported.', points: 5 },
          { id: 'l1d', name: 'Needs Improvement', description: 'Content is of limited relevance, poorly developed, or contains inaccuracies. Arguments are largely unsupported.', points: 2 },
        ]
      },
      {
        id: 'c2', name: 'Organization Criterion', description: 'Evaluates the structure, coherence, and flow of the essay, including introduction, body paragraphs, and conclusion.',
        points: 5,
        levels: [
          { id: 'l2a', name: 'Excellent', description: 'Essay is logically structured with a clear introduction, well-organized body paragraphs, and a strong conclusion. Transitions are smooth and effective.', points: 5 },
          { id: 'l2b', name: 'Good', description: 'Essay is generally well-structured, but may have minor issues with organization or flow. Transitions are mostly clear.', points: 3 },
          { id: 'l2c', name: 'Needs Improvement', description: 'Essay lacks clear structure or organization. Transitions are awkward or missing. Difficult to follow.', points: 1 },
        ]
      },
      {
        id: 'c3', name: 'Grammar and Mechanics', description: 'Assesses accuracy in grammar, spelling, punctuation, and sentence structure.',
        points: 5,
        levels: [
          { id: 'l3a', name: 'Excellent', description: 'Few, if any, errors in grammar, spelling, or punctuation. Sentences are clear and well-constructed.', points: 5 },
          { id: 'l3b', name: 'Good', description: 'Some minor errors in grammar or mechanics, but they do not significantly impede understanding.', points: 3 },
          { id: 'l3c', name: 'Needs Improvement', description: 'Frequent errors in grammar or mechanics that sometimes impede understanding.', points: 1 },
        ]
      }
    ],
    totalPoints: 20 // Adjusted total points
  };
  const sampleEssay = "Technology's impact on society is a multifaceted topic. While advancements connect us globally and drive innovation, they also raise concerns about privacy and job displacement. For instance, social media fosters communication but can also lead to misinformation. The structure of this argument aims to be clear. However, some sentences might be a bit clunky. Overall, I think this is a good attempt.";

  console.log("Starting testAgent...");
  const result = await agent.gradeEssay(sampleEssay, sampleRubric);
  console.log("Grading Result (testAgent):", JSON.stringify(result, null, 2));
}
// testAgent();
*/
