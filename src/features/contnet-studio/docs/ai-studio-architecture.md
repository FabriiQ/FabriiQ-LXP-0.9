# AI Studio Architecture

## Overview

This document outlines the architecture for the AI Studio, providing separate flows for Lesson Plans, Activities, Assessments, and Worksheets. The architecture is designed to be streamlined, mobile-first, and performance-optimized, leveraging agentic AI for content generation.

## Content Type Distinctions

Based on the schema analysis, here are the key distinctions between the different content types:

### Lesson Plans
- **Purpose**: Organize teaching activities over a period (weekly or monthly)
- **Structure**: Contains learning objectives, topics, teaching methods, resources, activities, assessments, and homework
- **Workflow**: Requires approval from coordinators and administrators
- **Relationships**: Can contain multiple activities and assessments
- **Usage**: Used by teachers for planning and documentation

### Activities
- **Purpose**: Interactive online learning experiences
- **Types**: Reading, Video, Quiz, Multiple Choice, True/False, etc.
- **Structure**: Contains content specific to the activity type
- **Usage**: Assigned to students for online completion
- **Grading**: Can be gradable or non-gradable

### Assessments
- **Purpose**: Evaluate student knowledge and understanding
- **Types**: Quizzes, Tests, Exams, etc.
- **Structure**: Contains questions, grading criteria, and instructions
- **Usage**: Primarily for offline/printed evaluation
- **Grading**: Always gradable with specific grading scales

### Worksheets
- **Purpose**: Printable learning materials
- **Structure**: Contains static content for printing
- **Usage**: Distributed to students as physical materials
- **Conversion**: Can be converted to activities

## Current Issues and Solutions

### Activity Type Registration and Preview Issues

A persistent issue in the current implementation is that when an activity type is selected and AI generates content, the system often fails to correctly load the specific activity type editor or preview component. This issue stems from several root causes:

1. **Inconsistent Activity Type Mapping**
   - The mapping between high-level activity types (e.g., SELF_STUDY, QUIZ) and specific activity type IDs (e.g., 'multiple-choice', 'fill-in-the-blanks') is inconsistent
   - Different parts of the codebase use different mapping approaches

2. **Lazy Loading Challenges**
   - Activity type components are lazy-loaded for performance
   - The AI generation flow doesn't properly trigger the loading of these components

3. **Component Registration Timing**
   - Activity type components may not be registered when the preview attempts to render
   - The registration process happens asynchronously, leading to race conditions

4. **Missing Activity Type Information**
   - Generated content sometimes lacks the correct activityType property
   - The system falls back to generic components instead of type-specific ones

### Solution: Activity Type Bridge System

To address these issues, the architecture includes an enhanced Activity Type Bridge system:

1. **Centralized Type Mapping**
   - A single source of truth for mapping between activity types
   - Consistent mapping across all components and services

2. **Preloading Strategy**
   - Preload activity type components based on selected type
   - Ensure components are available before preview is rendered

3. **Activity Type Registry Integration**
   - Direct integration with the unified activity registry
   - Proper type checking and validation

4. **Content Transformation Layer**
   - Transform AI-generated content to match expected activity type structure
   - Ensure all required properties are present

5. **Fallback Mechanism**
   - Improved fallback system when specific components aren't available
   - Clear error messages and recovery options

#### Detailed Activity Type Bridge Implementation

The Activity Type Bridge system consists of several key components:

