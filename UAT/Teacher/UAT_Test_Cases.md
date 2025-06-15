# Teacher Portal UAT Test Cases

## Overview

This document contains detailed test cases for the Teacher Portal. Each test case includes step-by-step instructions, expected results, and pass/fail criteria.

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

## Dashboard and Analytics Test Cases

### TC-TEACH-DASH-001: Dashboard Overview and Navigation

- **ID**: TC-TEACH-DASH-001
- **Title**: Dashboard Overview and Navigation
- **Scenario**: 1.1 Dashboard Overview and Navigation
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes

- **Test Steps**:
  1. Navigate to the dashboard
  2. Verify the presence of key metrics (class count, student count, attendance rate, etc.)
  3. Check for upcoming classes section
  4. View pending assessments section
  5. Access quick actions from the dashboard
  6. Click the refresh button to update dashboard data
  7. Navigate to different sections using the sidebar navigation

- **Expected Results**:
  1. Dashboard loads successfully with all metrics displayed
  2. Upcoming classes are shown with correct times and locations
  3. Pending assessments are listed accurately
  4. Quick actions are accessible and functional
  5. Refresh button updates the dashboard data
  6. Navigation to different sections works correctly

- **Pass/Fail Criteria**:
  - All dashboard elements are displayed correctly
  - Navigation between sections works without errors
  - Data refresh functionality works correctly

- **Notes**: Verify that the dashboard is responsive on different screen sizes

### TC-TEACH-DASH-002: Class Performance Analytics

- **ID**: TC-TEACH-DASH-002
- **Title**: Class Performance Analytics
- **Scenario**: 1.2 Class Performance Analytics
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes with student data

- **Test Steps**:
  1. Navigate to Class Analytics from the dashboard
  2. Select a specific class from the dropdown
  3. View attendance statistics chart
  4. View grade distribution chart
  5. Review student engagement metrics
  6. Filter data by date range
  7. Identify students needing attention
  8. Export analytics data to CSV

- **Expected Results**:
  1. Class Analytics page loads successfully
  2. Class selection dropdown works correctly
  3. Attendance statistics chart displays accurate data
  4. Grade distribution chart displays accurate data
  5. Engagement metrics show meaningful data
  6. Date range filter updates the displayed data
  7. At-risk students are highlighted
  8. Data exports correctly to CSV format

- **Pass/Fail Criteria**:
  - All analytics charts and data are displayed correctly
  - Filtering and selection controls work as expected
  - Data export functionality works correctly

- **Notes**: Verify that charts are responsive and readable on mobile devices

## Class Management Test Cases

### TC-TEACH-CLASS-001: Class Overview and Student Management

- **ID**: TC-TEACH-CLASS-001
- **Title**: Class Overview and Student Management
- **Scenario**: 2.1 Class Overview and Student Management
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes with students

- **Test Steps**:
  1. Navigate to Class Management from the dashboard
  2. Select a class from the list
  3. View class details (schedule, location, subject)
  4. View student roster
  5. Sort students by name, ID, or performance
  6. Select a student to view their profile
  7. Review student performance data
  8. Return to class view

- **Expected Results**:
  1. Class Management page loads successfully
  2. Class selection works correctly
  3. Class details are displayed accurately
  4. Student roster shows all enrolled students
  5. Sorting functions work correctly
  6. Student profile displays when selected
  7. Student performance data is accurate
  8. Navigation back to class view works

- **Pass/Fail Criteria**:
  - Class details and student roster display correctly
  - Sorting and selection controls work as expected
  - Student profiles are accessible and accurate

- **Notes**: Verify that the student count matches the expected enrollment

### TC-TEACH-CLASS-002: Class Schedule and Calendar Management

- **ID**: TC-TEACH-CLASS-002
- **Title**: Class Schedule and Calendar Management
- **Scenario**: 2.2 Class Schedule and Calendar Management
- **Priority**: Medium
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes with scheduled sessions

- **Test Steps**:
  1. Navigate to Class Calendar from the dashboard
  2. View weekly schedule view
  3. Switch to monthly view
  4. Click on a day to view detailed schedule
  5. Add a new class event
  6. Edit an existing event
  7. Delete an event
  8. Set up a recurring event

