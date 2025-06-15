# Activities Implementation Guide

This document provides a comprehensive overview of the activities system in our learning platform, including available activity types, their implementation details, and best practices for creating and managing activities.

## Table of Contents

1. [Introduction](#introduction)
2. [Activity Architecture](#activity-architecture)
3. [Activity Types](#activity-types)
   - [Quiz Activities](#quiz-activities)
   - [Reading Activities](#reading-activities)
   - [H5P Activities](#h5p-activities)
   - [Worksheet Activities](#worksheet-activities)
   - [Assessment Activities](#assessment-activities)
4. [Activity Creation Workflow](#activity-creation-workflow)
5. [AI Content Studio Integration](#ai-content-studio-integration)
6. [Activity Grading and Feedback](#activity-grading-and-feedback)
7. [Best Practices](#best-practices)

## Introduction

Activities are the core interactive elements of our learning platform. They provide students with opportunities to engage with content, practice skills, and demonstrate understanding. Our platform supports various activity types, each designed for specific educational purposes.

## Activity Architecture

Activities in our system follow a registry-based architecture with the following components:

- **Activity Registry**: Central registry where all activity types are registered
- **Activity Type**: Defines the behavior, configuration schema, and components for an activity
- **Activity Editor**: Component for creating and editing activities
- **Activity Viewer**: Component for displaying and interacting with activities
- **Activity Configuration**: JSON schema that defines the structure and validation rules for activity data

Each activity type implements the following capabilities:
- `isGradable`: Whether the activity can be graded
- `hasSubmission`: Whether the activity requires student submission
- `hasInteraction`: Whether the activity has interactive elements
- `hasRealTimeComponents`: Whether the activity has real-time components

## Activity Types

### Quiz Activities

Quiz activities allow educators to create interactive quizzes with various question types.

**Implementation Details:**
- **Purpose**: Assessment, Practice
- **Question Types**:
  - **Basic Questions**:
    - Multiple Choice: Single correct answer from options
    - Multiple Answer: Multiple correct answers from options
    - Short Answer: Free text response
    - True/False: Binary choice questions
    - Numeric: Numerical answer with optional range
    - Essay: Extended text response with word count limits
  
  - **Interactive Questions**:
    - Fill in the Blanks: Text with blank spaces to complete
    - Matching: Match items from two columns
    - Sequence: Arrange items in correct order
    - Drag and Drop: Drag items to correct targets
    - Drag the Words: Drag words into correct positions in text
    - Dropdown: Select correct options from dropdown menus
  
  - **Advanced Questions**:
    - Hotspot: Click on correct areas in an image
    - Likert Scale: Rate statements on a scale

**Features:**
- Automatic grading for objective question types
- Manual grading for subjective question types
- Question randomization
- Time limits
- Feedback options
- Explanation for correct answers

### Reading Activities

Reading activities provide content for students to read and interact with.

**Implementation Details:**
- **Purpose**: Content Delivery, Engagement
- **Editor**: PlateJS-based rich text editor with AI capabilities
- **Features**:
  - Rich text formatting
  - Embedded media (images, videos)
  - Interactive elements
  - Comprehension questions
  - Annotations
  - Highlighting

### H5P Activities

H5P activities leverage the H5P framework for creating rich, interactive content.

**Implementation Details:**
- **Integration**: Uses @lumieducation/h5p-react for client-side rendering
- **Directory Structure**:
  - h5p/
  - h5p/content/
  - h5p/libraries/
  - h5p/temporary-storage/
- **Features**:
  - Content creation
  - Content import/export
  - Analytics
  - Wide range of interactive content types

**Management**:
- Editor initialization required before file uploads
- Content storage in dedicated directories
- Library management

### Worksheet Activities

Worksheet activities provide structured documents for students to complete.

**Implementation Details:**
- **Purpose**: Practice, Assessment
- **Creation Methods**:
  - Manual creation
  - AI-assisted generation
- **Features**:
  - Canvas-based layout
  - Printable format
  - Digital completion
  - Various question types
  - Automatic and manual grading options

### Assessment Activities

Assessment activities are formal evaluations of student knowledge.

**Implementation Details:**
- **Purpose**: Evaluation, Certification
- **Features**:
  - Multiple activity types in one assessment
  - Scoring with total and passing scores
  - Time limits
  - Secure testing options
  - Review and approval workflow
  - Detailed analytics

## Activity Creation Workflow

1. **Selection**: Choose the appropriate activity type based on learning objectives
2. **Configuration**: Configure the activity settings and content
3. **Preview**: Test the activity from the student perspective
4. **Assignment**: Assign the activity to classes or individual students
5. **Monitoring**: Track student progress and performance
6. **Feedback**: Provide feedback on student submissions
7. **Iteration**: Refine the activity based on results and feedback

## AI Content Studio Integration

The AI Content Studio provides AI-powered tools for creating and enhancing activities.

**Implementation Details:**
- **Integration Points**:
  - Activity creation
  - Content generation
  - Question generation
  - Feedback generation
- **Workflow**:
  1. Select content category (worksheet/activity/assessment)
  2. Select specific type within that category
  3. Use AI to generate content
  4. Preview generated content
  5. Refine through conversation with AI
  6. Save when satisfied
- **AI Models**: Uses Google API and gemini-2.0-flash model

## Activity Grading and Feedback

Activities support various grading and feedback mechanisms.

**Implementation Details:**
- **Automatic Grading**:
  - Objective questions (multiple choice, true/false, etc.)
  - Numeric questions with exact or range matching
  - Pattern matching for short answers
- **Manual Grading**:
  - Essay questions
  - Open-ended responses
  - Projects and complex submissions
- **Feedback Types**:
  - Immediate feedback
  - Delayed feedback
  - General feedback
  - Question-specific feedback
  - Correct answer explanation

## Best Practices

### Activity Design
- Align activities with learning objectives
- Provide clear instructions
- Use a variety of activity types
- Consider accessibility needs
- Include appropriate difficulty levels

### Quiz Creation
- Use a mix of question types
- Provide clear, unambiguous questions
- Include explanations for correct answers
- Use randomization for practice activities
- Set appropriate time limits

### Content Management
- Organize activities by subject, topic, and difficulty
- Use consistent naming conventions
- Include metadata for easy searching
- Regularly review and update activities
- Archive outdated activities

### Performance Considerations
- Optimize media file sizes
- Limit the number of questions per page
- Consider mobile device compatibility
- Test activities on different devices and browsers
- Monitor system performance during peak usage

### Security
- Implement appropriate access controls
- Secure assessment activities
- Protect student data
- Regularly audit activity access
- Follow data protection regulations