1. **TypeMapper**
   ```typescript
   // Centralized mapping between high-level types and specific activity type IDs
   export function mapActivityTypeToId(activityType: string, purpose: ActivityPurpose): string {
     // Comprehensive mapping tables for different purposes
     const learningTypeMapping: Record<string, string> = {
       'SELF_STUDY': 'multiple-choice',
       'INTERACTIVE': 'fill-in-the-blanks',
       'QUIZ': 'quiz',
       'READING': 'reading',
       'VIDEO': 'video',
       'DISCUSSION': 'discussion',
       // Additional mappings...
     };

     const assessmentTypeMapping: Record<string, string> = {
       'QUIZ': 'quiz',
       'TEST': 'multiple-choice',
       'EXAM': 'multiple-choice',
       'ASSESSMENT': 'multiple-choice',
       // Additional mappings...
     };

     // Select the appropriate mapping based on purpose
     const mapping = purpose === ActivityPurpose.ASSESSMENT
       ? assessmentTypeMapping
       : learningTypeMapping;

     // Return the mapped ID with validation and logging
     const mappedType = mapping[activityType] || activityType;
     console.log(`Mapped activity type ${activityType} to ${mappedType} for purpose ${purpose}`);

     return mappedType;
   }
   ```

2. **ComponentLoader**
   ```typescript
   // Preload activity type components
   export function preloadActivityTypeComponents(activityType: string, purpose: ActivityPurpose): void {
     // Map to specific activity type ID
     const activityTypeId = mapActivityTypeToId(activityType, purpose);

     // Preload the activity type components
     if (typeof window !== 'undefined') {
       // Import the activity registry
       import('@/features/activities/registry').then(() => {
         // Trigger preloading of the activity type
         import('@/features/activities/registry/loader').then(module => {
           module.prefetchActivityType(activityTypeId);
           console.log(`Preloaded activity type: ${activityTypeId}`);
         });
       });
     }
   }
   ```

3. **ContentTransformer**
   ```typescript
   // Transform AI-generated content to match expected activity type structure
   export function transformContent(content: any, activityType: string, purpose: ActivityPurpose): any {
     // Map to specific activity type ID
     const activityTypeId = mapActivityTypeToId(activityType, purpose);

     // Get the activity type definition
     const activityTypeDef = getActivityTypeForAIGeneration(activityTypeId);

     if (!activityTypeDef) {
       console.warn(`Activity type definition not found for: ${activityTypeId}`);
       return content;
     }

     // Create a properly structured content object
     const transformedContent = {
       ...content,
       activityType: activityTypeId,
       purpose: purpose,
       // Ensure all required properties are present
       title: content.title || 'Untitled Activity',
       config: content.config || content,
       // Add any other required fields
     };

     return transformedContent;
   }
   ```

4. **FallbackProvider**
   ```typescript
   // Provide fallback components when specific ones aren't available
   export function getFallbackComponent(activityType: string, componentType: 'editor' | 'viewer'): React.ComponentType<any> {
     // Default fallback components
     const fallbacks: Record<string, Record<string, React.ComponentType<any>>> = {
       editor: {
         default: GenericActivityEditor,
         'multiple-choice': MultipleChoiceEditor,
         'reading': ReadingEditor,
         // Additional fallbacks...
       },
       viewer: {
         default: GenericActivityViewer,
         'multiple-choice': MultipleChoiceViewer,
         'reading': ReadingViewer,
         // Additional fallbacks...
       }
     };

     // Return the appropriate fallback component
     return fallbacks[componentType][activityType] || fallbacks[componentType].default;
   }
   ```

5. **Integration with AI Studio**
   ```typescript
   // In AIStudioDialog.tsx
   const handleActivityTypeSelection = (type: string) => {
     setActivityType(type);

     // Preload components for this activity type
     preloadActivityTypeComponents(type, activityPurpose);
   };

   // In content generation service
   const generateContent = async (params: ContentGenerationParams) => {
     // Map activity type and preload components
     const activityTypeId = mapActivityTypeToId(params.activityType, params.activityPurpose);
     preloadActivityTypeComponents(params.activityType, params.activityPurpose);

     // Generate content
     const content = await aiAgent.generateContent(params);

     // Transform content to match expected structure
     return transformContent(content, params.activityType, params.activityPurpose);
   };

   // In ActivityPreview.tsx
   const renderActivityPreview = (content: any) => {
     // Get the activity type ID
     const activityTypeId = content.activityType ||
       mapActivityTypeToId(content.type || defaultType, content.purpose || defaultPurpose);

     // Get the component
     let ViewerComponent = getActivityViewer(activityTypeId);

     // If component not found, use fallback
     if (!ViewerComponent) {
       console.warn(`Viewer component not found for activity type: ${activityTypeId}, using fallback`);
       ViewerComponent = getFallbackComponent(activityTypeId, 'viewer');
     }

     // Render the component
     return <ViewerComponent activity={content} />;
   };
   ```

