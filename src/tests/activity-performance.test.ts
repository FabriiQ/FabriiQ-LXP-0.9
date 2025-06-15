/**
 * Activity Tracking System Performance Tests
 * 
 * This file contains performance tests for the activity tracking system.
 * These tests are designed to simulate high load scenarios and measure performance.
 * 
 * Note: These tests are meant to be run in a development environment and may take some time to complete.
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { ActivityGradeService } from '../server/api/services/activity-grade.service';
import { BackgroundJobService, JobType } from '../server/api/services/background-job.service';
import { v4 as uuidv4 } from 'uuid';

// Use a real PrismaClient for performance testing
// This should be connected to a test database
const prisma = new PrismaClient();

// Test data generation
async function generateTestData(
  classCount: number,
  studentsPerClass: number,
  activitiesPerClass: number
) {
  console.log(`Generating test data: ${classCount} classes, ${studentsPerClass} students per class, ${activitiesPerClass} activities per class`);
  
  const classes = [];
  const students = [];
  const activities = [];
  
  // Create classes
  for (let i = 0; i < classCount; i++) {
    const classId = `perf-class-${i}-${uuidv4()}`;
    classes.push({
      id: classId,
      name: `Performance Test Class ${i}`,
      code: `PERF-${i}`,
      status: 'ACTIVE',
    });
    
    // Create students for this class
    for (let j = 0; j < studentsPerClass; j++) {
      const studentId = `perf-student-${i}-${j}-${uuidv4()}`;
      students.push({
        id: studentId,
        name: `Student ${i}-${j}`,
        email: `student-${i}-${j}@test.com`,
        status: 'ACTIVE',
      });
      
      // Create enrollment
      await prisma.enrollment.create({
        data: {
          classId,
          studentId,
          status: 'ACTIVE',
        },
      });
    }
    
    // Create activities for this class
    for (let k = 0; k < activitiesPerClass; k++) {
      const activityId = `perf-activity-${i}-${k}-${uuidv4()}`;
      activities.push({
        id: activityId,
        title: `Activity ${i}-${k}`,
        classId,
        subjectId: `perf-subject-${i}`,
        learningType: 'MULTIPLE_CHOICE',
        isGradable: k % 2 === 0, // Every other activity is gradable
        maxScore: 100,
        status: 'ACTIVE',
      });
    }
  }
  
  // Batch insert classes
  await prisma.class.createMany({
    data: classes,
    skipDuplicates: true,
  });
  
  // Batch insert students
  await prisma.studentProfile.createMany({
    data: students,
    skipDuplicates: true,
  });
  
  // Batch insert activities
  await prisma.activity.createMany({
    data: activities,
    skipDuplicates: true,
  });
  
  return {
    classes,
    students,
    activities,
  };
}

// Clean up test data
async function cleanupTestData() {
  // Delete all test data
  await prisma.activityGrade.deleteMany({
    where: {
      activityId: {
        startsWith: 'perf-activity-',
      },
    },
  });
  
  await prisma.activity.deleteMany({
    where: {
      id: {
        startsWith: 'perf-activity-',
      },
    },
  });
  
  await prisma.enrollment.deleteMany({
    where: {
      studentId: {
        startsWith: 'perf-student-',
      },
    },
  });
  
  await prisma.studentProfile.deleteMany({
    where: {
      id: {
        startsWith: 'perf-student-',
      },
    },
  });
  
  await prisma.class.deleteMany({
    where: {
      id: {
        startsWith: 'perf-class-',
      },
    },
  });
}

describe('Activity Performance Tests', () => {
  let activityGradeService: ActivityGradeService;
  let backgroundJobService: BackgroundJobService;
  let testData: any;
  
  // Set timeout to 5 minutes for these tests
  jest.setTimeout(5 * 60 * 1000);
  
  beforeAll(async () => {
    activityGradeService = new ActivityGradeService({ prisma });
    backgroundJobService = new BackgroundJobService({ prisma });
    
    // Generate test data
    testData = await generateTestData(2, 10, 20);
  });
  
  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
  });
  
  test('Batch create activity grades for a class', async () => {
    const classId = testData.classes[0].id;
    const activityId = testData.activities[0].id;
    
    console.log(`Creating activity grades for class ${classId}, activity ${activityId}`);
    
    const startTime = Date.now();
    
    // Create a background job
    const job = await backgroundJobService.createJob({
      type: JobType.CREATE_ACTIVITY_GRADES,
      data: {
        activityId,
        classId,
      },
      priority: 1,
    });
    
    console.log(`Created job ${job.id}`);
    
    // Wait for job to be processed
    let jobStatus = await backgroundJobService.getJobStatus(job.id);
    while (jobStatus.status !== 'COMPLETED' && jobStatus.status !== 'FAILED') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      jobStatus = await backgroundJobService.getJobStatus(job.id);
      console.log(`Job status: ${jobStatus.status}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Batch creation completed in ${duration}ms`);
    
    // Verify results
    const activityGrades = await prisma.activityGrade.findMany({
      where: {
        activityId,
      },
    });
    
    expect(activityGrades.length).toBe(10); // 10 students in the class
    expect(jobStatus.status).toBe('COMPLETED');
    
    // Log performance metrics
    console.log(`Performance metrics:
      - Time to create 10 activity grades: ${duration}ms
      - Average time per grade: ${duration / 10}ms
    `);
  });
  
  test('Batch update activity grades for a class', async () => {
    const classId = testData.classes[0].id;
    const activityId = testData.activities[0].id;
    
    console.log(`Updating activity grades for class ${classId}, activity ${activityId}`);
    
    const startTime = Date.now();
    
    // Get all students in the class
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
      },
      select: {
        studentId: true,
      },
    });
    
    // Create batch update input
    const batchInput = {
      activityId,
      gradedById: 'system',
      grades: enrollments.map(enrollment => ({
        studentId: enrollment.studentId,
        score: Math.floor(Math.random() * 100),
        feedback: 'Automatically graded',
      })),
    };
    
    // Perform batch update
    const result = await activityGradeService.batchGradeActivities(batchInput);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Batch update completed in ${duration}ms`);
    
    // Verify results
    expect(result.length).toBe(10); // 10 students in the class
    
    // Log performance metrics
    console.log(`Performance metrics:
      - Time to update 10 activity grades: ${duration}ms
      - Average time per grade: ${duration / 10}ms
    `);
  });
});
