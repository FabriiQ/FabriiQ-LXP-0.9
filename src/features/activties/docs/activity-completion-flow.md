# Activity Completion Flow

## Table of Contents

1. [Introduction](#introduction)
2. [Activity Completion Lifecycle](#activity-completion-lifecycle)
3. [Completion Logic by Activity Type](#completion-logic-by-activity-type)
4. [Reattempt Capabilities](#reattempt-capabilities)
5. [Grading System](#grading-system)
6. [Offline Support](#offline-support)
7. [Analytics and Tracking](#analytics-and-tracking)
8. [Reward Integration](#reward-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Introduction

The activity completion system is a core component of the learning experience platform, responsible for tracking user progress, evaluating responses, providing feedback, and integrating with the gradebook. This document provides a comprehensive overview of how activities are completed, tracked, and graded within the system.

## Activity Completion Lifecycle

### 1. Initiation

When a user starts an activity, the system:
- Records the start time
- Initializes analytics tracking
- Prepares the activity state
- Checks for any previous attempts or bookmarks

### 2. Interaction

During the activity, the system:
- Tracks user interactions (selections, inputs, navigation)
- Records time spent on each section/question
- Provides immediate feedback if configured
- Saves progress incrementally for longer activities

### 3. Submission

When the user completes the activity:
- The system validates all required inputs
- Collects all user responses
- Timestamps the completion
- Triggers the completion handler

### 4. Evaluation

After submission, the system:
- Grades the activity if it's gradable
- Calculates scores based on the activity's grading configuration
- Determines if the activity was passed (if a passing threshold exists)
- Prepares feedback for the user

### 5. Persistence

The completion data is then:
- Saved to the database (for online users)
- Stored in IndexedDB (for offline users, to be synced later)
- Linked to the user's profile and the specific activity

### 6. Feedback

The user receives:
- A completion confirmation
- Their score (if applicable)
- Correct/incorrect answers (if configured to show)
- Explanations for answers (if provided)
- Reward notifications (points, achievements, level-ups)

### 7. Analytics

Finally, the system:
- Records detailed analytics about the completion
- Updates learning progress metrics
- Triggers any dependent systems (like unlocking new content)

## Completion Logic by Activity Type

Different activity types have specific completion criteria:

### Multiple Choice & True/False

- Completed when the user selects an answer for all questions and submits
- Graded automatically based on correct answers
- Can be configured to require all questions or allow partial completion

### Multiple Response

- Completed when the user selects all applicable answers and submits
- Grading can be all-or-nothing or partial credit per question
- Supports partial scoring based on the number of correct selections

### Fill in the Blanks

- Completed when all required blanks have answers and the user submits
- Can be case-sensitive or case-insensitive
- May allow partial credit for partially correct answers

### Matching

- Completed when all items are matched and submitted
- Grading typically based on the number of correct matches
- Can be configured for partial credit

### Sequence

- Completed when all items are arranged in order and submitted
- Grading can be strict (all correct) or partial (based on relative positioning)

### Drag and Drop

- Completed when all draggable items are placed and submitted
- Grading based on correct placements

### Reading

- Completed when all sections have been viewed
- May require a minimum time spent on each section
- Often uses scroll position tracking to verify reading

### Video

- Completed when the video has been watched (typically 90%+ of duration)
- May include checkpoints that must be completed
- Tracks actual watch time vs. video duration

### Book

- Completed when all required sections and checkpoints are finished
- Checkpoints may include embedded activities of other types
- Progress is tracked by section and checkpoint completion

## Reattempt Capabilities

The system supports flexible reattempt configurations:

### Attempt Limits

- Activities can be configured with a specific number of allowed attempts
- Default is often set to 1 attempt for assessments
- Practice activities may allow unlimited attempts

### Attempt Tracking

- Each attempt is tracked separately in analytics
- For gradable activities, attempts are recorded in the ActivityGrade table
- The system can be configured to:
  - Keep only the latest attempt
  - Keep the highest-scoring attempt
  - Keep all attempts with timestamps

### Reattempt Controls

- Teachers can configure attempt limits per activity
- Some activity types (like readings) can always be revisited regardless of completion
- Gradable activities may have stricter reattempt policies

### Resuming vs. Reattempting

- Bookmarks allow users to resume incomplete activities
- This is different from starting a new attempt
- Bookmarks are stored in localStorage and can be cleared

## Grading System

The grading system evaluates user responses and calculates scores:

### Gradable Activities

- Activities marked as `isGradable: true` are integrated with the gradebook
- These activities contribute to the student's overall course grade
- Grading can be automatic or require teacher review

### Grading Configuration

- Each activity can have its own grading configuration:
  - Maximum score
  - Passing threshold
  - Weightage (contribution to overall grade)
  - Partial credit rules
  - Question-specific point values

### Grading Process

1. User submits the activity
2. System evaluates responses against correct answers
3. Points are calculated based on the grading configuration
4. Total score is determined and normalized (e.g., as a percentage)
5. Pass/fail status is determined if applicable
6. Grade is recorded in the ActivityGrade table
7. User receives feedback about their performance

### Grade Storage

- Grades are stored in the ActivityGrade table with:
  - Activity ID
  - Student ID
  - Score
  - Submission timestamp
  - Grading timestamp (if manually graded)
  - Grader ID (if applicable)
  - Submission content (user's answers)

## Offline Support

The system supports completing activities without an internet connection:

### Offline Completion Flow

1. Activity data is cached when first loaded
2. User completes the activity while offline
3. Completion data is stored in IndexedDB
4. System shows "Saved offline" notification
5. When connection is restored, data is synced to the server
6. Analytics and grades are updated accordingly

### Sync Process

- Background sync attempts to upload offline completions
- Conflict resolution handles cases where server data changed
- Users can manually trigger sync if needed
- Sync status is visible to users

## Analytics and Tracking

The system collects detailed analytics about activity completions:

### Tracked Metrics

- Start and completion timestamps
- Time spent on the activity
- Time spent per question/section
- Number of attempts
- Score and performance metrics
- Interaction patterns (e.g., changed answers, navigation)
- Device and environment information

### Analytics Storage

- Basic completion data is stored in the ActivityGrade table
- Detailed analytics are stored in the AnalyticsEvent table
- Events are categorized (e.g., ACTIVITY_VIEW, ACTIVITY_COMPLETION)
- Data includes user ID, activity ID, and structured event data

### Analytics Usage

- Teachers can view class and individual performance
- Students can see their own progress and performance
- System administrators can analyze platform usage
- Data informs content improvements and personalization

## Reward Integration

Activity completion can trigger rewards and gamification elements:

### Reward Types

- Points for completing activities
- Achievements for meeting specific criteria
- Level progression based on accumulated points
- Badges for special accomplishments
- Leaderboard positions

### Reward Flow

1. User completes an activity
2. System calculates applicable rewards
3. Rewards are displayed to the user with animations
4. Reward data is stored in the database
5. User's profile is updated with new rewards

### Reward Configuration

- Activities can have specific point values
- Achievement criteria can include activity completion
- Reward rules can be customized by teachers or administrators

## Best Practices

### For Teachers

- Set clear completion criteria for activities
- Configure appropriate attempt limits based on purpose
- Provide comprehensive feedback for incorrect answers
- Use a mix of activity types for varied assessment
- Review analytics to identify struggling students

### For Developers

- Ensure activities save progress frequently
- Implement robust offline support
- Design clear feedback mechanisms
- Optimize for mobile devices
- Ensure accessibility compliance
- Test with realistic user scenarios

### For Students

- Complete activities in a distraction-free environment
- Review feedback carefully to understand mistakes
- Use practice activities to prepare for assessments
- Reach out to teachers if stuck on specific concepts

## Troubleshooting

### Common Issues

- **Activity won't mark as complete**: Check if all required questions/sections are answered
- **Can't reattempt**: Verify the attempt limit configuration
- **Offline completion not syncing**: Check network connection and try manual sync
- **Score discrepancy**: Review the grading configuration and check for partial credit rules
- **Bookmark not working**: Clear browser cache or localStorage if corrupted

### Resolution Steps

1. Verify activity configuration
2. Check user permissions
3. Inspect browser console for errors
4. Clear cache if necessary
5. Contact support with specific activity ID and user ID
