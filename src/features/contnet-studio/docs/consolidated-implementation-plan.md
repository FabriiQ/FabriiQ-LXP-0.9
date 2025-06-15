# Consolidated Implementation Plan: Content Creation Pages & Integration

This plan consolidates Phase 4 (Refactor Content Creation Pages) and Phase 6 (Integration with Existing Components) to create a comprehensive implementation strategy that avoids redundant work and ensures proper integration with existing components.

## Existing Components Overview

### Content Studio Components
- **Core Components**
  - `ContentTypeSelector` (`src/features/contnet-studio/components/ContentTypeSelector.tsx`) - For selecting content type
  - `ContentCreationFlow` (`src/features/contnet-studio/components/ContentCreationFlow.tsx`) - Unified flow for content creation
  - `ClassSelector` (`src/features/contnet-studio/components/ClassSelector.tsx`) - For selecting class context
  - `SubjectSelector` (`src/features/contnet-studio/components/SubjectSelector.tsx`) - For selecting subject context
  - `HierarchicalTopicSelector` (`src/features/contnet-studio/components/HierarchicalTopicSelector.tsx`) - For selecting topics
  - `LearningObjectivesSelector` (`src/features/contnet-studio/components/LearningObjectivesSelector.tsx`) - For selecting learning objectives

- **Flow Components**
  - `StepBasedFlow` (`src/features/contnet-studio/components/flow/StepBasedFlow.tsx`) - For step-by-step flows
  - `ContentCreationLayout` (`src/features/contnet-studio/components/layout/ContentCreationLayout.tsx`) - Layout for content creation

- **Form Components**
  - `AIParametersForm` (`src/features/contnet-studio/components/forms/AIParametersForm.tsx`) - For AI generation parameters
  - `TeachingMethodsSelector` (`src/features/contnet-studio/components/forms/TeachingMethodsSelector.tsx`) - For selecting teaching methods

- **Preview Components**
  - `ContentPreview` (`src/features/contnet-studio/components/preview/ContentPreview.tsx`) - For previewing generated content

### Canvas Integration Components
- **Core Components**
  - `CanvasStateProvider` (`src/features/canvas/state/CanvasStateProvider.tsx`) - State management for Canvas
  - `ContentComposer` (`src/features/canvas/composers/ContentComposer.tsx`) - For creating and editing content
  - `ArtifactRenderer` (`src/features/canvas/artifacts/ArtifactRenderer.tsx`) - For rendering different types of content

- **Renderer Components**
  - `WorksheetRenderer` (`src/features/canvas/artifacts/renderers/WorksheetRenderer.tsx`) - For rendering worksheets
  - `AssessmentRenderer` (`src/features/canvas/artifacts/renderers/AssessmentRenderer.tsx`) - For rendering assessments
  - `QuestionRenderer` (`src/features/canvas/artifacts/renderers/QuestionRenderer.tsx`) - For rendering questions
  - `MarkdownRenderer` (`src/features/canvas/artifacts/renderers/MarkdownRenderer.tsx`) - For rendering markdown content

## 0. Multi-Agent Orchestration Integration

### 0.1 Integrate with Agent Orchestration System

- [ ] Integrate with `AgentOrchestratorProvider` from `src/features/agents/core/AgentOrchestratorProvider.tsx`
  - [ ] Use `registerAgent` to create specialized agents for each content type
  - [ ] Implement proper agent communication for multi-step content generation
  - [ ] Ensure proper memory management across agent interactions
- [ ] Leverage specialized agents from `src/features/agents/specialized/`
  - [ ] Use `WorksheetAgent` for worksheet generation
  - [ ] Use `AssessmentAgent` for assessment generation
  - [ ] Use `LessonPlanAgent` for lesson plan generation
  - [ ] Use `ContentRefinementAgent` for content improvement
