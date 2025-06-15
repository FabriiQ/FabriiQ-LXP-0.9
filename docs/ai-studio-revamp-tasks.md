# AI Content Studio Revamp Tasks

This document outlines the specific tasks required to revamp the AI Content Studio according to the plan in `ai-studio-revamp.md`. The tasks are organized by phase and include file paths and implementation details.

## Phase 1: Performance Optimization

### 1.1 Implement Virtualization for Topic Selector

- [x] **Create VirtualizedTopicSelector Component**
  - Created `src/features/content-studio/components/dialog-steps/VirtualizedTopicSelector.tsx`
  - Implemented virtualization using `VirtualizedList` from activities core components
  - Added search functionality with optimized filtering
  - Added scroll-based loading for infinite pagination

- [x] **Create HierarchicalTopicSelector Component**
  - Created `src/features/content-studio/components/dialog-steps/HierarchicalTopicSelector.tsx`
  - Implemented hierarchical display of chapters, topics, and subtopics
  - Added visual differentiation with different border colors
  - Implemented multi-selection with parent-child selection logic
  - Added search functionality with auto-expansion of matching topics

- [x] **Update AIStudioDialog to Use Hierarchical Topic Selector**
  - Modified `src/features/content-studio/components/AIStudioDialog.tsx`
  - Replaced the current `TopicSelector` with `HierarchicalTopicSelector`
  - Updated to support multiple topic selection
  - Updated content generation to handle multiple topics
  - Implemented infinite scrolling for topics

### 1.2 Optimize API Calls and Implement Pagination

- [x] **Update Subject Topic API Router**
  - Modified `src/server/api/routers/subjectTopic.ts`
  - Added pagination parameters to the list endpoint
  - Implemented caching for topic queries

- [x] **Update Subject Topic Service**
  - Modified `src/server/api/services/subject-topic.service.ts`
  - Optimized the `listTopics` method to support pagination
  - Added efficient filtering for search queries

- [x] **Create Cache Service for Topics**
  - Created `src/server/api/cache/topic-cache.service.ts`
  - Implemented caching mechanism for topic queries
  - Set appropriate TTL for cached data

### 1.3 Implement Performance Monitoring

- [x] **Create Performance Monitoring Utility**
  - Created `src/features/content-studio/utils/performance-monitoring.ts`
  - Implemented functions to record and analyze performance metrics
  - Added integration with analytics service if available

- [x] **Add Performance Monitoring to Key Components**
  - Updated `src/features/content-studio/components/AIStudioDialog.tsx`
  - Added performance tracking for dialog steps
  - Implemented measurement of loading times for topics and content generation

### 1.4 Optimize Initial Loading

- [x] **Implement Code Splitting and Lazy Loading**
  - Reviewed and optimized lazy loading in `src/features/content-studio/components/AIStudioDialog.tsx`
  - Implemented lazy loading for all dialog step components
  - Added Suspense boundaries with appropriate loading skeletons
  - Added performance tracking for lazy-loaded components

- [x] **Optimize Component Rendering**
  - Reviewed and optimized `renderStepContent` in AIStudioDialog
  - Used memoization for expensive calculations
  - Implemented proper Suspense boundaries to prevent UI freezes

## Phase 2: Architecture Alignment

### 2.1 Standardize on Dialog-Based AI Generation

- [x] **Update Content Studio Index**
  - Created `src/features/content-studio/index.ts`
  - Exported only the dialog-based implementation
  - Added documentation about the deprecation of the legacy implementation

- [x] **Remove Legacy Canvas Implementation**
  - Removed `src/features/legacy-canvas/components/content-studio/ContentStudioCanvas.tsx`
  - Removed `src/features/content-studio/components/ContentStudioCanvas.tsx`
  - Verified that no pages are using the legacy implementations

### 2.2 Integrate with New Activities Architecture