- **Expected Results**:
  1. Class Calendar page loads successfully
  2. Weekly view displays correctly
  3. Monthly view displays correctly
  4. Day detail view shows all events
  5. New event creation works
  6. Event editing works
  7. Event deletion works
  8. Recurring event setup works

- **Pass/Fail Criteria**:
  - Calendar views display correctly
  - Event management functions work as expected
  - Changes persist after refresh

- **Notes**: Test calendar synchronization with external calendars if applicable

## Attendance Tracking Test Cases

### TC-TEACH-ATT-001: Daily Attendance Recording

- **ID**: TC-TEACH-ATT-001
- **Title**: Daily Attendance Recording
- **Scenario**: 3.1 Daily Attendance Recording
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has a class scheduled for the current day

- **Test Steps**:
  1. Navigate to Attendance from the dashboard
  2. Select a class and today's date
  3. View the student list for attendance
  4. Mark several students as present
  5. Mark one student as absent
  6. Mark one student as late
  7. Add an attendance note for the absent student
  8. Submit the attendance record

- **Expected Results**:
  1. Attendance page loads successfully
  2. Class and date selection works correctly
  3. Student list displays all enrolled students
  4. Attendance status can be set for each student
  5. Notes can be added
  6. Submission works with confirmation message
  7. Attendance record is saved correctly
  8. Attendance summary is displayed

- **Pass/Fail Criteria**:
  - Attendance recording interface works correctly
  - All attendance statuses can be set
  - Attendance data is saved accurately

- **Notes**: Test bulk attendance marking if available

### TC-TEACH-ATT-002: Attendance Reports and Analytics

- **ID**: TC-TEACH-ATT-002
- **Title**: Attendance Reports and Analytics
- **Scenario**: 3.2 Attendance Reports and Analytics
- **Priority**: Medium
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - Attendance data exists for the user's classes

- **Test Steps**:
  1. Navigate to Attendance Reports from the dashboard
  2. Select a class and a date range (last month)
  3. Generate an attendance report
  4. View attendance statistics (present, absent, late percentages)
  5. View individual student attendance patterns
  6. Identify students with attendance issues
  7. Export the attendance report to PDF
  8. Export the attendance data to CSV

- **Expected Results**:
  1. Attendance Reports page loads successfully
  2. Class and date range selection works correctly
  3. Report generation works
  4. Statistics are calculated correctly
  5. Individual patterns are displayed accurately
  6. Students with issues are highlighted
  7. PDF export works correctly
  8. CSV export works correctly

- **Pass/Fail Criteria**:
  - Report generation works correctly
  - Statistics are accurate
  - Export functions work as expected

- **Notes**: Verify that attendance calculations are accurate

## Assessment Management Test Cases

### TC-TEACH-ASS-001: Assessment Creation and Assignment

- **ID**: TC-TEACH-ASS-001
- **Title**: Assessment Creation and Assignment
- **Scenario**: 4.1 Assessment Creation and Assignment
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes

- **Test Steps**:
  1. Navigate to Assessment Management from the dashboard
  2. Click "Create New Assessment"
  3. Enter assessment details:
     - Title: "Test Assessment"
     - Type: "Quiz"
     - Duration: "30 minutes"
     - Total points: "100"
  4. Add questions (multiple choice, short answer)
  5. Set grading criteria
  6. Select a class to assign the assessment
  7. Set due date and availability window
  8. Publish the assessment

- **Expected Results**:
  1. Assessment Management page loads successfully
  2. Assessment creation form appears
  3. All fields accept input correctly
  4. Questions can be added and configured
  5. Grading criteria can be set
  6. Class selection works
  7. Date settings work correctly
  8. Assessment is published with confirmation

- **Pass/Fail Criteria**:
  - Assessment is created with all details correct
  - Assessment appears in the assessment list
  - Assessment is assigned to the selected class

- **Notes**: Verify that different question types work correctly

### TC-TEACH-ASS-002: Grading and Feedback

- **ID**: TC-TEACH-ASS-002
- **Title**: Grading and Feedback
- **Scenario**: 4.2 Grading and Feedback
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - An assessment has been assigned and completed by students

- **Test Steps**:
  1. Navigate to Assessment Management from the dashboard
  2. Select "Submitted Assessments" tab
  3. Choose an assessment to grade
  4. View the list of student submissions
  5. Select a submission to grade
  6. Review student responses
  7. Assign grades and provide feedback for each question
  8. Save and publish the grades

