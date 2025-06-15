# Bloom's Taxonomy Activities Implementation Plan

This document outlines a phased approach for implementing Bloom's Taxonomy-aligned activities and assessments in our learning platform. The plan is designed to be incremental, focusing on the most impactful features first while ensuring alignment with our existing system architecture.

## Phase 1: Enhance Existing Activities with Bloom's Taxonomy

In this initial phase, we'll update our existing activity types to incorporate Bloom's Taxonomy and rubrics without creating new activity types.

### 1.1 Update Activity Data Models

- [ ] Extend the `BaseActivity` interface to include Bloom's Taxonomy fields:
  ```typescript
  export interface BaseActivity {
    // Existing fields
    bloomsLevel?: BloomsTaxonomyLevel;
    learningOutcomeIds?: string[];
    rubricId?: string;
  }
  ```

- [ ] Update activity database schema to include Bloom's Taxonomy fields:
  ```prisma
  model Activity {
    // Existing fields
    bloomsLevel       BloomsTaxonomyLevel?
    learningOutcomeIds String[]
    rubricId          String?
    rubric            Rubric?            @relation(fields: [rubricId], references: [id])
  }
  ```

### 1.2 Enhance Activity Creation UI

- [ ] Add `BloomsTaxonomySelector` component to activity creation forms
- [ ] Implement `LearningOutcomeSelector` for aligning activities with learning outcomes
- [ ] Add `RubricSelector` component for attaching rubrics to activities
- [ ] Create `ActionVerbSuggestions` integration for activity instructions

### 1.3 Update Existing Activity Types

Focus on enhancing these core activity types first:

- [ ] **Multiple Choice Activities**
  - Add Bloom's level selection for each question
  - Implement question type suggestions based on selected Bloom's level
  - Add rubric integration for grading

- [ ] **Reading Activities**
  - Add Bloom's level tagging for comprehension questions
  - Implement guided question generation based on Bloom's level

- [ ] **Video Activities**
  - Add Bloom's level tagging for video segments
  - Implement reflection questions aligned with Bloom's levels

- [ ] **Quiz Activities**
  - Add Bloom's distribution visualization
  - Implement cognitive balance analysis
  - Add rubric-based grading

### 1.4 Activity Analytics Integration

- [ ] Implement activity performance tracking by Bloom's level
- [ ] Create Bloom's level distribution visualization for completed activities
- [ ] Add cognitive balance analysis for teachers

## Phase 2: Implement Simple Bloom's-Aligned Activities

In this phase, we'll add the simplest and most impactful new activity types that align with Bloom's Taxonomy.

### 2.1 Remember Level Activities

- [ ] **Flashcards Activity**
  - Create flashcard activity model and UI
  - Implement spaced repetition algorithm
  - Add mastery tracking

- [ ] **Matching Activity**
  - Create matching activity model and UI
  - Implement drag-and-drop interface
  - Add automatic grading

- [ ] **Labeling Diagrams Activity**
  - Create diagram labeling model and UI
  - Implement image annotation tools
  - Add automatic grading

### 2.2 Understand Level Activities

- [ ] **Concept Map Activity**
  - Create concept map model and UI
  - Implement relationship visualization
  - Add collaborative editing option

- [ ] **Summarizing Activity**
  - Create text summarization model and UI
  - Implement AI-assisted feedback
  - Add peer review option

### 2.3 Apply Level Activities

- [ ] **Problem-Solving Activity**
  - Create problem-solving model and UI
  - Implement step-by-step solution tracking
  - Add worked examples and hints

- [ ] **Case Study Activity**
  - Create case study model and UI
  - Implement guided analysis framework
  - Add collaborative discussion option

### 2.4 Activity Template Library

- [ ] Create activity template library UI
- [ ] Implement template filtering by Bloom's level
- [ ] Add template customization and saving

## Phase 3: Advanced Bloom's-Aligned Activities

In this final phase, we'll implement more complex activity types that target higher-order thinking skills.

### 3.1 Analyze Level Activities

- [ ] **Compare and Contrast Activity**
  - Create comparison matrix model and UI
  - Implement guided analysis framework
  - Add collaborative editing option

- [ ] **Classification Activity**
  - Create classification model and UI
  - Implement drag-and-drop categorization
  - Add explanation requirement for choices

### 3.2 Evaluate Level Activities

- [ ] **Debate Activity**
  - Create debate model and UI
  - Implement position statement framework
  - Add evidence collection and evaluation

- [ ] **Peer Review Activity**
  - Create peer review model and UI
  - Implement rubric-based evaluation
  - Add feedback aggregation and analysis

### 3.3 Create Level Activities

- [ ] **Design Project Activity**
  - Create project model and UI
  - Implement milestone tracking
  - Add portfolio showcase option

- [ ] **Creative Writing Activity**
  - Create writing model and UI
  - Implement AI-assisted feedback
  - Add peer review and revision tracking

### 3.4 Advanced Integration Features

- [ ] Implement cross-activity progression tracking
- [ ] Create personalized activity recommendations based on Bloom's mastery
- [ ] Add adaptive difficulty based on student performance

## Implementation Guidelines

### Technology Stack

- Use React components from our existing UI library
- Leverage tRPC for API endpoints
- Use Prisma for database interactions
- Integrate with our agent system for AI-assisted features

### Code Organization

- Place new activity types in `src/features/activities/models/`
- Create UI components in `src/features/activities/components/`
- Add API endpoints in `src/server/api/routers/activities.ts`
- Define database schema extensions in `prisma/schema.prisma`

### Testing Strategy

- Create unit tests for each activity model
- Implement integration tests for activity creation and submission
- Add end-to-end tests for complete activity workflows

### Documentation

- Update API documentation for new endpoints
- Create user guides for teachers on creating Bloom's-aligned activities
- Add examples of effective activities for each Bloom's level