This comprehensive approach ensures that AI-generated content is correctly mapped to the appropriate activity type components, with proper preloading, transformation, and fallback mechanisms.

## Streamlined Architecture

The AI Studio architecture is redesigned to provide a unified yet specialized experience for generating different types of educational content.

### Core Components

1. **Content Type Selector**
   - Central entry point for all content generation
   - Clear distinction between content types
   - Visual indicators of content type characteristics

2. **Context Provider**
   - Manages shared context across all content types
   - Handles class, subject, and topic selection
   - Provides learning objectives suggestions

3. **Specialized Generators**
   - Lesson Plan Generator
   - Activity Generator
   - Assessment Generator
   - Worksheet Generator

4. **AI Conversation Interface**
   - Unified interface for all content types
   - Contextual controls based on content type
   - Real-time preview of generated content

5. **Content Integration System**
   - Handles saving and integration with the platform
   - Manages relationships between content types
   - Provides options for assignment and sharing

## Canvas Integration

The AI Studio leverages the Canvas system for enhanced content generation, particularly for worksheets and assessments. The Canvas system provides a powerful, conversation-based interface for generating complex content with rich formatting and structure.

### Canvas Components

1. **Canvas Agents**
   - Specialized LangGraph-based agents for different content types
   - State management for complex content generation
   - Tool-based generation for structured outputs
   - Reflection capabilities for improved content quality

2. **Content Composer**
   - Conversation-based interface for content generation
   - Real-time content preview and editing
   - Support for multiple content formats (text, code, etc.)
   - Integration with the AI Studio workflow

3. **Artifact System**
   - Structured representation of generated content
   - Support for different artifact types (markdown, code)
   - Version history and content revisions
   - Rendering components for different artifact types

4. **Canvas State Management**
   - Message history and conversation context
   - Artifact state and metadata
   - Highlighted content and selections
   - Language and formatting preferences

### Canvas Integration Points

The Canvas system integrates with the AI Studio at several key points:

1. **Worksheet Generation**
   - Uses Canvas agents for generating printable worksheets
   - Leverages artifact system for structured worksheet content
   - Provides specialized rendering for print layouts

2. **Assessment Generation**
   - Uses Canvas agents for generating comprehensive assessments
   - Supports various question types and formats
   - Includes answer keys and grading rubrics

3. **Content Refinement**
   - Provides conversation-based interface for refining content
   - Supports highlighting and focused editing of specific sections
   - Enables iterative improvement of generated content

## Teacher Preference System

The AI Studio includes a comprehensive preference system that remembers teacher preferences and adapts the experience accordingly.

### Preference Categories

1. **Content Preferences**
   - Preferred activity types
   - Typical difficulty levels
   - Formatting preferences
   - Language and tone preferences

2. **UI Preferences**
   - Default view modes
   - Preferred workflows
   - Recently used subjects and topics
   - Saved templates and prompts

3. **Generation Preferences**
   - Preferred AI models
   - Generation parameters
   - Output formats
   - Feedback patterns

### Preference Storage

1. **Server-Side Storage**
   - Long-term preferences stored in user profile
   - Synchronized across devices
   - Secure and persistent

2. **Client-Side Storage**
   - Session-specific preferences in localStorage
   - Draft content in IndexedDB
   - Content history and recent generations

3. **Memory System**
   - Contextual memory for AI interactions
   - Learning from past generations
   - Adaptation to teacher's style and needs