- [ ] Implement agent tools integration
  - [ ] Connect to `createPrintLayoutTool` for worksheets and assessments
  - [ ] Connect to `createQuestionGeneratorTool` for assessments
  - [ ] Connect to `createTopicDataTool` for content context
  - [ ] Connect to `createActivityDataTool` for lesson plans
- [ ] Set up agent registry integration
  - [ ] Use `AgentRegistry` from `src/features/agents/core/AgentRegistry.ts`
  - [ ] Ensure proper agent type registration
  - [ ] Implement lazy loading of agent implementations

## 1. Activity Creation & Integration

### 1.1 Refactor Activity Creation Page with Existing Components

- [ ] Refactor `ActivityCreationPage` (`src/features/contnet-studio/pages/ActivityCreationPage.tsx`) to use reusable components
  - [ ] Integrate `StepBasedFlow` from `src/features/contnet-studio/components/flow/StepBasedFlow.tsx`
  - [ ] Use `ContentCreationLayout` from `src/features/contnet-studio/components/layout/ContentCreationLayout.tsx`
  - [ ] Implement `AIParametersForm` from `src/features/contnet-studio/components/forms/AIParametersForm.tsx`
  - [ ] Add `ContentPreview` from `src/features/contnet-studio/components/preview/ContentPreview.tsx`

### 1.2 Extract & Integrate Activity-Specific Components

- [ ] Create `ActivityTypeSelector` using existing `ActivityTypeSelectorGrid` from `src/components/teacher/activities/enhanced/ActivityTypeSelectorGrid.tsx`
  - [ ] Ensure it loads activity types from `src/features/activities/types/*`
  - [ ] Connect to existing activity registry
- [ ] Implement `ActivityParametersForm` that works with all activity types
  - [ ] Support all activity types from the registry
  - [ ] Use schema validation from activity type definitions
- [ ] Create `ActivityPreview` that uses existing `ActivityViewer` from `src/components/teacher/activities/enhanced/ActivityViewer.tsx`
  - [ ] Implement wrapper for student/teacher view switching
  - [ ] Add error handling for missing activity types
  - [ ] Ensure responsive design compatibility

### 1.3 Enhance ActivityTypeBridge Integration

- [ ] Enhance `ActivityTypeBridge` TypeMapper in `src/features/contnet-studio/ActivityTypeBridge`
  - [ ] Consolidate duplicate activity types (e.g., 'fill-in-blanks'/'fill-in-the-blanks')
  - [ ] Ensure consistent mapping between high-level types and specific IDs
  - [ ] Add comprehensive activity type display names
  - [ ] Implement purpose detection for activity types
- [ ] Integrate with existing activity editor components
  - [ ] Use `ActivityEditor` from `src/components/teacher/activities/enhanced/ActivityEditor.tsx`
  - [ ] Implement consistent form validation
  - [ ] Add auto-save functionality
  - [ ] Ensure proper error handling
- [ ] Integrate with activity analytics
  - [ ] Connect to existing `ActivityAnalyticsWrapper`
  - [ ] Implement completion tracking with existing hooks
  - [ ] Use existing performance metrics collection

### 1.4 Integrate with Multi-Agent Orchestration for Activity Generation

- [ ] Create specialized activity generation flow using `AgentType.CONTENT_REFINEMENT`
  - [ ] Implement activity-specific agent configuration
  - [ ] Connect to activity type registry for proper content structure
  - [ ] Add activity-specific tools and capabilities
- [ ] Implement agent communication for multi-step activity generation
  - [ ] Use `AgentCollaborationManager` for coordinating generation steps
  - [ ] Implement proper message passing between agents
  - [ ] Set up feedback loops for content refinement
- [ ] Add teacher preference integration
  - [ ] Use `TeacherPreferenceMemory` to store and retrieve preferences
  - [ ] Implement adaptive generation based on past feedback
  - [ ] Create preference learning system for activity types

### 1.5 Update Tests for Activity Integration skip fr now

