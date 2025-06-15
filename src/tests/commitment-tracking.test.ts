/**
 * Commitment Tracking System Tests
 * 
 * This file contains tests for the commitment tracking system, including:
 * - Commitment creation and updates
 * - Commitment status tracking
 * - Integration with ActivityGrade
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { CommitmentContractService } from '../server/api/services/commitment-contract.service';
import { ActivityGradeService } from '../server/api/services/activity-grade.service';
import { v4 as uuidv4 } from 'uuid';

// Mock PrismaClient
const mockPrisma = {
  commitmentContract: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  activityGrade: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  activity: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  studentProfile: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

// Test data
const testCommitment = {
  id: 'commitment-1',
  title: 'Complete 5 activities',
  description: 'I commit to completing 5 activities by the deadline',
  studentId: 'student-1',
  classId: 'class-1',
  subjectId: 'subject-1',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  isCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    activities: ['activity-1', 'activity-2', 'activity-3', 'activity-4', 'activity-5'],
  },
};

const testActivities = [
  {
    id: 'activity-1',
    title: 'Activity 1',
    classId: 'class-1',
    subjectId: 'subject-1',
  },
  {
    id: 'activity-2',
    title: 'Activity 2',
    classId: 'class-1',
    subjectId: 'subject-1',
  },
  {
    id: 'activity-3',
    title: 'Activity 3',
    classId: 'class-1',
    subjectId: 'subject-1',
  },
  {
    id: 'activity-4',
    title: 'Activity 4',
    classId: 'class-1',
    subjectId: 'subject-1',
  },
  {
    id: 'activity-5',
    title: 'Activity 5',
    classId: 'class-1',
    subjectId: 'subject-1',
  },
];

const testStudent = {
  id: 'student-1',
  name: 'Test Student',
};

describe('CommitmentContractService', () => {
  let commitmentService: CommitmentContractService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    commitmentService = new CommitmentContractService({ prisma: mockPrisma });
    
    // Set up default mocks
    mockPrisma.studentProfile.findUnique.mockResolvedValue(testStudent);
    mockPrisma.activity.findMany.mockResolvedValue(testActivities);
    mockPrisma.commitmentContract.create.mockImplementation(data => Promise.resolve({
      ...data.data,
      id: 'commitment-1',
    }));
    mockPrisma.commitmentContract.findUnique.mockResolvedValue(testCommitment);
    mockPrisma.commitmentContract.update.mockImplementation(data => Promise.resolve({
      ...testCommitment,
      ...data.data,
    }));
  });
  
  test('createActivityCommitment should create a new commitment contract', async () => {
    const result = await commitmentService.createActivityCommitment({
      studentId: 'student-1',
      activities: ['activity-1', 'activity-2', 'activity-3', 'activity-4', 'activity-5'],
      title: 'Complete 5 activities',
      description: 'I commit to completing 5 activities by the deadline',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      classId: 'class-1',
      subjectId: 'subject-1',
    });
    
    expect(mockPrisma.studentProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'student-1' },
    });
    
    expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['activity-1', 'activity-2', 'activity-3', 'activity-4', 'activity-5'],
        },
      },
    });
    
    expect(mockPrisma.commitmentContract.create).toHaveBeenCalled();
    expect(mockPrisma.activityGrade.updateMany).toHaveBeenCalled();
    
    expect(result).toBeDefined();
    expect(result.id).toBe('commitment-1');
    expect(result.studentId).toBe('student-1');
    expect(result.title).toBe('Complete 5 activities');
  });
  
  test('getStudentCommitmentContracts should get commitments for a student', async () => {
    mockPrisma.commitmentContract.findMany.mockResolvedValue([testCommitment]);
    
    const result = await commitmentService.getStudentCommitmentContracts({
      studentId: 'student-1',
      classId: 'class-1',
    });
    
    expect(mockPrisma.commitmentContract.findMany).toHaveBeenCalledWith({
      where: {
        studentId: 'student-1',
        classId: 'class-1',
      },
      orderBy: {
        deadline: 'asc',
      },
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('commitment-1');
  });
  
  test('updateCommitmentStatus should update commitment status', async () => {
    // Mock activity grades to be all completed
    mockPrisma.activityGrade.findMany.mockResolvedValue([
      { activityId: 'activity-1', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-2', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-3', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-4', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-5', status: SubmissionStatus.COMPLETED },
    ]);
    
    const result = await commitmentService.updateCommitmentStatus('commitment-1');
    
    expect(mockPrisma.commitmentContract.findUnique).toHaveBeenCalledWith({
      where: { id: 'commitment-1' },
    });
    
    expect(mockPrisma.activityGrade.findMany).toHaveBeenCalled();
    
    expect(mockPrisma.commitmentContract.update).toHaveBeenCalledWith({
      where: { id: 'commitment-1' },
      data: {
        isCompleted: true,
        completedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    });
    
    expect(mockPrisma.activityGrade.updateMany).toHaveBeenCalledWith({
      where: {
        activityId: {
          in: ['activity-1', 'activity-2', 'activity-3', 'activity-4', 'activity-5'],
        },
        studentId: 'student-1',
      },
      data: {
        commitmentMet: true,
      },
    });
    
    expect(result).toBeDefined();
    expect(result.isCompleted).toBe(true);
    expect(result.completedAt).toBeDefined();
  });
  
  test('updateCommitmentStatus should handle partially completed commitments', async () => {
    // Mock activity grades to be partially completed
    mockPrisma.activityGrade.findMany.mockResolvedValue([
      { activityId: 'activity-1', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-2', status: SubmissionStatus.COMPLETED },
      { activityId: 'activity-3', status: SubmissionStatus.SUBMITTED },
      { activityId: 'activity-4', status: SubmissionStatus.UNATTEMPTED },
      { activityId: 'activity-5', status: SubmissionStatus.UNATTEMPTED },
    ]);
    
    const result = await commitmentService.updateCommitmentStatus('commitment-1');
    
    expect(mockPrisma.commitmentContract.update).toHaveBeenCalledWith({
      where: { id: 'commitment-1' },
      data: {
        isCompleted: false,
        updatedAt: expect.any(Date),
        metadata: expect.objectContaining({
          progress: {
            completed: 2,
            total: 5,
            percentage: 40,
          },
        }),
      },
    });
    
    expect(result).toBeDefined();
    expect(result.isCompleted).toBe(false);
    expect(result.metadata.progress.completed).toBe(2);
    expect(result.metadata.progress.percentage).toBe(40);
  });
});