### Preference Integration

The preference system integrates with the AI Studio workflow to provide a personalized experience:

1. **Smart Defaults**
   - Pre-filled parameters based on past usage
   - Suggested content types for specific subjects
   - Adaptive difficulty based on class context

2. **Contextual Suggestions**
   - Recommended topics based on curriculum
   - Suggested learning objectives
   - Activity type recommendations

3. **Adaptive Interface**
   - Simplified workflows for frequent tasks
   - Advanced options for power users
   - Accessibility adaptations based on preferences

## Separate Content Flows

### 1. Lesson Plan Flow

```
Content Type Selection → Class Selection → Subject Selection → Date Range Selection →
Topic Selection → Learning Objectives Selection → Teaching Methods Selection →
Plan Structure Configuration → Generation Method Selection → AI Generation →
AI Conversation → Preview → Save/Publish
```

#### Specialized Components
- **Date Range Selector**: For selecting start and end dates
- **Plan Structure Editor**: For configuring the structure of the lesson plan
- **Learning Objectives Selector**: For selecting or creating learning objectives
- **Teaching Methods Selector**: For selecting teaching methodologies
- **Resource Linker**: For adding educational resources
- **Activity/Assessment Integrator**: For including existing or generating new activities/assessments

#### AI Agent Configuration
- Uses specialized prompts for educational planning
- Generates structured lesson plans with appropriate components
- Suggests activities and assessments that align with learning objectives
- Provides teaching strategies and resource recommendations

### 2. Activity Flow

```
Content Type Selection → Class Selection → Subject Selection → Topic Selection →
Activity Type Selection → Activity Parameters Configuration → Generation Method Selection →
AI Generation → AI Conversation → Preview → Save/Publish
```

#### Specialized Components
- **Activity Type Selector**: For selecting the specific activity type
- **Activity Parameters Form**: For configuring activity-specific parameters
- **Interactive Preview**: For testing the activity as a student would experience it
- **Grading Configuration**: For gradable activities

#### AI Agent Configuration
- Uses the existing Activity Agent
- Generates content appropriate for online interactive learning
- Creates engaging, pedagogically sound activities
- Ensures alignment with learning objectives and topics

### 3. Assessment Flow

```
Content Type Selection → Class Selection → Subject Selection → Topic Selection →
Assessment Type Selection → Assessment Parameters Configuration → Generation Method Selection →
AI Generation → AI Conversation → Preview → Save/Publish
```

#### Specialized Components
- **Assessment Type Selector**: For selecting the specific assessment type
- **Question Type Configuration**: For configuring the types of questions to include
- **Grading Scale Selector**: For selecting appropriate grading scales
- **Print Layout Preview**: For viewing how the assessment will appear when printed

#### AI Agent Configuration
- Uses the existing Assessment Agent
- Generates content appropriate for formal evaluation
- Creates varied question types with appropriate difficulty levels
- Includes answer keys and grading rubrics

### 4. Worksheet Flow

```
Content Type Selection → Class Selection → Subject Selection → Topic Selection →
Worksheet Type Selection → Worksheet Parameters Configuration → Generation Method Selection →
AI Generation → AI Conversation → Preview → Save/Publish
```

#### Specialized Components
- **Worksheet Type Selector**: For selecting the specific worksheet type
- **Print Layout Configuration**: For configuring the layout for printing
- **Content Structure Editor**: For organizing worksheet sections
- **Activity Conversion Options**: For converting to online activities if desired

#### AI Agent Configuration
- Specialized for generating printable content
- Creates structured worksheets with appropriate spacing and formatting
- Includes answer sections and teacher notes
- Optimizes for print layout

## Shared Components

All flows share these common components to ensure consistency and reduce redundancy:

1. **Class Selector**
   - Displays classes associated with the teacher
   - Provides quick access to recently used classes
   - Includes class details (grade level, subject focus)