- [ ] Test integration with reusable components
  - [ ] Test `StepBasedFlow` integration
  - [ ] Test `ContentCreationLayout` integration
  - [ ] Test `AIParametersForm` integration
  - [ ] Test `ContentPreview` integration
- [ ] Test activity-specific functionality
  - [ ] Test `ActivityTypeSelector` with all activity types
  - [ ] Test `ActivityParametersForm` with various activity types
  - [ ] Test `ActivityPreview` with different content
- [ ] Test `ActivityTypeBridge` with all activity types
  - [ ] Test activity viewer integration with various content
  - [ ] Test activity editor integration with edge cases
  - [ ] Test analytics integration with mock data
  - [ ] Test error handling with missing activity types
- [ ] Test responsive behavior and accessibility

## 2. Assessment Creation & Integration

### 2.1 Refactor Assessment Creation Page with Existing Components

- [ ] Refactor `AssessmentCreationPage` to use reusable components
  - [ ] Integrate `StepBasedFlow` from `src/features/contnet-studio/components/flow/StepBasedFlow.tsx`
  - [ ] Use `ContentCreationLayout` from `src/features/contnet-studio/components/layout/ContentCreationLayout.tsx`
  - [ ] Implement `AIParametersForm` from `src/features/contnet-studio/components/forms/AIParametersForm.tsx`
  - [ ] Add `ContentPreview` from `src/features/contnet-studio/components/preview/ContentPreview.tsx`

### 2.2 Extract & Integrate Assessment-Specific Components

- [ ] Create `AssessmentTypeSelector` based on assessment categories from `AssessmentCategory` enum
  - [ ] Support all assessment types (QUIZ, TEST, EXAM, etc.)
  - [ ] Use consistent styling with `ActivityTypeSelector`
- [ ] Implement `AssessmentParametersForm` using schema from `AssessmentForm` (`src/app/admin/campus/classes/[id]/assessments/components/AssessmentForm.tsx`)
  - [ ] Support all assessment types
  - [ ] Use schema validation
- [ ] Create `AssessmentPreview` component
  - [ ] Support print preview mode
  - [ ] Show question types correctly
  - [ ] Handle different assessment formats

### 2.3 Integrate with Multi-Agent Orchestration for Assessment Generation

- [ ] Implement specialized assessment generation using `AgentType.ASSESSMENT`
  - [ ] Use `createAssessmentAgent` from `src/features/agents/specialized/AssessmentAgent.ts`
  - [ ] Configure assessment-specific tools and capabilities
  - [ ] Implement assessment template creation
- [ ] Set up assessment-specific agent tools
  - [ ] Connect to `createQuestionGeneratorTool` for diverse question types
  - [ ] Implement `analyzeAssessmentDifficulty` tool
  - [ ] Implement `generateRubric` tool for scoring guides
- [ ] Create assessment generation workflow
  - [ ] Implement multi-step assessment creation process
  - [ ] Add difficulty balancing capabilities
  - [ ] Implement educational standards alignment

### 2.4 Integrate with Canvas System for Assessment Rendering

- [ ] Implement Canvas integration for assessments
  - [ ] Use `CanvasStateProvider` from `src/features/canvas/state/CanvasStateProvider.tsx`
  - [ ] Integrate `ContentComposer` from `src/features/canvas/composers/ContentComposer.tsx`
  - [ ] Connect to `ArtifactRenderer` from `src/features/canvas/artifacts/ArtifactRenderer.tsx`
- [ ] Set up assessment-specific renderers
  - [ ] Use `AssessmentRenderer` from `src/features/canvas/artifacts/renderers/AssessmentRenderer.tsx`
  - [ ] Connect to `QuestionRenderer` for rendering questions
  - [ ] Connect to `MarkdownRenderer` for rendering instructions
- [ ] Implement print layout optimization
  - [ ] Create print-specific CSS for assessments
  - [ ] Add page break controls for long assessments
  - [ ] Implement answer key generation for printed assessments

