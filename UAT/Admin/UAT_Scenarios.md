# Admin Portal UAT Scenarios

## Overview

This document outlines the key user scenarios for testing the Admin Portal. Each scenario represents a complete user journey that tests multiple features and functions of the system from the perspective of different admin roles.

## Scenario Categories

1. **System Administration**
2. **Campus Management**
3. **Program and Course Management**
4. **User Management**
5. **Fee and Enrollment Management**
6. **Reporting and Analytics**

## Detailed Scenarios

### 1. System Administration Scenarios

#### Scenario 1.1: System Setup and Configuration
**User Role**: System Admin  
**Objective**: Configure system-wide settings and parameters  
**Description**: A system administrator sets up the system for the first time, configuring global settings, enabling features, and establishing system parameters.

**Key Steps**:
1. Log in as System Admin
2. Navigate to system settings
3. Configure global parameters
4. Set up authentication methods
5. Define role permissions
6. Configure notification settings
7. Save and verify changes

#### Scenario 1.2: User Role Management
**User Role**: System Admin  
**Objective**: Create and manage user roles and permissions  
**Description**: A system administrator creates new roles, assigns permissions, and manages existing roles to ensure proper access control.

**Key Steps**:
1. Log in as System Admin
2. Navigate to role management
3. Create a new role
4. Assign permissions to the role
5. Modify an existing role
6. Test role permissions
7. Delete a role

### 2. Campus Management Scenarios

#### Scenario 2.1: Campus Creation and Setup
**User Role**: System Admin  
**Objective**: Create a new campus and configure its settings  
**Description**: A system administrator creates a new campus, configures its details, and sets up its features and facilities.

**Key Steps**:
1. Log in as System Admin
2. Navigate to campus management
3. Create a new campus
4. Configure campus details
5. Set up campus features
6. Add facilities
7. Assign campus administrators
8. Verify campus creation

#### Scenario 2.2: Campus Feature Management
**User Role**: Campus Admin  
**Objective**: Enable and configure campus-specific features  
**Description**: A campus administrator enables and configures features specific to their campus, such as attendance tracking, grading, and portal access.

**Key Steps**:
1. Log in as Campus Admin
2. Navigate to campus settings
3. Enable/disable features
4. Configure feature settings
5. Save and verify changes

### 3. Program and Course Management Scenarios

#### Scenario 3.1: Program Creation and Management
**User Role**: System Admin / Campus Admin  
**Objective**: Create and manage academic programs  
**Description**: An administrator creates a new academic program, configures its structure, and assigns it to campuses.

**Key Steps**:
1. Log in as appropriate admin
2. Navigate to program management
3. Create a new program
4. Define program structure
5. Assign program to campuses
6. Configure program settings
7. Verify program creation

#### Scenario 3.2: Course Setup and Configuration
**User Role**: Campus Admin  
**Objective**: Set up courses within a program  
**Description**: A campus administrator creates courses within a program, configures course details, and assigns teachers.

**Key Steps**:
1. Log in as Campus Admin
2. Navigate to course management
3. Select a program
4. Create a new course
5. Configure course details
6. Assign teachers
7. Set up course schedule
8. Verify course creation

### 4. User Management Scenarios

#### Scenario 4.1: Bulk User Import
**User Role**: System Admin / Campus Admin  
**Objective**: Import multiple users at once  
**Description**: An administrator imports multiple users from a CSV file, verifies the import, and manages any errors.

**Key Steps**:
1. Log in as appropriate admin
2. Navigate to user management
3. Select bulk import option
4. Upload CSV file
5. Review import preview
6. Confirm import
7. Handle any errors
8. Verify imported users

#### Scenario 4.2: Teacher Assignment and Management
**User Role**: Campus Admin  
**Objective**: Assign teachers to classes and manage their workload  
**Description**: A campus administrator assigns teachers to classes, manages their schedules, and monitors their workload.

**Key Steps**:
1. Log in as Campus Admin
2. Navigate to teacher management
3. Select a teacher
4. View current assignments
5. Assign to new classes
6. Adjust teaching load
7. Verify assignments

### 5. Fee and Enrollment Management Scenarios

#### Scenario 5.1: Fee Structure Setup
**User Role**: System Admin  
**Objective**: Create and configure fee structures  
**Description**: A system administrator creates fee structures, configures fee components, and assigns them to programs.

**Key Steps**:
1. Log in as System Admin
2. Navigate to fee management
3. Create a new fee structure
4. Configure fee components
5. Set payment schedules
6. Assign to programs
7. Verify fee structure

#### Scenario 5.2: Student Enrollment and Fee Assignment
**User Role**: Campus Admin  
**Objective**: Enroll students and assign fees  
**Description**: A campus administrator enrolls students in programs, assigns appropriate fee structures, and manages discounts.

**Key Steps**:
1. Log in as Campus Admin
2. Navigate to enrollment management
3. Select a student
4. Enroll in a program
5. Assign fee structure
6. Apply discounts if applicable
7. Confirm enrollment
8. Verify enrollment and fees

### 6. Reporting and Analytics Scenarios

#### Scenario 6.1: Custom Report Generation
**User Role**: System Admin / Campus Admin  
**Objective**: Create and generate custom reports  
**Description**: An administrator creates a custom report, configures its parameters, and generates it for analysis.

**Key Steps**:
1. Log in as appropriate admin
2. Navigate to reporting
3. Create a new custom report
4. Configure report parameters
5. Select data fields
6. Set filters and sorting
7. Generate report
8. Export report in different formats

#### Scenario 6.2: Analytics Dashboard Usage
**User Role**: System Admin / Campus Admin  
**Objective**: Use analytics dashboards to gain insights  
**Description**: An administrator uses analytics dashboards to monitor key metrics, identify trends, and make data-driven decisions.

**Key Steps**:
1. Log in as appropriate admin
2. Navigate to analytics dashboard
3. Select time period
4. Filter data as needed
5. Interact with visualizations
6. Drill down into specific metrics
7. Export insights
8. Set up alerts for key metrics
