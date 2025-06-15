# Migration to Agent-Based Content Generation

This document explains the migration from the old `content-generator.service.ts` to the new agent-based content generation system implemented in `agent-content-generator.service.ts`.

## Overview

The AI Studio has been upgraded to use a multi-agent orchestration system for generating content instead of the previous approach that relied on mock data generation. This change ensures that all generated content is real-time, contextually relevant, and of higher quality.

## Key Changes

### 1. Removal of Mock Data Generation

The old implementation in `content-generator.service.ts` included functions like `simulateAIResponse()` and various `createSample*Content()` functions that generated template-based mock data. These have been completely removed in favor of real-time content generation.

### 2. Introduction of Agent-Based Architecture

The new implementation in `agent-content-generator.service.ts` uses a multi-agent orchestration system with specialized agents:

- **AssessmentAgent**: Specialized for creating assessment activities with question generation capabilities
- **ContentRefinementAgent**: Specialized for refining educational content with style adaptation

### 3. Enhanced API Integration

The new implementation has improved integration with Google's Generative AI (Gemini) API:

- Better error handling without fallbacks to mock data
- Improved API key management with support for multiple environment variable names
- Enhanced prompt engineering for better content generation

### 4. Improved Content Structure

The generated content now has a more consistent structure that:

- Aligns with the activities architecture
- Includes metadata about the generation process
- Provides better support for different activity types

## Migration Guide

### For Developers

If you were using the old `content-generator.service.ts`, you should update your imports to use the new service:

```typescript
// Old import (remove this)
import { generateContent } from '@/features/contnet-studio/services/content-generator.service';

// New import (use this instead)
import { generateContent } from '@/features/contnet-studio/services/agent-content-generator.service';
```

The function signature remains the same, so no other changes should be needed in most cases.

### For Tests

If your tests were relying on mock data generation functions from the old service, you should update them to:

1. Use the new agent-based service
2. Create proper test mocks for the agent-based content generation
3. Remove any dependencies on the old mock data generation functions

## API Key Configuration

The new service requires a Google Generative AI API key to be configured in the environment variables. The service will look for the key in the following variables (in order):

1. `NEXT_PUBLIC_GEMINI_API_KEY` (for client-side code)
2. `GEMINI_API_KEY` (for server-side code)
3. `NEXT_PUBLIC_GOOGLE_API_KEY` (for backward compatibility)
4. `GOOGLE_API_KEY` (for backward compatibility)

Make sure at least one of these variables is set in your environment.

## Error Handling

The new service has improved error handling:

- It will throw clear error messages when the API key is not configured
- It will not fall back to mock data on errors, ensuring that users are aware when real-time generation fails
- It includes detailed error information in the logs

## Performance Considerations

The agent-based content generation may be slightly slower than the previous mock data generation, but it provides much higher quality content. The service includes performance monitoring to help identify and address any performance issues.

## Documentation Updates

All documentation has been updated to reference the new agent-based content generator:

- `ai-studio-activity-generation.md`
- `ai-studio-activity-generation-implementation.md`
- `ai-studio-architecture.md`
- `real-time-data-generation.md`
