# Teacher Activities Update - Test Script

This document provides a step-by-step test script to verify that all enhanced components work correctly.

## Prerequisites

- A test environment with the enhanced components deployed
- A teacher account with access to a test class
- Sample activities of different types
- Student accounts enrolled in the test class

## Test Cases

### 1. Activity Type Selection and Creation

#### 1.1. Navigate to Activity Creation Page

1. Log in as a teacher
2. Navigate to a class
3. Click on "Activities" in the navigation menu
4. Click on "Create Activity" button

**Expected Result**: The activity creation page loads with the activity type selection grid displayed.

#### 1.2. Filter Activity Types

1. Click on the "Learning" tab
2. Verify that only learning activities are displayed
3. Click on the "Assessment" tab
4. Verify that only assessment activities are displayed
5. Click on the "All" tab
6. Verify that all activity types are displayed

**Expected Result**: Activity types are filtered correctly by purpose.

#### 1.3. Search for Activity Types

1. Enter "quiz" in the search box
2. Verify that only quiz-related activity types are displayed
3. Clear the search box
4. Verify that all activity types are displayed again

**Expected Result**: Activity types are filtered correctly by search term.

#### 1.4. Create a Multiple Choice Quiz

1. Select the "Multiple Choice" activity type
2. Fill in the basic information:
   - Title: "Test Multiple Choice Quiz"
   - Description: "A test quiz for the enhanced components"
   - Purpose: "Assessment"
   - Start Date: Tomorrow
   - End Date: Next week
   - Duration: 30 minutes
3. Enable "Gradable Activity"
4. Set Maximum Score to 100
5. Set Passing Score to 60
6. Configure the quiz:
   - Add 3 questions with multiple choice options
   - Set correct answers for each question
7. Click "Create Activity"

**Expected Result**: The activity is created successfully and you are redirected to the activities list page.

#### 1.5. Create a Reading Activity

1. Navigate back to the activity creation page
2. Select the "Reading" activity type
3. Fill in the basic information:
   - Title: "Test Reading Activity"
   - Description: "A test reading activity for the enhanced components"
   - Purpose: "Learning"
   - Start Date: Tomorrow
   - End Date: Next week
   - Duration: 20 minutes
4. Configure the reading activity:
   - Add a title
   - Add content text
   - Add an image (if supported)
5. Click "Create Activity"

**Expected Result**: The activity is created successfully and you are redirected to the activities list page.

### 2. Activity List

#### 2.1. View Activities List

1. Navigate to the activities list page
2. Verify that the activities you created are displayed
3. Check that the activity cards show:
   - Activity title
   - Activity type
   - Purpose
   - Gradable status
   - Start and end dates
   - Duration

**Expected Result**: All activities are displayed correctly with their details.

#### 2.2. Filter Activities

1. Use the purpose filter to select "Assessment"
2. Verify that only assessment activities are displayed
3. Use the purpose filter to select "Learning"
4. Verify that only learning activities are displayed
5. Clear the filter
6. Verify that all activities are displayed again

**Expected Result**: Activities are filtered correctly by purpose.

#### 2.3. Search for Activities

1. Enter the title of one of your activities in the search box
2. Verify that only that activity is displayed
3. Clear the search box
4. Verify that all activities are displayed again

**Expected Result**: Activities are filtered correctly by search term.

#### 2.4. Sort Activities

1. Sort activities by title
2. Verify that activities are sorted alphabetically
3. Sort activities by date
4. Verify that activities are sorted by creation date
5. Sort activities by purpose
6. Verify that activities are sorted by purpose

**Expected Result**: Activities are sorted correctly by the selected field.

### 3. Activity Viewing and Editing

#### 3.1. View Activity Details

1. Click on the "View" button for the multiple choice quiz
2. Verify that the activity details are displayed:
   - Title
   - Description
   - Purpose
   - Start and end dates
   - Duration
   - Gradable status
3. Check that the activity content is displayed correctly in the preview tab

