/**
 * Activity Tracking System Tests
 * 
 * This file contains tests for the activity tracking system, including:
 * - ActivityGrade creation and updates
 * - Points calculation
 * - Commitment tracking
 * - Performance with large datasets
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { ActivityGradeService } from '../server/api/services/activity-grade.service';
import { ActivityPointsService } from '../server/api/services/activity-points.service';
import { BackgroundJobService, JobType } from '../server/api/services/background-job.service';
import { v4 as uuidv4 } from 'uuid';

// Mock PrismaClient
const mockPrisma = {
  activity: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  activityGrade: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
  studentProfile: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findMany: jest.fn(),
  },
  studentPoints: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as unknown as PrismaClient;

// Test data
const testActivity = {
  id: 'activity-1',
  title: 'Test Activity',
  classId: 'class-1',
  subjectId: 'subject-1',
  learningType: 'MULTIPLE_CHOICE',
  purpose: 'ASSESSMENT',
  isGradable: true,
  maxScore: 100,
  weightage: 1,
};

const testStudent = {
  id: 'student-1',
  name: 'Test Student',
};

describe('ActivityGradeService', () => {
  let activityGradeService: ActivityGradeService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    activityGradeService = new ActivityGradeService({ prisma: mockPrisma });
    
    // Set up default mocks
    mockPrisma.activity.findUnique.mockResolvedValue(testActivity);
    mockPrisma.studentProfile.findUnique.mockResolvedValue(testStudent);
    mockPrisma.activityGrade.findFirst.mockResolvedValue(null);
    mockPrisma.activityGrade.create.mockImplementation(data => Promise.resolve(data.data));
    mockPrisma.activityGrade.upsert.mockImplementation(data => Promise.resolve(data.create));
  });
  
  test('createActivityGrade should create a new activity grade', async () => {
    const result = await activityGradeService.createActivityGrade({
      activityId: 'activity-1',
      studentId: 'student-1',
      status: SubmissionStatus.SUBMITTED,
    });
    
    expect(mockPrisma.activity.findUnique).toHaveBeenCalledWith({
      where: { id: 'activity-1' },
    });
    
    expect(mockPrisma.studentProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'student-1' },
    });
    
    expect(mockPrisma.activityGrade.findFirst).toHaveBeenCalledWith({
      where: {
        activityId: 'activity-1',
        studentId: 'student-1',
      },
    });
    
    expect(mockPrisma.activityGrade.upsert).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.activityId).toBe('activity-1');
    expect(result.studentId).toBe('student-1');
    expect(result.status).toBe(SubmissionStatus.SUBMITTED);
  });
  
  test('updateActivityGrade should update an existing activity grade', async () => {
    mockPrisma.activityGrade.findUnique.mockResolvedValue({
      id: 'grade-1',
      activityId: 'activity-1',
      studentId: 'student-1',
      status: SubmissionStatus.SUBMITTED,
    });
    
    mockPrisma.activityGrade.update.mockImplementation(data => Promise.resolve({
      ...data.data,
      activityId: 'activity-1',
      studentId: 'student-1',
    }));
    
    const result = await activityGradeService.updateActivityGrade('activity-1', 'student-1', {
      status: SubmissionStatus.GRADED,
      score: 85,
    });
    
    expect(mockPrisma.activityGrade.findUnique).toHaveBeenCalledWith({
      where: {
        activityId_studentId: {
          activityId: 'activity-1',
          studentId: 'student-1',
        },
      },
    });
    
    expect(mockPrisma.activityGrade.update).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.status).toBe(SubmissionStatus.GRADED);
    expect(result.score).toBe(85);
  });
});

describe('ActivityPointsService', () => {
  let activityPointsService: ActivityPointsService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    activityPointsService = new ActivityPointsService({ prisma: mockPrisma });
    
    // Set up default mocks
    mockPrisma.activity.findUnique.mockResolvedValue(testActivity);
  });
  
  test('calculateActivityPoints should calculate points based on activity type', async () => {
    const result = await activityPointsService.calculateActivityPoints('activity-1');
    
    expect(mockPrisma.activity.findUnique).toHaveBeenCalledWith({
      where: { id: 'activity-1' },
      select: {
        learningType: true,
        purpose: true,
        isGradable: true,
        maxScore: true,
        weightage: true,
        content: true,
      },
    });
    
    // For MULTIPLE_CHOICE with ASSESSMENT purpose, points should be 5 * 1 * 1.5 = 8 (rounded)
    expect(result).toBe(8);
  });
  
  test('calculateActivityPoints should handle different activity types', async () => {
    // Test ESSAY type
    mockPrisma.activity.findUnique.mockResolvedValueOnce({
      ...testActivity,
      learningType: 'ESSAY',
      purpose: 'PRACTICE',
    });
    
    const essayResult = await activityPointsService.calculateActivityPoints('activity-1');
    // For ESSAY with PRACTICE purpose, points should be 15 * 1 * 1.2 = 18
    expect(essayResult).toBe(18);
    
    // Test PROJECT type
    mockPrisma.activity.findUnique.mockResolvedValueOnce({
      ...testActivity,
      learningType: 'PROJECT',
      purpose: 'ENRICHMENT',
      weightage: 2,
    });
    
    const projectResult = await activityPointsService.calculateActivityPoints('activity-1');
    // For PROJECT with ENRICHMENT purpose and weightage 2, points should be 25 * 2 * 1.1 = 55
    expect(projectResult).toBe(55);
  });
});

describe('BackgroundJobService', () => {
  let backgroundJobService: BackgroundJobService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    backgroundJobService = new BackgroundJobService({ prisma: mockPrisma });
    
    // Set up default mocks
    mockPrisma.$queryRaw.mockResolvedValue([{ id: 'job-1' }]);
  });
  
  test('createJob should create a new background job', async () => {
    const result = await backgroundJobService.createJob({
      type: JobType.CREATE_ACTIVITY_GRADES,
      data: {
        activityId: 'activity-1',
        classId: 'class-1',
      },
    });
    
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.id).toBe('job-1');
  });
  
  test('getNextJob should get the next pending job', async () => {
    const result = await backgroundJobService.getNextJob();
    
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.id).toBe('job-1');
  });
});
