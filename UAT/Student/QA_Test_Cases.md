# Student Portal QA Test Cases

## Overview

This document contains detailed QA test cases for the Student Portal. These test cases focus on technical aspects, edge cases, error handling, performance, and UX psychology principles that should be tested by QA engineers before UAT begins.

## Test Case Structure

Each test case follows this structure:
- **ID**: Unique identifier for the test case
- **Title**: Brief description of the test case
- **Category**: Type of testing (Functional, Security, Performance, etc.)
- **Priority**: High, Medium, or Low
- **Preconditions**: Conditions that must be met before executing the test
- **Test Steps**: Step-by-step instructions
- **Expected Results**: What should happen after each step
- **Notes**: Additional information or considerations

## Functional Test Cases

### QA-STUD-FUNC-001: Activity Submission Edge Cases

- **ID**: QA-STUD-FUNC-001
- **Title**: Activity Submission Edge Cases
- **Category**: Functional
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Various types of activities are assigned

- **Test Steps**:
  1. Test submission of very large text responses
  2. Test submission with various file types and sizes
  3. Test submission exactly at the deadline
  4. Test submission after the deadline
  5. Test partial submission and resuming later
  6. Test submission with poor network connectivity
  7. Test submission with embedded media
  8. Test resubmission of previously submitted activities

- **Expected Results**:
  1. Large text responses are handled correctly
  2. File type and size restrictions are enforced
  3. Submission at deadline is accepted
  4. Late submission handling follows policy
  5. Partial submission and resuming works correctly
  6. Submission works with poor connectivity
  7. Embedded media is handled correctly
  8. Resubmission follows policy and works correctly

- **Notes**: Test with various activity types and submission scenarios

### QA-STUD-FUNC-002: Leaderboard and Points Calculation Validation

- **ID**: QA-STUD-FUNC-002
- **Title**: Leaderboard and Points Calculation Validation
- **Category**: Functional
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Points and leaderboard data exists

- **Test Steps**:
  1. Verify points calculation for different activity types
  2. Test points calculation for streaks and bonuses
  3. Verify leaderboard position calculation
  4. Test leaderboard updates after point changes
  5. Verify timeframe calculations (daily, weekly, monthly)
  6. Test edge cases (tied scores, very high/low scores)
  7. Verify level progression thresholds
  8. Test historical data accuracy

- **Expected Results**:
  1. Points are calculated correctly for all activity types
  2. Streak and bonus points are calculated correctly
  3. Leaderboard positions are calculated correctly
  4. Leaderboard updates promptly after point changes
  5. Timeframe calculations are accurate
  6. Edge cases are handled correctly
  7. Level progression occurs at correct thresholds
  8. Historical data is accurate and consistent

- **Notes**: Use known test data to verify calculations

## UX Psychology Test Cases

### QA-STUD-UX-001: Progress Visualization and Motivation

- **ID**: QA-STUD-UX-001
- **Title**: Progress Visualization and Motivation
- **Category**: UX Psychology
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has progress data

- **Test Steps**:
  1. Verify Goal Gradient Effect in progress bars
  2. Test Endowed Progress Effect in partially completed achievements
  3. Verify IKEA Effect in customizable elements
  4. Test Sunk Cost visualization in accumulated points
  5. Verify chunking of information in dashboard
  6. Test celebration animations and timing
  7. Verify "X away from unlocking" messaging
  8. Test motivational messaging for different scenarios

- **Expected Results**:
  1. Progress bars show appropriate gradient effect
  2. Partially completed achievements show progress
  3. Customizable elements work correctly
  4. Accumulated points are clearly visualized
  5. Information is properly chunked for comprehension
  6. Celebrations occur at appropriate moments
  7. "X away" messaging is accurate and motivating
  8. Motivational messaging is contextually appropriate

- **Notes**: Evaluate subjective aspects of motivation and engagement

### QA-STUD-UX-002: Commitment Contract Implementation

- **ID**: QA-STUD-UX-002
- **Title**: Commitment Contract Implementation
- **Category**: UX Psychology
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Commitment contract feature is available

- **Test Steps**:
  1. Test creation of various commitment types
  2. Verify commitment parameters and constraints
  3. Test commitment tracking accuracy
  4. Verify commitment completion recognition
  5. Test commitment failure handling
  6. Verify commitment analytics and insights
  7. Test commitment sharing functionality
  8. Verify commitment history and trends