### 2.5 Update Tests for Assessment Integration

- [ ] Test integration with reusable components
  - [ ] Test `StepBasedFlow` integration
  - [ ] Test `ContentCreationLayout` integration
  - [ ] Test `AIParametersForm` integration
  - [ ] Test `ContentPreview` integration
- [ ] Test assessment-specific functionality
  - [ ] Test `AssessmentTypeSelector` with all assessment types
  - [ ] Test `AssessmentParametersForm` with various assessment types
  - [ ] Test `AssessmentPreview` with different content
- [ ] Test agent integration
  - [ ] Test assessment agent creation and configuration
  - [ ] Test assessment generation workflow
  - [ ] Test tool execution and error handling
- [ ] Test responsive behavior and accessibility

## 3. Worksheet Creation & Integration

### 3.1 Refactor Worksheet Creation Page with Existing Components

- [ ] Refactor `WorksheetCreationPage` to use reusable components
  - [ ] Integrate `StepBasedFlow` from `src/features/contnet-studio/components/flow/StepBasedFlow.tsx`
  - [ ] Use `ContentCreationLayout` from `src/features/contnet-studio/components/layout/ContentCreationLayout.tsx`
  - [ ] Implement `AIParametersForm` from `src/features/contnet-studio/components/forms/AIParametersForm.tsx`
  - [ ] Add `ContentPreview` from `src/features/contnet-studio/components/preview/ContentPreview.tsx`

### 3.2 Extract & Integrate Worksheet-Specific Components

- [ ] Create `WorksheetTypeSelector` based on `WorksheetTemplateType` from `src/features/agents/specialized/WorksheetAgent.ts`
  - [ ] Support all worksheet types (STANDARD, PRACTICE, ASSESSMENT, REVIEW, HOMEWORK)
  - [ ] Use consistent styling with other type selectors
- [ ] Implement `WorksheetParametersForm`
  - [ ] Support all worksheet types
  - [ ] Include print layout options
- [ ] Create `WorksheetPreview` component that uses `WorksheetRenderer` from `src/features/canvas/artifacts/renderers/WorksheetRenderer.tsx`
  - [ ] Support print preview mode
  - [ ] Show worksheet sections correctly
  - [ ] Handle different worksheet formats

### 3.3 Integrate with Multi-Agent Orchestration for Worksheet Generation

- [ ] Implement specialized worksheet generation using `AgentType.WORKSHEET`
  - [ ] Use `createWorksheetAgent` from `src/features/agents/specialized/WorksheetAgent.ts`
  - [ ] Configure worksheet-specific tools and capabilities
  - [ ] Implement worksheet template creation based on `WorksheetTemplateType`
- [ ] Set up worksheet-specific agent tools
  - [ ] Connect to `createPrintLayoutTool` for print optimization
  - [ ] Implement `generateAnswerKey` tool
  - [ ] Connect to Canvas artifact system for structured worksheets
- [ ] Create worksheet generation workflow
  - [ ] Implement multi-step worksheet creation process
  - [ ] Add print layout optimization
  - [ ] Implement educational standards alignment

### 3.4 Integrate with Canvas System for Worksheet Rendering

- [ ] Implement Canvas integration for worksheets
  - [ ] Use `CanvasStateProvider` from `src/features/canvas/state/CanvasStateProvider.tsx`
  - [ ] Integrate `ContentComposer` from `src/features/canvas/composers/ContentComposer.tsx`
  - [ ] Connect to `ArtifactRenderer` from `src/features/canvas/artifacts/ArtifactRenderer.tsx`
- [ ] Set up worksheet-specific renderers
  - [ ] Use `WorksheetRenderer` from `src/features/canvas/artifacts/renderers/WorksheetRenderer.tsx`
  - [ ] Connect to `QuestionRenderer` for rendering questions
  - [ ] Connect to `MarkdownRenderer` for rendering instructions
  - [ ] Connect to `TableRenderer` for rendering tables
