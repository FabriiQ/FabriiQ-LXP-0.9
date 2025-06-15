# Agent-Based Content Generation

This document describes the agent-based content generation approach used in the AI Studio for creating educational activities.

## Overview

The agent-based content generation system uses a multi-agent orchestration architecture to generate high-quality educational content. It leverages specialized agents for different types of activities and integrates with Google's Generative AI to produce content that is pedagogically sound, engaging, and aligned with educational standards.

## Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Orchestration Layer                     │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Agent       │ Agent       │ Token Limited   │ Agent            │
│ Registry    │ Factory     │ Orchestrator    │ Collaboration    │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    Specialized Agent Layer                       │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Worksheet   │ Assessment  │ Content         │ Lesson Plan      │
│ Agent       │ Agent       │ Refinement      │ Agent            │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Tool Layer                                │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Google      │ Print       │ Question        │ Student Data     │
│ Generative  │ Layout Tool │ Generator Tool  │ Tool             │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Memory Layer                              │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Memory      │ Teacher     │ Advanced        │ Reflection       │
│ Manager     │ Preference  │ Memory Manager  │ Manager          │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
```

### Key Components

1. **Agent Orchestration Layer**: Manages agent state, registration, and communication.
   - AgentOrchestratorProvider: Central component that provides a React Context for components to access agent functionality.
   - AgentRegistry: Manages the registration and retrieval of agent types and factory functions.
   - TokenLimitedAgentOrchestrator: Extends the base orchestrator with token usage tracking and budget enforcement.

2. **Specialized Agent Layer**: Contains specialized agents for different educational content types.
   - AssessmentAgent: Creates assessments with question generation capabilities.
   - ContentRefinementAgent: Refines content with style adaptation and clarity improvements.

3. **Tool Layer**: Provides specialized tools for agents to perform specific tasks.
   - Google Generative AI: Generates initial content based on structured prompts.
   - Question Generator Tool: Generates educational questions of various types.
   - Print Layout Tool: Optimizes content for printing.

4. **Memory Layer**: Provides sophisticated memory management for agents.
   - Memory Manager: Basic memory operations for agents.
   - Teacher Preference Memory: Stores and retrieves teacher preferences.
   - Advanced Memory Manager: Enhanced memory capabilities with TTL and metadata.

## Content Generation Process

The content generation process follows these steps:

1. **User Input**: The user provides input parameters such as subject, topic, activity type, difficulty level, and number of questions.

2. **Agent Selection**: The system selects the appropriate specialized agent based on the activity type and purpose.
   - Assessment activities use the AssessmentAgent.
   - Learning activities use the ContentRefinementAgent.

3. **Prompt Creation**: The system creates a structured prompt for the Google Generative AI model based on the activity type and user parameters.

4. **Initial Content Generation**: The Google Generative AI model generates initial content based on the structured prompt.

5. **Content Refinement**: The specialized agent refines the generated content, adding metadata, ensuring pedagogical soundness, and optimizing for the target audience.

6. **Final Content Delivery**: The refined content is delivered to the user interface for review and editing.

## Specialized Agents

### Assessment Agent

The Assessment Agent is specialized for creating educational assessments. It focuses on:

1. Aligning questions with educational standards and learning objectives.
2. Ensuring a balanced distribution of question difficulty.
3. Creating clear and unambiguous questions.
4. Generating appropriate feedback and explanations.
5. Creating scoring rubrics.

### Content Refinement Agent

The Content Refinement Agent is specialized for improving educational content. It focuses on:

1. Enhancing clarity and conciseness.
2. Improving engagement and interest for the target audience.
3. Ensuring pedagogical soundness.
4. Correcting errors and inconsistencies.
5. Optimizing formatting and structure.

## Integration with Google Generative AI

The system integrates with Google's Generative AI to generate initial content. The integration works as follows:

1. The system creates a structured prompt based on the activity type and user parameters.
2. The prompt is sent to the Google Generative AI model.
3. The model generates content in a structured JSON format.
4. The content is parsed and refined by the specialized agent.
5. The refined content is delivered to the user interface.

### API Key Configuration

To use Google Generative AI, you need to configure an API key. There are several ways to do this:

1. **Environment Variables (Recommended)**:
   - Create a `.env.local` file in the root of your project
   - Add your Google API key: `GOOGLE_API_KEY=your_api_key_here`
   - Next.js will automatically load this environment variable

2. **Server API Route**:
   - The system includes a secure API route at `/api/config/google-api-key`
   - This route provides the API key to the client without exposing it in client-side code
   - The API key is still stored in environment variables on the server

3. **Development Fallback**:
   - For development purposes only, the system includes a fallback mechanism
   - If no API key is found, it will use a hardcoded development key
   - This is not recommended for production use

To obtain a Google Generative AI API key:
1. Go to the [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## Fallback Mechanism

If the Google Generative AI integration fails (e.g., due to API key issues or network problems), the system falls back to a template-based content generation approach. This ensures that the system can continue to function even if the AI service is unavailable.

## Future Enhancements

Planned enhancements for the agent-based content generation system include:

1. **Enhanced Agent Collaboration**: Enabling multiple agents to collaborate on complex content generation tasks.
2. **Improved Memory Management**: Enhancing the memory system to better store and retrieve teacher preferences and student data.
3. **Advanced Tool Integration**: Adding more specialized tools for agents to use in content generation.
4. **Personalization**: Using student data to personalize generated content.
5. **Feedback Learning**: Enabling agents to learn from user feedback to improve future content generation.

## Usage

To use the agent-based content generation system, follow these steps:

1. Import the agent-based content generator service:
   ```typescript
   import { generateContent } from '@/features/contnet-studio/services/agent-content-generator.service';
   ```

2. Call the generateContent function with the appropriate parameters:
   ```typescript
   const content = await generateContent({
     subject: 'Mathematics',
     subjectId: 'math-101',
     topic: 'Algebra',
     topicId: 'algebra-101',
     activityType: 'multiple-choice',
     activityPurpose: ActivityPurpose.ASSESSMENT,
     numQuestions: 5,
     difficultyLevel: 'medium',
     prompt: 'Create questions about solving linear equations',
     teacherId: 'teacher-123',
     classId: 'class-456',
     topicDescription: 'Introduction to algebraic concepts',
     topicContext: 'Following arithmetic operations',
     learningOutcomes: 'Students will be able to solve linear equations'
   });
   ```

3. Use the generated content in your application:
   ```typescript
   // Display the content in the UI
   <AgentConversationInterface
     initialContent={content}
     onSave={handleSaveActivity}
     onBack={handleBack}
     activityType={activityType}
     activityTitle={content.title}
     activityPurpose={activityPurpose}
   />
   ```

## Conclusion

The agent-based content generation system provides a powerful, flexible framework for generating high-quality educational content. By leveraging specialized agents, Google's Generative AI, and a sophisticated memory system, it enables the creation of engaging, pedagogically sound activities that meet the needs of educators and students.
