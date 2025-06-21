import { AIGradingResult, EssayGradingCriterion } from '../types/essay';
import { createAgent, AgentType } from '@/features/agents';

/**
 * Essay AI Grading Service
 * Provides AI-powered grading for essay assessments using the agent system
 */
export class EssayAIGradingService {
  private agent: any;

  constructor() {
    // Initialize the essay grading agent
    this.initializeAgent();
  }

  private async initializeAgent() {
    try {
      this.agent = await createAgent({
        type: AgentType.ESSAY_GRADING,
        name: 'Essay Grading Assistant',
        description: 'AI-powered essay grading with rubric-based evaluation',
        systemPrompt: `You are an expert essay grading assistant. You help teachers grade essays efficiently and fairly using rubric-based evaluation.`,
        tools: [],
        metadata: {}
      });
    } catch (error) {
      console.error('Failed to initialize essay grading agent:', error);
      this.agent = null;
    }
  }

  /**
   * Grade an essay using AI
   */
  async gradeEssay(
    essayContent: string,
    question: string,
    criteria: EssayGradingCriterion[],
    sampleAnswer?: string,
    keywords?: string[]
  ): Promise<AIGradingResult> {
    try {
      // Ensure agent is initialized
      if (!this.agent) {
        await this.initializeAgent();
      }

      if (!this.agent) {
        throw new Error('Essay grading agent not available');
      }

      // Use the agent's grading tool
      const result = await this.agent.tools.find((tool: any) => tool.name === 'gradeEssay')?.execute({
        essayContent,
        question,
        criteria,
        sampleAnswer,
        keywords
      });

      if (!result) {
        throw new Error('Grading tool not found or failed to execute');
      }

      console.log('Essay AI grading completed', {
        wordCount: essayContent.split(' ').length,
        overallScore: result.overallScore,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      console.error('Error in AI essay grading:', error);

      // Fallback to manual parsing if agent fails
      return this.createFallbackResult(criteria, error as Error);
    }
  }

  /**
   * Create fallback result when agent fails
   */
  private createFallbackResult(criteria: EssayGradingCriterion[], error: Error): AIGradingResult {
    const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
    return {
      overallScore: 0,
      maxScore,
      percentage: 0,
      criteriaScores: criteria.map(criterion => ({
        criterionId: criterion.id,
        score: 0,
        maxScore: criterion.maxScore,
        feedback: 'Unable to process AI grading response',
        confidence: 0.1
      })),
      overallFeedback: `AI grading encountered an error: ${error.message}. Please grade manually.`,
      strengths: [],
      improvements: ['Please review this essay manually'],
      gradedAt: new Date(),
      model: 'agent-based-grading',
      confidence: 0.1
    };
  }

  /**
   * Build the grading prompt for AI
   */
  private buildGradingPrompt(
    essayContent: string,
    question: string,
    criteria: EssayGradingCriterion[],
    sampleAnswer?: string,
    keywords?: string[]
  ): string {
    const criteriaDescription = criteria.map(criterion => {
      const levels = criterion.levels.map(level => 
        `- ${level.name} (${level.score} points): ${level.description}`
      ).join('\n');
      
      return `**${criterion.name}** (Weight: ${criterion.weight}, Max: ${criterion.maxScore} points)
${criterion.description || ''}
Performance Levels:
${levels}`;
    }).join('\n\n');

    let prompt = `You are an expert essay grader. Please grade the following essay based on the provided rubric criteria.

**Essay Question:**
${question}

**Essay Content:**
${essayContent}

**Grading Criteria:**
${criteriaDescription}`;

    if (sampleAnswer) {
      prompt += `\n\n**Sample Answer for Reference:**
${sampleAnswer}`;
    }

    if (keywords && keywords.length > 0) {
      prompt += `\n\n**Key Concepts to Look For:**
${keywords.join(', ')}`;
    }

    prompt += `\n\n**Instructions:**
1. Evaluate the essay against each criterion
2. Assign a score for each criterion based on the performance levels
3. Provide specific feedback for each criterion
4. Identify strengths and areas for improvement
5. Provide an overall assessment
6. Rate your confidence in this grading (0-1 scale)

**Response Format (JSON):**
{
  "criteriaScores": [
    {
      "criterionId": "criterion_id",
      "score": number,
      "maxScore": number,
      "feedback": "specific feedback",
      "confidence": number
    }
  ],
  "overallFeedback": "comprehensive feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "confidence": number,
  "bloomsLevelAnalysis": {
    "REMEMBER": number,
    "UNDERSTAND": number,
    "APPLY": number,
    "ANALYZE": number,
    "EVALUATE": number,
    "CREATE": number
  }
}`;

    return prompt;
  }

  /**
   * Parse AI response into structured grading result
   */
  private parseGradingResponse(
    response: string,
    criteria: EssayGradingCriterion[]
  ): AIGradingResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Calculate overall score
      const overallScore = parsed.criteriaScores.reduce(
        (sum: number, score: any) => sum + score.score, 
        0
      );
      const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
      const percentage = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;

      return {
        overallScore,
        maxScore,
        percentage,
        criteriaScores: parsed.criteriaScores.map((score: any) => ({
          ...score,
          criterionId: score.criterionId || criteria[0]?.id || 'unknown'
        })),
        overallFeedback: parsed.overallFeedback || 'No overall feedback provided',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        bloomsLevelAnalysis: parsed.bloomsLevelAnalysis,
        gradedAt: new Date(),
        model: 'gemini-2.0-flash',
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Error parsing AI grading response:', error);
      
      // Fallback: create a basic result
      const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
      return {
        overallScore: 0,
        maxScore,
        percentage: 0,
        criteriaScores: criteria.map(criterion => ({
          criterionId: criterion.id,
          score: 0,
          maxScore: criterion.maxScore,
          feedback: 'Unable to process AI grading response',
          confidence: 0.1
        })),
        overallFeedback: 'AI grading encountered an error. Please grade manually.',
        strengths: [],
        improvements: ['Please review this essay manually'],
        gradedAt: new Date(),
        model: 'gemini-2.0-flash',
        confidence: 0.1
      };
    }
  }

  /**
   * Generate feedback suggestions for manual grading
   */
  async generateFeedbackSuggestions(
    essayContent: string,
    question: string,
    currentScore?: number,
    maxScore?: number
  ): Promise<{
    suggestions: string[];
    strengths: string[];
    improvements: string[];
  }> {
    try {
      // Ensure agent is initialized
      if (!this.agent) {
        await this.initializeAgent();
      }

      if (!this.agent) {
        throw new Error('Essay grading agent not available');
      }

      // Use the agent's feedback generation tool
      const result = await this.agent.tools.find((tool: any) => tool.name === 'generateFeedbackSuggestions')?.execute({
        essayContent,
        question,
        currentScore,
        maxScore
      });

      if (result) {
        return result;
      }

      return {
        suggestions: ['Consider the essay structure and argument development'],
        strengths: ['Student attempted to address the question'],
        improvements: ['Could benefit from more detailed analysis']
      };
    } catch (error) {
      console.error('Error generating feedback suggestions:', error);
      return {
        suggestions: ['Please provide detailed feedback on content and structure'],
        strengths: ['Student submitted a complete response'],
        improvements: ['Consider areas for development']
      };
    }
  }

  /**
   * Analyze essay for Bloom's taxonomy levels
   */
  async analyzeBloomsLevels(
    essayContent: string,
    question: string
  ): Promise<Record<string, number>> {
    try {
      // Ensure agent is initialized
      if (!this.agent) {
        await this.initializeAgent();
      }

      if (!this.agent) {
        throw new Error('Essay grading agent not available');
      }

      // Use the agent's Bloom's analysis tool
      const result = await this.agent.tools.find((tool: any) => tool.name === 'analyzeBloomsLevels')?.execute({
        essayContent,
        question
      });

      if (result) {
        return result;
      }

      return {
        REMEMBER: 20,
        UNDERSTAND: 30,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 10,
        CREATE: 5
      };
    } catch (error) {
      console.error('Error analyzing Bloom\'s levels:', error);
      return {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };
    }
  }
}