**Expected Result**: Activity details and content are displayed correctly.

#### 3.2. Edit Activity

1. Click on the "Edit" tab
2. Click on the "Edit Activity" button
3. Modify the activity title to "Updated Multiple Choice Quiz"
4. Change the duration to 45 minutes
5. Modify one of the questions
6. Click "Save Changes"

**Expected Result**: The activity is updated successfully and the changes are reflected in the activity details.

#### 3.3. View Activity Analytics

1. Click on the "Analytics" tab
2. Verify that the analytics section is displayed
3. Check that the analytics show:
   - Number of views
   - Number of submissions
   - Average score (if applicable)

**Expected Result**: Activity analytics are displayed correctly.

### 4. Activity Grading

#### 4.1. Navigate to Grading Page

1. Click on the "Grade" button for the multiple choice quiz
2. Verify that the grading page loads with:
   - Student list
   - Submission status for each student
   - Grading form

**Expected Result**: The grading page loads correctly with student information.

#### 4.2. Grade a Submission

1. Select a student with a submission
2. Verify that the submission is displayed
3. Enter a score of 85
4. Enter feedback: "Good job on the quiz!"
5. Click "Save Grade"

**Expected Result**: The grade is saved successfully and the student's status is updated to "Graded".

#### 4.3. Navigate to Batch Grading

1. Click on the "Batch Grading" button
2. Verify that the batch grading page loads with:
   - Student list with checkboxes
   - Default score and feedback fields
   - Apply grades button

**Expected Result**: The batch grading page loads correctly.

#### 4.4. Batch Grade Submissions

1. Select multiple students
2. Set the default score to 80
3. Set the default feedback to "Good effort on the quiz!"
4. Click "Apply Grades"

**Expected Result**: The grades are saved successfully for all selected students.

#### 4.5. Export and Import Grades

1. Click on the "Export Grades" button
2. Verify that a CSV file is downloaded
3. Modify the CSV file to change some grades
4. Click on the "Import Grades" button
5. Select the modified CSV file
6. Verify that the grades are updated

**Expected Result**: Grades are exported and imported correctly.

### 5. Edge Cases and Error Handling

#### 5.1. Create Activity with Missing Required Fields

1. Navigate to the activity creation page
2. Select an activity type
3. Leave the title field empty
4. Try to create the activity

**Expected Result**: Validation error is displayed for the missing title.

#### 5.2. Edit Activity with Invalid Data

1. Navigate to an activity's edit page
2. Set the maximum score to -10
3. Try to save the changes

**Expected Result**: Validation error is displayed for the invalid score.

#### 5.3. Grade Submission with Invalid Score

1. Navigate to the grading page
2. Select a student with a submission
3. Enter a score of 200 (above the maximum)
4. Try to save the grade

**Expected Result**: Validation error is displayed for the invalid score.

#### 5.4. Batch Grade with No Students Selected

1. Navigate to the batch grading page
2. Don't select any students
3. Set a default score and feedback
4. Try to apply grades

**Expected Result**: Error message is displayed indicating that no students are selected.

## Test Results

Document the results of each test case:

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| 1.1       |           |       |
| 1.2       |           |       |
| 1.3       |           |       |
| ...       |           |       |

## Issues and Recommendations

Document any issues encountered during testing and provide recommendations for fixing them:

1. **Issue**: [Description of the issue]
   - **Severity**: [High/Medium/Low]
   - **Steps to Reproduce**: [Steps to reproduce the issue]
   - **Expected Behavior**: [What should happen]
   - **Actual Behavior**: [What actually happens]
   - **Recommendation**: [Suggested fix]

2. **Issue**: [Description of the issue]
   - ...

## Conclusion

Summarize the test results and provide an overall assessment of the enhanced components:

- Are all components working as expected?
- Are there any critical issues that need to be addressed before deployment?
- Are there any performance concerns?
- Are there any usability issues?

Based on the test results, provide a recommendation on whether the enhanced components are ready for deployment to production.
