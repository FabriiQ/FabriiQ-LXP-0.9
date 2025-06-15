# Student Portal UAT Test Cases

## Overview

This document contains detailed test cases for the Student Portal. Each test case includes step-by-step instructions, expected results, and pass/fail criteria.

## Test Case Structure

Each test case follows this structure:
- **ID**: Unique identifier for the test case
- **Title**: Brief description of the test case
- **Scenario**: Reference to the related user scenario
- **Priority**: High, Medium, or Low
- **Preconditions**: Conditions that must be met before executing the test
- **Test Steps**: Step-by-step instructions
- **Expected Results**: What should happen after each step
- **Pass/Fail Criteria**: Conditions that determine if the test passes or fails
- **Notes**: Additional information or considerations

## Dashboard and Class Profile Test Cases

### TC-STUD-DASH-001: Dashboard Overview and Navigation

- **ID**: TC-STUD-DASH-001
- **Title**: Dashboard Overview and Navigation
- **Scenario**: 1.1 Dashboard Overview and Navigation
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User is enrolled in at least one class

- **Test Steps**:
  1. Navigate to the dashboard
  2. Verify the presence of key metrics (points, level, streak, etc.)
  3. Check for upcoming activities section
  4. View recent grades section
  5. Access quick actions from the dashboard
  6. Click the refresh button to update dashboard data
  7. Navigate to different sections using the sidebar navigation

- **Expected Results**:
  1. Dashboard loads successfully with all metrics displayed
  2. Upcoming activities are shown with correct due dates
  3. Recent grades are displayed accurately
  4. Quick actions are accessible and functional
  5. Refresh button updates the dashboard data
  6. Navigation to different sections works correctly

- **Pass/Fail Criteria**:
  - All dashboard elements are displayed correctly
  - Navigation between sections works without errors
  - Data refresh functionality works correctly

- **Notes**: Verify that the dashboard is responsive on different screen sizes

### TC-STUD-DASH-002: Class Profile Exploration

- **ID**: TC-STUD-DASH-002
- **Title**: Class Profile Exploration
- **Scenario**: 1.2 Class Profile Exploration
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User is enrolled in at least one class
  - User has some achievements and points

- **Test Steps**:
  1. Navigate to Class Profile
  2. View the Achievements tab
  3. Click on an achievement to view details
  4. Switch to the Learning Goals tab
  5. Create a new learning goal
  6. Switch to the Points tab and view points history
  7. Switch to the Journey tab and view timeline
  8. Switch to the Personal Bests tab
  9. Switch to the Commitment Contracts tab

- **Expected Results**:
  1. Class Profile page loads successfully
  2. Achievements tab shows earned and available achievements
  3. Achievement details display correctly
  4. Learning Goals tab shows existing goals
  5. New goal creation works correctly
  6. Points history displays with visualization
  7. Journey timeline shows chronological events
  8. Personal Bests shows top achievements
  9. Commitment Contracts shows active commitments

- **Pass/Fail Criteria**:
  - All tabs display correct information
  - Interactive elements work as expected
  - Creation and update functions work correctly

- **Notes**: Verify that UX psychology principles are applied correctly

## Activities Dashboard Test Cases

### TC-STUD-ACT-001: Activities Overview and Filtering

- **ID**: TC-STUD-ACT-001
- **Title**: Activities Overview and Filtering
- **Scenario**: 2.1 Activities Overview and Filtering
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has assigned activities

- **Test Steps**:
  1. Navigate to Activities Dashboard
  2. View all assigned activities
  3. Filter activities by status (pending)
  4. Filter activities by subject (Mathematics)
  5. Sort activities by due date (ascending)
  6. Search for a specific activity by name
  7. Clear all filters
  8. Switch between grid and list view if available

- **Expected Results**:
  1. Activities Dashboard loads successfully
  2. All assigned activities are displayed
  3. Status filter shows only pending activities
  4. Subject filter shows only Mathematics activities
  5. Activities are sorted by due date
  6. Search returns matching activities
  7. Clearing filters shows all activities
  8. View switching works correctly

- **Pass/Fail Criteria**:
  - All activities are displayed correctly
  - Filtering and sorting work as expected
  - Search functionality works correctly

- **Notes**: Verify that activity status indicators are clear and intuitive

### TC-STUD-ACT-002: Activity Completion

- **ID**: TC-STUD-ACT-002
- **Title**: Activity Completion
- **Scenario**: 2.2 Activity Completion
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has at least one pending activity

- **Test Steps**:
  1. Navigate to Activities Dashboard
  2. Select a pending activity
  3. View activity instructions and resources
  4. Start the activity
  5. Complete the activity requirements (answer questions, upload files, etc.)
  6. Review work before submission
  7. Submit the activity
  8. Verify submission status and confirmation

- **Expected Results**:
  1. Activities Dashboard loads successfully
  2. Activity selection works correctly
  3. Activity details display correctly
  4. Activity starts properly
  5. Activity interaction works correctly
  6. Review screen shows completed work
  7. Submission process works
  8. Confirmation appears and status updates

