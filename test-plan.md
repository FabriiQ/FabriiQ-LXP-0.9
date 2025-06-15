# Teacher Activities Update Test Plan

This document outlines the test plan for the enhanced teacher activities components that use the new activities architecture from the `features/activities` folder.

## Test Environment

- **Development Environment**: Local development environment with a test database
- **Test Users**: Teacher accounts with access to test classes
- **Test Data**: Sample activities of different types

## Test Cases

### 1. Activity Type Selection

#### 1.1 Activity Type Grid Display

- **Objective**: Verify that the activity type grid displays all available activity types
- **Steps**:
  1. Navigate to the activity creation page
  2. Verify that the activity type grid is displayed
  3. Check that all activity types are shown with their names, descriptions, and icons
- **Expected Result**: All registered activity types are displayed in the grid

#### 1.2 Activity Type Filtering

- **Objective**: Verify that activity types can be filtered by purpose
- **Steps**:
  1. Navigate to the activity creation page
  2. Click on the "Learning" tab
  3. Verify that only learning activities are displayed
  4. Click on the "Assessment" tab
  5. Verify that only assessment activities are displayed
- **Expected Result**: Activity types are filtered correctly by purpose

#### 1.3 Activity Type Search

- **Objective**: Verify that activity types can be searched by name or description
- **Steps**:
  1. Navigate to the activity creation page
  2. Enter a search term in the search box
  3. Verify that only matching activity types are displayed
- **Expected Result**: Activity types are filtered correctly by search term

### 2. Activity Creation

#### 2.1 Basic Activity Creation

- **Objective**: Verify that a basic activity can be created
- **Steps**:
  1. Navigate to the activity creation page
  2. Select an activity type
  3. Fill in the basic information (title, description, etc.)
  4. Configure the activity-specific settings
  5. Click "Create Activity"
- **Expected Result**: Activity is created successfully with the correct content structure

#### 2.2 Gradable Activity Creation

- **Objective**: Verify that a gradable activity can be created
- **Steps**:
  1. Navigate to the activity creation page
  2. Select an activity type that supports grading
  3. Fill in the basic information
  4. Enable the "Gradable Activity" option
  5. Set the maximum score and passing score
  6. Configure the activity-specific settings
  7. Click "Create Activity"
- **Expected Result**: Gradable activity is created successfully with the correct grading settings

#### 2.3 Activity Creation Validation

- **Objective**: Verify that activity creation is validated correctly
- **Steps**:
  1. Navigate to the activity creation page
  2. Select an activity type
  3. Leave required fields empty
  4. Click "Create Activity"
- **Expected Result**: Validation errors are displayed for the missing fields

### 3. Activity Viewing

#### 3.1 Activity Details Display

- **Objective**: Verify that activity details are displayed correctly
- **Steps**:
  1. Navigate to an activity detail page
  2. Verify that the activity title, description, and other details are displayed
  3. Check that the activity type is shown correctly
- **Expected Result**: Activity details are displayed correctly

#### 3.2 Activity Content Display

- **Objective**: Verify that activity content is displayed correctly
- **Steps**:
  1. Navigate to an activity detail page
  2. Verify that the activity content is displayed using the correct viewer component
- **Expected Result**: Activity content is displayed correctly using the appropriate viewer component

#### 3.3 Activity Tabs

- **Objective**: Verify that activity tabs work correctly
- **Steps**:
  1. Navigate to an activity detail page
  2. Click on the "Preview" tab
  3. Verify that the activity preview is displayed
  4. Click on the "Edit" tab
  5. Verify that the edit button is displayed
  6. Click on the "Analytics" tab
  7. Verify that analytics are displayed if available
- **Expected Result**: Activity tabs work correctly and display the appropriate content

### 4. Activity Editing

#### 4.1 Basic Activity Editing

- **Objective**: Verify that a basic activity can be edited
- **Steps**:
  1. Navigate to an activity detail page
  2. Click on the "Edit" tab
  3. Click on the "Edit Activity" button
  4. Modify the basic information
  5. Click "Save Changes"
- **Expected Result**: Activity is updated successfully with the new information