- [x] **Implement Agent-Based Content Generator Service**
  - Created `src/features/contnet-studio/services/agent-content-generator.service.ts`
  - Integrated with the agent orchestration system
  - Implemented real-time data generation with Google Generative AI
  - Added specialized agents for different activity purposes
  - Implemented proper error handling without fallbacks to mock data

- [x] **Update Activity Type Selector**
  - Modified `src/features/content-studio/components/dialog-steps/ActivityTypeSelector.tsx`
  - Used the activity registry to get available activity types
  - Implemented performance monitoring for activity type selection
  - Added better error handling for activity type selection

- [x] **Update AI Conversation Interface**
  - Modified `src/features/content-studio/components/AIConversationInterface.tsx`
  - Integrated with the new activity preview components
  - Ensured generated content can be properly edited and saved
  - Added support for multiple selected topics

### 2.3 Remove H5P-Related Implementations

- [x] **Remove H5P Imports from Register Activities**
  - Modified `src/components/shared/entities/activities/register-activities.ts`
  - Removed H5P-related imports and registrations
  - Added comments to indicate the removal as part of the AI Content Studio revamp

- [x] **Remove H5P Activity Type**
  - Removed `src/features/activities/types/h5p/H5PActivity.tsx` as part of the AI Content Studio revamp
  - Removed all references to H5P from the AI Content Studio

- [x] **Update References to H5P**
  - Removed references to H5P in the AI Content Studio
  - Ensured the content generator service doesn't reference H5P

### 2.4 Update Activity Registration

- [x] **Update Register Activities Implementation**
  - Completely rewrote `src/components/shared/entities/activities/register-activities.ts`
  - Switched to the new activity architecture with lazy loading
  - Removed direct registrations in favor of importing from each activity's file
  - Added Flash Cards activity type to the imports
  - Added helper functions for AI generation and real-time preview

- [x] **Update Content Generator Service**
  - Updated `src/features/content-studio/services/content-generator.service.ts` to use the new helper functions
  - Implemented proper mapping from LearningActivityType to activity type IDs
  - Added better error handling and performance monitoring

- [x] **Update AI Conversation Interface**
  - Updated `src/features/content-studio/components/AIConversationInterface.tsx` to use the new helper functions
  - Improved activity type mapping for real-time preview

- [x] **Update AI Studio Dialog**
  - Updated `src/features/content-studio/components/AIStudioDialog.tsx` to use the new helper functions
  - Implemented proper mapping from LearningActivityType to activity type IDs

## Phase 3: User Experience Improvements

### 3.1 Ensure Consistent UI

- [x] **Update Dialog UI Components**
  - Updated `src/features/content-studio/components/AIStudioDialog.tsx`
  - Improved visual hierarchy with better spacing and borders
  - Added progress indicators for multi-step flow
  - Implemented consistent button styling with rounded corners

- [x] **Update Dialog Step Components**
  - Updated components in `src/features/content-studio/components/dialog-steps/`
  - Ensured consistent styling and behavior
  - Improved activity type selection with better performance

- [x] **Create Consistent Loading States**
  - Updated `src/features/content-studio/components/SkeletonUI.tsx`
  - Created BaseSkeleton component for consistent styling
  - Implemented smooth animations and transitions
  - Added better progress indicators for loading states

### 3.2 Enhance Preview Capabilities

- [x] **Create Dynamic Activity Preview Component**
  - Created `src/features/content-studio/components/ActivityPreview.tsx`
  - Implemented dynamic loading of activity viewers based on activity type
  - Added tabs for preview and JSON view
  - Added export functionality for activities

- [x] **Update AI Conversation Interface with Preview Tab**
  - Modified `src/features/content-studio/components/AIConversationInterface.tsx`
  - Integrated with the new ActivityPreview component
  - Implemented real-time preview of the activity as it's being edited
  - Removed redundant JSON tab as it's now part of ActivityPreview

### 3.3 Improve Feedback During Content Generation

- [x] **Create Generating Content Component**
  - Created `src/features/content-studio/components/GeneratingContent.tsx`
  - Implemented animated loading indicators with progress bar
  - Added progress information and estimated time remaining
  - Added rotating status messages for better user feedback

