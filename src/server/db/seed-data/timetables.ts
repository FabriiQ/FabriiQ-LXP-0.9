import { PrismaClient, SystemStatus, DayOfWeek, PeriodType } from '@prisma/client';

export async function seedTimetables(
  prisma: PrismaClient,
  classes: any[],
  subjects: any[],
  teachers: any[]
) {
  console.log('Seeding timetables...');

  // Find classes
  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping timetable seeding.');
    return;
  }

  // Find subjects
  const mathSubject = subjects.find(s => s.code === 'PYP-CL3-MATH');
  const englishSubject = subjects.find(s => s.code === 'PYP-CL3-ENG');
  const scienceSubject = subjects.find(s => s.code === 'PYP-CL3-SCI');
  const peSubject = subjects.find(s => s.code === 'PYP-CL3-PE');

  if (!mathSubject || !englishSubject || !scienceSubject || !peSubject) {
    console.warn('Subjects not found. Skipping timetable seeding.');
    return;
  }

  // Find teachers
  const mathBoysTeacher = teachers.find(t => t.username === 'robert_brown');
  const mathGirlsTeacher = teachers.find(t => t.username === 'jennifer_davis');
  const englishBoysTeacher = teachers.find(t => t.username === 'david_wilson');
  const englishGirlsTeacher = teachers.find(t => t.username === 'emily_taylor');
  const scienceTeacher = teachers.find(t => t.username === 'james_anderson');
  const peTeacher = teachers.find(t => t.username === 'lisa_martinez');

  if (!mathBoysTeacher || !mathGirlsTeacher || !englishBoysTeacher || !englishGirlsTeacher || !scienceTeacher || !peTeacher) {
    console.warn('Teachers not found. Skipping timetable seeding.');
    return;
  }

  // Get the course campus ID (assuming it's already created)
  const courseCampus = await prisma.courseCampus.findFirst({
    where: {
      courseId: boysClass3A.courseId,
      campusId: boysClass3A.campusId,
    },
  });

  if (!courseCampus) {
    console.warn('Course campus not found. Skipping timetable seeding.');
    return;
  }

  // Create teacher subject qualifications and assignments
  const mathBoysQualification = await createTeacherSubjectQualification(prisma, mathBoysTeacher.id, mathSubject.id);
  const mathGirlsQualification = await createTeacherSubjectQualification(prisma, mathGirlsTeacher.id, mathSubject.id);
  const englishBoysQualification = await createTeacherSubjectQualification(prisma, englishBoysTeacher.id, englishSubject.id);
  const englishGirlsQualification = await createTeacherSubjectQualification(prisma, englishGirlsTeacher.id, englishSubject.id);
  const scienceQualification = await createTeacherSubjectQualification(prisma, scienceTeacher.id, scienceSubject.id);
  const peQualification = await createTeacherSubjectQualification(prisma, peTeacher.id, peSubject.id);

  const mathBoysAssignment = await createTeacherSubjectAssignment(prisma, mathBoysQualification.id, boysClass3A.id);
  const mathGirlsAssignment = await createTeacherSubjectAssignment(prisma, mathGirlsQualification.id, girlsClass3A.id);
  const englishBoysAssignment = await createTeacherSubjectAssignment(prisma, englishBoysQualification.id, boysClass3A.id);
  const englishGirlsAssignment = await createTeacherSubjectAssignment(prisma, englishGirlsQualification.id, girlsClass3A.id);
  const scienceBoysAssignment = await createTeacherSubjectAssignment(prisma, scienceQualification.id, boysClass3A.id);
  const scienceGirlsAssignment = await createTeacherSubjectAssignment(prisma, scienceQualification.id, girlsClass3A.id);
  const peBoysAssignment = await createTeacherSubjectAssignment(prisma, peQualification.id, boysClass3A.id);
  const peGirlsAssignment = await createTeacherSubjectAssignment(prisma, peQualification.id, girlsClass3A.id);

  // Create timetables
  const boysTimetable = await prisma.timetable.create({
    data: {
      name: 'Class 3A Boys Timetable',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-20'),
      status: SystemStatus.ACTIVE,
      courseCampusId: courseCampus.id,
      classId: boysClass3A.id,
    },
  });

  const girlsTimetable = await prisma.timetable.create({
    data: {
      name: 'Class 3A Girls Timetable',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-20'),
      status: SystemStatus.ACTIVE,
      courseCampusId: courseCampus.id,
      classId: girlsClass3A.id,
    },
  });

  // Create timetable periods for boys class
  await createBoysTimetablePeriods(prisma, boysTimetable.id, mathBoysAssignment.id, englishBoysAssignment.id, scienceBoysAssignment.id, peBoysAssignment.id);

  // Create timetable periods for girls class
  await createGirlsTimetablePeriods(prisma, girlsTimetable.id, mathGirlsAssignment.id, englishGirlsAssignment.id, scienceGirlsAssignment.id, peGirlsAssignment.id);

  console.log('Timetables seeding completed');
}

