import { PrismaClient, SystemStatus } from '@prisma/client';

export const subjectsSeedData = [
  {
    code: 'PYP-CL3-MATH',
    name: 'Mathematics for Class 3',
    credits: 1.0,
    courseCode: 'PYP-CL3',
    syllabus: {
      overview: 'This subject covers fundamental mathematical concepts for third-grade students.',
      objectives: [
        'Develop proficiency in addition and subtraction with three-digit numbers',
        'Learn multiplication tables (1-10) and basic division',
        'Understand basic geometric shapes and measurement concepts',
        'Develop problem-solving skills using mathematical operations',
      ],
      assessmentMethods: [
        'Regular quizzes and worksheets',
        'Mid-term and final assessments',
        'Practical activities and projects',
      ],
    },
    status: SystemStatus.ACTIVE,
  },
  {
    code: 'PYP-CL3-ENG',
    name: 'English for Class 3',
    credits: 1.0,
    courseCode: 'PYP-CL3',
    syllabus: {
      overview: 'This subject focuses on developing reading, writing, and communication skills for third-grade students.',
      objectives: [
        'Improve reading comprehension and vocabulary',
        'Develop writing skills with proper grammar and punctuation',
        'Enhance speaking and listening abilities',
        'Introduce basic literary concepts and story elements',
      ],
      assessmentMethods: [
        'Reading comprehension tests',
        'Writing assignments and projects',
        'Oral presentations',
        'Spelling and vocabulary quizzes',
      ],
    },
    status: SystemStatus.ACTIVE,
  },
  {
    code: 'PYP-CL3-SCI',
    name: 'Science for Class 3',
    credits: 1.0,
    courseCode: 'PYP-CL3',
    syllabus: {
      overview: 'This subject introduces basic scientific concepts and inquiry skills for third-grade students.',
      objectives: [
        'Understand plant and animal life cycles and classifications',
        'Learn about weather patterns and the solar system',
        'Develop observation and experimentation skills',
        'Foster curiosity about the natural world',
      ],
      assessmentMethods: [
        'Science projects and experiments',
        'Written tests and quizzes',
        'Observation journals',
        'Group activities and presentations',
      ],
    },
    status: SystemStatus.ACTIVE,
  },
  {
    code: 'PYP-CL3-PE',
    name: 'Physical Education for Class 3',
    credits: 0.5,
    courseCode: 'PYP-CL3',
    syllabus: {
      overview: 'This subject focuses on developing physical skills, teamwork, and healthy habits for third-grade students.',
      objectives: [
        'Develop fundamental movement skills and coordination',
        'Learn basic ball skills and game strategies',
        'Foster teamwork and cooperation',
        'Promote physical fitness and healthy lifestyle habits',
      ],
      assessmentMethods: [
        'Physical skills assessments',
        'Participation and effort evaluation',
        'Team game performance',
        'Basic fitness tests',
      ],
    },
    status: SystemStatus.ACTIVE,
  },
];

export async function seedSubjects(prisma: PrismaClient, courses: any[]) {
  console.log('Seeding subjects...');

  const createdSubjects: any[] = [];

  // First, check if we have courses
  if (!courses || courses.length === 0) {
    console.warn('No courses found. Fetching courses from database...');
    const dbCourses = await prisma.course.findMany();
    if (dbCourses.length === 0) {
      console.warn('No courses found in database. Subjects cannot be seeded.');
      return [];
    }
    courses = dbCourses;
  }

  for (const subject of subjectsSeedData) {
    const { courseCode, ...subjectData } = subject;

    // Find the course by code
    const course = courses.find(c => c.code === courseCode);

    if (!course) {
      console.warn(`Course with code ${courseCode} not found. Trying to find in database...`);
      const dbCourse = await prisma.course.findUnique({
        where: { code: courseCode }
      });

      if (!dbCourse) {
        console.warn(`Course with code ${courseCode} not found in database. Skipping subject ${subject.code}`);
        continue;
      }

      const createdSubject = await prisma.subject.upsert({
        where: { code: subject.code },
        update: {
          ...subjectData,
          courseId: dbCourse.id,
        },
        create: {
          ...subjectData,
          courseId: dbCourse.id,
        },
      });

      createdSubjects.push(createdSubject);
    } else {
      const createdSubject = await prisma.subject.upsert({
        where: { code: subject.code },
        update: {
          ...subjectData,
          courseId: course.id,
        },
        create: {
          ...subjectData,
          courseId: course.id,
        },
      });

      createdSubjects.push(createdSubject);
    }
  }

  console.log(`Seeded ${createdSubjects.length} subjects`);
  return createdSubjects;
}