- **Pass/Fail Criteria**:
  - Activity details and instructions display correctly
  - Activity interaction works as expected
  - Submission process completes successfully
  - Activity status updates correctly

- **Notes**: Test different activity types (quiz, assignment, etc.)

## Leaderboard Test Cases

### TC-STUD-LEAD-001: Leaderboard Exploration

- **ID**: TC-STUD-LEAD-001
- **Title**: Leaderboard Exploration
- **Scenario**: 3.1 Leaderboard Exploration
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Leaderboard data exists

- **Test Steps**:
  1. Navigate to Leaderboard
  2. View class leaderboard
  3. Check personal position and score
  4. Switch to grade leaderboard
  5. Switch to campus leaderboard
  6. Change timeframe to daily
  7. Change timeframe to weekly
  8. Change timeframe to monthly
  9. View position change indicators

- **Expected Results**:
  1. Leaderboard page loads successfully
  2. Class leaderboard displays correctly
  3. Personal position is highlighted
  4. Grade leaderboard displays correctly
  5. Campus leaderboard displays correctly
  6. Daily timeframe updates the display
  7. Weekly timeframe updates the display
  8. Monthly timeframe updates the display
  9. Position changes are indicated correctly

- **Pass/Fail Criteria**:
  - All leaderboard views display correctly
  - Timeframe switching works as expected
  - Personal position is clearly indicated

- **Notes**: Verify that leaderboard motivates rather than discourages

### TC-STUD-LEAD-002: Achievement Badge Showcase

- **ID**: TC-STUD-LEAD-002
- **Title**: Achievement Badge Showcase
- **Scenario**: 3.2 Achievement Badge Showcase
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has earned some achievement badges

- **Test Steps**:
  1. Navigate to Achievements
  2. View earned badges
  3. Select a badge to view details
  4. View available badges not yet earned
  5. Check progress towards an unearned badge
  6. Filter badges by category
  7. Sort badges by date earned
  8. View badge showcase on profile

- **Expected Results**:
  1. Achievements page loads successfully
  2. Earned badges display correctly
  3. Badge details show correctly
  4. Available badges display correctly
  5. Progress indicators are accurate
  6. Category filtering works correctly
  7. Sorting works correctly
  8. Profile showcase displays correctly

- **Pass/Fail Criteria**:
  - Badges display correctly with appropriate visuals
  - Badge details and progress are accurate
  - Filtering and sorting work as expected

- **Notes**: Verify that badge design is visually appealing and motivating

## Points System Test Cases

### TC-STUD-PTS-001: Points Tracking and History

- **ID**: TC-STUD-PTS-001
- **Title**: Points Tracking and History
- **Scenario**: 4.1 Points Tracking and History
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has earned points

- **Test Steps**:
  1. Navigate to Points section
  2. View total points and current level
  3. Check points needed for next level
  4. View recent points transactions
  5. Check points breakdown by source
  6. View points history chart
  7. Filter history by date range
  8. Export points history if available

- **Expected Results**:
  1. Points section loads successfully
  2. Total points and level display correctly
  3. Next level information is accurate
  4. Recent transactions display correctly
  5. Breakdown shows accurate distribution
  6. History chart visualizes points over time
  7. Date filtering works correctly
  8. Export function works if available

- **Pass/Fail Criteria**:
  - Points information displays correctly
  - Visualizations are accurate and clear
  - Filtering works as expected

- **Notes**: Verify that points calculations are accurate

### TC-STUD-PTS-002: Streak and Bonus Points

- **ID**: TC-STUD-PTS-002
- **Title**: Streak and Bonus Points
- **Scenario**: 4.2 Streak and Bonus Points
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has an active streak

- **Test Steps**:
  1. Navigate to Streaks section
  2. View current streak status
  3. Check streak requirements
  4. View streak rewards information
  5. Check streak history
  6. Complete an activity to maintain streak
  7. Verify streak update
  8. Verify bonus points awarded

- **Expected Results**:
  1. Streaks section loads successfully
  2. Current streak displays correctly
  3. Requirements are clearly explained
  4. Rewards information is accurate
  5. History shows past streaks
  6. Activity completion works
  7. Streak updates correctly
  8. Bonus points are awarded correctly

- **Pass/Fail Criteria**:
  - Streak information displays correctly
  - Streak maintenance works as expected
  - Bonus points are awarded correctly

- **Notes**: Test streak reset scenarios as well

## Learning Journey Test Cases

### TC-STUD-JOUR-001: Journey Timeline Exploration

- **ID**: TC-STUD-JOUR-001
- **Title**: Journey Timeline Exploration
- **Scenario**: 5.1 Journey Timeline Exploration
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has journey events

