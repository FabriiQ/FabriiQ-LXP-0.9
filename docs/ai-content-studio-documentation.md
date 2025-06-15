# AI Content Studio Documentation

## Overview

The AI Content Studio is a powerful tool that allows teachers to create AI-powered educational activities for their students. It provides a streamlined, dialog-based interface for generating various types of activities, including quizzes, readings, videos, discussions, and more.

## Architecture

The AI Content Studio follows a modern, component-based architecture that prioritizes performance, reusability, and maintainability:

### Key Components

1. **AIStudioDialog**: The main dialog component that orchestrates the multi-step activity creation process.
2. **HierarchicalTopicSelector**: A component that displays topics in a hierarchical structure (chapter → topic → subtopic) with visual differentiation and multi-selection capabilities.
3. **ActivityPreview**: A dynamic component that renders a preview of the generated activity based on its type.
4. **AIConversationInterface**: The interface for interacting with the AI to refine and customize the generated activity.
5. **GeneratingContent**: A component that provides visual feedback during the content generation process.

### Services

1. **ContentGeneratorService**: Handles the generation of AI-powered content for different activity types.
2. **TopicCacheService**: Provides caching for topic queries to improve performance with large datasets.
3. **AIResponseCacheService**: Caches AI responses to reduce API calls and improve performance.
4. **PerformanceMonitoringService**: Tracks and records performance metrics for optimization.

## Features

### Multi-Step Activity Creation

The AI Content Studio guides users through a step-by-step process to create activities:

1. **Subject Selection**: Choose a subject for the activity.
2. **Topic Selection**: Select one or more topics for the activity using the hierarchical topic selector.
3. **Activity Type Selection**: Choose the type of activity to create (quiz, reading, video, etc.).
4. **Parameter Configuration**: Set parameters like difficulty level and number of questions.
5. **Prompt Refinement**: Customize the prompt for the AI to generate more specific content.
6. **Content Generation**: The AI generates the activity based on the selected parameters.
7. **Content Refinement**: Review and refine the generated content through the conversation interface.

### Hierarchical Topic Selection

The topic selector displays topics in a hierarchical structure with visual differentiation:

- **Chapters**: Displayed with purple borders
- **Topics**: Displayed with blue borders
- **Subtopics**: Displayed with green borders

Features include:

- **Multi-selection**: Select multiple topics at once
- **Parent-child selection**: Selecting a chapter automatically selects all its topics and subtopics
- **Individual deselection**: Unselect individual topics or subtopics even if their parent is selected
- **Search functionality**: Search for topics and auto-expand matching results

### Dynamic Activity Preview

The activity preview component dynamically renders a preview of the generated activity based on its type. It includes:

- **Preview tab**: Shows how the activity will appear to students
- **JSON tab**: Shows the raw JSON data for the activity
- **Export functionality**: Export the activity as a JSON file

### Performance Optimizations

The AI Content Studio includes several performance optimizations:

- **Topic caching**: Caches topic queries to reduce database load
- **Virtualized lists**: Uses virtualization for efficient rendering of large lists
- **Lazy loading**: Loads components only when needed
- **Pagination**: Implements efficient pagination for large datasets
- **Performance monitoring**: Tracks and records performance metrics for optimization

## Usage Guide

### Creating an Activity

1. Click the "Create Activity" button in the teacher dashboard.
2. Select a subject from the list of available subjects.
3. Select one or more topics for the activity:
   - Browse the hierarchical structure to find relevant topics
   - Use the search box to find specific topics
   - Select chapters to automatically select all their topics and subtopics
   - Deselect individual topics if needed
4. Choose the type of activity you want to create.
5. Configure the parameters for the activity:
   - Set the difficulty level
   - Specify the number of questions
   - Configure other activity-specific parameters
6. Refine the prompt if needed to generate more specific content.
7. Click "Generate Activity" to create the activity.
8. Review and refine the generated content through the conversation interface.
9. Save or export the activity when you're satisfied with the result.

### Tips for Effective Prompts

- Be specific about the concepts you want to cover
- Mention any specific question types you prefer (e.g., multiple choice, true/false)
- Include any special instructions or requirements
- Specify the target audience or grade level
- Request examples or real-world applications if needed

## Technical Details

### Topic Caching

The topic cache service improves performance by caching topic queries:

- Uses an in-memory cache with a 5-minute TTL (Time To Live)
- Caches topics by subject, page, and search query
- Automatically invalidates cache entries when they expire
- Provides a wrapper function for caching topic queries

### Infinite Query Implementation

The AI Content Studio uses tRPC's infinite query capabilities for efficient pagination:

- Implements a `listTopicsInfinite` procedure in the subjectTopic router
- Uses cursor-based pagination for better performance
- Caches query results to reduce database load
- Automatically fetches more topics when the user scrolls to the bottom of the list

### Performance Monitoring

The performance monitoring service tracks and records performance metrics:

- Records the time taken for various operations
- Provides insights into performance bottlenecks
- Helps identify areas for optimization

## Troubleshooting

### Common Issues

1. **Slow topic loading**: If topics are loading slowly, try:
   - Clearing your browser cache
   - Reducing the page size in the API call
   - Checking your network connection

2. **Content generation errors**: If you encounter errors during content generation:
   - Check that your prompt is clear and specific
   - Try a different activity type
   - Reduce the complexity of the request

3. **UI rendering issues**: If the UI is not rendering correctly:
   - Try refreshing the page
   - Clear your browser cache
   - Update your browser to the latest version

### Support

For additional support, please contact the system administrator or refer to the technical documentation for more detailed information.

## Future Enhancements

Planned enhancements for the AI Content Studio include:

1. **Enhanced AI capabilities**: Improved AI models for more accurate and relevant content generation
2. **Additional activity types**: Support for more types of educational activities
3. **Collaborative editing**: Allow multiple teachers to collaborate on activity creation
4. **Integration with LMS**: Seamless integration with popular Learning Management Systems
5. **Analytics**: Track and analyze student performance on AI-generated activities
