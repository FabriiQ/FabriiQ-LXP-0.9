import { bloomsAnalyticsRouter } from './blooms-analytics.router';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { vi } from 'vitest';

// Mock Prisma client and its methods
const mockPrisma = {
  topicMastery: {
    findMany: vi.fn(),
  },
  class: {
    findUnique: vi.fn(),
  },
  student: {
    findUnique: vi.fn(),
  }
};

// Mock context
const mockCtx = {
  prisma: mockPrisma,
  session: {
    user: { id: 'user1', userType: 'TEACHER' },
    expires: new Date().toISOString(),
  },
};

// Default student data for mocks
const defaultStudentData = {
  id: 's1',
  user: { id: 'user1', name: 'Test Student' },
};

// Default topic mastery data for mocks
const defaultTopicMasteries = [
  {
    studentId: 's1',
    topicId: 't1',
    subjectId: 'subj123',
    rememberLevel: 80,
    understandLevel: 70,
    applyLevel: 60,
    analyzeLevel: 50,
    evaluateLevel: 40,
    createLevel: 30,
    overallMastery: 55,
    updatedAt: new Date(),
    topic: { id: 't1', title: 'Topic 1', subjectId: 'subj123', subject: { id: 'subj123', name: 'Subject 1' } },
  },
];

describe('bloomsAnalyticsRouter - getStudentPerformance', () => {
  const caller = bloomsAnalyticsRouter.createCaller(mockCtx as any);

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup default mocks for successful calls to avoid repetitive mocking in each test
    mockPrisma.student.findUnique.mockResolvedValue(defaultStudentData);
    mockPrisma.topicMastery.findMany.mockResolvedValue(defaultTopicMasteries);
  });

  test('Test 1: classId provided, subjectId derived successfully', async () => {
    mockPrisma.class.findUnique.mockResolvedValueOnce({
      id: 'c1',
      courseCampus: { course: { subjects: [{ id: 'subj123' }] } },
    } as any);

    await caller.getStudentPerformance({ studentId: 's1', classId: 'c1' });

    expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
      where: { id: 'c1' },
      select: expect.any(Object),
    });
    expect(mockPrisma.topicMastery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 's1',
          subjectId: 'subj123',
        }),
      })
    );
  });

  test('Test 2: classId provided, subjectId derivation fails (class not found)', async () => {
    mockPrisma.class.findUnique.mockResolvedValueOnce(null);

    await caller.getStudentPerformance({ studentId: 's1', classId: 'c_not_found' });

    expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
      where: { id: 'c_not_found' },
      select: expect.any(Object),
    });
    // Ensure subjectId is not part of the where clause or is undefined
    const calls = mockPrisma.topicMastery.findMany.mock.calls;
    expect(calls[0][0].where.subjectId).toBeUndefined();
  });

  test('Test 3: classId provided, subjectId derivation fails (subject not linked)', async () => {
    mockPrisma.class.findUnique.mockResolvedValueOnce({
      id: 'c_no_subj',
      courseCampus: { course: { subjects: [] } },
    } as any);

    await caller.getStudentPerformance({ studentId: 's1', classId: 'c_no_subj' });

    expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
      where: { id: 'c_no_subj' },
      select: expect.any(Object),
    });
    const calls = mockPrisma.topicMastery.findMany.mock.calls;
    expect(calls[0][0].where.subjectId).toBeUndefined();
  });

  test('Test 4: subjectId provided directly', async () => {
    await caller.getStudentPerformance({ studentId: 's1', subjectId: 'subj_direct' });

    expect(mockPrisma.class.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.topicMastery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 's1',
          subjectId: 'subj_direct',
        }),
      })
    );
  });

  test('Test 5: classId and subjectId both provided (subjectId takes precedence)', async () => {
    await caller.getStudentPerformance({
      studentId: 's1',
      classId: 'c1',
      subjectId: 'subj_direct',
    });

    // class.findUnique should not be called if subjectId is directly provided
    expect(mockPrisma.class.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.topicMastery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 's1',
          subjectId: 'subj_direct', // Direct subjectId should be used
        }),
      })
    );
  });

  // Basic test to ensure the procedure returns correct structure
  test('Returns correct performance structure', async () => {
    const result = await caller.getStudentPerformance({ studentId: 's1', subjectId: 'subj123' });
    expect(result).toEqual({
      studentId: 's1',
      studentName: 'Test Student',
      [BloomsTaxonomyLevel.REMEMBER]: 80,
      [BloomsTaxonomyLevel.UNDERSTAND]: 70,
      [BloomsTaxonomyLevel.APPLY]: 60,
      [BloomsTaxonomyLevel.ANALYZE]: 50,
      [BloomsTaxonomyLevel.EVALUATE]: 40,
      [BloomsTaxonomyLevel.CREATE]: 30,
      overallMastery: 55,
    });
  });
});