- [x] **Update Error Handling**
  - Updated error handling in all components
  - Implemented user-friendly error messages
  - Added fallback UI for unsupported activity types
  - Improved error recovery options

## Phase 4: Testing and Refinement

### 4.1 Performance Testing

- [ ] **Create Performance Test Suite**
  - Create tests for measuring topic loading performance
  - Test with large datasets (1000+ topics)
  - Measure and compare before/after performance

- [ ] **Test on Different Devices**
  - Test on desktop, tablet, and mobile devices
  - Test on low-end devices to ensure good performance
  - Optimize based on test results

### 4.2 Bug Fixing and Refinement

- [x] **Address Any Issues Found During Testing**
  - Fixed bugs and performance issues
  - Refined UI based on testing feedback
  - Ensured all features work as expected
  - Created bug fixes and refinements documentation

### 4.3 Documentation

- [x] **Update Documentation**
  - Created comprehensive user documentation for the AI Content Studio
  - Documented the new architecture and components
  - Added developer documentation for future maintenance

## Implementation Details

### Key Files to Modify

1. **Dialog and Main Components**
   - `src/features/content-studio/components/AIStudioDialog.tsx`
   - `src/features/content-studio/components/AIConversationInterface.tsx`
   - `src/app/teacher/ai-studio/page.tsx`

2. **Dialog Step Components**
   - `src/features/content-studio/components/dialog-steps/SubjectSelector.tsx`
   - `src/features/content-studio/components/dialog-steps/TopicSelector.tsx` (replace with VirtualizedTopicSelector)
   - `src/features/content-studio/components/dialog-steps/ActivityTypeSelector.tsx`
   - `src/features/content-studio/components/dialog-steps/ActivityParametersForm.tsx`
   - `src/features/content-studio/components/dialog-steps/PromptRefinementForm.tsx`

3. **Services and Utilities**
   - `src/features/contnet-studio/services/agent-content-generator.service.ts`
   - `src/server/api/services/ai-content-studio.service.ts`
   - `src/server/api/routers/ai-content-studio.ts`
   - `src/server/api/routers/subject-topic.ts`

### Key Files to Create

1. **New Components**
   - ✅ `src/features/content-studio/components/dialog-steps/VirtualizedTopicSelector.tsx` (Completed)
   - ✅ `src/features/content-studio/components/dialog-steps/HierarchicalTopicSelector.tsx` (Completed)
   - ✅ `src/features/content-studio/components/ActivityPreview.tsx` (Completed)
   - ✅ `src/features/content-studio/components/GeneratingContent.tsx` (Completed)

2. **Utilities and Services**
   - ✅ `src/features/content-studio/utils/performance-monitoring.ts` (Completed)
   - ✅ `src/server/api/cache/topic-cache.service.ts` (Completed)

### Files to Remove

1. **Legacy Implementations**
   - ✅ `src/features/legacy-canvas/components/content-studio/ContentStudioCanvas.tsx` (Removed)
   - ✅ `src/features/content-studio/components/ContentStudioCanvas.tsx` (Removed)

2. **H5P-Related Files**
   - ✅ `src/features/activities/types/h5p/H5PActivity.tsx` (Removed)
   - ✅ All other H5P-related components have been removed

## Dependencies and Prerequisites

1. **Required Components**
   - `VirtualizedList` from activities core components
   - Activity registry from the new activities architecture
   - New activity viewer components

2. **API Dependencies**
   - Subject and topic APIs
   - Activity creation APIs
   - AI service APIs

## Timeline Estimation

- **Phase 1 (Performance Optimization)**: 3-5 days
- **Phase 2 (Architecture Alignment)**: 2-4 days
- **Phase 3 (User Experience Improvements)**: 3-5 days
- **Phase 4 (Testing and Refinement)**: 2-3 days

Total estimated time: 10-17 days depending on complexity and testing requirements.
