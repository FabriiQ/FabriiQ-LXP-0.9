import { PrismaClient, SystemStatus } from '@prisma/client';

export const classesSeedData = [
  // Boys Campus Classes
  {
    name: 'Class 3A',
    code: 'SIS-BOYS-CL3A',
    courseCode: 'PYP-CL3',
    campusCode: 'SIS-BOYS',
    minCapacity: 1,
    maxCapacity: 25,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Class 3B',
    code: 'SIS-BOYS-CL3B',
    courseCode: 'PYP-CL3',
    campusCode: 'SIS-BOYS',
    minCapacity: 1,
    maxCapacity: 25,
    status: SystemStatus.ACTIVE,
  },

  // Girls Campus Classes
  {
    name: 'Class 3A',
    code: 'SIS-GIRLS-CL3A',
    courseCode: 'PYP-CL3',
    campusCode: 'SIS-GIRLS',
    minCapacity: 1,
    maxCapacity: 25,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Class 3B',
    code: 'SIS-GIRLS-CL3B',
    courseCode: 'PYP-CL3',
    campusCode: 'SIS-GIRLS',
    minCapacity: 1,
    maxCapacity: 25,
    status: SystemStatus.ACTIVE,
  },
];

export async function seedClasses(prisma: PrismaClient, programCampuses: any[], users: any[]) {
  console.log('Seeding classes...');

  // Find teacher profiles to assign as class teachers
  const teacherProfiles = await prisma.teacherProfile.findMany({
    include: {
      user: true,
    },
  });

  if (teacherProfiles.length === 0) {
    console.warn('No teacher profiles found. Classes will be created without class teachers.');
  }

  // Find terms
  const terms = await prisma.term.findMany({
    where: {
      status: SystemStatus.ACTIVE,
    },
  });

  if (terms.length === 0) {
    console.warn('No terms found. Skipping class seeding.');
    return [];
  }

  // Use the first term
  const term = terms[0];

  // Find course campuses
  let courseCampuses = await prisma.courseCampus.findMany({
    where: {
      status: SystemStatus.ACTIVE,
    },
  });

  if (courseCampuses.length === 0) {
    console.warn('No course campuses found. Creating course campuses for each program campus.');

    // Find courses
    const courses = await prisma.course.findMany({
      where: {
        status: SystemStatus.ACTIVE,
      },
    });

    if (courses.length === 0) {
      console.warn('No courses found. Creating a default course.');

      // Find a program
      const program = await prisma.program.findFirst({
        where: {
          status: SystemStatus.ACTIVE,
        },
      });

      if (!program) {
        console.warn('No program found. Skipping class seeding.');
        return [];
      }

      // Create a default course
      const defaultCourse = await prisma.course.create({
        data: {
          name: 'Class 3',
          code: 'PYP-CL3',
          description: 'Third grade curriculum for primary students',
          credits: 5,
          status: SystemStatus.ACTIVE,
          program: { connect: { id: program.id } },
        },
      });

      courses.push(defaultCourse);
      console.log('Created default course');
    }

    // Create course campuses for each program campus
    const createdCourseCampuses = [];

    for (const programCampus of programCampuses) {
      if (!programCampus.campusId) {
        console.warn(`Program campus ${programCampus.id} has no campusId. Skipping course campus creation.`);
        continue;
      }

      for (const course of courses) {
        try {
          const courseCampus = await prisma.courseCampus.create({
            data: {
              courseId: course.id,
              campusId: programCampus.campusId,
              programCampusId: programCampus.id,
              startDate: new Date('2024-08-01'),
              endDate: new Date('2025-06-30'),
              status: SystemStatus.ACTIVE,
            },
          });

          createdCourseCampuses.push(courseCampus);
        } catch (error) {
          console.warn(`Error creating course campus: ${error}`);
        }
      }
    }

    if (createdCourseCampuses.length === 0) {
      console.warn('Failed to create course campuses. Skipping class seeding.');
      return [];
    }

    courseCampuses = createdCourseCampuses;
    console.log(`Created ${createdCourseCampuses.length} course campuses`);
  }

  const createdClasses = [];

  for (const classData of classesSeedData) {
    const { campusCode, courseCode, ...classInfo } = classData;

    // Find the campus by code
    const campus = await prisma.campus.findUnique({
      where: { code: campusCode },
    });

    if (!campus) {
      console.warn(`Campus with code ${campusCode} not found. Skipping class ${classData.code}`);
      continue;
    }

    // Find a course campus for this campus
    const courseCampus = courseCampuses.find(cc => cc.campusId === campus.id);

    if (!courseCampus) {
      console.warn(`No course campus found for campus ${campus.code}. Skipping class ${classData.code}`);
      continue;
    }

    // Find a program campus for this campus
    const programCampus = programCampuses.find(pc => pc.campusId === campus.id);

    if (!programCampus) {
      console.warn(`No program campus found for campus ${campus.code}. Skipping class ${classData.code}`);
      continue;
    }

    // Find a teacher for this class
    let classTeacherId = null;
    if (teacherProfiles.length > 0) {
      // Assign teachers based on campus (male teachers to boys campus, female teachers to girls campus)
      const isBoysCampus = campusCode === 'SIS-BOYS';

      // Simple logic to determine if a teacher is male or female based on name
      // This is just for demonstration purposes
      const eligibleTeachers = teacherProfiles.filter(teacher => {
        const teacherName = teacher.user?.name || '';
        const isMaleTeacher = !['Sarah', 'Emily', 'Jessica', 'Amanda', 'Jennifer', 'Elizabeth'].some(
          femaleName => teacherName.includes(femaleName)
        );
        return isBoysCampus ? isMaleTeacher : !isMaleTeacher;
      });

      if (eligibleTeachers.length > 0) {
        // Assign a random teacher from the eligible teachers
        const randomTeacher = eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];
        classTeacherId = randomTeacher.id;
      }
    }

    // Create the class
    const createdClass = await prisma.class.upsert({
      where: { code: classData.code },
      update: {
        ...classInfo,
        campusId: campus.id,
        courseCampusId: courseCampus.id,
        termId: term.id,
        classTeacherId,
        programCampusId: programCampus.id,
        minCapacity: 1,
        maxCapacity: classData.maxCapacity,
      },
      create: {
        ...classInfo,
        campusId: campus.id,
        courseCampusId: courseCampus.id,
        termId: term.id,
        classTeacherId,
        programCampusId: programCampus.id,
        minCapacity: 1,
        maxCapacity: classData.maxCapacity,
        currentCount: 0,
      },
    });

    createdClasses.push(createdClass);
  }

  console.log(`Seeded ${createdClasses.length} classes`);
  return createdClasses;
}
