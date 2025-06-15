

















# Bloom's Taxonomy Implementation
- User wants to implement Bloom's Taxonomy at curriculum level (subjects/topics with distribution settings), lesson plan level (cognitive balance analysis), and assessment level (creation flow with rubrics).
- Implementation should include distribution settings for subjects, alignment for topics, learning outcomes with Bloom's levels, action verb suggestions, UI visualization, validation, and guidance tooltips.
- Bloom's Taxonomy should be integrated with grading components (FeedbackGenerator, BatchGrading, GradingResult, BloomsLevelFeedback).
- Teacher Dashboard should include Bloom's analytics (cognitive level distribution, performance tracking, mastery heatmaps) and enhanced reporting.

# Learning Outcome and Criteria Management
- Learning outcomes should be managed on a separate page with a 'Manage Learning Outcomes' button on topic pages.
- Learning outcome generation should support bulk creation with taxonomy distribution percentages, using AI with proper dialog interface for selecting taxonomy levels and action verbs.
- Generation should implement ABCD framework (Audience, Behavior, Condition, Degree) with radio button selection, use contextual AI rather than just taxonomy-based, and include action verb tags.
- Learning outcome editing should open in an edit dialog with label 'Learning Outcome Statement *'.
- Components should be reused from existing Bloom's Taxonomy feature in features/bloom.
- User prefers batch save functionality over individual saves for learning outcomes - remove individual save buttons and use single 'Finish & Save All' button instead.
- Learning outcomes should be integrated with rubric criteria, allowing each outcome to have associated criteria with performance levels.
- Criteria creation (AI and manual) should be associated with learning outcomes and topics, shown separately from rubrics in learning outcomes management, and displayed in teacher assessment dialog rubric creation with related learning outcomes, Bloom's taxonomy levels, and action verb tags.
- Simple Criteria Association Implementation requires updates to RubricCriteria model with topicId/learningOutcomeId fields, dedicated criteria.router.ts, CriteriaManagement.tsx component, and updates to AI generation components for reusable criteria association.

# Assessment and Rubrics System
- Assessments (printable and online) should integrate with Bloom's Taxonomy, rubric-based grading, and proper association with grading activities.
- Assessment components should be placed in src/features/assessments with existing score-based manual grading functionality remaining intact.
- Assessment creation should use tree-form content structure for topics/subtopics, reuse existing learning outcomes and rubric components, allow rubric creation during setup, and implement criteria-based grading.
- Rubric creation should show existing criteria from selected learning outcomes that users can select/add.
- Rubrics should include topic relationships in addition to subject relationships for better organization and filtering.
- RubricCriteria should be redesigned as reusable building blocks associated with topics and learning outcomes, not directly with rubrics, to avoid conflicts and inefficiency in the current implementation.
- User prefers complete analysis and implementation of criteria management across both system admin (manual and AI creation) and teacher assessment dialogs rather than partial solutions.
- Teachers should be able to grade students without digital submissions as assessments are mostly done manually in class.

# Activities Implementation
- Activities should be implemented in phases: updating existing activities, adding simple ones, then implementing complex ones.
- Activities should support both score-based and rubrics grading with user selection, and both manual and auto grading options.
- Activity Creator should integrate with lesson plans to auto-populate subjects, topics, learning outcomes, and Bloom's taxonomy levels.
- For assignment creation dialogs: reuse existing rubric creation form from learning outcomes in system admin.

# Technical Implementation Details
- The project uses tRPC and Prisma queries for API and database interactions.
- Agents should be created in features/agent agentic system and wrapped in feature-specific code.
- Components from features/bloom should be reused centrally to avoid conflicts.
- Next.js routing requires consistent parameter naming; route conflicts were resolved by moving folders to [classId].
- User prefers direct database relationships between Subject and Rubrics/Criteria models for better performance.

# UI/UX and System Design
- All components must align with existing UI/UX, psychology principles, and follow mobile-first approach.
- Reuse existing components rather than creating new ones to avoid conflicts.
- Use rich text editors instead of textareas for input fields (except learning outcome generator prompts).
- Taxonomy distribution should be responsive without text overlap and enforce 0-100% validation.
- Content structure and statistics components should properly respect theme (light/dark mode).

# Coordinator and Teacher Workflows
- Lesson plans need to display learning outcomes, topics, objectives, activities, Bloom's Taxonomy distribution, and assessments in coordinator view.
- Teacher lesson plan creation should save Bloom's distribution in dedicated field not just content JSON, and implement proper draft/submission workflow.
- Lesson plan status types should include 'rejected' or 'not approved' in addition to draft, submitted, and approved statuses.
- Topic mastery should be integrated with Bloom's Taxonomy and rubrics, including updates to leaderboards, student profiles, and achievements.

# General Preferences
- User prefers simpler implementation approaches that minimize changes to existing codebase when possible, favoring incremental improvements over major restructuring.

# Marketing and Positioning
- AIVY LXP should be positioned as a blended learning experience platform with compelling hooklines added to marketing materials.