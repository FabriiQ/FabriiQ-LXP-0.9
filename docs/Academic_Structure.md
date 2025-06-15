# Academic Structure in Aivy LXP

## Table of Contents

1. [Introduction](#introduction)
2. [Academic Structure Hierarchy](#academic-structure-hierarchy)
3. [Core Components](#core-components)
   - [Institution](#institution)
   - [Campus](#campus)
   - [Programs](#programs)
   - [Academic Cycles](#academic-cycles)
   - [Terms](#terms)
   - [Courses and Subjects](#courses-and-subjects)
   - [Classes](#classes)
4. [Component Relationships](#component-relationships)
5. [Business Rules and Logic](#business-rules-and-logic)
6. [Role-Based Access Control](#role-based-access-control)
7. [Implementation Flow](#implementation-flow)
8. [Use Cases](#use-cases)
9. [Integration Points](#integration-points)
10. [Best Practices](#best-practices)

## Introduction

The Academic Structure in Aivy LXP provides a comprehensive framework for organizing educational institutions, their offerings, and related activities. This document outlines the hierarchical components, their relationships, and implementation strategies to effectively manage educational structures from institutional level down to individual class sessions.

This structure allows educational organizations to configure their organizational hierarchy, academic offerings, and instructional delivery while maintaining a consistent approach to education management.

## Academic Structure Hierarchy

```
Institution
│
├── Academic Cycles (flexible duration educational periods)
│   │
│   ├── Terms (with TermType and TermPeriod)
│   │   │
│   │   ├── Classes
│   │   │   │
│   │   │   ├── Timetables
│   │   │   │   │
│   │   │   │   └── TimetablePeriods
│   │   │   │
│   │   │   ├── Assessments
│   │   │   │   │
│   │   │   │   └── AssessmentSubmissions
│   │   │   │
│   │   │   └── Activities
│   │   │
│   │   └── SchedulePatterns
│   │       │
│   │       └── ScheduleExceptions
│   │
│   ├── Calendar Events (academic events)
│   │
│   └── Holidays (non-instructional days)
│
└── Campuses (physical or virtual locations)
    │
    ├── Programs (degree/certificate offerings)
    │   │
    │   └── ProgramCampus (campus-specific program implementations)
    │
    ├── Courses (specific educational offerings)
    │   │
    │   └── CourseCampus (campus-specific course implementations)
    │
    └── Campus Features (facilities and amenities)
```

## Core Components

### Institution

The Institution is the top-level entity in the academic structure, representing the educational organization as a whole.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: The official name of the institution
- **Code**: A unique identifier or abbreviation
- **Address**: Physical location of the institution's headquarters
- **Contact Information**: Phone, email, and other contact details
- **Logo**: The institution's official emblem
- **Website**: Web address of the institution
- **Status**: Current operational status

**Relationships:**
- **One-to-Many with Campuses**: An institution can have multiple campuses
- **One-to-Many with Academic Cycles**: An institution can have multiple academic cycles
- **One-to-Many with Users**: Users are associated with institutions

**Business Rules:**
- Each institution must have a unique code
- Institution status affects the availability of its components
- Only SYSTEM_ADMIN can create or delete institutions
- ADMINISTRATOR role is institution-specific

### Campus

Campuses represent physical or virtual locations where educational activities take place.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Descriptive name of the campus
- **Code**: Unique campus identifier
- **Address**: Physical location
- **Contact Information**: Campus-specific contact details
- **Institution ID**: Reference to parent institution
- **Status**: Operational status of the campus

**Relationships:**
- **Many-to-One with Institution**: Each campus belongs to one institution
- **One-to-Many with Programs**: Campuses can offer multiple programs via ProgramCampus
- **One-to-Many with Courses**: Campuses offer specific courses via CourseCampus
- **One-to-Many with Campus Features**: Campuses have various facilities and amenities
- **One-to-Many with Facilities**: Physical resources available at the campus
- **Many-to-Many with Users**: Users can have access to multiple campuses

**Business Rules:**
- Each campus must have a unique code within its institution
- Campus status affects the availability of its programs and courses
- Campus access is controlled through UserCampusAccess
- CAMPUS_ADMIN role is campus-specific

### Programs

Programs represent complete educational offerings such as degrees, diplomas, or certificates.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Program name (e.g., "Bachelor of Science in Computer Science")
- **Code**: Unique program identifier
- **Description**: Detailed information about the program
- **Level**: Educational level (Undergraduate, Graduate, Certificate, etc.)
- **Credits**: Total credits required for completion
- **Duration**: Standard timeframe for completion (in months/years)
- **Status**: Current status of the program

**Relationships:**
- **Many-to-Many with Campuses**: Programs are offered at specific campuses via ProgramCampus
- **One-to-Many with Courses**: Programs consist of multiple courses

**Business Rules:**
- Each program must have a unique code
- Programs can be offered at multiple campuses with campus-specific variations
- Program availability is controlled through ProgramCampus
- Program status affects student enrollment eligibility

#### ProgramCampus

This represents the availability of programs at specific campuses.

**Key Attributes:**
- **ID**: Unique identifier
- **Program ID**: Reference to the program
- **Campus ID**: Reference to the campus
- **Start Date**: When the program became available at the campus
- **End Date**: When the program will cease to be offered (if applicable)
- **Status**: Current status of this program-campus relationship

**Business Rules:**
- A program can have different start/end dates at different campuses
- ProgramCampus status affects class creation and student enrollment
- Campus-specific program variations are managed through this entity

### Academic Cycles

The Academic Cycle serves as a flexible container for organizing educational activities across varying timeframes.

**Key Attributes:**
- **ID**: Unique identifier
- **Code**: Unique code for the cycle
- **Name**: Descriptive name (e.g., "2023-2024" or "Spring 2024 Short Course")
- **Description**: Optional detailed description
- **Start Date**: Beginning of the academic cycle
- **End Date**: End of the academic cycle
- **Type**: Type of cycle (ANNUAL, SEMESTER, TRIMESTER, QUARTER, CUSTOM)
- **Duration**: Duration in months (calculated automatically)
- **Status**: ACTIVE, INACTIVE, ARCHIVED, DELETED
- **Institution ID**: Reference to parent institution
- **Created By**: User who created the cycle
- **Updated By**: User who last updated the cycle

**Relationships:**
- **Many-to-One with Institution**: Each cycle belongs to one institution
- **One-to-Many with Terms**: A cycle contains multiple terms
- **One-to-Many with Calendar Events**: Academic events within the cycle
- **One-to-Many with Holidays**: Holidays within the cycle
- **Many-to-One with User (Creator)**: Tracks who created the cycle
- **Many-to-One with User (Updater)**: Tracks who last updated the cycle

**Business Rules:**
- Start date must be before end date
- Duration is automatically calculated in months
- No overlapping active cycles within the same institution
- Cannot be deleted if it has active terms
- Access control based on user role and permissions
- Type must be one of the predefined types

### Terms

Terms represent major divisions within an academic cycle, with specific type and period information.

**Key Attributes:**
- **ID**: Unique identifier
- **Code**: Unique code for the term
- **Name**: Descriptive name (e.g., "Fall 2023")
- **Description**: Optional detailed description
- **TermType**: Type of term (SEMESTER, TRIMESTER, QUARTER, THEME_BASED, CUSTOM)
- **TermPeriod**: Specific period within the type:
  - For SEMESTER: FALL, SPRING, SUMMER, WINTER
  - For TRIMESTER: FIRST_TRIMESTER, SECOND_TRIMESTER, THIRD_TRIMESTER
  - For QUARTER: FIRST_QUARTER, SECOND_QUARTER, THIRD_QUARTER, FOURTH_QUARTER
  - For THEME_BASED: THEME_UNIT
- **Start Date**: Beginning of the term
- **End Date**: End of the term
- **Course ID**: Reference to associated course
- **Academic Cycle ID**: Reference to parent academic cycle
- **Status**: ACTIVE, INACTIVE, ARCHIVED, DELETED
- **Schedule Pattern ID**: Optional reference to a recurring schedule pattern

**Relationships:**
- **Many-to-One with Academic Cycle**: Each term belongs to one academic cycle
- **Many-to-One with Course**: Each term is associated with a course
- **One-to-Many with Classes**: Classes are assigned to specific terms
- **One-to-Many with Assessments**: Term-based assessment planning
- **One-to-Many with Facility Schedules**: Term-specific facility scheduling
- **One-to-Many with Grade Books**: Term-based grade management
- **Many-to-One with Schedule Pattern**: Optional association with a recurring schedule

**Business Rules:**
- Term dates must fall within the parent academic cycle dates
- TermType and TermPeriod must be compatible
- Each term must be associated with a course
- Term status affects class scheduling and enrollment
- Terms cannot be deleted if they have active classes

### Courses and Subjects

#### Subject

Subjects represent specific disciplines or fields of study.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Subject name (e.g., "Mathematics", "History")
- **Code**: Unique subject identifier
- **Description**: Detailed information about the subject
- **Parent Subject ID**: Optional reference to a broader subject category
- **Node Type**: Whether this is a leaf subject or a category

**Relationships:**
- **Self-referential**: Subjects can have parent-child relationships
- **One-to-Many with Courses**: Subjects can have multiple related courses
- **One-to-Many with TeacherSubjectQualification**: Teachers' qualifications in subjects
- **One-to-Many with TeacherSubjectAssignment**: Teacher assignments to subjects

**Business Rules:**
- Subjects can be organized hierarchically
- Subject node type determines if it can have child subjects
- Subjects are used for teacher qualification tracking
- Subjects provide a framework for curriculum organization

#### Course

Courses represent specific educational offerings within subjects.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Course name (e.g., "Introduction to Calculus")
- **Code**: Unique course identifier
- **Description**: Detailed information about the course content
- **Credits**: Academic credit value
- **Level**: Course level (Beginner, Intermediate, Advanced)
- **Subject ID**: Associated subject area
- **Status**: Current course status

**Relationships:**
- **Many-to-One with Subject**: Courses belong to a subject area
- **Many-to-Many with Prerequisites**: Courses can have prerequisite courses
- **Many-to-Many with Campuses**: Courses are offered at specific campuses via CourseCampus
- **One-to-Many with Terms**: Course implementations in specific terms

**Business Rules:**
- Each course must have a unique code
- Courses can have prerequisites that must be completed before enrollment
- Course availability at campuses is managed through CourseCampus
- Course status affects term and class creation

#### CourseCampus

Represents the availability of courses at specific campuses.

**Key Attributes:**
- **ID**: Unique identifier
- **Course ID**: Reference to the course
- **Campus ID**: Reference to the campus
- **Start Date**: When the course became available at the campus
- **End Date**: When the course will cease to be offered (if applicable)
- **Status**: Current status of this course-campus relationship

**Business Rules:**
- A course can have different availability at different campuses
- CourseCampus status affects class creation
- Campus-specific course variations are managed through this entity

### Classes

Classes represent specific instances of courses being offered in a particular term.

**Key Attributes:**
- **ID**: Unique identifier
- **Name**: Class name (often derived from the course)
- **Description**: Additional class-specific information
- **Course Campus ID**: Reference to the campus-specific course offering
- **Term ID**: Reference to the term when the class is offered
- **Program Campus ID**: Optional reference to the program-campus association
- **Start Date**: Start date for the class
- **End Date**: End date for the class
- **Status**: Current status of the class

**Relationships:**
- **Many-to-One with Term**: Each class belongs to a specific term
- **Many-to-One with Course Campus**: Each class is an instance of a course at a specific campus
- **Many-to-One with Program Campus**: Optional association with a program at a specific campus
- **One-to-Many with Timetables**: Class scheduling
- **One-to-Many with Assessments**: Evaluations for the class
- **One-to-Many with Activities**: Learning activities within the class
- **Many-to-Many with Students**: Students enrolled in the class via StudentEnrollment
- **Many-to-Many with Teachers**: Teachers assigned to the class via TeacherAssignment

**Business Rules:**
- Class dates must fall within the parent term dates
- Classes must be associated with a course campus and term
- Class status affects student enrollment and teacher assignments
- Classes integrate with the timetable system for scheduling

## Component Relationships

The academic structure components have complex interrelationships that enable comprehensive educational management:

### Institutional Hierarchy
- Institutions contain campuses
- Campuses offer programs and courses through ProgramCampus and CourseCampus
- Programs are available at specific campuses via ProgramCampus

### Academic Time Structure
- Institutions have academic cycles
- Academic cycles contain terms
- Terms contain classes
- Academic calendars integrate with this time structure

### Educational Content Organization
- Subjects organize knowledge domains
- Courses implement subjects
- Classes instantiate courses in specific terms
- Activities structure the learning within classes

### Personnel Relationships
- Teachers have subject qualifications
- Teachers are assigned to subjects
- Teachers are assigned to classes
- Students enroll in classes

### Scheduling Framework
- Classes have timetables
- Timetables contain timetable periods
- Schedule patterns define recurring schedules
- The calendar system integrates with this scheduling framework

## Business Rules and Logic

The academic structure implementation enforces several business rules to ensure data integrity and proper educational planning:

### Institution-Level Rules
- Each institution must have a unique code
- Institution status affects the availability of its components
- Only SYSTEM_ADMIN can create or delete institutions
- ADMINISTRATOR role is institution-specific

### Campus-Level Rules
- Each campus must have a unique code within its institution
- Campus status affects the availability of its programs and courses
- Campus access is controlled through UserCampusAccess
- CAMPUS_ADMIN role is campus-specific

### Program and Course Rules
- Programs and courses must have unique codes
- Programs can be offered at multiple campuses with campus-specific variations
- Courses can have prerequisites that must be completed before enrollment
- Program and course availability is controlled through ProgramCampus and CourseCampus

### Academic Cycle Rules
- Start date must be before end date
- Duration is automatically calculated in months
- No overlapping active cycles within the same institution
- Cannot be deleted if it has active terms
- Type must be one of the predefined types (ANNUAL, SEMESTER, TRIMESTER, QUARTER, CUSTOM)

### Term Rules
- Term dates must fall within the parent academic cycle dates
- TermType and TermPeriod must be compatible
- Each term must be associated with a course
- Term status affects class scheduling and enrollment
- Terms cannot be deleted if they have active classes

### Class Rules
- Class dates must fall within the parent term dates
- Classes must be associated with a course campus and term
- Class status affects student enrollment and teacher assignments
- Classes integrate with the timetable system for scheduling

## Role-Based Access Control

The academic structure implementation includes a comprehensive role-based access control system:

### User Types and Roles

- **System Level**:
  - SYSTEM_ADMIN: Full system access
  - SYSTEM_MANAGER: System-wide management without critical operations

- **Institution Level**:
  - ADMINISTRATOR: Institution-wide management

- **Campus Level**:
  - CAMPUS_ADMIN: Full campus management
  - CAMPUS_COORDINATOR: Campus program and course coordination
  - COORDINATOR: Program and course coordination

- **Academic Roles**:
  - TEACHER: Teaching and assessment responsibilities
  - CAMPUS_TEACHER: Campus-specific teaching role

- **Student Roles**:
  - STUDENT: Learning and assessment participation
  - CAMPUS_STUDENT: Campus-specific student role

- **Other Roles**:
  - CAMPUS_PARENT: Parent/guardian access to student information

### Permission Types

Academic structure permissions are organized by level:

- **Institution Level**:
  - MANAGE_ACADEMIC_CYCLES: Create, update, and manage academic cycles
  - VIEW_ALL_ACADEMIC_CYCLES: View all academic cycles in the institution

- **Campus Level**:
  - MANAGE_CAMPUS_ACADEMIC_CYCLES: Manage campus-specific academic cycles
  - VIEW_CAMPUS_ACADEMIC_CYCLES: View campus-specific academic cycles

- **Class Level**:
  - VIEW_CLASS_ACADEMIC_CYCLES: View academic cycles related to assigned classes

### Access Control Implementation

The system implements access control at the service level, with different data access patterns based on user role:

- **Institution Administrators**: Can view and manage all academic cycles within their institution
- **Campus Administrators**: Can view and manage academic cycles related to their campus
- **Teachers**: Can view academic cycles related to their assigned classes
- **Students**: Can view academic cycles related to their enrolled classes

## Implementation Flow

The implementation flow for setting up an academic structure typically follows these steps:

### 1. Institutional Setup
- Create the institution record
- Configure institution-wide settings
- Establish top-level administrative roles

### 2. Campus Configuration
- Create campus records under the institution
- Set up campus features and facilities
- Assign campus administrators
- Configure campus-specific settings

### 3. Subject and Program Definition
- Define the subject hierarchy
- Create programs with their requirements
- Establish program-campus relationships
- Set up degree and certificate requirements

### 4. Course Development
- Create courses within subjects
- Define course content and learning objectives
- Establish course prerequisites
- Configure course-campus availability

### 5. Academic Calendar Setup
- Define academic cycles with appropriate types
- Create terms with specific term types and periods
- Set up holidays and academic events
- Configure schedule patterns for recurring activities

### 6. Class Creation
- Create class instances for courses in specific terms
- Assign teachers to classes
- Set up timetables and schedules
- Define class activities and assessments

### 7. Student Management
- Process student enrollments in classes
- Track attendance and participation
- Manage assessment submissions and grading
- Monitor academic progress

## Use Cases

### Case 1: University with Multiple Campuses

**Institution**: Central University

**Campuses**:
- Main Campus (urban location)
- Satellite Campus (suburban location)
- Online Campus (virtual)

**Academic Structure**:
- Academic Cycle: 2023-2024 (ANNUAL type)
  - Fall Semester (SEMESTER type, FALL period)
  - Spring Semester (SEMESTER type, SPRING period)
  - Summer Term (SEMESTER type, SUMMER period)

**Implementation**:
- Create the Central University institution
- Set up the three campuses
- Define the academic cycle and term structure
- Create programs and establish their campus availability
- Define courses and prerequisites
- Create classes for each course in appropriate terms
- Set up timetables and scheduling
- Process enrollments and teaching assignments

### Case 2: K-12 School Using Quarters

**Institution**: Metropolitan School District

**Campuses**:
- Elementary School
- Middle School
- High School

**Academic Structure**:
- Academic Cycle: 2023-2024 (ANNUAL type)
  - First Quarter (QUARTER type, FIRST_QUARTER period)
  - Second Quarter (QUARTER type, SECOND_QUARTER period)
  - Third Quarter (QUARTER type, THIRD_QUARTER period)
  - Fourth Quarter (QUARTER type, FOURTH_QUARTER period)

**Implementation**:
- Create the school district institution
- Set up the three school campuses
- Define the academic cycle with quarters
- Create the subject hierarchy
- Define grade-appropriate courses
- Create classes for each grade level
- Assign teachers with appropriate qualifications
- Process student enrollments by grade

### Case 3: Short Course Program

**Institution**: Professional Development Institute

**Campus**:
- Training Center

**Academic Structure**:
- Academic Cycle: Spring 2024 Bootcamp (CUSTOM type)
  - Bootcamp Term (CUSTOM type, THEME_UNIT period)

**Implementation**:
- Create the institute institution
- Set up the training center campus
- Define the custom academic cycle
- Create the specialized course
- Set up the bootcamp term
- Create the class with intensive scheduling
- Assign specialized instructors
- Process professional enrollments

## Integration Points

The academic structure integrates with several other system components:

### 1. User Management
- User types determine access to academic structure components
- Campus access controls which campuses a user can interact with
- Role-based permissions filter academic data appropriately

### 2. Calendar Management
- Academic cycles and terms define the educational calendar
- Holidays and academic events appear on calendars
- Timetable periods show on user schedules
- Schedule patterns define recurring events

### 3. Attendance and Assessment
- Classes provide the context for attendance tracking
- Terms organize assessment periods
- Academic cycles enable reporting across terms
- Grade books are organized by terms

### 4. Reporting and Analytics
- Academic structure provides hierarchical data organization
- Time-based reporting uses academic cycles and terms
- Campus-based reporting uses the campus hierarchy
- Program and course analytics leverage their relationships

## Best Practices

### 1. Hierarchical Consistency
- Maintain consistent naming conventions across the academic structure
- Ensure logical nesting of components (institution → campus → program → course)
- Document any exceptions to standard hierarchies

### 2. Time Management
- Plan academic cycles well in advance
- Ensure term dates align properly with the parent cycle
- Configure holidays and academic events early
- Use schedule patterns for efficient recurring scheduling

### 3. Access Control
- Implement role-based access aligned with the academic structure
- Ensure campus-level security boundaries
- Provide class-level permissions for teachers and students
- Maintain audit trails for all changes

### 4. Data Integrity
- Enforce business rules at the service level
- Validate dates, types, and relationships
- Prevent overlapping cycles and terms
- Maintain proper status transitions

### 5. Performance Optimization
- Use the provided database indexes for efficient queries
- Consider the impact of large date range queries
- Implement pagination for listing large numbers of cycles
- Cache frequently accessed hierarchical data

By following these guidelines and understanding the complete academic structure, administrators can effectively manage complex educational organizations while supporting teaching, learning, and reporting needs. 