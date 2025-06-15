# AI Studio Activity Generation Guide

## Overview

This document explains how the AI Studio generates activities and provides guidance on improving the quality of generated content.

## Current Implementation

The AI Studio uses Google Generative AI (Gemini) and a multi-agent orchestration system to create educational activities based on subject, topic, and learning outcomes. The implementation is in `src/features/contnet-studio/services/agent-content-generator.service.ts`.

### How It Works

1. **User Input Collection**:
   - Users select a subject, topic, activity type, and other parameters
   - Users can refine a prompt to guide the AI

2. **Prompt Engineering**:
   - The system creates a detailed prompt with specific instructions
   - The prompt includes subject, topic, learning outcomes, and formatting requirements

3. **AI Generation**:
   - The prompt is sent to Google Generative AI
   - The AI generates structured content based on the prompt

4. **Content Processing**:
   - The AI response is parsed and converted to the appropriate activity format
   - The content is normalized to ensure compatibility with the activity viewers

## Common Issues and Solutions

### Issue: Self-Referential Questions

**Problem**: The AI sometimes generates questions about the subject itself rather than about the actual content.

Example:
```
What is the relationship between Whole Numbers and Mathematics for Class 3?
```

**Solution**: The prompt now explicitly instructs the AI to avoid self-referential questions and provides examples of good questions.

### Issue: Generic Content

**Problem**: The AI sometimes generates generic content that lacks specific subject knowledge.

**Solution**: The prompt now includes:
- Topic description and context
- Learning outcomes
- Examples of good question types
- Instructions to focus on specific concepts and applications

### Issue: Poor Distractors

**Problem**: The AI sometimes creates obviously incorrect options that don't serve as good distractors.

**Solution**: The prompt now instructs the AI to create plausible but clearly incorrect alternative options.

## Best Practices for Activity Generation

1. **Provide Detailed Context**:
   - Include specific topic descriptions
   - Add learning outcomes
   - Specify grade level

2. **Refine the Prompt**:
   - Add specific concepts you want covered
   - Mention any special requirements
   - Include examples if needed

3. **Review and Edit**:
   - Always review AI-generated content
   - Edit questions to improve clarity
   - Ensure distractors are plausible but clearly incorrect

## Technical Implementation

The content generation process is implemented in `agent-content-generator.service.ts` with these key functions:

1. `generateContent()`: Main function that orchestrates the generation process
2. `createStructuredPromptForActivityType()`: Creates a detailed prompt for the AI
3. `generateContentWithAgents()`: Uses specialized agents to generate real-time content

### Prompt Template

The enhanced prompt template follows this structure:

```
Create a [difficulty] level [activity type] [purpose] activity about [topic] in [subject].
[Topic Description]
[Topic Context]
[Learning Outcomes]

Generate [number] questions that:
1. Test understanding of specific concepts and facts about [topic]
2. Are appropriate for the grade level
3. Align with the learning outcomes
4. Include clear, factual explanations for the correct answers
5. Have plausible but clearly incorrect alternative options

DO NOT create questions about the subject itself (e.g., "What is the relationship between [topic] and [subject]?").
Instead, create questions about actual concepts, facts, and applications within [topic].

For example, if the topic is "Whole Numbers", create questions about:
- Properties of whole numbers
- Operations with whole numbers
- Real-world applications of whole numbers
- Number patterns and sequences

Format the response as a JSON object with the following structure:
...
```

## Future Improvements

1. **Implement Google Generative AI Integration**:
   - Replace the simulation with actual API calls
   - Add error handling and retry logic

2. **Add Quality Checks**:
   - Implement validation to ensure generated questions are relevant
   - Filter out self-referential or meta-questions

3. **Enhance Prompt Engineering**:
   - Continuously refine prompts based on results
   - Add more examples of good questions

4. **Implement Two-Step Generation**:
   - First, generate subject-specific content and facts
   - Then, generate questions based on that content