- [ ] Implement print layout optimization
  - [ ] Create print-specific CSS
  - [ ] Add page break controls
  - [ ] Implement header/footer for printed pages
  - [ ] Add answer key generation for printed worksheets

### 3.5 Update Tests for Worksheet Integration  skip fr now

- [ ] Test integration with reusable components
  - [ ] Test `StepBasedFlow` integration
  - [ ] Test `ContentCreationLayout` integration
  - [ ] Test `AIParametersForm` integration
  - [ ] Test `ContentPreview` integration
- [ ] Test worksheet-specific functionality
  - [ ] Test `WorksheetTypeSelector` with all worksheet types
  - [ ] Test `WorksheetParametersForm` with various worksheet types
  - [ ] Test `WorksheetPreview` with different content
- [ ] Test agent integration
  - [ ] Test worksheet agent creation and configuration
  - [ ] Test worksheet generation workflow
  - [ ] Test print layout optimization
  - [ ] Test answer key generation
- [ ] Test Canvas integration
  - [ ] Test `CanvasStateProvider` integration
  - [ ] Test `ContentComposer` functionality
  - [ ] Test `ArtifactRenderer` with worksheet content
  - [ ] Test `WorksheetRenderer` with various section types
  - [ ] Test print layout rendering
- [ ] Test responsive behavior and accessibility

## 4. Lesson Plan Creation & Integration

### 4.1 Refactor Lesson Plan Creation Page with Existing Components

- [ ] Refactor `LessonPlanCreationPage` (`src/features/contnet-studio/pages/LessonPlanCreationPage.tsx`) to use reusable components
  - [ ] Integrate `StepBasedFlow` from `src/features/contnet-studio/components/flow/StepBasedFlow.tsx`
  - [ ] Use `ContentCreationLayout` from `src/features/contnet-studio/components/layout/ContentCreationLayout.tsx`
  - [ ] Implement `AIParametersForm` from `src/features/contnet-studio/components/forms/AIParametersForm.tsx`
  - [ ] Add `ContentPreview` from `src/features/contnet-studio/components/preview/ContentPreview.tsx`

### 4.2 Integrate with Existing Lesson Plan Components

- [ ] Use `LessonPlanForm` from `src/components/teacher/lesson-plans/LessonPlanForm.tsx`
  - [ ] Ensure compatibility with form schema
  - [ ] Integrate with AI-generated content
- [ ] Leverage existing `LearningObjectivesSelector` from `src/features/contnet-studio/components/LearningObjectivesSelector.tsx`
  - [ ] Implement AI-assisted learning objectives based on topics
  - [ ] Connect to topic selection
- [ ] Connect to existing `TeachingMethodsSelector` from `src/features/contnet-studio/components/forms/TeachingMethodsSelector.tsx`
  - [ ] Create AI-suggested teaching methods based on content
- [ ] Use existing `DateRangeSelector` component
  - [ ] Ensure proper date validation
- [ ] Implement `PlanStructureEditor`
  - [ ] Support different lesson plan types
  - [ ] Allow customization of sections
- [ ] Implement `ResourceLinker`
  - [ ] Add AI-recommended resources based on objectives
  - [ ] Allow manual resource addition

### 4.3 Enhance Lesson Plan Content Structure

- [ ] Ensure compatibility with `lessonPlanContentSchema`
  - [ ] Implement proper validation for all content sections
  - [ ] Add time allocation for activities and assessments
  - [ ] Create differentiation planning options
- [ ] Improve lesson plan workflow integration
  - [ ] Connect to existing approval workflow
  - [ ] Implement status tracking and visualization
  - [ ] Add reflection capabilities for completed plans
  - [ ] Create notification system for status changes
- [ ] Enhance lesson plan AI generation
  - [ ] Implement AI-suggested activities and assessments
  - [ ] Connect to existing activity and assessment selection

### 4.4 Integrate with Multi-Agent Orchestration for Lesson Plan Generation

