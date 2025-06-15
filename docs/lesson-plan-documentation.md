# Lesson Plan Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Lesson Plan Workflow](#lesson-plan-workflow)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Teacher Guide](#teacher-guide)
5. [Coordinator Guide](#coordinator-guide)
6. [Admin Guide](#admin-guide)
7. [Calendar Integration](#calendar-integration)
8. [Analytics](#analytics)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

## Introduction

The Lesson Plan feature allows teachers to create, submit, and manage lesson plans for their classes. Lesson plans go through an approval workflow involving coordinators and campus administrators to ensure quality and consistency across the institution.

### Key Features

- Create weekly or monthly lesson plans
- Attach resources and activities to lesson plans
- Submit plans for review and approval
- Track approval status
- Add post-implementation reflections
- View lesson plans on calendars
- Export lesson plans to calendar applications
- Analyze lesson plan metrics and trends

## Lesson Plan Workflow

The lesson plan workflow consists of the following stages:

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

## User Roles and Permissions

### Teacher

- Create, edit, and delete draft lesson plans
- Submit lesson plans for review
- View their own lesson plans and their status
- Add reflections to approved lesson plans
- Export lesson plans to calendar

### Coordinator

- View submitted lesson plans for their campus
- Approve or reject lesson plans with comments
- View lesson plan analytics
- Export lesson plans to calendar

### Campus Admin

- View coordinator-approved lesson plans for their campus
- Approve or reject lesson plans with comments
- View comprehensive lesson plan analytics
- Export lesson plans to calendar

## Teacher Guide

### Creating a Lesson Plan

1. Navigate to the Lesson Plans section in the Teacher Portal
2. Click "Create New Lesson Plan"
3. Fill in the required information:
   - Title
   - Description
   - Class
   - Subject (optional)
   - Date Range
   - Plan Type (Weekly or Monthly)
4. Add content to the lesson plan:
   - Learning Objectives
   - Topics
   - Teaching Methods
   - Resources
   - Activities
   - Assessments
   - Homework
   - Notes
5. Click "Save as Draft" to save the lesson plan

### Submitting a Lesson Plan

1. Open the draft lesson plan
2. Review all content for accuracy and completeness
3. Click "Submit for Review"
4. Confirm submission in the dialog
5. The lesson plan status will change to "Submitted"

### Adding Reflection

1. Open an approved lesson plan
2. Click "Add Reflection"
3. Enter your reflection on the implementation of the lesson plan
4. Click "Save Reflection"

### Viewing Lesson Plans on Calendar

1. Navigate to the Calendar section in the Teacher Portal
2. Lesson plans will be displayed on the calendar based on their date range
3. Click on a lesson plan to view details
4. Use the "Export to Calendar" button to export the lesson plan to your calendar application

## Coordinator Guide

### Reviewing Lesson Plans

1. Navigate to the Lesson Plans section in the Coordinator Portal
2. Filter the list to show "Submitted" lesson plans
3. Click on a lesson plan to review it
4. Review the content and add comments if needed
5. Click "Approve" or "Reject"
   - If rejecting, provide a reason for rejection
6. The lesson plan status will change to "Coordinator Approved" or "Rejected"

### Viewing Analytics

1. Navigate to the Analytics section in the Coordinator Portal
2. View various metrics and charts:
   - Approval rates
   - Lesson plan counts by teacher
   - Lesson plan counts by subject
   - Monthly trends
3. Use filters to refine the data by date range, campus, etc.
4. Export analytics data to CSV if needed

## Admin Guide

### Reviewing Coordinator-Approved Lesson Plans

1. Navigate to the Lesson Plans section in the Admin Portal
2. Filter the list to show "Coordinator Approved" lesson plans
3. Click on a lesson plan to review it
4. Review the content, coordinator comments, and add your own comments if needed
5. Click "Approve" or "Reject"
   - If rejecting, provide a reason for rejection
6. The lesson plan status will change to "Approved" or "Rejected"

### Viewing Comprehensive Analytics

1. Navigate to the Analytics section in the Admin Portal
2. View comprehensive metrics and charts:
   - Approval rates by coordinator
   - Approval rates by teacher
   - Approval rates by subject
   - Monthly and yearly trends
   - Average time to approval
3. Use filters to refine the data by date range, campus, etc.
4. Export analytics data to CSV if needed

## Calendar Integration

The Lesson Plan feature integrates with the calendar system to display lesson plans on calendars and allow export to external calendar applications.

### Viewing Lesson Plans on Calendar

1. Navigate to the Calendar section in your portal
2. Lesson plans will be displayed on the calendar based on their date range
3. Click on a lesson plan to view details

### Exporting to Calendar

1. Open a lesson plan
2. Click "Export to Calendar"
3. The lesson plan will be exported as an iCalendar (.ics) file
4. Open the file with your calendar application (Google Calendar, Outlook, etc.)

## Analytics

The Lesson Plan feature includes analytics to track metrics and trends related to lesson plans.

### Available Metrics

- Total lesson plans
- Lesson plans by status
- Approval rates
- Average time to approval
- Lesson plans by teacher
- Lesson plans by subject
- Monthly trends
- Plan type distribution

### Viewing Analytics

1. Navigate to the Analytics section in your portal
2. Use the tabs to view different categories of metrics
3. Use filters to refine the data by date range, campus, etc.
4. Export analytics data to CSV if needed

## Troubleshooting

### Common Issues

#### Lesson Plan Not Saving

- Ensure all required fields are filled in
- Check your internet connection
- Try refreshing the page and trying again

#### Cannot Submit Lesson Plan

- Ensure all required fields are filled in
- Check that the lesson plan is in "Draft" status
- Ensure you have permission to submit lesson plans

#### Cannot View Lesson Plan on Calendar

- Ensure the lesson plan is approved
- Check that the date range is within the calendar view
- Try refreshing the calendar

## FAQ

### How long does the approval process take?

The approval process typically takes 1-3 business days, depending on the workload of coordinators and administrators.

### Can I edit a submitted lesson plan?

No, once a lesson plan is submitted, it cannot be edited. If changes are needed, the plan must be rejected and a new version submitted.

### Can I use a previous lesson plan as a template?

Yes, you can duplicate an existing lesson plan and modify it as needed.

### How do I know when my lesson plan is approved?

You will receive a notification when your lesson plan is approved or rejected. You can also check the status in the Lesson Plans section of the Teacher Portal.

### Can I export multiple lesson plans to my calendar?

Currently, lesson plans must be exported individually. Bulk export functionality may be added in a future update.
