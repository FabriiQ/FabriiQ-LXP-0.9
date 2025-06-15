import { gradeEssayActivity } from './essay';
import { EssayActivity, createDefaultEssayActivity } from '../models/essay';
import { GradingResult, ActivitySettings } from '../models/base'; // ActivitySettings might be needed for typing sampleActivity.settings
import { EssayGradingAgent, AgentGradingOutput } from '../../agents/specialized/EssayGradingAgent'; // Adjusted path

// Mock the EssayGradingAgent
// We want to control the output of its `gradeEssay` method.
jest.mock('../../agents/specialized/EssayGradingAgent');

// Define the type for the settings if not already part of EssayActivity directly in a more typed way
interface TestEssayActivitySettings extends ActivitySettings {
    passingPercentage?: number;
    showRubricToStudents?: boolean;
}


describe('gradeEssayActivity', () => {
  let sampleActivity: EssayActivity;
  const mockGradeEssayMethod = jest.fn(); // This will be our mock for agent.gradeEssay()

  beforeEach(() => {
    // Create a fresh default activity for each test
    sampleActivity = createDefaultEssayActivity();

    // Ensure a defined rubric for most tests, can be overridden per test if needed
    sampleActivity.rubric = {
      criteria: [
        { id: 'c1', name: 'Content', description: 'Quality of content', points: 10, levels: [
            {id: 'l1a', name: 'Excellent', description: 'Excellent content', points: 10},
            {id: 'l1b', name: 'Good', description: 'Good content', points: 7}
        ]},
        { id: 'c2', name: 'Organization', description: 'Structure of essay', points: 5, levels: [
            {id: 'l2a', name: 'Excellent', description: 'Well organized', points: 5},
            {id: 'l2b', name: 'Good', description: 'Decently organized', points: 3}
        ]}
      ],
      totalPoints: 15
    };
    sampleActivity.isGradable = true;
    // Explicitly type settings for the test
    sampleActivity.settings = { passingPercentage: 60, showRubricToStudents: true } as TestEssayActivitySettings;

    // Reset and configure the mock for EssayGradingAgent for each test
    (EssayGradingAgent as jest.Mock).mockClear();
    mockGradeEssayMethod.mockClear();
    // Mock implementation of the EssayGradingAgent constructor
    (EssayGradingAgent as jest.Mock).mockImplementation(() => {
      return {
        gradeEssay: mockGradeEssayMethod, // agentInstance.gradeEssay will now be this mock function
      };
    });
  });

  it('should correctly call the EssayGradingAgent and map its output to GradingResult', async () => {
    const agentOutput: AgentGradingOutput = {
      totalScore: 12, // 7 (Content) + 5 (Organization)
      maxScore: 15,
      criteriaResults: [
        { criterionId: 'c1', criterionName: 'Content', achievedLevelName: 'Good', score: 7, maxPoints: 10, feedback: 'Content was good.' },
        { criterionId: 'c2', criterionName: 'Organization', achievedLevelName: 'Excellent', score: 5, maxPoints: 5, feedback: 'Organization was excellent.' }
      ],
      overallFeedback: 'Overall a good effort. Organization was particularly strong.'
    };
    mockGradeEssayMethod.mockResolvedValue(agentOutput); // Configure agent.gradeEssay to return this

    const essaySubmissionText = "This is the student's essay submission.";
    const result: GradingResult = await gradeEssayActivity(sampleActivity, essaySubmissionText);

    // Verify that the agent's gradeEssay method was called correctly
    expect(mockGradeEssayMethod).toHaveBeenCalledTimes(1);
    expect(mockGradeEssayMethod).toHaveBeenCalledWith(essaySubmissionText, sampleActivity.rubric);

    // Verify the mapping to GradingResult
    expect(result.score).toBe(12);
    expect(result.maxScore).toBe(15);
    expect(result.percentage).toBe((12 / 15) * 100); // 80%
    expect(result.passed).toBe(true); // 80 >= 60 (default passingPercentage in sampleActivity)
    expect(result.overallFeedback).toBe('Overall a good effort. Organization was particularly strong.');

    expect(result.questionResults.length).toBe(1); // One "question" for the whole essay
    const questionResult = result.questionResults[0];
    expect(questionResult.points).toBe(12);
    expect(questionResult.maxPoints).toBe(15);
    expect(questionResult.feedback).toContain('Criterion: Content');
    expect(questionResult.feedback).toContain('Achieved Level: Good');
    expect(questionResult.feedback).toContain('AI Feedback: Content was good.');
    expect(questionResult.feedback).toContain('Criterion: Organization');
    expect(questionResult.feedback).toContain('Achieved Level: Excellent');
    expect(questionResult.feedback).toContain('AI Feedback: Organization was excellent.');
    expect(questionResult.explanation).toBe(agentOutput.overallFeedback);
  });

  it('should throw an error if activity has no rubric', async () => {
    sampleActivity.rubric = undefined; // Test condition
    await expect(gradeEssayActivity(sampleActivity, "Test essay")).rejects.toThrow('Cannot grade essay activity: No rubric provided.');
  });

  it('should throw an error if activity is not gradable', async () => {
    sampleActivity.isGradable = false; // Test condition
    await expect(gradeEssayActivity(sampleActivity, "Test essay")).rejects.toThrow('Activity is not set as gradable.');
  });

  it('should correctly determine "passed" status based on a different passingPercentage', async () => {
    const agentOutput: AgentGradingOutput = {
      totalScore: 7, maxScore: 15, criteriaResults: [], overallFeedback: 'Needs improvement.'
    };
    mockGradeEssayMethod.mockResolvedValue(agentOutput);

    // Set a different passing percentage for this test
    if (sampleActivity.settings) {
        (sampleActivity.settings as TestEssayActivitySettings).passingPercentage = 50;
    } else {
        sampleActivity.settings = { passingPercentage: 50 } as TestEssayActivitySettings;
    }

    const result: GradingResult = await gradeEssayActivity(sampleActivity, "Test essay");
    // 7/15 = 46.66...% which is less than 50%
    expect(result.passed).toBe(false);
    expect(result.percentage).toBeCloseTo((7/15)*100);
  });

   it('should handle agent failure or unexpected agent output gracefully', async () => {
    mockGradeEssayMethod.mockRejectedValue(new Error("AI Agent Failed"));

    await expect(gradeEssayActivity(sampleActivity, "Test essay")).rejects.toThrow("AI Agent Failed");
  });

  it('should use default passing percentage if not set in activity settings', async () => {
    const agentOutput: AgentGradingOutput = {
      totalScore: 10, maxScore: 15, criteriaResults: [], overallFeedback: 'Good.'
    }; // 10/15 = 66.66%
    mockGradeEssayMethod.mockResolvedValue(agentOutput);
    sampleActivity.settings = undefined; // Remove settings to test default

    const result = await gradeEssayActivity(sampleActivity, "test");
    expect(result.passed).toBe(true); // Default is 60, 66.66% >= 60%
  });
});
