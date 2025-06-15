import { EssayGradingAgent, AgentGradingOutput } from './EssayGradingAgent';
import { EssayRubric, EssayRubricCriterion } from '../../../question-bank/models/types'; // Adjusted path

// Mock the getLlmEvaluation function at the module level
// This Record will store prompt keywords and their corresponding mock responses.
const mockLlmResponses: Record<string, any> = {};

// We need to get the actual getLlmEvaluation for typing if it's exported,
// but the mock will be effective at runtime.
// The actual mocking is done via jest.mock below.
let actualGetLlmEvaluation: (prompt: string) => Promise<string>;

jest.mock('./EssayGradingAgent', () => {
  const originalModule = jest.requireActual('./EssayGradingAgent');
  // Store the original getLlmEvaluation if needed elsewhere, or for complex mocks.
  // actualGetLlmEvaluation = originalModule.getLlmEvaluation; // This line might cause issues if getLlmEvaluation is not exported or due to hoisting.
                                                              // It's safer to define the mock function directly.

  return {
    ...originalModule, // Spread original module to keep other exports like the class itself
    // Define the mock for getLlmEvaluation directly here
    getLlmEvaluation: jest.fn(async (prompt: string) => {
      // Find a response key (substring) that is contained in the prompt
      const key = Object.keys(mockLlmResponses).find(k => prompt.includes(k));
      if (key && mockLlmResponses[key]) {
        return JSON.stringify(mockLlmResponses[key]);
      }
      // Default mock response if no specific key matches (simulates an unexpected prompt or error)
      return JSON.stringify({ level_name: "Error_Mock", points: 0, feedback: "Mock LLM error: No matching response for prompt." });
    }),
  };
});

// After jest.mock, when we import from './EssayGradingAgent', 'getLlmEvaluation' will be the mocked version.
// We need to cast it to jest.Mock to access mockClear, etc.
const { getLlmEvaluation } = require('./EssayGradingAgent');
const mockedGetLlmEvaluation = getLlmEvaluation as jest.Mock;