- **Expected Results**:
  1. Various commitment types can be created
  2. Parameters and constraints work correctly
  3. Tracking is accurate and timely
  4. Completion is properly recognized and celebrated
  5. Failure is handled constructively
  6. Analytics provide meaningful insights
  7. Sharing functionality works correctly
  8. History and trends are accurately displayed

- **Notes**: Evaluate psychological aspects of commitment mechanisms

## Performance Test Cases

### QA-STUD-PERF-001: Activities Dashboard Performance

- **ID**: QA-STUD-PERF-001
- **Title**: Activities Dashboard Performance
- **Category**: Performance
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has many assigned activities

- **Test Steps**:
  1. Measure initial loading time for activities dashboard
  2. Test performance with large number of activities
  3. Measure filtering and sorting performance
  4. Test search functionality performance
  5. Measure activity detail loading time
  6. Test performance on mobile devices
  7. Test performance with slow network conditions
  8. Monitor memory usage during extended use

- **Expected Results**:
  1. Initial loading time is under 3 seconds
  2. Performance scales well with activity count
  3. Filtering and sorting respond within 1 second
  4. Search returns results within 2 seconds
  5. Activity details load within 2 seconds
  6. Mobile performance is acceptable
  7. Works acceptably on slow networks
  8. Memory usage remains stable

- **Notes**: Use performance monitoring tools to measure load times and resource usage

### QA-STUD-PERF-002: Learning Journey Timeline Performance

- **ID**: QA-STUD-PERF-002
- **Title**: Learning Journey Timeline Performance
- **Category**: Performance
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has journey events

- **Test Steps**:
  1. Measure initial loading time for journey timeline
  2. Test performance with large number of events
  3. Measure filtering performance
  4. Test scrolling performance through timeline
  5. Measure event detail loading time
  6. Test performance on mobile devices
  7. Test performance with slow network conditions
  8. Monitor memory usage during extended use

- **Expected Results**:
  1. Initial loading time is under 3 seconds
  2. Performance scales well with event count
  3. Filtering responds within 1 second
  4. Scrolling is smooth without lag
  5. Event details load within 1 second
  6. Mobile performance is acceptable
  7. Works acceptably on slow networks
  8. Memory usage remains stable

- **Notes**: Test with various timeline lengths and event types

## Mobile Responsiveness Test Cases

### QA-STUD-MOB-001: Activity Completion on Mobile

- **ID**: QA-STUD-MOB-001
- **Title**: Activity Completion on Mobile
- **Category**: Mobile Responsiveness
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is accessing the Student Portal from mobile devices
  - Activities are assigned to the user

- **Test Steps**:
  1. Access activities on various mobile devices
  2. Test different activity types on mobile
  3. Test text input on mobile keyboard
  4. Test file upload from mobile device
  5. Test embedded media playback
  6. Verify touch interactions for interactive activities
  7. Test orientation changes during activity completion
  8. Verify submission process on mobile

- **Expected Results**:
  1. Activities interface adapts to different screen sizes
  2. All activity types are usable on mobile
  3. Text input works correctly with mobile keyboard
  4. File upload works from mobile device
  5. Media playback works correctly
  6. Touch interactions work properly
  7. Orientation changes are handled properly
  8. Submission works correctly on mobile

- **Notes**: Test on actual devices when possible, not just emulators

### QA-STUD-MOB-002: Leaderboard and Profile on Mobile

- **ID**: QA-STUD-MOB-002
- **Title**: Leaderboard and Profile on Mobile
- **Category**: Mobile Responsiveness
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is accessing the Student Portal from mobile devices
  - Leaderboard and profile data exists

- **Test Steps**:
  1. Access leaderboard on various mobile devices
  2. Test leaderboard scrolling and navigation
  3. Verify leaderboard filtering on mobile
  4. Access class profile on mobile
  5. Test navigation between profile tabs
  6. Verify all profile elements are accessible
  7. Test interactive elements in profile
  8. Verify visualizations are readable on small screens

- **Expected Results**:
  1. Leaderboard adapts to different screen sizes
  2. Scrolling and navigation work smoothly
  3. Filtering works correctly on mobile
  4. Profile adapts to different screen sizes
  5. Tab navigation works correctly
  6. All elements are accessible without zooming
  7. Interactive elements work correctly
  8. Visualizations are readable and clear

- **Notes**: Test readability and usability on various screen sizes

## Offline Functionality Test Cases

### QA-STUD-OFF-001: Offline Activity Access

- **ID**: QA-STUD-OFF-001
- **Title**: Offline Activity Access
- **Category**: Offline Functionality
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Activities are assigned to the user
  - Some activities have been accessed online

