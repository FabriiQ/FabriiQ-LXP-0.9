/**
 * End-to-End Test for Lesson Plan Workflow
 * 
 * This test simulates the complete workflow of a lesson plan:
 * 1. Teacher creates a lesson plan
 * 2. Teacher submits the lesson plan for review
 * 3. Coordinator approves the lesson plan
 * 4. Admin approves the lesson plan
 * 5. Teacher adds reflection to the lesson plan
 * 
 * Note: This test requires a test database with proper seed data.
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';
import { LessonPlanStatus, LessonPlanType } from '@prisma/client';

// Test users
const TEACHER_EMAIL = 'teacher@example.com';
const TEACHER_PASSWORD = 'password123';
const COORDINATOR_EMAIL = 'coordinator@example.com';
const COORDINATOR_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

test.describe('Lesson Plan Workflow', () => {
  let lessonPlanId: string;
  
  test('Teacher can create a lesson plan', async ({ page }) => {
    // Login as teacher
    await page.goto('/login');
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to lesson plan creation page
    await page.goto('/teacher/lesson-plans/create');
    
    // Fill in the lesson plan form
    await page.fill('input[name="title"]', 'E2E Test Lesson Plan');
    await page.fill('textarea[name="description"]', 'This is a test lesson plan created by E2E tests');
    
    // Select class
    await page.click('select[name="classId"]');
    await page.click('option:has-text("Test Class")');
    
    // Select subject
    await page.click('select[name="subjectId"]');
    await page.click('option:has-text("Mathematics")');
    
    // Set date range
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    await page.fill('input[name="startDate"]', today.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', nextWeek.toISOString().split('T')[0]);
    
    // Select plan type
    await page.click('select[name="planType"]');
    await page.click('option[value="WEEKLY"]');
    
    // Fill in learning objectives
    await page.click('button:has-text("Add Learning Objective")');
    await page.fill('input[name="learningObjectives.0"]', 'Students will understand basic algebra concepts');
    
    // Fill in topics
    await page.click('button:has-text("Add Topic")');
    await page.fill('input[name="topics.0"]', 'Introduction to Algebra');
    
    // Fill in teaching methods
    await page.click('button:has-text("Add Teaching Method")');
    await page.fill('input[name="teachingMethods.0"]', 'Interactive lecture');
    
    // Add a resource
    await page.click('button:has-text("Add Resource")');
    await page.fill('input[name="resources.0.name"]', 'Algebra Textbook');
    await page.click('select[name="resources.0.type"]');
    await page.click('option[value="DOCUMENT"]');
    
    // Add an activity
    await page.click('button:has-text("Add Activity")');
    await page.fill('input[name="activities.0.name"]', 'Algebra Quiz');
    await page.click('select[name="activities.0.type"]');
    await page.click('option[value="QUIZ"]');
    
    // Add an assessment
    await page.click('button:has-text("Add Assessment")');
    await page.fill('input[name="assessments.0.name"]', 'Algebra Test');
    await page.click('select[name="assessments.0.type"]');
    await page.click('option[value="QUIZ"]');
    
    // Add homework
    await page.click('button:has-text("Add Homework")');
    await page.fill('textarea[name="homework.0.description"]', 'Complete algebra worksheet');
    
    // Add notes
    await page.fill('textarea[name="notes"]', 'Remember to review previous lessons before starting');
    
    // Submit the form
    await page.click('button:has-text("Create Lesson Plan")');
    
    // Wait for success message
    await expect(page.locator('div:has-text("Lesson plan created successfully")')).toBeVisible();
    
    // Extract the lesson plan ID from the URL
    const url = page.url();
    lessonPlanId = url.split('/').pop() || '';
    
    // Verify we're on the lesson plan view page
    await expect(page).toHaveURL(new RegExp(`/teacher/lesson-plans/${lessonPlanId}`));
    
    // Verify the lesson plan status is DRAFT
    await expect(page.locator('span:has-text("Draft")')).toBeVisible();
  });
  
  test('Teacher can submit a lesson plan for review', async ({ page }) => {
    // Login as teacher
    await page.goto('/login');
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to the lesson plan view page
    await page.goto(`/teacher/lesson-plans/${lessonPlanId}`);
    
    // Click the submit button
    await page.click('button:has-text("Submit for Review")');
    
    // Confirm submission in the dialog
    await page.click('button:has-text("Submit")');
    
    // Wait for success message
    await expect(page.locator('div:has-text("Lesson plan submitted for review")')).toBeVisible();
    
    // Verify the lesson plan status is SUBMITTED
    await expect(page.locator('span:has-text("Submitted")')).toBeVisible();
  });
  
  test('Coordinator can approve a lesson plan', async ({ page }) => {
    // Login as coordinator
    await page.goto('/login');
    await page.fill('input[name="email"]', COORDINATOR_EMAIL);
    await page.fill('input[name="password"]', COORDINATOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to the coordinator lesson plan review page
    await page.goto(`/coordinator/lesson-plans/${lessonPlanId}`);
    
    // Add a note
    await page.fill('textarea[name="note"]', 'This lesson plan looks good. Approved by coordinator.');
    
    // Click the approve button
    await page.click('button:has-text("Approve")');
    
    // Wait for success message
    await expect(page.locator('div:has-text("Lesson plan approved")')).toBeVisible();
    
    // Verify the lesson plan status is COORDINATOR_APPROVED
    await expect(page.locator('span:has-text("Coordinator Approved")')).toBeVisible();
  });
  
  test('Admin can approve a lesson plan', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to the admin lesson plan review page
    await page.goto(`/admin/lesson-plans/${lessonPlanId}`);
    
    // Add a note
    await page.fill('textarea[name="note"]', 'Final approval by admin. Ready for implementation.');
    
    // Click the approve button
    await page.click('button:has-text("Approve")');
    
    // Wait for success message
    await expect(page.locator('div:has-text("Lesson plan approved")')).toBeVisible();
    
    // Verify the lesson plan status is APPROVED
    await expect(page.locator('span:has-text("Approved")')).toBeVisible();
  });
  
  test('Teacher can add reflection to an approved lesson plan', async ({ page }) => {
    // Login as teacher
    await page.goto('/login');
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to the lesson plan view page
    await page.goto(`/teacher/lesson-plans/${lessonPlanId}`);
    
    // Click the add reflection button
    await page.click('button:has-text("Add Reflection")');
    
    // Add reflection
    await page.fill('textarea[name="reflection"]', 'The lesson went well. Students engaged with the material and showed good understanding of algebra concepts. Next time, I would allocate more time for practice exercises.');
    
    // Submit the reflection
    await page.click('button:has-text("Save Reflection")');
    
    // Wait for success message
    await expect(page.locator('div:has-text("Reflection added successfully")')).toBeVisible();
    
    // Verify the reflection is displayed
    await expect(page.locator('div:has-text("The lesson went well")')).toBeVisible();
  });
});