#### 4.2 Activity Content Editing

- **Objective**: Verify that activity content can be edited
- **Steps**:
  1. Navigate to an activity detail page
  2. Click on the "Edit" tab
  3. Click on the "Edit Activity" button
  4. Modify the activity-specific content
  5. Click "Save Changes"
- **Expected Result**: Activity content is updated successfully with the new content

#### 4.3 Activity Editing Validation

- **Objective**: Verify that activity editing is validated correctly
- **Steps**:
  1. Navigate to an activity detail page
  2. Click on the "Edit" tab
  3. Click on the "Edit Activity" button
  4. Clear required fields
  5. Click "Save Changes"
- **Expected Result**: Validation errors are displayed for the missing fields

### 5. Activity Grading

#### 5.1 Student List Display

- **Objective**: Verify that the student list is displayed correctly
- **Steps**:
  1. Navigate to an activity grading page
  2. Verify that the student list is displayed
  3. Check that student names and submission status are shown correctly
- **Expected Result**: Student list is displayed correctly with submission status

#### 5.2 Submission Viewing

- **Objective**: Verify that student submissions can be viewed
- **Steps**:
  1. Navigate to an activity grading page
  2. Select a student with a submission
  3. Verify that the submission is displayed using the correct viewer component
- **Expected Result**: Student submission is displayed correctly using the appropriate viewer component

#### 5.3 Manual Grading

- **Objective**: Verify that activities can be graded manually
- **Steps**:
  1. Navigate to an activity grading page
  2. Select a student with a submission
  3. Enter a score and feedback
  4. Click "Save Grade"
- **Expected Result**: Grade is saved successfully and the student's status is updated to "Graded"

### 6. API Integration

#### 6.1 Component System Flag

- **Objective**: Verify that the `useComponentSystem` flag is set correctly
- **Steps**:
  1. Create a new activity using the enhanced components
  2. Check the API request payload
  3. Verify that the `useComponentSystem` flag is set to `true`
- **Expected Result**: The `useComponentSystem` flag is set to `true` in the API request

#### 6.2 Activity Content Structure

- **Objective**: Verify that the activity content structure is correct
- **Steps**:
  1. Create a new activity using the enhanced components
  2. Check the API request payload
  3. Verify that the content structure includes the `activityType` field
- **Expected Result**: The content structure includes the `activityType` field with the correct value

#### 6.3 Activity Update

- **Objective**: Verify that activity updates maintain the component system flag
- **Steps**:
  1. Edit an existing activity using the enhanced components
  2. Check the API request payload
  3. Verify that the `useComponentSystem` flag is set to `true`
- **Expected Result**: The `useComponentSystem` flag is set to `true` in the API request

## Test Data

### Sample Activities

Create sample activities of different types for testing:

1. **Multiple Choice Quiz**:
   - Type: `multiple-choice`
   - Purpose: `ASSESSMENT`
   - Gradable: Yes

2. **Reading Activity**:
   - Type: `reading`
   - Purpose: `LEARNING`
   - Gradable: No

3. **Video Activity**:
   - Type: `video`
   - Purpose: `LEARNING`
   - Gradable: No

4. **Matching Activity**:
   - Type: `matching`
   - Purpose: `PRACTICE`
   - Gradable: Yes

### Test Users

Create test users with different roles:

1. **Teacher**:
   - Username: `teacher1`
   - Password: `password`
   - Classes: Test Class 1, Test Class 2

2. **Student**:
   - Username: `student1`
   - Password: `password`
   - Classes: Test Class 1

## Test Execution

Execute the tests in the following order:

1. Activity Type Selection tests
2. Activity Creation tests
3. Activity Viewing tests
4. Activity Editing tests
5. Activity Grading tests
6. API Integration tests

Document any issues encountered during testing and create bug reports as needed.

## Test Reporting

Create a test report with the following information:

- Test case ID
- Test case description
- Test steps
- Expected result
- Actual result
- Pass/Fail status
- Comments

## Conclusion

This test plan provides a comprehensive approach to testing the enhanced teacher activities components. By following this plan, we can ensure that the components work correctly and integrate properly with the new activities architecture.
