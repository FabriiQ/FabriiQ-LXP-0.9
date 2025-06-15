# Admin Portal UAT Test Cases

## Overview

This document contains detailed test cases for the Admin Portal. Each test case includes step-by-step instructions, expected results, and pass/fail criteria.

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

## System Administration Test Cases

### TC-ADMIN-SYS-001: System Settings Configuration

- **ID**: TC-ADMIN-SYS-001
- **Title**: System Settings Configuration
- **Scenario**: 1.1 System Setup and Configuration
- **Priority**: High
- **Preconditions**:
  - User has System Admin role
  - User is logged in to the Admin Portal
  - System settings have not been configured

- **Test Steps**:
  1. Navigate to System Settings from the main dashboard
  2. Configure the following settings:
     - System name
     - Default language
     - Date and time format
     - Email notification settings
     - Password policy
  3. Save the settings
  4. Log out and log back in

- **Expected Results**:
  1. System Settings page loads successfully
  2. All settings can be configured without errors
  3. Settings are saved successfully with confirmation message
  4. After logging back in, all configured settings are applied correctly

- **Pass/Fail Criteria**:
  - All settings are saved correctly
  - Settings are applied system-wide
  - No error messages appear during configuration

- **Notes**: Some settings may require system restart to take effect

### TC-ADMIN-SYS-002: User Role Creation and Permission Assignment

- **ID**: TC-ADMIN-SYS-002
- **Title**: User Role Creation and Permission Assignment
- **Scenario**: 1.2 User Role Management
- **Priority**: High
- **Preconditions**:
  - User has System Admin role
  - User is logged in to the Admin Portal

- **Test Steps**:
  1. Navigate to User Roles from the main dashboard
  2. Click "Create New Role"
  3. Enter role name "Test Coordinator"
  4. Enter role description
  5. Assign the following permissions:
     - View all programs
     - View and edit assigned classes
     - View and edit assigned teachers
     - View student profiles
     - Generate reports
  6. Save the role
  7. Edit the role to add additional permission: "Manage attendance"
  8. Save the changes
  9. Create a test user and assign the new role
  10. Log in as the test user and verify permissions

- **Expected Results**:
  1. User Roles page loads successfully
  2. New role creation form appears
  3. Role is created successfully with confirmation message
  4. Role can be edited successfully
  5. Changes are saved correctly
  6. Test user can access only the permitted functions

- **Pass/Fail Criteria**:
  - Role is created with correct permissions
  - Edited permissions are saved correctly
  - Test user has access to exactly the assigned permissions

- **Notes**: Verify both positive permissions (what the user can do) and negative permissions (what the user cannot do)

## Campus Management Test Cases

### TC-ADMIN-CAMP-001: Create New Campus

- **ID**: TC-ADMIN-CAMP-001
- **Title**: Create New Campus
- **Scenario**: 2.1 Campus Creation and Setup
- **Priority**: High
- **Preconditions**:
  - User has System Admin role
  - User is logged in to the Admin Portal

- **Test Steps**:
  1. Navigate to Campus Management from the main dashboard
  2. Click "Add New Campus"
  3. Enter campus details:
     - Name: "Test Campus"
     - Code: "TC001"
     - Address: "123 Test Street"
     - City: "Test City"
     - State/Province: "Test State"
     - Country: "Test Country"
     - Postal Code: "12345"
     - Phone: "123-456-7890"
     - Email: "testcampus@example.com"
  4. Upload campus logo
  5. Configure campus features:
     - Enable attendance tracking
     - Enable grading
     - Enable student portal
     - Enable teacher portal
  6. Click "Create Campus"
  7. Navigate to the newly created campus details

- **Expected Results**:
  1. Campus Management page loads successfully
  2. New campus form appears
  3. All fields accept input correctly
  4. Logo upload works correctly
  5. Campus is created successfully with confirmation message
  6. Campus details page shows all entered information correctly
  7. Configured features are enabled

- **Pass/Fail Criteria**:
  - Campus is created with all details correct
  - Campus appears in the campus list
  - Campus features are configured correctly

- **Notes**: Verify that required fields validation works correctly

### TC-ADMIN-CAMP-002: Assign Campus Administrator

- **ID**: TC-ADMIN-CAMP-002
- **Title**: Assign Campus Administrator
- **Scenario**: 2.1 Campus Creation and Setup
- **Priority**: High
- **Preconditions**:
  - User has System Admin role
  - User is logged in to the Admin Portal
  - A campus has been created (Test Campus)
  - A user with appropriate role exists

- **Test Steps**:
  1. Navigate to Campus Management from the main dashboard
  2. Select "Test Campus" from the list
  3. Click on "Administrators" tab
  4. Click "Assign Administrator"
  5. Search for a user by name or email
  6. Select a user from the search results
  7. Assign the role "Campus Admin"
  8. Set the status to "Active"
  9. Click "Assign"
  10. Log out and log in as the assigned administrator
  11. Verify access to the campus

- **Expected Results**:
  1. Campus Management page loads successfully
  2. Campus details page loads with Administrators tab
  3. User search works correctly
  4. User is assigned successfully with confirmation message
  5. Assigned user appears in the administrators list
  6. Assigned user can log in and access the campus with appropriate permissions

- **Pass/Fail Criteria**:
  - Administrator is assigned correctly
  - Administrator has appropriate access to the campus
  - Administrator cannot access other campuses

