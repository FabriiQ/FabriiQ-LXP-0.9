# AI Studio Activity Generation Implementation Guide

## Overview

This document explains the technical implementation of AI Studio's activity generation feature, which uses Google Generative AI and specialized agents to create educational activities based on subject, topic, and learning outcomes.

## Implementation Details

The activity generation is implemented in `src/features/contnet-studio/services/agent-content-generator.service.ts`. The key components are:

1. **Agent-Based Content Generation**:
   - The service uses a multi-agent orchestration system to generate real-time content
   - Specialized agents (AssessmentAgent and ContentRefinementAgent) are used based on activity purpose
   - The system integrates with Google's Gemini model for AI-powered content generation

2. **Google Generative AI Integration**:
   - The service uses the official `@google/generative-ai` package to interact with Google's Gemini model
   - The API key is stored in the `.env` file as `GEMINI_API_KEY` or `NEXT_PUBLIC_GEMINI_API_KEY`
   - The service uses dynamic imports to load the Google Generative AI library only when needed

2. **Enhanced Prompt Engineering**:
   - The `createEnhancedPrompt` function creates detailed prompts that guide the AI to generate high-quality content
   - The prompt includes specific instructions to avoid self-referential questions and focus on actual content
   - The prompt is tailored to the specific activity type (multiple-choice, true-false, etc.)

3. **Fallback Mechanism**:
   - If the API call fails or the API key is missing, the service falls back to a simulated response
   - This ensures the application can continue to function even if the AI service is unavailable

4. **Response Processing**:
   - The AI response is parsed as JSON and merged with the base activity structure
   - The content is normalized to ensure compatibility with the activity viewers

## Troubleshooting

If you're experiencing issues with the AI-generated activities, check the following:

1. **API Key**:
   - Ensure the `GOOGLE_API_KEY` is correctly set in the `.env` file
   - Check the console logs for any API key related errors

2. **Network Issues**:
   - Check if the application can connect to Google's API
   - Look for network-related errors in the console

3. **Response Format**:
   - If the AI is generating content but it's not being displayed correctly, check the console for parsing errors
   - The AI response must be valid JSON that matches the expected structure

4. **Fallback Content**:
   - If you're seeing generic or template-like content, the system might be using the fallback mechanism
   - Check the console logs for messages about falling back to simulated responses

## Common Issues and Solutions

### Issue: Self-Referential Questions

**Problem**: The AI generates questions about the subject itself rather than about the actual content.

**Solution**: This typically happens when using the fallback content. Check if:
- The API key is correctly set
- There are any errors in the console related to the API call
- The AI response is being parsed correctly

### Issue: Generic Content

**Problem**: The AI generates generic content that lacks specific subject knowledge.

**Solution**:
- Provide more detailed topic descriptions and learning outcomes
- Check if the enhanced prompt is being sent correctly to the AI
- Ensure the AI response is being parsed and processed correctly

### Issue: Poor Quality Content

**Problem**: The AI generates content that is technically correct but not educationally valuable.

**Solution**:
- Refine the prompt to include more specific instructions
- Provide more context about the topic and learning outcomes
- Consider post-processing the AI response to improve quality

## Monitoring and Logging

The service includes extensive logging to help diagnose issues:

- The enhanced prompt is logged before sending to the AI
- Success or failure of the API call is logged
- The raw AI response is logged if parsing fails
- The processed content is logged before returning

Check the console logs for these messages to diagnose any issues with the activity generation process.

## Future Improvements

1. **Streaming Responses**:
   - Implement streaming responses to improve perceived performance
   - Show a loading indicator with progress updates

2. **Quality Checks**:
   - Add validation to ensure generated questions are relevant
   - Filter out self-referential or meta-questions

3. **Prompt Refinement**:
   - Continuously refine prompts based on results
   - Add more examples of good questions

4. **Two-Step Generation**:
   - First, generate subject-specific content and facts
   - Then, generate questions based on that content