2. **Subject Selector**
   - Displays subjects based on selected class
   - Includes subject icons and color coding
   - Shows recently used subjects first

3. **HierarchicalTopicSelector**
   - Displays topics in a hierarchical structure
   - Implements virtualization for performance
   - Allows multi-selection with visual indicators
   - Shows topic details on selection

4. **LearningObjectivesSelector**
   - Suggests learning objectives based on selected topics
   - Allows custom learning objective creation
   - Groups objectives by taxonomy (Bloom's, etc.)

5. **GenerationMethodSelector**
   - Offers choice between AI generation and manual creation
   - Provides clear explanation of each option
   - Remembers user preferences

6. **AIConversationInterface**
   - Unified interface for all content types
   - Contextual controls based on content type
   - Real-time preview of generated content
   - Chat-based interaction for refinement

## Technical Implementation

### 1. Component Architecture

```
AIStudioProvider
├── ContentTypeSelector
├── ContextProvider
│   ├── ClassSelector
│   ├── SubjectSelector
│   ├── TopicSelector
│   └── LearningObjectivesSelector
├── ContentGenerators
│   ├── AgentContentGenerator
│   ├── LessonPlanGenerator
│   ├── ActivityGenerator
│   ├── AssessmentGenerator
│   └── WorksheetGenerator
├── CanvasIntegration
│   ├── ContentComposer
│   ├── ArtifactRenderer
│   └── CanvasAgentProvider
├── AIConversationInterface
├── ActivityTypeBridge
│   ├── TypeMapper
│   ├── ComponentLoader
│   ├── ContentTransformer
│   └── FallbackProvider
├── PreferenceSystem
│   ├── PreferenceProvider
│   ├── PreferenceStorage
│   └── AdaptiveDefaults
└── ContentIntegrationSystem
```

### 2. State Management

- **Global State**: Content type, class, subject, topics
- **Generator-Specific State**: Parameters specific to each content type
- **Conversation State**: Chat history, content revisions
- **Canvas State**: Artifacts, highlights, selections
- **Preference State**: User preferences and adaptive settings
- **Preview State**: Current version of generated content

### 3. API Integration

- **Content Generation API**: Unified endpoint with content-type-specific parameters
- **Content Storage API**: Specialized endpoints for each content type
- **Context API**: Endpoints for retrieving classes, subjects, topics, and learning objectives
- **Preference API**: Endpoints for storing and retrieving user preferences
- **Canvas API**: Endpoints for Canvas-specific operations

### 4. Agent System

- **Agent Factory**: Creates specialized agents for each content type
- **Agent Nodes**: Specialized nodes for different generation tasks
- **Tool Schemas**: Structured output formats for each content type
- **Canvas Agents**: LangGraph-based agents for complex content generation
- **Memory System**: Contextual memory for personalized content generation
- **Caching System**: Efficient caching of agent responses

## Mobile-First Implementation

The AI Studio is designed with a mobile-first approach to ensure optimal performance and usability on all devices:

1. **Responsive Layout**
   - Single-column layout on mobile
   - Multi-column layout on larger screens
   - Adaptive component sizing

2. **Touch-Friendly Controls**
   - Large touch targets
   - Swipe gestures for navigation
   - Bottom sheet dialogs for mobile

3. **Progressive Loading**
   - Essential components load first
   - Non-critical components load on demand
   - Skeleton screens during loading

4. **Offline Capabilities**
   - Draft saving
   - Offline content generation queue
   - Background synchronization

5. **Performance Optimizations**
   - Virtualized lists
   - Image optimization
   - Code splitting
   - Lazy loading

## Performance Optimization

To ensure optimal performance, especially with large datasets:

1. **Data Loading**
   - Pagination for large datasets
   - Virtualization for long lists
   - Prefetching based on user behavior

2. **AI Processing**
   - Request queuing for concurrent requests
   - Caching of AI responses
   - Progressive generation for large content

3. **UI Rendering**
   - Component memoization
   - Virtualized rendering
   - Optimized re-renders

4. **Network Optimization**
   - Request batching
   - Response compression
   - Selective updates

## Alternative Simplified Flow

For users who prefer a simpler experience, an alternative streamlined flow is provided:

```
Content Type Selection → Quick Context Selection (Class + Subject) →
Topic Search/Selection → AI Generation → Preview → Save/Publish
```

This simplified flow:
- Reduces the number of steps
- Uses smart defaults based on user history
- Provides a more guided experience
- Offers fewer customization options
- Focuses on rapid content generation

## Implementation Plan

The implementation will follow a phased approach:

1. **Phase 1: Activity Type Bridge System**
   - Develop centralized type mapping system
   - Create component preloading strategy
   - Implement content transformation layer
   - Build improved fallback mechanism
   - Fix existing activity type registration issues

2. **Phase 2: Core Architecture**
   - Implement ContentTypeSelector
   - Implement shared ContextProvider
   - Create unified AIConversationInterface
   - Set up basic preference storage
   - Integrate with Activity Type Bridge

3. **Phase 3: Canvas Integration**
   - Integrate Canvas agents from existing codebase
   - Implement ContentComposer component
   - Create ArtifactRenderer for different content types
   - Set up Canvas state management
   - Ensure proper activity type handling

4. **Phase 4: Activity and Assessment Flows**
   - Implement ActivityGenerator
   - Implement AssessmentGenerator with Canvas integration
   - Connect to existing agents
   - Add activity-specific preferences
   - Test with all supported activity types

5. **Phase 5: Worksheet Flow**
   - Implement WorksheetGenerator with Canvas integration
   - Create print-optimized components
   - Leverage Canvas artifact system for structured worksheets
   - Add worksheet-specific preferences
   - Ensure proper activity type conversion

6. **Phase 6: Lesson Plan Flow**
   - Implement LessonPlanGenerator
   - Create specialized components
   - Develop lesson plan agent
   - Add lesson plan-specific preferences
   - Integrate with activities and assessments

7. **Phase 7: Preference System Enhancement**
   - Implement comprehensive preference provider
   - Create adaptive defaults based on usage patterns
   - Add contextual suggestions
   - Develop memory system for AI interactions
   - Store activity type preferences

8. **Phase 8: Integration and Optimization**
   - Integrate all flows
   - Implement performance optimizations
   - Add mobile-specific enhancements
   - Finalize preference synchronization
   - Comprehensive testing of all activity types

## Conclusion

This architecture provides a comprehensive, streamlined approach to generating educational content through the AI Studio. By separating the flows for different content types while maintaining shared components and context, the system offers a specialized yet consistent experience for educators.

The Activity Type Bridge system addresses a critical issue in the current implementation, ensuring that AI-generated content correctly maps to specific activity type editors and previews. This system provides a centralized mapping mechanism, preloading strategy, content transformation layer, and improved fallback mechanisms, resulting in a more reliable and consistent user experience.

The integration of the Canvas system enhances the AI Studio's capabilities for generating complex content, particularly for worksheets and assessments. The Canvas agents, content composer, and artifact system provide powerful tools for creating rich, structured educational materials with a conversation-based interface.

The teacher preference system adds a layer of personalization, remembering teacher preferences and adapting the experience accordingly. This system reduces repetitive tasks, provides smart defaults, and offers contextual suggestions, making the AI Studio more efficient and user-friendly over time.

The mobile-first, performance-optimized design ensures that the AI Studio works efficiently on all devices, even with large datasets. The agentic AI approach, with specialized agents for each content type and a memory system for personalized interactions, enables the generation of high-quality, pedagogically sound content tailored to specific educational needs and teaching styles.

By prioritizing the implementation of the Activity Type Bridge system, this architecture ensures that the fundamental issue of activity type mapping is resolved early in the development process, providing a solid foundation for the rest of the implementation.