- **Test Steps**:
  1. Navigate to Learning Journey
  2. View chronological timeline
  3. Identify different event types
  4. Select an event to view details
  5. Filter events by category
  6. Filter events by date range
  7. View milestone events
  8. Share a journey highlight if applicable

- **Expected Results**:
  1. Learning Journey page loads successfully
  2. Timeline displays chronologically
  3. Event types are visually distinct
  4. Event details display correctly
  5. Category filtering works correctly
  6. Date filtering works correctly
  7. Milestones are highlighted
  8. Sharing function works if available

- **Pass/Fail Criteria**:
  - Timeline displays correctly with visual elements
  - Event details are accurate
  - Filtering works as expected

- **Notes**: Verify that the timeline is visually engaging

### TC-STUD-JOUR-002: Milestone Achievement

- **ID**: TC-STUD-JOUR-002
- **Title**: Milestone Achievement
- **Scenario**: 5.2 Milestone Achievement
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User is close to achieving a milestone

- **Test Steps**:
  1. Navigate to Learning Journey
  2. Check progress towards a milestone
  3. Identify remaining requirements
  4. Complete required activities
  5. Achieve the milestone
  6. View milestone celebration
  7. Verify milestone added to journey
  8. Share milestone achievement if applicable

- **Expected Results**:
  1. Learning Journey page loads successfully
  2. Progress indicators are accurate
  3. Requirements are clearly displayed
  4. Activity completion works
  5. Milestone achievement is recognized
  6. Celebration animation/notification appears
  7. Milestone appears in journey timeline
  8. Sharing function works if available

- **Pass/Fail Criteria**:
  - Progress tracking is accurate
  - Milestone achievement is properly recognized
  - Celebration and timeline update work correctly

- **Notes**: Verify that the celebration is motivating and rewarding

## Learning Time Tracking Test Cases

### TC-STUD-TIME-001: Time Tracking Overview

- **ID**: TC-STUD-TIME-001
- **Title**: Time Tracking Overview
- **Scenario**: 6.1 Time Tracking Overview
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has tracked learning time

- **Test Steps**:
  1. Navigate to Learning Time
  2. View total learning time
  3. Check time distribution by subject
  4. View time distribution by activity type
  5. Explore time trends over different periods
  6. Filter time data by date range
  7. View learning pattern insights
  8. Set a time-based learning goal if applicable

- **Expected Results**:
  1. Learning Time page loads successfully
  2. Total time displays correctly
  3. Subject distribution shows accurately
  4. Activity type distribution shows accurately
  5. Trend visualization is clear
  6. Date filtering works correctly
  7. Insights are meaningful
  8. Goal setting works if available

- **Pass/Fail Criteria**:
  - Time data displays correctly
  - Visualizations are accurate and clear
  - Filtering works as expected

- **Notes**: Verify that time calculations are accurate

### TC-STUD-TIME-002: Real-Time Activity Tracking

- **ID**: TC-STUD-TIME-002
- **Title**: Real-Time Activity Tracking
- **Scenario**: 6.2 Real-Time Activity Tracking
- **Priority**: Medium
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - Activities with time tracking are available

- **Test Steps**:
  1. Navigate to Activities
  2. Select an activity with time tracking
  3. Start the activity
  4. Observe real-time time tracking
  5. Pause the activity
  6. Resume the activity
  7. Complete the activity
  8. Verify time spent is recorded correctly

- **Expected Results**:
  1. Activities page loads successfully
  2. Activity selection works correctly
  3. Activity starts with timer
  4. Timer runs in real-time
  5. Pause function stops the timer
  6. Resume function restarts the timer
  7. Completion stops the timer
  8. Time is recorded accurately

- **Pass/Fail Criteria**:
  - Timer functions work correctly
  - Pause and resume work as expected
  - Time is recorded accurately

- **Notes**: Test with different activity durations

## Offline Functionality Test Cases

### TC-STUD-OFF-001: Working Offline

- **ID**: TC-STUD-OFF-001
- **Title**: Working Offline
- **Scenario**: 8.1 Working Offline
- **Priority**: High
- **Preconditions**:
  - User has Student role
  - User is logged in to the Student Portal
  - User has previously accessed data (for caching)

- **Test Steps**:
  1. Log in to the Student Portal
  2. Navigate through different sections to cache data
  3. Disconnect from the network (turn off Wi-Fi/data)
  4. Verify offline indicator is displayed
  5. Navigate to Activities
  6. Work on a cached activity while offline
  7. Save progress locally
  8. Verify changes are queued for synchronization

- **Expected Results**:
  1. Login is successful
  2. Navigation works correctly
  3. Offline indicator appears when disconnected
  4. Previously accessed data is available offline
  5. Activities are accessible offline
  6. Activity interaction works offline
  7. Progress is saved locally
  8. Queue status is visible to the user

- **Pass/Fail Criteria**:
  - Offline indicator works correctly
  - Cached data is accessible offline
  - Changes can be made offline and are queued

- **Notes**: Test with various network conditions and transition scenarios