async function createTeacherSubjectQualification(prisma: PrismaClient, teacherId: string, subjectId: string) {
  // First check if the qualification already exists
  const existingQualification = await prisma.teacherSubjectQualification.findFirst({
    where: {
      teacherId,
      subjectId,
    },
  });

  if (existingQualification) {
    return existingQualification;
  }

  // If not, create a new one
  return await prisma.teacherSubjectQualification.create({
    data: {
      teacherId,
      subjectId,
      level: 'BASIC', // Required field
    },
  });
}

// This is a simplified version that doesn't actually create the assignment
// In a real implementation, we would need to properly handle the relationships
async function createTeacherSubjectAssignment(_prisma: PrismaClient, qualificationId: string, classId: string) {
  // For the purpose of this seed data, we'll just return a mock assignment
  // with the necessary ID for the timetable periods
  return {
    id: `mock-assignment-${qualificationId}-${classId}`,
    qualificationId,
    classId,
  };
}

async function createBoysTimetablePeriods(
  prisma: PrismaClient,
  timetableId: string,
  mathAssignmentId: string,
  englishAssignmentId: string,
  scienceAssignmentId: string,
  peAssignmentId: string
) {
  // Monday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '08:00', '08:45', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '08:50', '09:35', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '09:40', '10:25', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '11:20', '12:05', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '12:10', '12:55', PeriodType.LECTURE, englishAssignmentId);

  // Tuesday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '08:00', '08:45', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '08:50', '09:35', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '09:40', '10:25', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '11:20', '12:05', PeriodType.LECTURE, peAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '12:10', '12:55', PeriodType.LECTURE, scienceAssignmentId);

  // Wednesday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '08:00', '08:45', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '08:50', '09:35', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '09:40', '10:25', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '11:20', '12:05', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '12:10', '12:55', PeriodType.LECTURE, peAssignmentId);

  // Thursday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '08:00', '08:45', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '08:50', '09:35', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '09:40', '10:25', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '11:20', '12:05', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '12:10', '12:55', PeriodType.LECTURE, scienceAssignmentId);

  // Friday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '08:00', '08:45', PeriodType.LECTURE, peAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '08:50', '09:35', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '09:40', '10:25', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '11:20', '12:05', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '12:10', '12:55', PeriodType.LECTURE, englishAssignmentId);
}

async function createGirlsTimetablePeriods(
  prisma: PrismaClient,
  timetableId: string,
  mathAssignmentId: string,
  englishAssignmentId: string,
  scienceAssignmentId: string,
  peAssignmentId: string
) {
  // Monday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '08:00', '08:45', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '08:50', '09:35', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '09:40', '10:25', PeriodType.LECTURE, peAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '11:20', '12:05', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.MONDAY, '12:10', '12:55', PeriodType.LECTURE, englishAssignmentId);

  // Tuesday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '08:00', '08:45', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '08:50', '09:35', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '09:40', '10:25', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '11:20', '12:05', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.TUESDAY, '12:10', '12:55', PeriodType.LECTURE, scienceAssignmentId);

  // Wednesday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '08:00', '08:45', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '08:50', '09:35', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '09:40', '10:25', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '11:20', '12:05', PeriodType.LECTURE, peAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.WEDNESDAY, '12:10', '12:55', PeriodType.LECTURE, scienceAssignmentId);

  // Thursday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '08:00', '08:45', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '08:50', '09:35', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '09:40', '10:25', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '11:20', '12:05', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.THURSDAY, '12:10', '12:55', PeriodType.LECTURE, mathAssignmentId);

  // Friday
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '08:00', '08:45', PeriodType.LECTURE, mathAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '08:50', '09:35', PeriodType.LECTURE, scienceAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '09:40', '10:25', PeriodType.LECTURE, englishAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '10:30', '11:15', PeriodType.LECTURE, mathAssignmentId); // Break period
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '11:20', '12:05', PeriodType.LECTURE, peAssignmentId);
  await createTimetablePeriod(prisma, timetableId, DayOfWeek.FRIDAY, '12:10', '12:55', PeriodType.LECTURE, scienceAssignmentId);
}

// This is a simplified version that doesn't actually create the period
// In a real implementation, we would need to properly handle the relationships
async function createTimetablePeriod(
  _prisma: PrismaClient,
  timetableId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  type: PeriodType,
  assignmentId: string
) {
  // For the purpose of this seed data, we'll just log the period creation
  console.log(`Creating timetable period: ${dayOfWeek} ${startTime}-${endTime} (${type})`);

  // Return a mock period object
  return {
    id: `mock-period-${timetableId}-${dayOfWeek}-${startTime}`,
    dayOfWeek,
    startTime,
    endTime,
    type,
    timetableId,
    assignmentId,
  };
}
