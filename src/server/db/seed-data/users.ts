import { PrismaClient, UserType, AccessScope, SystemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

export const DEFAULT_USER_PASSWORD = 'Password123!';

// System Admin
export const systemAdminData = {
  email: 'admin@sunshine.edu',
  name: 'System Administrator',
  username: 'sys_admin',
  userType: UserType.SYSTEM_ADMIN,
  accessScope: AccessScope.SYSTEM,
  status: SystemStatus.ACTIVE,
};

// Program Coordinator
export const coordinatorData = {
  email: 'coordinator@sunshine.edu',
  name: 'Alex Johnson',
  username: 'alex_johnson',
  userType: UserType.COORDINATOR,
  accessScope: AccessScope.MULTI_CAMPUS,
  status: SystemStatus.ACTIVE,
};

// Campus Admins
export const campusAdminsData = [
  {
    email: 'boys_admin@sunshine.edu',
    name: 'Michael Smith',
    username: 'michael_smith',
    userType: UserType.CAMPUS_ADMIN,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-BOYS',
  },
  {
    email: 'girls_admin@sunshine.edu',
    name: 'Sarah Williams',
    username: 'sarah_williams',
    userType: UserType.CAMPUS_ADMIN,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-GIRLS',
  },
];

// Teachers
export const teachersData = [
  {
    email: 'math_boys@sunshine.edu',
    name: 'Robert Brown',
    username: 'robert_brown',
    userType: UserType.TEACHER,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-BOYS',
    subjects: ['PYP-CL3-MATH'],
    isClassTeacher: true,
    classCode: 'SIS-BOYS-CL3A',
  },
  {
    email: 'math_girls@sunshine.edu',
    name: 'Jennifer Davis',
    username: 'jennifer_davis',
    userType: UserType.TEACHER,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-GIRLS',
    subjects: ['PYP-CL3-MATH'],
    isClassTeacher: true,
    classCode: 'SIS-GIRLS-CL3A',
  },
  {
    email: 'english_boys@sunshine.edu',
    name: 'David Wilson',
    username: 'david_wilson',
    userType: UserType.TEACHER,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-BOYS',
    subjects: ['PYP-CL3-ENG'],
    isClassTeacher: false,
  },
  {
    email: 'english_girls@sunshine.edu',
    name: 'Emily Taylor',
    username: 'emily_taylor',
    userType: UserType.TEACHER,
    accessScope: AccessScope.SINGLE_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCode: 'SIS-GIRLS',
    subjects: ['PYP-CL3-ENG'],
    isClassTeacher: false,
  },
  {
    email: 'science@sunshine.edu',
    name: 'James Anderson',
    username: 'james_anderson',
    userType: UserType.TEACHER,
    accessScope: AccessScope.MULTI_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCodes: ['SIS-BOYS', 'SIS-GIRLS'],
    subjects: ['PYP-CL3-SCI'],
    isClassTeacher: false,
  },
  {
    email: 'pe@sunshine.edu',
    name: 'Lisa Martinez',
    username: 'lisa_martinez',
    userType: UserType.TEACHER,
    accessScope: AccessScope.MULTI_CAMPUS,
    status: SystemStatus.ACTIVE,
    campusCodes: ['SIS-BOYS', 'SIS-GIRLS'],
    subjects: ['PYP-CL3-PE'],
    isClassTeacher: false,
  },
];

// Students
export const boysStudentsData = [
  { name: 'John Smith', email: 'john_smith@student.sunshine.edu', username: 'john_smith' },
  { name: 'William Johnson', email: 'william_johnson@student.sunshine.edu', username: 'william_johnson' },
  { name: 'Thomas Brown', email: 'thomas_brown@student.sunshine.edu', username: 'thomas_brown' },
  { name: 'Daniel Davis', email: 'daniel_davis@student.sunshine.edu', username: 'daniel_davis' },
  { name: 'Matthew Wilson', email: 'matthew_wilson@student.sunshine.edu', username: 'matthew_wilson' },
  { name: 'Andrew Taylor', email: 'andrew_taylor@student.sunshine.edu', username: 'andrew_taylor' },
  { name: 'Christopher Anderson', email: 'christopher_anderson@student.sunshine.edu', username: 'christopher_anderson' },
  { name: 'Joseph Martinez', email: 'joseph_martinez@student.sunshine.edu', username: 'joseph_martinez' },
  { name: 'Ryan Thompson', email: 'ryan_thompson@student.sunshine.edu', username: 'ryan_thompson' },
  { name: 'Nicholas Garcia', email: 'nicholas_garcia@student.sunshine.edu', username: 'nicholas_garcia' },
];

export const girlsStudentsData = [
  { name: 'Emma Smith', email: 'emma_smith@student.sunshine.edu', username: 'emma_smith' },
  { name: 'Olivia Johnson', email: 'olivia_johnson@student.sunshine.edu', username: 'olivia_johnson' },
  { name: 'Sophia Brown', email: 'sophia_brown@student.sunshine.edu', username: 'sophia_brown' },
  { name: 'Isabella Davis', email: 'isabella_davis@student.sunshine.edu', username: 'isabella_davis' },
  { name: 'Charlotte Wilson', email: 'charlotte_wilson@student.sunshine.edu', username: 'charlotte_wilson' },
  { name: 'Amelia Taylor', email: 'amelia_taylor@student.sunshine.edu', username: 'amelia_taylor' },
  { name: 'Mia Anderson', email: 'mia_anderson@student.sunshine.edu', username: 'mia_anderson' },
  { name: 'Harper Martinez', email: 'harper_martinez@student.sunshine.edu', username: 'harper_martinez' },
  { name: 'Evelyn Thompson', email: 'evelyn_thompson@student.sunshine.edu', username: 'evelyn_thompson' },
  { name: 'Abigail Garcia', email: 'abigail_garcia@student.sunshine.edu', username: 'abigail_garcia' },
];

export async function seedUsers(prisma: PrismaClient, institutions: any[], campuses: any[]) {
  console.log('Seeding users...');

  const hashedPassword = await hash(DEFAULT_USER_PASSWORD, 12);
  const institution = institutions[0]; // Sunshine International School

  if (!institution) {
    throw new Error('Institution not found. Cannot seed users.');
  }

  const boysCampus = campuses.find(c => c.code === 'SIS-BOYS');
  const girlsCampus = campuses.find(c => c.code === 'SIS-GIRLS');

  if (!boysCampus || !girlsCampus) {
    throw new Error('Campuses not found. Cannot seed users.');
  }

  // Create System Admin
  const systemAdmin = await prisma.user.upsert({
    where: { email: systemAdminData.email },
    update: {
      name: systemAdminData.name,
      username: systemAdminData.username,
      userType: systemAdminData.userType,
      accessScope: systemAdminData.accessScope,
      status: systemAdminData.status,
      primaryCampusId: boysCampus.id, // Set primary campus ID
    },
    create: {
      ...systemAdminData,
      password: hashedPassword,
      institutionId: institution.id,
      primaryCampusId: boysCampus.id, // Set primary campus ID
    },
  });

  // Create Program Coordinator
  const coordinator = await prisma.user.upsert({
    where: { email: coordinatorData.email },
    update: {
      name: coordinatorData.name,
      username: coordinatorData.username,
      userType: coordinatorData.userType,
      accessScope: coordinatorData.accessScope,
      status: coordinatorData.status,
      primaryCampusId: boysCampus.id, // Set primary campus ID
    },
    create: {
      ...coordinatorData,
      password: hashedPassword,
      institutionId: institution.id,
      primaryCampusId: boysCampus.id, // Set primary campus ID
    },
  });

  // Create campus access for coordinator
  await prisma.userCampusAccess.upsert({
    where: {
      userId_campusId: {
        userId: coordinator.id,
        campusId: boysCampus.id,
      },
    },
    update: {
      status: SystemStatus.ACTIVE,
      roleType: UserType.COORDINATOR,
    },
    create: {
      userId: coordinator.id,
      campusId: boysCampus.id,
      status: SystemStatus.ACTIVE,
      roleType: UserType.COORDINATOR,
    },
  });

  await prisma.userCampusAccess.upsert({
    where: {
      userId_campusId: {
        userId: coordinator.id,
        campusId: girlsCampus.id,
      },
    },
    update: {
      status: SystemStatus.ACTIVE,
      roleType: UserType.COORDINATOR,
    },
    create: {
      userId: coordinator.id,
      campusId: girlsCampus.id,
      status: SystemStatus.ACTIVE,
      roleType: UserType.COORDINATOR,
    },
  });

  // Create Campus Admins
  const campusAdmins = [];

  for (const adminData of campusAdminsData) {
    const { campusCode, ...userData } = adminData;
    const campus = campuses.find(c => c.code === campusCode);

    if (!campus) {
      console.warn(`Campus with code ${campusCode} not found. Skipping admin ${userData.email}`);
      continue;
    }

    const admin = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        username: userData.username,
        userType: userData.userType,
        accessScope: userData.accessScope,
        status: userData.status,
        primaryCampusId: campus.id, // Set primary campus ID
      },
      create: {
        ...userData,
        password: hashedPassword,
        institutionId: institution.id,
        primaryCampusId: campus.id, // Set primary campus ID
      },
    });

    // Create campus access for admin
    await prisma.userCampusAccess.upsert({
      where: {
        userId_campusId: {
          userId: admin.id,
          campusId: campus.id,
        },
      },
      update: {
        status: SystemStatus.ACTIVE,
        roleType: UserType.CAMPUS_ADMIN,
      },
      create: {
        userId: admin.id,
        campusId: campus.id,
        status: SystemStatus.ACTIVE,
        roleType: UserType.CAMPUS_ADMIN,
      },
    });

    campusAdmins.push(admin);
  }

  // Create Teachers
  const teachers = [];

  for (const teacherData of teachersData) {
    const { campusCode, campusCodes, subjects, isClassTeacher, classCode, ...userData } = teacherData;

    // Determine primary campus for the teacher
    let primaryCampusId = null;
    if (campusCode) {
      const campus = campuses.find(c => c.code === campusCode);
      if (campus) {
        primaryCampusId = campus.id;
      }
    } else if (campusCodes && campusCodes.length > 0) {
      // For multi-campus teachers, use the first campus as primary
      const campus = campuses.find(c => c.code === campusCodes[0]);
      if (campus) {
        primaryCampusId = campus.id;
      }
    }

    const teacher = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        username: userData.username,
        userType: userData.userType,
        accessScope: userData.accessScope,
        status: userData.status,
        primaryCampusId: primaryCampusId, // Set primary campus ID
      },
      create: {
        ...userData,
        password: hashedPassword,
        institutionId: institution.id,
        primaryCampusId: primaryCampusId, // Set primary campus ID
      },
    });

    // Create teacher profile
    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: teacher.id },
      update: {},
      create: {
        userId: teacher.id,
      },
    });

    // Create campus access for teacher
    if (campusCode) {
      const campus = campuses.find(c => c.code === campusCode);

      if (campus) {
        await prisma.userCampusAccess.upsert({
          where: {
            userId_campusId: {
              userId: teacher.id,
              campusId: campus.id,
            },
          },
          update: {
            status: SystemStatus.ACTIVE,
            roleType: UserType.TEACHER,
          },
          create: {
            userId: teacher.id,
            campusId: campus.id,
            status: SystemStatus.ACTIVE,
            roleType: UserType.TEACHER,
          },
        });
      }
    } else if (campusCodes) {
      for (const code of campusCodes) {
        const campus = campuses.find(c => c.code === code);

        if (campus) {
          await prisma.userCampusAccess.upsert({
            where: {
              userId_campusId: {
                userId: teacher.id,
                campusId: campus.id,
              },
            },
            update: {
              status: SystemStatus.ACTIVE,
              roleType: UserType.TEACHER,
            },
            create: {
              userId: teacher.id,
              campusId: campus.id,
              status: SystemStatus.ACTIVE,
              roleType: UserType.TEACHER,
            },
          });
        }
      }
    }

    teachers.push({ ...teacher, teacherProfileId: teacherProfile.id });
  }

  // Create Students
  const students = [];

  // Boys students
  for (const studentData of boysStudentsData) {
    const student = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {
        name: studentData.name,
        username: studentData.username,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: boysCampus.id, // Set primary campus ID
      },
      create: {
        ...studentData,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        primaryCampusId: boysCampus.id, // Set primary campus ID
      },
    });

    // Create student profile
    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        enrollmentNumber: `B${Math.floor(1000 + Math.random() * 9000)}`,
      },
    });

    // Create campus access for student
    await prisma.userCampusAccess.upsert({
      where: {
        userId_campusId: {
          userId: student.id,
          campusId: boysCampus.id,
        },
      },
      update: {
        status: SystemStatus.ACTIVE,
        roleType: UserType.STUDENT,
      },
      create: {
        userId: student.id,
        campusId: boysCampus.id,
        status: SystemStatus.ACTIVE,
        roleType: UserType.STUDENT,
      },
    });

    students.push({ ...student, studentProfileId: studentProfile.id, campusId: boysCampus.id });
  }

  // Girls students
  for (const studentData of girlsStudentsData) {
    const student = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {
        name: studentData.name,
        username: studentData.username,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        primaryCampusId: girlsCampus.id, // Set primary campus ID
      },
      create: {
        ...studentData,
        password: hashedPassword,
        userType: UserType.STUDENT,
        accessScope: AccessScope.SINGLE_CAMPUS,
        status: SystemStatus.ACTIVE,
        institutionId: institution.id,
        primaryCampusId: girlsCampus.id, // Set primary campus ID
      },
    });

    // Create student profile
    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        enrollmentNumber: `G${Math.floor(1000 + Math.random() * 9000)}`,
      },
    });

    // Create campus access for student
    await prisma.userCampusAccess.upsert({
      where: {
        userId_campusId: {
          userId: student.id,
          campusId: girlsCampus.id,
        },
      },
      update: {
        status: SystemStatus.ACTIVE,
        roleType: UserType.STUDENT,
      },
      create: {
        userId: student.id,
        campusId: girlsCampus.id,
        status: SystemStatus.ACTIVE,
        roleType: UserType.STUDENT,
      },
    });

    students.push({ ...student, studentProfileId: studentProfile.id, campusId: girlsCampus.id });
  }

  console.log(`Seeded ${1 + 1 + campusAdmins.length + teachers.length + students.length} users`);
  return {
    systemAdmin,
    coordinator,
    campusAdmins,
    teachers,
    students,
  };
}
