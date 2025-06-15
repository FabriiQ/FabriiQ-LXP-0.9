/**
 * Tests for lesson plan relations with activities and assessments
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Lesson Plan Relations', () => {
  let testLessonPlan;
  let testActivity;
  let testAssessment;

  // Setup: Create test data
  beforeAll(async () => {
    // Get a teacher for the lesson plan
    const teacher = await prisma.teacherProfile.findFirst();
    if (!teacher) throw new Error('No teacher found for testing');

    // Get a class for the lesson plan
    const classEntity = await prisma.class.findFirst();
    if (!classEntity) throw new Error('No class found for testing');

    // Create a test lesson plan
    testLessonPlan = await prisma.lessonPlan.create({
      data: {
        title: 'Test Lesson Plan',
        teacherId: teacher.id,
        classId: classEntity.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        planType: 'WEEKLY',
        content: { sections: [] },
      },
    });

    console.log(`Created test lesson plan with ID: ${testLessonPlan.id}`);
  });

  // Cleanup: Delete test data
  afterAll(async () => {
    if (testActivity) {
      await prisma.activity.delete({ where: { id: testActivity.id } });
    }
    
    if (testAssessment) {
      await prisma.assessment.delete({ where: { id: testAssessment.id } });
    }
    
    if (testLessonPlan) {
      await prisma.lessonPlan.delete({ where: { id: testLessonPlan.id } });
    }
    
    await prisma.$disconnect();
  });

  test('Should create an activity with a lesson plan reference', async () => {
    // Get a subject for the activity
    const subject = await prisma.subject.findFirst();
    if (!subject) throw new Error('No subject found for testing');

    // Get a class for the activity
    const classEntity = await prisma.class.findFirst();
    if (!classEntity) throw new Error('No class found for testing');

    // Create an activity with a reference to the lesson plan
    testActivity = await prisma.activity.create({
      data: {
        title: 'Test Activity',
        purpose: 'LEARNING',
        learningType: 'LECTURE',
        status: 'ACTIVE',
        subjectId: subject.id,
        classId: classEntity.id,
        content: { description: 'Test activity for lesson plan relation' },
        lessonPlanId: testLessonPlan.id,
      },
    });

    expect(testActivity).toBeDefined();
    expect(testActivity.lessonPlanId).toBe(testLessonPlan.id);
  });

  test('Should create an assessment with a lesson plan reference', async () => {
    // Get required data for assessment
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found for testing');

    const institution = await prisma.institution.findFirst();
    if (!institution) throw new Error('No institution found for testing');

    const subject = await prisma.subject.findFirst();
    if (!subject) throw new Error('No subject found for testing');

    const classEntity = await prisma.class.findFirst();
    if (!classEntity) throw new Error('No class found for testing');

    const term = await prisma.term.findFirst();
    if (!term) throw new Error('No term found for testing');

    // Create an assessment with a reference to the lesson plan
    testAssessment = await prisma.assessment.create({
      data: {
        title: 'Test Assessment',
        institutionId: institution.id,
        classId: classEntity.id,
        subjectId: subject.id,
        termId: term.id,
        createdById: user.id,
        status: 'ACTIVE',
        lessonPlanId: testLessonPlan.id,
      },
    });

    expect(testAssessment).toBeDefined();
    expect(testAssessment.lessonPlanId).toBe(testLessonPlan.id);
  });

  test('Should fetch a lesson plan with related activities and assessments', async () => {
    // Fetch the lesson plan with its related activities and assessments
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: testLessonPlan.id },
      include: {
        activities: true,
        assessments: true,
      },
    });

    expect(lessonPlan).toBeDefined();
    expect(lessonPlan.activities).toHaveLength(1);
    expect(lessonPlan.activities[0].id).toBe(testActivity.id);
    expect(lessonPlan.assessments).toHaveLength(1);
    expect(lessonPlan.assessments[0].id).toBe(testAssessment.id);
  });

  test('Should update an activity to associate with a lesson plan', async () => {
    // Create a new activity without a lesson plan
    const subject = await prisma.subject.findFirst();
    const classEntity = await prisma.class.findFirst();
    
    const newActivity = await prisma.activity.create({
      data: {
        title: 'New Activity Without Lesson Plan',
        purpose: 'LEARNING',
        learningType: 'DISCUSSION',
        status: 'ACTIVE',
        subjectId: subject.id,
        classId: classEntity.id,
        content: { description: 'Activity to be updated with lesson plan' },
      },
    });

    // Update the activity to associate with the lesson plan
    const updatedActivity = await prisma.activity.update({
      where: { id: newActivity.id },
      data: {
        lessonPlanId: testLessonPlan.id,
      },
    });

    expect(updatedActivity.lessonPlanId).toBe(testLessonPlan.id);

    // Clean up
    await prisma.activity.delete({ where: { id: newActivity.id } });
  });

  test('Should update an assessment to associate with a lesson plan', async () => {
    // Get required data for assessment
    const user = await prisma.user.findFirst();
    const institution = await prisma.institution.findFirst();
    const subject = await prisma.subject.findFirst();
    const classEntity = await prisma.class.findFirst();
    const term = await prisma.term.findFirst();
    
    // Create a new assessment without a lesson plan
    const newAssessment = await prisma.assessment.create({
      data: {
        title: 'New Assessment Without Lesson Plan',
        institutionId: institution.id,
        classId: classEntity.id,
        subjectId: subject.id,
        termId: term.id,
        createdById: user.id,
        status: 'ACTIVE',
      },
    });

    // Update the assessment to associate with the lesson plan
    const updatedAssessment = await prisma.assessment.update({
      where: { id: newAssessment.id },
      data: {
        lessonPlanId: testLessonPlan.id,
      },
    });

    expect(updatedAssessment.lessonPlanId).toBe(testLessonPlan.id);

    // Clean up
    await prisma.assessment.delete({ where: { id: newAssessment.id } });
  });
});
