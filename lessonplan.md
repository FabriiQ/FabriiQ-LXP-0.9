# Lesson Plan Creation and Approval System

## Overview

This document outlines the implementation of a lesson plan creation and approval system for the Learning Experience Platform (LXP). The system will allow teachers to create weekly or monthly lesson plans, which will then be reviewed and approved by coordinators and campus administrators.

## Current System Architecture

### User Roles and Permissions

The LXP currently has the following relevant user roles:

1. **Teachers (CAMPUS_TEACHER)**
   - Create and manage learning activities
   - Manage class resources
   - Track student progress

2. **Coordinators (CAMPUS_COORDINATOR)**
   - Oversee multiple classes or subjects
   - Assign teachers to classes
   - Review and approve certain content

3. **Campus Administrators (CAMPUS_ADMIN)**
   - Manage campus-wide settings
   - Final approval authority for campus content
   - Access to all campus data

### Existing Activity System

The platform has a robust activity system with:

- **Activity Types**: Various types including quizzes, assignments, projects, etc.
- **Activity Purposes**: LEARNING, ASSESSMENT, PRACTICE
- **Activity Content**: Stored as JSON in the database
- **Activity Registry**: Manages different activity types and their implementations

### Resource Management

The system has a resource management system that supports:

- **Resource Types**: FILES, FOLDERS, LINKS
- **Resource Access Levels**: PRIVATE, SHARED, PUBLIC
- **Resource Ownership**: Resources are owned by users

## Lesson Plan Requirements

### Lesson Plan Structure

A lesson plan should include:

1. **Basic Information**
   - Title
   - Teacher
   - Subject/Class
   - Time Period (Weekly/Monthly)
   - Date Range

2. **Content Components**
   - Learning Objectives
   - Topics to Cover
   - Teaching Methods
   - Resources Required
   - Activities Planned
   - Assessment Methods
   - Homework/Assignments

3. **Metadata**
   - Creation Date
   - Status (Draft, Submitted, Under Review, Approved, Rejected)
   - Approval Information (Approver, Approval Date, Comments)

### Workflow

The lesson plan workflow will be:

1. **Creation**: Teacher creates a lesson plan (status: DRAFT)
2. **Submission**: Teacher submits the plan for review (status: SUBMITTED)
3. **Coordinator Review**: Coordinator reviews the plan
   - If approved, status changes to COORDINATOR_APPROVED
   - If rejected, status changes to REJECTED with feedback
4. **Admin Review**: Campus admin reviews coordinator-approved plans
   - If approved, status changes to APPROVED
   - If rejected, status changes to REJECTED with feedback
5. **Implementation**: Teacher implements the approved lesson plan
6. **Reflection**: Teacher can add post-implementation reflections (optional)

### Notifications

The system should send notifications:
- To coordinators when a lesson plan is submitted
- To teachers when their lesson plan is approved or rejected
- To campus admins when a lesson plan is approved by a coordinator

## Technical Implementation

### Database Schema

We need to add the following models to the database schema:

```prisma
// Lesson Plan model
model LessonPlan {
  id               String           @id @default(cuid())
  title            String
  description      String?
  teacherId        String
  classId          String
  subjectId        String?
  startDate        DateTime
  endDate          DateTime
  planType         LessonPlanType   // WEEKLY or MONTHLY
  content          Json             // Structured content of the lesson plan
  status           LessonPlanStatus @default(DRAFT)
  submittedAt      DateTime?
  coordinatorId    String?
  coordinatorNote  String?
  coordinatorApprovedAt DateTime?
  adminId          String?
  adminNote        String?
  adminApprovedAt  DateTime?
  reflection       String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relations
  teacher          TeacherProfile   @relation(fields: [teacherId], references: [id])
  class            Class            @relation(fields: [classId], references: [id])
  subject          Subject?         @relation(fields: [subjectId], references: [id])
  coordinator      User?            @relation("CoordinatorApprovals", fields: [coordinatorId], references: [id])
  admin            User?            @relation("AdminApprovals", fields: [adminId], references: [id])

  @@index([teacherId])
  @@index([classId])
  @@index([subjectId])
  @@index([status])
  @@map("lesson_plans")
}

// Lesson Plan Type Enum
enum LessonPlanType {
  WEEKLY
  MONTHLY
}

// Lesson Plan Status Enum
enum LessonPlanStatus {
  DRAFT
  SUBMITTED
  COORDINATOR_APPROVED
  APPROVED
  REJECTED
}
```

### API Endpoints

We need to create the following API endpoints:

1. **Lesson Plan Router**
   - `create`: Create a new lesson plan
   - `update`: Update an existing lesson plan
   - `submit`: Submit a lesson plan for review
   - `getById`: Get a lesson plan by ID
   - `getByTeacher`: Get lesson plans for a teacher
   - `getByClass`: Get lesson plans for a class
   - `getByStatus`: Get lesson plans by status
   - `coordinatorApprove`: Approve a lesson plan as coordinator
   - `coordinatorReject`: Reject a lesson plan as coordinator
   - `adminApprove`: Approve a lesson plan as admin
   - `adminReject`: Reject a lesson plan as admin
   - `addReflection`: Add reflection to an implemented lesson plan

2. **Notification Integration**
   - Use the existing notification system to send alerts

### Frontend Components

#### Teacher Portal

1. **Lesson Plan Dashboard**
   - Overview of all lesson plans with status indicators
   - Filtering by status, date range, subject, class

2. **Lesson Plan Creator/Editor**
   - Form for creating/editing lesson plans
   - Rich text editor for content sections
   - Resource selector for attaching resources
   - Activity selector for including activities
   - Preview functionality
   - Save as draft / Submit buttons

3. **Lesson Plan Viewer**
   - View-only display of lesson plan content
   - Status information and approval history
   - Reflection section for completed plans

#### Coordinator Portal

1. **Lesson Plan Review Dashboard**
   - List of submitted lesson plans pending review
   - Filtering by teacher, subject, date range

2. **Review Interface**
   - View lesson plan content
   - Approval/rejection form with comments
   - History of previous versions (if applicable)

#### Campus Admin Portal

1. **Lesson Plan Approval Dashboard**
   - List of coordinator-approved lesson plans pending final approval
   - Filtering by coordinator, teacher, subject, date range

2. **Approval Interface**
   - View lesson plan content and coordinator approval
   - Final approval/rejection form with comments

### Integration Points

1. **Activity System Integration**
   - Link activities to lesson plans
   - Allow creation of activities from lesson plan interface

2. **Resource System Integration**
   - Attach resources to lesson plans
   - Create resources from lesson plan interface

3. **Calendar Integration**
   - Display lesson plans on teacher/class calendars
   - Sync with scheduling system

4. **Analytics Integration**
   - Track lesson plan approval rates
   - Monitor implementation effectiveness

## Implementation Plan

### Phase 1: Core Functionality

1. Create database schema for lesson plans
2. Implement basic CRUD operations in API
3. Develop teacher lesson plan creation interface
4. Implement submission workflow

### Phase 2: Approval Workflow

1. Develop coordinator review interface
2. Implement admin approval interface
3. Set up notification system integration
4. Add status tracking and history

### Phase 3: Integration and Enhancement

1. Integrate with activity and resource systems
2. Add calendar integration
3. Implement analytics tracking
4. Add reflection functionality

## Conclusion

The lesson plan creation and approval system will streamline the curriculum planning process, ensure quality control through multi-level review, and provide better visibility into teaching plans across the campus. By integrating with existing activities and resources, it will create a cohesive planning experience for teachers while giving coordinators and administrators the oversight they need.
