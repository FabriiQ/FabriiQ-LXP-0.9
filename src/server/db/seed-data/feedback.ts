import { PrismaClient, SystemStatus } from '@prisma/client';
import { FeedbackType, FeedbackSeverity, FeedbackStatus } from '../../api/constants';

export async function seedFeedback(
  prisma: PrismaClient, 
  students: any[], 
  teachers: any[],
  classes: any[],
  users: any[]
) {
  console.log('Seeding feedback data...');

  // Find classes
  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping feedback seeding.');
    return;
  }

  // Find students
  const johnSmith = students.find(s => s.user.email === 'john_smith@student.sunshine.edu');
  const oliviaJohnson = students.find(s => s.user.email === 'olivia_johnson@student.sunshine.edu');
  const thomasBrown = students.find(s => s.user.email === 'thomas_brown@student.sunshine.edu');
  const harperMartinez = students.find(s => s.user.email === 'harper_martinez@student.sunshine.edu');

  // Find teachers
  const mathBoysTeacher = teachers.find(t => t.username === 'robert_brown');
  const englishGirlsTeacher = teachers.find(t => t.username === 'emily_taylor');

  // Find coordinator
  const coordinator = users.find(u => u.username === 'alex_johnson');

  if (!johnSmith || !oliviaJohnson || !thomasBrown || !harperMartinez || !mathBoysTeacher || !englishGirlsTeacher || !coordinator) {
    console.warn('Students, teachers, or coordinator not found. Skipping feedback seeding.');
    return;
  }

  // ===== STUDENT FEEDBACK =====
  
  // 1. Mathematics - John Smith (Positive)
  await createStudentFeedback(
    prisma,
    {
      type: FeedbackType.ACADEMIC_PERFORMANCE,
      severity: FeedbackSeverity.POSITIVE,
      title: 'Excellent progress in multiplication',
      description: 'John has shown excellent progress in multiplication. He consistently completes his work on time and helps his classmates.',
      tags: ['mathematics', 'multiplication', 'progress'],
      classId: boysClass3A.id,
      createdById: mathBoysTeacher.user.id,
      status: FeedbackStatus.RESOLVED,
    },
    johnSmith.id
  );

  // 2. English - Olivia Johnson (Positive)
  await createStudentFeedback(
    prisma,
    {
      type: FeedbackType.ACADEMIC_PERFORMANCE,
      severity: FeedbackSeverity.POSITIVE,
      title: 'Improved reading comprehension',
      description: 'Olivia\'s reading comprehension skills have improved significantly. She is now able to identify main ideas and supporting details with greater accuracy.',
      tags: ['english', 'reading', 'comprehension'],
      classId: girlsClass3A.id,
      createdById: englishGirlsTeacher.user.id,
      status: FeedbackStatus.RESOLVED,
    },
    oliviaJohnson.id
  );

  // 3. Science - Thomas Brown (Concern)
  await createStudentFeedback(
    prisma,
    {
      type: FeedbackType.IMPROVEMENT_AREA,
      severity: FeedbackSeverity.CONCERN,
      title: 'Needs to focus during class discussions',
      description: 'Thomas needs to focus more during class discussions. He has good ideas but gets distracted easily.',
      tags: ['science', 'focus', 'class participation'],
      classId: boysClass3A.id,
      createdById: mathBoysTeacher.user.id,
      status: FeedbackStatus.IN_REVIEW,
    },
    thomasBrown.id
  );

  // 4. PE - Harper Martinez (Concern)
  await createStudentFeedback(
    prisma,
    {
      type: FeedbackType.ATTENDANCE,
      severity: FeedbackSeverity.CONCERN,
      title: 'Consistently late to PE classes',
      description: 'Harper has been consistently late to PE classes. Please ensure timely arrival to maximize participation time.',
      tags: ['physical education', 'attendance', 'punctuality'],
      classId: girlsClass3A.id,
      createdById: englishGirlsTeacher.user.id,
      status: FeedbackStatus.IN_REVIEW,
    },
    harperMartinez.id
  );

  // ===== CLASS FEEDBACK (FROM COORDINATOR) =====
  
  // 1. Class 3A Boys - Overall Performance
  await createClassFeedback(
    prisma,
    {
      type: FeedbackType.ACADEMIC_PERFORMANCE,
      severity: FeedbackSeverity.NEUTRAL,
      title: 'Class 3A Boys - Reading comprehension needs improvement',
      description: 'Class 3A boys are showing good progress in mathematics but need more support in reading comprehension. Recommend additional reading activities.',
      tags: ['class performance', 'reading', 'improvement'],
      classId: boysClass3A.id,
      createdById: coordinator.id,
      status: FeedbackStatus.IN_REVIEW,
    }
  );

  // 2. Class 3A Girls - Overall Performance
  await createClassFeedback(
    prisma,
    {
      type: FeedbackType.ACHIEVEMENT,
      severity: FeedbackSeverity.POSITIVE,
      title: 'Class 3A Girls - Excellent teamwork',
      description: 'Class 3A girls have shown excellent teamwork during science projects. Their collaborative skills are exemplary.',
      tags: ['class performance', 'teamwork', 'science'],
      classId: girlsClass3A.id,
      createdById: coordinator.id,
      status: FeedbackStatus.RESOLVED,
    }
  );

  console.log('Feedback data seeding completed');
}

async function createStudentFeedback(
  prisma: PrismaClient,
  feedbackData: {
    type: FeedbackType;
    severity: FeedbackSeverity;
    title: string;
    description: string;
    tags: string[];
    classId: string;
    createdById: string;
    status: FeedbackStatus;
  },
  studentId: string
) {
  // Create base feedback
  const feedbackBase = await prisma.feedbackBase.create({
    data: {
      type: feedbackData.type,
      severity: feedbackData.severity,
      title: feedbackData.title,
      description: feedbackData.description,
      tags: feedbackData.tags,
      classId: feedbackData.classId,
      createdById: feedbackData.createdById,
      status: SystemStatus.ACTIVE,
    },
  });

  // Create student feedback
  return await prisma.studentFeedback.create({
    data: {
      studentId: studentId,
      feedbackBaseId: feedbackBase.id,
    },
  });
}

async function createClassFeedback(
  prisma: PrismaClient,
  feedbackData: {
    type: FeedbackType;
    severity: FeedbackSeverity;
    title: string;
    description: string;
    tags: string[];
    classId: string;
    createdById: string;
    status: FeedbackStatus;
  }
) {
  // Create base feedback (for class, no student or teacher specific)
  return await prisma.feedbackBase.create({
    data: {
      type: feedbackData.type,
      severity: feedbackData.severity,
      title: feedbackData.title,
      description: feedbackData.description,
      tags: feedbackData.tags,
      classId: feedbackData.classId,
      createdById: feedbackData.createdById,
      status: SystemStatus.ACTIVE,
    },
  });
}
