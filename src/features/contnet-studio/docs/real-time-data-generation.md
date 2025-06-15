# Real-Time Data Generation in Content Studio

This document explains how the Content Studio generates real-time data for activities using the agent system, rather than using mock data.

## Overview

The Content Studio uses a multi-agent orchestration system to generate real-time content for activities. This ensures that each activity has unique, contextually relevant content based on the selected subject, topic, and other parameters.

## Implementation Details

### Agent-Based Content Generation

The primary service responsible for generating content is `agent-content-generator.service.ts`. This service:

1. Takes parameters like subject, topic, activity type, and difficulty level
2. Creates an enhanced prompt for the AI model
3. Uses Google Generative AI (Gemini) to generate real-time content
4. Refines the content using specialized agents (AssessmentAgent or ContentRefinementAgent)
5. Returns structured activity data with questions and settings

### Key Components

- **generateContent()**: Main function that orchestrates the content generation process
- **generateContentWithAgents()**: Uses the agent system and Google Generative AI to create content
- **createStructuredPromptForActivityType()**: Creates activity-specific prompts
- **refineContentWithAgent()**: Enhances the AI-generated content with metadata

### AI Integration

The system uses Google's Generative AI (Gemini 2.0 Flash) to generate content. The API key is retrieved from environment variables:

```typescript
// Try to get the API key from environment variables
let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// If not found and we're on the server, try the server-side variable
if (!apiKey && typeof window === 'undefined') {
  apiKey = process.env.GEMINI_API_KEY;
}

// For backward compatibility, try the old variable names
if (!apiKey) {
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
}
```

## Specialized Agents

The system uses two main types of agents:

1. **AssessmentAgent**: Specialized for creating assessment activities with question generation capabilities
2. **ContentRefinementAgent**: Specialized for refining educational content with style adaptation

## Data Flow

1. User selects parameters in the AIStudioDialog
2. The dialog calls `generateContent()` with these parameters
3. The service creates a prompt and calls the Google Generative AI API
4. The API returns structured content in JSON format
5. The content is refined by the appropriate agent
6. The final content is returned to the dialog for display and editing

## Error Handling

If there's an error during content generation, the system will:

1. Log detailed error information
2. Throw an error with a descriptive message
3. Display an error toast to the user

The system does NOT fall back to mock data on errors, ensuring that users are aware when real-time generation fails.

## Recent Changes

The system was recently updated to:

1. Remove all mock data generation code from AIStudioDialog.tsx
2. Ensure the agent-content-generator.service.ts properly uses real-time data
3. Implement proper error handling without fallbacks to mock data
4. Add better logging to track the content generation process

## Testing

When testing the system:

1. Ensure the GEMINI_API_KEY environment variable is properly set
2. Check the console logs for "Using real-time data from agent generation"
3. Verify that generated content is unique and contextually relevant
4. Test error scenarios by temporarily using an invalid API key

## Troubleshooting

If you encounter issues:

1. Check that the API key is valid and properly configured
2. Look for detailed error messages in the console
3. Verify network connectivity to the Google Generative AI API
4. Ensure the prompt is properly formatted for the activity type