- [ ] Implement specialized lesson plan generation using `AgentType.LESSON_PLAN`
  - [ ] Use `createLessonPlanAgent` from `src/features/agents/specialized/LessonPlanAgent.ts`
  - [ ] Configure lesson plan-specific tools and capabilities
  - [ ] Implement curriculum alignment features
- [ ] Set up lesson plan-specific agent tools
  - [ ] Connect to `createActivityDataTool` for activity integration
  - [ ] Implement teaching method suggestion tool
  - [ ] Create differentiation planning tool
- [ ] Create lesson plan generation workflow
  - [ ] Implement multi-step lesson plan creation process
  - [ ] Add collaborative planning with other agent types
  - [ ] Implement educational standards alignment
- [ ] Implement agent memory for lesson plan preferences
  - [ ] Store teacher preferences for lesson structure
  - [ ] Learn from past lesson plan feedback
  - [ ] Adapt to teaching style over time

### 4.5 Update Tests for Lesson Plan Integration  skip fr now

- [ ] Test integration with reusable components
  - [ ] Test `StepBasedFlow` integration
  - [ ] Test `ContentCreationLayout` integration
  - [ ] Test `AIParametersForm` integration
  - [ ] Test `ContentPreview` integration
- [ ] Test lesson plan-specific functionality
  - [ ] Test `LessonPlanForm` integration
  - [ ] Test `LearningObjectivesSelector` with AI suggestions
  - [ ] Test `TeachingMethodsSelector` with AI suggestions
  - [ ] Test `DateRangeSelector`
  - [ ] Test `PlanStructureEditor`
  - [ ] Test `ResourceLinker`
- [ ] Test agent integration
  - [ ] Test lesson plan agent creation and configuration
  - [ ] Test lesson plan generation workflow
  - [ ] Test activity and assessment integration
  - [ ] Test teaching method suggestion
  - [ ] Test differentiation planning
- [ ] Test AI-assisted generation features
  - [ ] Test workflow status transitions
  - [ ] Test content validation with edge cases
  - [ ] Test integration with activities and assessments

## 5. Content Conversion

### 5.1 Activity to Worksheet Conversion

- [ ] Implement activity to worksheet conversion using `ConvertToActivityInput` from `src/server/api/services/worksheet.service.ts`
  - [ ] Create conversion UI
  - [ ] Add conversion options (paper size, formatting, etc.)
  - [ ] Implement conversion logic
- [ ] Add activity type mapping
  - [ ] Map activity types to printable worksheet formats
  - [ ] Create content transformation for print-friendly output
  - [ ] Add validation for printability
- [ ] Implement preview of converted worksheet
  - [ ] Create side-by-side preview (digital vs. print)
  - [ ] Add print layout options (spacing, font size, etc.)
  - [ ] Implement edit options for worksheet customization

### 5.2 Integrate Multi-Agent Orchestration for Content Conversion

- [ ] Use `AgentType.CONTENT_REFINEMENT` for conversion optimization
  - [ ] Configure specialized conversion agent
  - [ ] Implement content structure transformation
  - [ ] Add print layout optimization
- [ ] Implement agent tools for conversion
  - [ ] Create activity-to-worksheet transformation tool
  - [ ] Implement print layout optimization tool
  - [ ] Add content validation tool
- [ ] Set up conversion workflow
  - [ ] Create multi-step conversion process
  - [ ] Implement feedback loop for conversion quality
  - [ ] Add teacher preference integration for conversion settings

### 5.3 Write Tests for Content Conversion  skip fr now

- [ ] Test conversion UI and workflow
  - [ ] Test conversion UI
  - [ ] Test mapping logic
  - [ ] Test preview
  - [ ] Test print output validation
- [ ] Test agent integration
  - [ ] Test conversion agent creation and configuration
  - [ ] Test transformation tools
  - [ ] Test print layout optimization
  - [ ] Test error handling and edge cases
