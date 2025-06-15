# Assessment System Structure in Aivy LXP

## Table of Contents

1. [Introduction](#introduction)
2. [Assessment System Hierarchy](#assessment-system-hierarchy)
3. [Core Components](#core-components)
   - [Assessment](#assessment)
   - [Assessment Template](#assessment-template)
   - [Assessment Submission](#assessment-submission)
   - [GradeBook](#gradebook)
   - [Student Grade](#student-grade)
4. [Grading Types and Scales](#grading-types-and-scales)
   - [Numeric Grading](#numeric-grading)
   - [CGPA/GPA Grading](#cgpagpa-grading)
   - [Rubric-Based Grading](#rubric-based-grading)
   - [Letter Grade Conversion](#letter-grade-conversion)
5. [Term and Cumulative Grading](#term-and-cumulative-grading)
6. [Implementation Flow](#implementation-flow)
7. [Use Cases](#use-cases)
8. [Integration Points](#integration-points)
9. [Best Practices](#best-practices)

## Introduction

The Assessment System in Aivy LXP provides a comprehensive framework for evaluating student performance, tracking academic progress, and generating meaningful insights across different timeframes. This document outlines the structure, components, and processes involved in implementing various assessment and grading approaches, from individual assignments to cumulative program-level evaluation.

This system is designed to accommodate diverse educational contexts, from traditional numerical grading to complex rubric-based assessment, while maintaining a consistent approach to data management and reporting.

## Assessment System Hierarchy

```
Course (e.g., "Advanced Physics")
│
├── Class: Term 1 (Fall 2024)
│   ├── Assessments
│   │   ├── Assessment 1: Quiz
│   │   │   └── Assessment Submissions (Student Work)
│   │   │
│   │   ├── Assessment 2: Midterm Exam
│   │   │   └── Assessment Submissions (Student Work)
│   │   │
│   │   └── Assessment 3: Final Project
│   │       └── Assessment Submissions (Student Work)
│   │
│   └── GradeBook: Term 1 Results
│       ├── Student Grade: Assessment 1 (85%)
│       ├── Student Grade: Assessment 2 (90%)
│       ├── Student Grade: Assessment 3 (88%)
│       └── Term Grade: 88% (40% of final course grade)
│
├── Class: Term 2 (Spring 2025)
│   ├── Assessments
│   │   ├── Assessment 4: Research Paper
│   │   │   └── Assessment Submissions (Student Work)
│   │   │
│   │   ├── Assessment 5: Lab Experiment
│   │   │   └── Assessment Submissions (Student Work)
│   │   │
│   │   └── Assessment 6: Final Exam
│   │       └── Assessment Submissions (Student Work)
│   │
│   └── GradeBook: Term 2 Results
│       ├── Student Grade: Assessment 4 (92%)
│       ├── Student Grade: Assessment 5 (87%)
│       ├── Student Grade: Assessment 6 (90%)
│       └── Term Grade: 90% (60% of final course grade)
│
└── Course Completion Record
    ├── Final Course Grade: 89.2% (weighted calculation)
    ├── Credit Earned: 4.0
    └── Status: COMPLETED
```

## Core Components

### Assessment

Assessments represent individual evaluation activities within a class.

**Key Attributes:**
- **Title**: Assessment name/title
- **Description**: Detailed instructions and requirements
- **Class ID**: The class this assessment belongs to
- **Due Date**: Submission deadline
- **Open Date**: When the assessment becomes available
- **Category**: Type of assessment (QUIZ, EXAM, ASSIGNMENT, PROJECT, etc.)
- **Weight**: Contribution to the overall grade (percentage)
- **Total Points**: Maximum possible score
- **Grading Type**: Method of evaluation (NUMERIC, RUBRIC, LETTER, PASS_FAIL, etc.)
- **Grading Scale**: Reference to the grading scale used
- **Status**: Current status of the assessment (DRAFT, PUBLISHED, CLOSED, etc.)
- **Term ID**: Optional direct reference to a specific term

**Relationships:**
- **Many-to-One with Class**: Each assessment belongs to a specific class
- **One-to-Many with Submissions**: Student submissions for this assessment
- **Many-to-One with AssessmentTemplate**: Optional template this assessment is based on

**Functionality:**
- Defines evaluation criteria and expectations
- Structures grading and feedback processes
- Contributes to term and course grades
- Provides assessment analytics data

### Assessment Template

Templates provide standardized assessment structures that can be reused across classes.

**Key Attributes:**
- **Title**: Template name
- **Description**: Purpose and usage guidelines
- **Category**: Type of assessment (QUIZ, EXAM, ASSIGNMENT, PROJECT, etc.)
- **Instructions**: Default instructions for students
- **Rubric Definition**: Predefined evaluation criteria
- **Total Points**: Default maximum score
- **Grading Type**: Default method of evaluation
- **Time Limit**: Optional time constraint for completion
- **Questions**: Predefined assessment items

**Relationships:**
- **One-to-Many with Assessments**: Assessments created from this template

**Functionality:**
- Ensures consistency across similar assessments
- Streamlines assessment creation process
- Maintains standard evaluation criteria
- Supports comparative analytics

### Assessment Submission

Represents a student's response to an assessment.

**Key Attributes:**
- **Assessment ID**: The assessment being responded to
- **Student ID**: The student submitting the work
- **Submission Date**: When the work was submitted
- **Content**: The actual submission data
- **Attachments**: Any attached files or resources
- **Status**: Submission status (DRAFT, SUBMITTED, GRADED, RETURNED, etc.)
- **Submitted Late**: Flag indicating if submission was after the deadline
- **Late Penalty**: Any penalty applied for late submission
- **Score**: Raw numerical score received
- **Feedback**: Teacher comments and guidance

**Relationships:**
- **Many-to-One with Assessment**: Each submission belongs to an assessment
- **Many-to-One with Student**: Each submission is made by a student
- **One-to-One with StudentGrade**: Corresponding grade record

**Functionality:**
- Captures student work for evaluation
- Tracks submission status and timeliness
- Stores feedback for student improvement
- Provides submission analytics

### GradeBook

The GradeBook serves as a container for all grades within a class.

**Key Attributes:**
- **Class ID**: The class this gradebook belongs to
- **Term ID**: Optional reference to a specific term
- **Grading Type**: Primary grading method for this class
- **Grading Scale**: Reference to the grading scale used
- **Calculation Method**: How the final grade is computed
- **Status**: Current status (IN_PROGRESS, FINALIZED, etc.)
- **Publication Date**: When grades were/will be published to students

**Relationships:**
- **Many-to-One with Class**: Each gradebook belongs to a class
- **One-to-Many with StudentGrades**: Individual grade records
- **Many-to-One with Term**: Optional term association

**Functionality:**
- Aggregates all assessment grades for a class
- Calculates final class grades
- Provides grade distribution analytics
- Manages grade visibility and reporting

### Student Grade

Represents an individual student's grade for a specific assessment or the overall class.

**Key Attributes:**
- **GradeBook ID**: The parent gradebook
- **Student ID**: The student being graded
- **Assessment ID**: Optional reference to a specific assessment (if an assessment grade)
- **Raw Score**: Numerical points earned
- **Percentage**: Score as a percentage of total possible points
- **Letter Grade**: Optional letter grade representation
- **GPA Value**: Numerical equivalent for GPA calculation
- **Status**: Current status (PROVISIONAL, FINAL, etc.)
- **Is Final Grade**: Flag indicating if this is the final grade for the class
- **Override**: Flag indicating if this grade was manually overridden
- **Comments**: Optional explanatory notes

**Relationships:**
- **Many-to-One with GradeBook**: Each grade belongs to a gradebook
- **Many-to-One with Student**: Each grade is for a specific student
- **Many-to-One with Assessment**: Optional reference to a specific assessment

**Functionality:**
- Records individual assessment performance
- Contributes to final class grade calculations
- Enables student performance tracking
- Supports historical grade records

## Grading Types and Scales

### Numeric Grading

Numeric grading uses direct numerical scores or percentages to evaluate student work.

**Implementation:**
- **Raw Points**: Direct numerical scores (e.g., 85 out of 100)
- **Percentage**: Scores converted to percentages
- **Customizable Thresholds**: Defines passing and excellence thresholds
- **Weight Distribution**: Assessments can have different weights in final calculation

**Example Configuration:**
```
Assessment Total Points: 100
Student Score: 85
Percentage: 85%
Pass Threshold: 60%
Excellence Threshold: 90%
Grade Status: PASSED
```

### CGPA/GPA Grading

Grade Point Average systems use numerical equivalents for performance levels.

**Implementation:**
- **GPA Scale**: Typically 0.0 to 4.0 (or 0.0 to 5.0 in some systems)
- **Grade Points**: Numerical values assigned to letter grades
- **Credit Hours**: Weighting based on course credits
- **Term GPA**: Average for a single term
- **Cumulative GPA**: Average across all terms

**Example Configuration:**
```
4.0 Scale:
A = 4.0 (90-100%)
B = 3.0 (80-89%)
C = 2.0 (70-79%)
D = 1.0 (60-69%)
F = 0.0 (0-59%)

Course Credits: 3
Student Grade: 85% (B = 3.0)
Grade Points: 3.0 × 3 credits = 9.0 grade points
```

### Rubric-Based Grading

Rubric grading uses structured criteria with performance levels to evaluate work.

**Implementation:**
- **Criteria**: Specific aspects of the assessment to evaluate
- **Performance Levels**: Defined quality levels for each criterion
- **Points Per Level**: Score assigned to each performance level
- **Weighted Criteria**: Different criteria can have different weights

**Example Rubric:**
```
Criterion 1: Research Quality (40%)
- Excellent (4): Comprehensive research with diverse sources (40 points)
- Good (3): Solid research with adequate sources (30 points)
- Satisfactory (2): Basic research with limited sources (20 points)
- Needs Improvement (1): Minimal research with few sources (10 points)

Criterion 2: Analysis (30%)
- [Performance levels with points]

Criterion 3: Presentation (30%)
- [Performance levels with points]

Student Scores:
- Research Quality: Good (30 points)
- Analysis: Excellent (30 points)
- Presentation: Satisfactory (15 points)
Final Score: 75 points (75%)
```

### Letter Grade Conversion

Letter grades provide categorical representations of performance levels.

**Implementation:**
- **Grade Bands**: Percentage ranges mapped to letter grades
- **Customizable Scales**: Different institutions can define their own mappings
- **Plus/Minus Gradations**: Finer distinctions within letter grades

**Example Conversion Table:**
```
A+: 97-100%
A:  93-96%
A-: 90-92%
B+: 87-89%
B:  83-86%
B-: 80-82%
C+: 77-79%
C:  73-76%
C-: 70-72%
D+: 67-69%
D:  63-66%
D-: 60-62%
F:  0-59%
```

## Term and Cumulative Grading

### Term-Based Grading

Term grading focuses on performance within a specific academic period.

**Implementation:**
- **Term GradeBook**: Contains all grades for a specific class in a term
- **Assessment Weightings**: Different assessments contribute different percentages
- **Term GPA Calculation**: Average of all class grades in a term, weighted by credits
- **Term Completion Status**: Overall performance status for the term

**Example Term Calculation:**
```
Class: Physics 101 (Term 1)
- Quiz 1: 85% (Weight: 10%)
- Lab Reports: 90% (Weight: 30%)
- Midterm: 78% (Weight: 20%)
- Final Exam: 88% (Weight: 40%)

Term Grade Calculation:
(85 × 0.1) + (90 × 0.3) + (78 × 0.2) + (88 × 0.4) = 85.9%
Letter Grade: B
Grade Points: 3.0 × 4 credits = 12.0 grade points
```

### Cumulative Grading

Cumulative grading tracks performance across multiple terms or the entire program.

**Implementation:**
- **Course Completion Record**: Aggregates performance across all terms for a course
- **Term Weightings**: Different terms can contribute different percentages to final grade
- **Cumulative GPA**: Average of all course grades, weighted by credits
- **Program Completion Percentage**: Progress toward graduation requirements

**Example Cumulative Calculation:**
```
Course: Advanced Physics (across multiple terms)
- Term 1: 85.9% (Weight: 40%)
- Term 2: 90.2% (Weight: 60%)

Final Course Grade:
(85.9 × 0.4) + (90.2 × 0.6) = 88.5%
Letter Grade: B+
Grade Points: 3.3 × 4 credits = 13.2 grade points

Student's Cumulative Record:
- Total Credits Attempted: 60
- Total Credits Earned: 58
- Total Grade Points: 180.6
- Cumulative GPA: 3.11
- Program Completion: 48.3% (58/120 credits)
```

### Special Grading Scenarios

#### Course Retakes

When students repeat courses to improve grades:

**Implementation:**
- **Retake Flag**: Indicates the course has been taken before
- **Grade Replacement**: Options for replacing original grade or averaging
- **Attempt Count**: Tracks number of times the course was taken
- **GPA Impact Rules**: Defines how retakes affect cumulative GPA

**Example:**
```
Course: Math 101
Original Attempt: D (1.0)
Retake Attempt: B (3.0)

Grade Replacement Policy: Higher Grade
Final Record: B (3.0)
GPA Calculation: Only B is counted in GPA
```

#### Incomplete Grades

When students need additional time to complete requirements:

**Implementation:**
- **Incomplete Status**: Temporary grade indication
- **Expiration Date**: When incomplete status must be resolved
- **Default Grade**: Grade assigned if not completed by deadline
- **Resolution Process**: Workflow for converting incomplete to final grade

**Example:**
```
Course: Literature 202
Current Status: Incomplete (I)
Expiration Date: March 15, 2025
Default Grade if Unresolved: F
Required Completion: Final Paper and Exam
```

#### Transfer Credits

Credits earned at other institutions:

**Implementation:**
- **Transfer Source**: Original institution information
- **Equivalency**: Mapped to equivalent local course
- **Grade Treatment**: Options for including in GPA or credit-only
- **Transfer Limit**: Maximum transfer credits allowed

**Example:**
```
Original Course: CHEM101 at State University
Equivalent Local Course: CHEM135
Original Grade: A- (3.7)
Transfer Type: Credit Only (no GPA impact)
Credits Applied: 4
```

## Implementation Flow

The implementation flow for the assessment system follows these steps:

### 1. Assessment Framework Setup

- Define grading types and scales for the institution
- Create assessment categories and templates
- Establish grade calculation policies

### 2. Class-Level Assessment Planning

- Create assessments for each class
- Define weightings and grading criteria
- Set up submission requirements and deadlines

### 3. Student Submission Management

- Track submission status and deadlines
- Process student work
- Handle special cases (late submissions, extensions, etc.)

### 4. Grading and Feedback

- Evaluate submissions using appropriate grading methods
- Provide detailed feedback
- Record scores in the gradebook

### 5. Term Grade Calculation

- Aggregate assessment grades with proper weightings
- Calculate final term grades
- Apply any term-specific policies

### 6. Cumulative Record Maintenance

- Update student transcript with term results
- Calculate updated cumulative metrics
- Track progress toward program completion

### 7. Academic Standing Evaluation

- Apply progression rules based on grades
- Identify students needing intervention
- Update student status (Good Standing, Probation, etc.)

### 8. Reporting and Analytics

- Generate grade reports for students
- Provide analytics for instructors and administrators
- Support data-driven decision making

## Use Cases

### Case 1: University Course with Mixed Assessment Types

**Course**: Business Statistics (BUS301)

**Term Structure**:
- Semester 1: Foundations and Probability
- Semester 2: Inferential Statistics and Applications

**Assessment Plan**:
- **Semester 1**:
  - Weekly Quizzes (20%): Numeric grading, 10 points each
  - Case Study Project (30%): Rubric-based, 100 points
  - Midterm Exam (20%): Numeric grading, 100 points
  - Final Exam (30%): Numeric grading, 100 points

- **Semester 2**:
  - Data Analysis Labs (25%): Rubric-based, 20 points each
  - Research Project (35%): Rubric-based, 100 points
  - Final Exam (40%): Numeric grading, 100 points

**Term Weighting**:
- Semester 1: 40% of final grade
- Semester 2: 60% of final grade

**Implementation Steps**:
1. Create the course structure with two semesters
2. Set up assessments with appropriate weightings
3. Define rubrics for project-based assessments
4. Establish term and cumulative calculation methods
5. Process student submissions and grades
6. Calculate final course grades and update transcripts

### Case 2: K-12 Standards-Based Grading

**Course**: 8th Grade Science

**Term Structure**:
- Quarter 1: Physical Science Concepts
- Quarter 2: Life Science Concepts
- Quarter 3: Earth Science Concepts
- Quarter 4: Applied Science Projects

**Assessment Approach**:
- Standards-based rubric grading (4-point scale):
  - 4: Exceeds Standard
  - 3: Meets Standard
  - 2: Approaching Standard
  - 1: Below Standard

**Standards Categories**:
- Scientific Knowledge (40%)
- Inquiry and Process Skills (30%)
- Application and Analysis (30%)

**Implementation Steps**:
1. Define standards rubrics for each category
2. Create assessments mapped to specific standards
3. Track mastery levels across quarters
4. Calculate standards-based report card grades
5. Generate growth reports showing progress over time

## Integration Points

The assessment system integrates with several other system components:

### 1. Academic Structure
- Assessments are connected to classes, terms, and courses
- Grading policies can be defined at institutional or program level
- Academic periods provide context for grade calculation and reporting

### 2. Learning Management
- Assessments connect to learning activities
- Submission processes integrate with content delivery
- Feedback mechanisms support the learning cycle

### 3. Attendance System
- Attendance can impact grade calculations (if configured)
- Absence patterns may trigger grade accommodations
- Participation grades can draw from attendance data

### 4. Student Records
- Grades feed into official transcripts
- Academic standing is determined from grade data
- Graduation eligibility is calculated from completed requirements

### 5. Reporting System
- Grade data drives performance dashboards
- Analytics identify trends and intervention needs
- Compliance reporting uses grade statistics

### 6. Parent/Student Portals
- Grade visibility is managed through portals
- Progress tracking is available to stakeholders
- Grade notifications alert users to new evaluations

## Best Practices

### 1. Grading Policy Transparency
- Clearly document grading methods and scales
- Publish assessment weightings in advance
- Provide rubrics before assignment submission
- Ensure consistent application of grading standards

### 2. Data Integrity
- Implement grade change audit trails
- Use validation rules to prevent impossible scores
- Regularly backup grade data
- Establish grade finalization workflows

### 3. Flexible Configuration
- Support multiple grading approaches within the same institution
- Allow program-specific grade scales
- Enable instructor customization within institutional guidelines
- Provide options for special grading situations

### 4. Performance Optimization
- Implement caching for frequently accessed grade data
- Optimize grade calculation algorithms
- Schedule intensive recalculations during off-peak hours
- Use incremental updates for cumulative statistics

### 5. Security and Privacy
- Enforce strict grade data access controls
- Comply with educational privacy regulations
- Implement row-level security for grade visibility
- Maintain detailed access logs for grade changes

### 6. User Experience
- Design intuitive grading interfaces for instructors
- Provide clear grade visualizations for students
- Support batch operations for efficient grading
- Include contextual help for grading features

By following these guidelines and leveraging the comprehensive assessment structure, educational institutions can implement robust, flexible, and pedagogically sound grading practices that support student learning and academic progress tracking. 