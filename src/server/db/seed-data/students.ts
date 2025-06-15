import { PrismaClient, UserType, AccessScope, SystemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

export const DEFAULT_STUDENT_PASSWORD = 'Student123!';

interface Class {
  id: string;
  code: string;
}

interface Campus {
  id: string;
  code: string;
}

export async function seedStudents(prisma: PrismaClient, classes: Class[], campuses: Campus[]) {
  console.log('Seeding students...');

  const hashedPassword = await hash(DEFAULT_STUDENT_PASSWORD, 12);

  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping student seeding.');
    return [];
  }

  const boysCampus = campuses.find(c => c.code === 'SIS-BOYS');
  const girlsCampus = campuses.find(c => c.code === 'SIS-GIRLS');

  if (!boysCampus || !girlsCampus) {
    console.warn('Campuses not found. Skipping student seeding.');
    return [];
  }

  // Find institution
  const institution = await prisma.institution.findFirst({
    where: { code: 'SIS' },
  });

  if (!institution) {
    console.warn('Institution not found. Skipping student seeding.');
    return [];
  }

  // Boys Campus - Class 3A (10 students)
  const boysStudentsData = [
    {
      email: 'john_smith@student.sunshine.edu',
      name: 'John Smith',
      username: 'john_smith',
      enrollmentNumber: 'SIS-BOYS-2024-001',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'william_johnson@student.sunshine.edu',
      name: 'William Johnson',
      username: 'william_johnson',
      enrollmentNumber: 'SIS-BOYS-2024-002',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'thomas_brown@student.sunshine.edu',
      name: 'Thomas Brown',
      username: 'thomas_brown',
      enrollmentNumber: 'SIS-BOYS-2024-003',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'daniel_davis@student.sunshine.edu',
      name: 'Daniel Davis',
      username: 'daniel_davis',
      enrollmentNumber: 'SIS-BOYS-2024-004',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'matthew_wilson@student.sunshine.edu',
      name: 'Matthew Wilson',
      username: 'matthew_wilson',
      enrollmentNumber: 'SIS-BOYS-2024-005',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'andrew_taylor@student.sunshine.edu',
      name: 'Andrew Taylor',
      username: 'andrew_taylor',
      enrollmentNumber: 'SIS-BOYS-2024-006',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'christopher_anderson@student.sunshine.edu',
      name: 'Christopher Anderson',
      username: 'christopher_anderson',
      enrollmentNumber: 'SIS-BOYS-2024-007',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'joseph_martinez@student.sunshine.edu',
      name: 'Joseph Martinez',
      username: 'joseph_martinez',
      enrollmentNumber: 'SIS-BOYS-2024-008',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'ryan_thompson@student.sunshine.edu',
      name: 'Ryan Thompson',
      username: 'ryan_thompson',
      enrollmentNumber: 'SIS-BOYS-2024-009',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
    {
      email: 'nicholas_garcia@student.sunshine.edu',
      name: 'Nicholas Garcia',
      username: 'nicholas_garcia',
      enrollmentNumber: 'SIS-BOYS-2024-010',
      campusId: boysCampus.id,
      classId: boysClass3A.id,
    },
  ];

  // Girls Campus - Class 3A (10 students)
  const girlsStudentsData = [
    {
      email: 'emma_smith@student.sunshine.edu',
      name: 'Emma Smith',
      username: 'emma_smith',
      enrollmentNumber: 'SIS-GIRLS-2024-001',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'olivia_johnson@student.sunshine.edu',
      name: 'Olivia Johnson',
      username: 'olivia_johnson',
      enrollmentNumber: 'SIS-GIRLS-2024-002',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'sophia_brown@student.sunshine.edu',
      name: 'Sophia Brown',
      username: 'sophia_brown',
      enrollmentNumber: 'SIS-GIRLS-2024-003',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'isabella_davis@student.sunshine.edu',
      name: 'Isabella Davis',
      username: 'isabella_davis',
      enrollmentNumber: 'SIS-GIRLS-2024-004',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'charlotte_wilson@student.sunshine.edu',
      name: 'Charlotte Wilson',
      username: 'charlotte_wilson',
      enrollmentNumber: 'SIS-GIRLS-2024-005',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'amelia_taylor@student.sunshine.edu',
      name: 'Amelia Taylor',
      username: 'amelia_taylor',
      enrollmentNumber: 'SIS-GIRLS-2024-006',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'mia_anderson@student.sunshine.edu',
      name: 'Mia Anderson',
      username: 'mia_anderson',
      enrollmentNumber: 'SIS-GIRLS-2024-007',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'harper_martinez@student.sunshine.edu',
      name: 'Harper Martinez',
      username: 'harper_martinez',
      enrollmentNumber: 'SIS-GIRLS-2024-008',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'evelyn_thompson@student.sunshine.edu',
      name: 'Evelyn Thompson',
      username: 'evelyn_thompson',
      enrollmentNumber: 'SIS-GIRLS-2024-009',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
    {
      email: 'abigail_garcia@student.sunshine.edu',
      name: 'Abigail Garcia',
      username: 'abigail_garcia',
      enrollmentNumber: 'SIS-GIRLS-2024-010',
      campusId: girlsCampus.id,
      classId: girlsClass3A.id,
    },
  ];

  const createdStudents = [];

  // Create boys students
  for (const studentData of boysStudentsData) {
    const { email, name, username, enrollmentNumber, campusId, classId } = studentData;

    // Create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        username,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
      },
      create: {
        email,
        name,
        username,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
      },
    });

    // Create student profile
    const student = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        enrollmentNumber,
        // campusId and classId are not fields in StudentProfile
        // They are handled through relationships
      },
      create: {
        userId: user.id,
        enrollmentNumber,
        interests: [],
        achievements: [],
      },
      include: {
        user: true,
      },
    });

    // Update class assignment - simplified for seed data
    try {
      // Check if enrollment exists
      const existingEnrollment = await prisma.studentEnrollment.findUnique({
        where: {
          studentId_classId: {
            studentId: student.id,
            classId: classId
          }
        }
      });

      if (existingEnrollment) {
        // Update existing enrollment
        await prisma.studentEnrollment.update({
          where: {
            studentId_classId: {
              studentId: student.id,
              classId: classId
            }
          },
          data: {
            status: SystemStatus.ACTIVE
          }
        });
      } else {
        // Create new enrollment
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            classId: classId,
            status: SystemStatus.ACTIVE,
            createdById: user.id,
            startDate: new Date()
          }
        });
      }
    } catch (error) {
      console.warn(`Error creating student enrollment: ${error}`);
    }

    // Create campus assignment - simplified for seed data
    try {
      // Check if campus access exists
      const existingCampusAccess = await prisma.userCampusAccess.findUnique({
        where: {
          userId_campusId: {
            userId: user.id,
            campusId: campusId
          }
        }
      });

      if (existingCampusAccess) {
        // Update existing campus access
        await prisma.userCampusAccess.update({
          where: {
            userId_campusId: {
              userId: user.id,
              campusId: campusId
            }
          },
          data: {
            status: SystemStatus.ACTIVE
          }
        });
      } else {
        // Create new campus access
        await prisma.userCampusAccess.create({
          data: {
            userId: user.id,
            campusId: campusId,
            status: SystemStatus.ACTIVE,
            roleType: UserType.STUDENT,
            startDate: new Date()
          }
        });
      }

      // Set as primary campus
      await prisma.user.update({
        where: { id: user.id },
        data: { primaryCampusId: campusId },
      });
    } catch (error) {
      console.warn(`Error creating campus access: ${error}`);
    }

    createdStudents.push(student);
  }

  // Create girls students
  for (const studentData of girlsStudentsData) {
    const { email, name, username, enrollmentNumber, campusId, classId } = studentData;

    // Create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        username,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
      },
      create: {
        email,
        name,
        username,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
      },
    });

    // Create student profile
    const student = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        enrollmentNumber,
        // campusId and classId are not fields in StudentProfile
        // They are handled through relationships
      },
      create: {
        userId: user.id,
        enrollmentNumber,
        interests: [],
        achievements: [],
      },
      include: {
        user: true,
      },
    });

    // Update class assignment - simplified for seed data
    try {
      // Check if enrollment exists
      const existingEnrollment = await prisma.studentEnrollment.findUnique({
        where: {
          studentId_classId: {
            studentId: student.id,
            classId: classId
          }
        }
      });

      if (existingEnrollment) {
        // Update existing enrollment
        await prisma.studentEnrollment.update({
          where: {
            studentId_classId: {
              studentId: student.id,
              classId: classId
            }
          },
          data: {
            status: SystemStatus.ACTIVE
          }
        });
      } else {
        // Create new enrollment
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            classId: classId,
            status: SystemStatus.ACTIVE,
            createdById: user.id,
            startDate: new Date()
          }
        });
      }
    } catch (error) {
      console.warn(`Error creating student enrollment: ${error}`);
    }

    // Create campus assignment - simplified for seed data
    try {
      // Check if campus access exists
      const existingCampusAccess = await prisma.userCampusAccess.findUnique({
        where: {
          userId_campusId: {
            userId: user.id,
            campusId: campusId
          }
        }
      });

      if (existingCampusAccess) {
        // Update existing campus access
        await prisma.userCampusAccess.update({
          where: {
            userId_campusId: {
              userId: user.id,
              campusId: campusId
            }
          },
          data: {
            status: SystemStatus.ACTIVE
          }
        });
      } else {
        // Create new campus access
        await prisma.userCampusAccess.create({
          data: {
            userId: user.id,
            campusId: campusId,
            status: SystemStatus.ACTIVE,
            roleType: UserType.STUDENT,
            startDate: new Date()
          }
        });
      }

      // Set as primary campus
      await prisma.user.update({
        where: { id: user.id },
        data: { primaryCampusId: campusId },
      });
    } catch (error) {
      console.warn(`Error creating campus access: ${error}`);
    }

    createdStudents.push(student);
  }

  console.log(`Seeded ${createdStudents.length} students`);
  return createdStudents;
}