describe('EssayGradingAgent', () => {
  let agent: EssayGradingAgent;
  const sampleRubric: EssayRubric = {
    criteria: [
      { id: 'c1', name: 'Content', description: 'Quality of content', points: 10, levels: [
        { id: 'l1a', name: 'Excellent_Content', description: 'Very good', points: 10 },
        { id: 'l1b', name: 'Good_Content', description: 'Good', points: 7 },
      ]},
      { id: 'c2', name: 'Organization', description: 'Structure', points: 5, levels: [
        { id: 'l2a', name: 'Excellent_Organization', description: 'Well structured', points: 5 },
        { id: 'l2b', name: 'Good_Organization', description: 'Okay structure', points: 3 },
      ]},
      { id: 'c3', name: 'Grammar', description: 'Correctness of grammar', points: 5, levels: [
        { id: 'l3a', name: 'Excellent_Grammar', description: 'Flawless grammar', points: 5 },
        { id: 'l3b', name: 'Good_Grammar', description: 'Minor errors', points: 3 },
      ]}
    ],
    totalPoints: 20 // 10 + 5 + 5
  };
  const sampleEssay = "This is a test essay about modern technology.";

  beforeEach(() => {
    agent = new EssayGradingAgent();
    // Reset mocks before each test
    mockedGetLlmEvaluation.mockClear();
    // Clear specific responses stored in our mockLlmResponses object
    for (const key in mockLlmResponses) {
      delete mockLlmResponses[key];
    }
  });

  describe('constructPromptForCriterion', () => {
    it('should generate a valid prompt including essay text, criterion details, and level descriptions', () => {
      const criterion = sampleRubric.criteria[0]; // Content criterion
      // Access private method for testing (common in Jest for specific unit tests)
      // Type assertion to access private method; alternative is to change method to protected or test through public API.
      const prompt = (agent as any).constructPromptForCriterion(sampleEssay, criterion);

      expect(prompt).toContain(sampleEssay);
      expect(prompt).toContain(`Criterion: ${criterion.name}`);
      expect(prompt).toContain(`Description: "${criterion.description}"`);
      expect(prompt).toContain(`Maximum Points for this criterion: ${criterion.points}`);
      criterion.levels.forEach(level => {
        expect(prompt).toContain(`Level: "${level.name}" (Points: ${level.points}): ${level.description}`);
      });
      expect(prompt).toContain('Respond *only* with a single JSON object');
      expect(prompt).toContain('"level_name": "<name_of_the_chosen_level>"');
    });
  });

  describe('gradeEssay', () => {
    it('should correctly grade based on mocked LLM responses for each criterion', async () => {
      // Setup specific mock responses for this test case
      mockLlmResponses['Content'] = { level_name: "Excellent_Content", points: 10, feedback: "Great content!" };
      mockLlmResponses['Organization'] = { level_name: "Good_Organization", points: 3, feedback: "Organization is okay." };
      mockLlmResponses['Grammar'] = { level_name: "Excellent_Grammar", points: 5, feedback: "Perfect grammar." };

      const result: AgentGradingOutput = await agent.gradeEssay(sampleEssay, sampleRubric);

      expect(mockedGetLlmEvaluation).toHaveBeenCalledTimes(3); // Called for each of the 3 criteria
      expect(result.totalScore).toBe(18); // 10 (Content) + 3 (Organization) + 5 (Grammar)
      expect(result.maxScore).toBe(20);
      expect(result.criteriaResults.length).toBe(3);

      expect(result.criteriaResults[0].criterionName).toBe('Content');
      expect(result.criteriaResults[0].score).toBe(10);
      expect(result.criteriaResults[0].achievedLevelName).toBe('Excellent_Content');
      expect(result.criteriaResults[0].feedback).toBe('Great content!');

      expect(result.criteriaResults[1].criterionName).toBe('Organization');
      expect(result.criteriaResults[1].score).toBe(3);
      expect(result.criteriaResults[1].achievedLevelName).toBe('Good_Organization');
      expect(result.criteriaResults[1].feedback).toBe('Organization is okay.');

      expect(result.criteriaResults[2].criterionName).toBe('Grammar');
      expect(result.criteriaResults[2].score).toBe(5);
      expect(result.criteriaResults[2].achievedLevelName).toBe('Excellent_Grammar');
      expect(result.criteriaResults[2].feedback).toBe('Perfect grammar.');
    });

    it('should handle LLM errors for a criterion gracefully and sum other scores', async () => {
      mockLlmResponses['Content'] = { level_name: "Excellent_Content", points: 10, feedback: "Great content!" };
      // No mock for "Organization", so it will use the default error mock from getLlmEvaluation
      // (which returns { level_name: "Error_Mock", points: 0, ... })
      mockLlmResponses['Grammar'] = { level_name: "Good_Grammar", points: 3, feedback: "Grammar is good." };

      const result: AgentGradingOutput = await agent.gradeEssay(sampleEssay, sampleRubric);

      expect(mockedGetLlmEvaluation).toHaveBeenCalledTimes(3);
      expect(result.totalScore).toBe(13); // 10 (Content) + 0 (Organization error) + 3 (Grammar)
      expect(result.criteriaResults.length).toBe(3);

      expect(result.criteriaResults[1].criterionName).toBe('Organization');
      expect(result.criteriaResults[1].score).toBe(0);
      expect(result.criteriaResults[1].achievedLevelName).toBe('Error_Mock'); // From default error mock
      expect(result.criteriaResults[1].feedback).toContain('Mock LLM error: No matching response for prompt.');
    });

    it('should handle if LLM returns a level name not in the rubric', async () => {
        mockLlmResponses['Content'] = { level_name: "NonExistent_Level", points: 7, feedback: "Tried a weird level." };
        mockLlmResponses['Organization'] = { level_name: "Excellent_Organization", points: 5, feedback: "Org ok." };
        mockLlmResponses['Grammar'] = { level_name: "Excellent_Grammar", points: 5, feedback: "Grammar ok." };

        const result = await agent.gradeEssay(sampleEssay, sampleRubric);
        expect(result.totalScore).toBe(10); // 0 for Content + 5 for Org + 5 for Grammar
        expect(result.criteriaResults[0].score).toBe(0);
        expect(result.criteriaResults[0].achievedLevelName).toBe("NonExistent_Level");
        expect(result.criteriaResults[0].feedback).toBe("Tried a weird level.");
    });
  });
});