- **Expected Results**:
  1. Assessment Management page loads successfully
  2. Submitted Assessments tab shows assessments
  3. Assessment selection works correctly
  4. Student submission list displays correctly
  5. Submission details load correctly
  6. Responses can be reviewed
  7. Grades and feedback can be entered
  8. Grades are saved and published correctly

- **Pass/Fail Criteria**:
  - Grading interface works correctly
  - Feedback can be provided
  - Grades are saved accurately

- **Notes**: Test partial grading and resuming grading later

## Resource Management Test Cases

### TC-TEACH-RES-001: Resource Library Access and Management

- **ID**: TC-TEACH-RES-001
- **Title**: Resource Library Access and Management
- **Scenario**: 6.1 Resource Library Access and Management
- **Priority**: Medium
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - Resources exist in the library

- **Test Steps**:
  1. Navigate to Resource Library from the dashboard
  2. Browse resource categories
  3. Search for a specific resource
  4. View resource details
  5. Download a resource
  6. Upload a new resource:
     - Title: "Test Resource"
     - Type: "Worksheet"
     - Subject: "Mathematics"
     - File: sample PDF
  7. Organize resources into a collection
  8. Share a resource with colleagues

- **Expected Results**:
  1. Resource Library page loads successfully
  2. Categories are displayed correctly
  3. Search function works
  4. Resource details display correctly
  5. Download works correctly
  6. Upload works with confirmation
  7. Collection creation works
  8. Sharing functionality works

- **Pass/Fail Criteria**:
  - Resource browsing and search work correctly
  - Resource upload works correctly
  - Organization and sharing functions work

- **Notes**: Test with various file types and sizes

### TC-TEACH-RES-002: Lesson Plan Creation and Management

- **ID**: TC-TEACH-RES-002
- **Title**: Lesson Plan Creation and Management
- **Scenario**: 6.2 Lesson Plan Creation and Management
- **Priority**: Medium
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has assigned classes

- **Test Steps**:
  1. Navigate to Lesson Planning from the dashboard
  2. Click "Create New Lesson Plan"
  3. Enter lesson plan details:
     - Title: "Test Lesson"
     - Subject: "Science"
     - Duration: "45 minutes"
     - Learning objectives
  4. Add content sections and activities
  5. Attach resources from the library
  6. Schedule the lesson for a class
  7. Save the lesson plan
  8. Submit for coordinator review if required

- **Expected Results**:
  1. Lesson Planning page loads successfully
  2. Lesson plan creation form appears
  3. All fields accept input correctly
  4. Content sections can be added
  5. Resources can be attached
  6. Scheduling works correctly
  7. Lesson plan is saved correctly
  8. Submission process works if applicable

- **Pass/Fail Criteria**:
  - Lesson plan is created with all details correct
  - Lesson plan appears in the lesson plan list
  - Resources are correctly attached

- **Notes**: Verify that lesson plans can be edited after creation

## Offline Functionality Test Cases

### TC-TEACH-OFF-001: Working Offline

- **ID**: TC-TEACH-OFF-001
- **Title**: Working Offline
- **Scenario**: 8.1 Working Offline
- **Priority**: High
- **Preconditions**:
  - User has Teacher role
  - User is logged in to the Teacher Portal
  - User has previously accessed data (for caching)

- **Test Steps**:
  1. Log in to the Teacher Portal
  2. Navigate through different sections to cache data
  3. Disconnect from the network (turn off Wi-Fi/data)
  4. Verify offline indicator is displayed
  5. Navigate to Attendance
  6. Record attendance for a class while offline
  7. Create a new assessment while offline
  8. Verify changes are queued for synchronization

- **Expected Results**:
  1. Login is successful
  2. Navigation works correctly
  3. Offline indicator appears when disconnected
  4. Previously accessed data is available offline
  5. Attendance recording works offline
  6. Assessment creation works offline
  7. Changes are queued for later synchronization
  8. Queue status is visible to the user

- **Pass/Fail Criteria**:
  - Offline indicator works correctly
  - Cached data is accessible offline
  - Changes can be made offline and are queued

- **Notes**: Test with various network conditions and transition scenarios