- **Test Steps**:
  1. Access activities while online
  2. Go offline (disconnect from network)
  3. Navigate to activities dashboard
  4. Access previously viewed activities
  5. Attempt to work on activities offline
  6. Save progress locally
  7. Reconnect to network
  8. Verify synchronization of activity progress

- **Expected Results**:
  1. Activities are cached while browsing online
  2. Offline indicator appears when disconnected
  3. Activities dashboard is accessible offline
  4. Previously viewed activities are available offline
  5. Activities can be worked on offline
  6. Progress is saved locally
  7. Synchronization starts when reconnected
  8. Activity progress is synchronized correctly

- **Notes**: Test with various activity types and offline scenarios

### QA-STUD-OFF-002: Offline Points and Progress Tracking

- **ID**: QA-STUD-OFF-002
- **Title**: Offline Points and Progress Tracking
- **Category**: Offline Functionality
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has points and progress data
  - Data is cached for offline use

- **Test Steps**:
  1. View points and progress while online
  2. Go offline (disconnect from network)
  3. Complete activities that earn points while offline
  4. Verify points are tracked locally
  5. Check progress indicators update offline
  6. Reconnect to network
  7. Verify synchronization of points and progress
  8. Check for any discrepancies after synchronization

- **Expected Results**:
  1. Points and progress data is cached
  2. Offline indicator appears when disconnected
  3. Activities can be completed offline
  4. Points are tracked locally while offline
  5. Progress indicators update correctly offline
  6. Synchronization starts when reconnected
  7. Points and progress synchronize correctly
  8. No discrepancies after synchronization

- **Notes**: Test various point-earning scenarios offline

## Error Handling Test Cases

### QA-STUD-ERR-001: Activity Submission Error Recovery

- **ID**: QA-STUD-ERR-001
- **Title**: Activity Submission Error Recovery
- **Category**: Error Handling
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User is working on an activity
  - Ability to simulate errors

- **Test Steps**:
  1. Begin completing an activity
  2. Enter substantial amount of work
  3. Simulate network error during submission
  4. Verify error message and recovery options
  5. Test auto-save functionality
  6. Verify work is preserved after error
  7. Test retry submission functionality
  8. Verify successful submission after recovery

- **Expected Results**:
  1. Activity starts correctly
  2. Work can be entered
  3. Error is handled gracefully
  4. Clear error message with recovery options
  5. Auto-save has preserved work
  6. All work is preserved after error
  7. Retry functionality works correctly
  8. Submission succeeds after recovery

- **Notes**: Test various activity types and error scenarios

### QA-STUD-ERR-002: Learning Time Tracking Error Handling

- **ID**: QA-STUD-ERR-002
- **Title**: Learning Time Tracking Error Handling
- **Category**: Error Handling
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Learning time tracking is active
  - Ability to simulate errors

- **Test Steps**:
  1. Start an activity with time tracking
  2. Allow tracking to run for some time
  3. Simulate browser crash or page refresh
  4. Restart the browser and return to the activity
  5. Verify time tracking state recovery
  6. Test time tracking during network disconnection
  7. Verify time data synchronization after reconnection
  8. Check for any time tracking discrepancies

- **Expected Results**:
  1. Activity starts with time tracking
  2. Time tracking runs correctly
  3. Crash or refresh is simulated
  4. Activity can be accessed again
  5. Time tracking state is recovered
  6. Time tracking continues during disconnection
  7. Time data synchronizes correctly
  8. No significant discrepancies in time data

- **Notes**: Test various interruption scenarios

## Security Test Cases

### QA-STUD-SEC-001: Student Data Privacy

- **ID**: QA-STUD-SEC-001
- **Title**: Student Data Privacy
- **Category**: Security
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has personal data in the system

- **Test Steps**:
  1. Verify student can only access their own data
  2. Test access to class leaderboard data
  3. Check for appropriate data masking of other students
  4. Test data visibility in shared activities
  5. Verify data sharing limitations
  6. Check offline storage of personal data
  7. Test session timeout handling
  8. Verify data access logs are maintained

- **Expected Results**:
  1. Student can only access their own data
  2. Leaderboard shows appropriate information
  3. Other students' data is appropriately masked
  4. Shared activities show only permitted data
  5. Data sharing is limited appropriately
  6. Offline storage follows privacy guidelines
  7. Session timeout clears sensitive data
  8. Access logs are maintained for auditing

- **Notes**: Verify compliance with relevant data privacy regulations