- **Notes**: Verify that multiple administrators can be assigned to a single campus

## Program and Course Management Test Cases

### TC-ADMIN-PROG-001: Create Academic Program

- **ID**: TC-ADMIN-PROG-001
- **Title**: Create Academic Program
- **Scenario**: 3.1 Program Creation and Management
- **Priority**: High
- **Preconditions**:
  - User has System Admin role
  - User is logged in to the Admin Portal
  - At least one campus exists

- **Test Steps**:
  1. Navigate to Program Management from the main dashboard
  2. Click "Create New Program"
  3. Enter program details:
     - Name: "Test Program"
     - Code: "TP001"
     - Description: "Test program for UAT"
     - Duration: "2 years"
     - Level: "Undergraduate"
  4. Select campuses where the program will be offered
  5. Configure program structure:
     - Add semesters/terms
     - Define credit requirements
  6. Click "Create Program"
  7. Navigate to the newly created program details

- **Expected Results**:
  1. Program Management page loads successfully
  2. New program form appears
  3. All fields accept input correctly
  4. Program is created successfully with confirmation message
  5. Program details page shows all entered information correctly
  6. Program structure is configured correctly

- **Pass/Fail Criteria**:
  - Program is created with all details correct
  - Program appears in the program list
  - Program is associated with the selected campuses

- **Notes**: Verify that the program appears correctly in the campus view

### TC-ADMIN-COURSE-001: Create Course in Program

- **ID**: TC-ADMIN-COURSE-001
- **Title**: Create Course in Program
- **Scenario**: 3.2 Course Setup and Configuration
- **Priority**: High
- **Preconditions**:
  - User has Campus Admin role
  - User is logged in to the Admin Portal
  - A program has been created (Test Program)
  - The program is associated with the admin's campus

- **Test Steps**:
  1. Navigate to Course Management from the main dashboard
  2. Select "Test Program" from the list
  3. Click "Add New Course"
  4. Enter course details:
     - Name: "Test Course"
     - Code: "TC001"
     - Description: "Test course for UAT"
     - Credits: "3"
     - Hours per week: "4"
  5. Assign to semester/term
  6. Configure course settings:
     - Grading scale
     - Attendance requirements
     - Prerequisites
  7. Click "Create Course"
  8. Navigate to the newly created course details

- **Expected Results**:
  1. Course Management page loads successfully
  2. New course form appears
  3. All fields accept input correctly
  4. Course is created successfully with confirmation message
  5. Course details page shows all entered information correctly
  6. Course settings are configured correctly

- **Pass/Fail Criteria**:
  - Course is created with all details correct
  - Course appears in the program's course list
  - Course settings are applied correctly

- **Notes**: Verify that prerequisites are enforced correctly when students enroll

## User Management Test Cases

### TC-ADMIN-USER-001: Bulk Import Users

- **ID**: TC-ADMIN-USER-001
- **Title**: Bulk Import Users
- **Scenario**: 4.1 Bulk User Import
- **Priority**: Medium
- **Preconditions**:
  - User has System Admin or Campus Admin role
  - User is logged in to the Admin Portal
  - A CSV file with user data is prepared

- **Test Steps**:
  1. Navigate to User Management from the main dashboard
  2. Click "Bulk Import"
  3. Select user type (Students, Teachers, etc.)
  4. Download the template CSV file
  5. Upload the prepared CSV file
  6. Review the import preview
  7. Handle any validation errors
  8. Confirm the import
  9. Navigate to the user list to verify imported users

- **Expected Results**:
  1. User Management page loads successfully
  2. Bulk Import option is available
  3. Template CSV file can be downloaded
  4. CSV file can be uploaded
  5. Preview shows the data to be imported
  6. Validation errors are displayed clearly
  7. Import confirmation shows success message
  8. Imported users appear in the user list

- **Pass/Fail Criteria**:
  - Users are imported correctly
  - Validation errors are handled properly
  - Imported users have correct roles and permissions

- **Notes**: Test with both valid and invalid data to verify error handling

### TC-ADMIN-USER-002: Assign Teacher to Classes

- **ID**: TC-ADMIN-USER-002
- **Title**: Assign Teacher to Classes
- **Scenario**: 4.2 Teacher Assignment and Management
- **Priority**: High
- **Preconditions**:
  - User has Campus Admin role
  - User is logged in to the Admin Portal
  - At least one teacher exists
  - At least one class exists

- **Test Steps**:
  1. Navigate to Teacher Management from the main dashboard
  2. Select a teacher from the list
  3. Click on "Class Assignments" tab
  4. Click "Assign to Class"
  5. Select a class from the available classes
  6. Set assignment details:
     - Role: "Primary Teacher"
     - Start date
     - End date (optional)
  7. Click "Assign"
  8. Verify the assignment in the teacher's profile
  9. Verify the assignment in the class details

- **Expected Results**:
  1. Teacher Management page loads successfully
  2. Teacher profile loads with Class Assignments tab
  3. Available classes are displayed
  4. Assignment is created successfully with confirmation message
  5. Assignment appears in the teacher's assignments list
  6. Assignment appears in the class details

- **Pass/Fail Criteria**:
  - Teacher is assigned correctly to the class
  - Assignment details are recorded correctly
  - Teacher can access the assigned class

- **Notes**: Verify that scheduling conflicts are detected and prevented
