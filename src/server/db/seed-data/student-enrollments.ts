import { PrismaClient, SystemStatus, UserType, AccessScope } from '@prisma/client';
import { generateEnrollmentNumber } from '../../utils/enrollment-number';

export async function seedStudentEnrollments(
  prisma: PrismaClient,
  classes: any[],
  users: any[]
) {
  console.log('Seeding student enrollments...');

  // Find student profiles
  const studentProfiles = await prisma.studentProfile.findMany({
    include: {
      user: true,
    },
  });

  if (studentProfiles.length === 0) {
    console.warn('No student profiles found. Creating sample student profiles...');

    // Find admin user to use as creator
    const adminUser = users.find(u => u.userType === 'ADMINISTRATOR');

    if (!adminUser) {
      console.warn('No admin user found. Skipping student enrollment seeding.');
      return [];
    }

    // Create sample student profiles
    await createSampleStudentProfiles(prisma, users);

    // Fetch the newly created student profiles
    const newStudentProfiles = await prisma.studentProfile.findMany({
      include: {
        user: true,
      },
    });

    if (newStudentProfiles.length === 0) {
      console.warn('Failed to create student profiles. Skipping student enrollment seeding.');
      return [];
    }

    return createEnrollments(prisma, newStudentProfiles, classes, adminUser);
  }

  // Find admin user to use as creator
  let adminUser = users.find(u => u.userType === 'ADMINISTRATOR');

  if (!adminUser) {
    console.warn('No admin user found. Creating a default admin user for student enrollments.');

    // Find an institution
    const institution = await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    if (!institution) {
      console.warn('No institution found. Cannot create admin user.');
      return [];
    }

    // Create a default admin user
    adminUser = await prisma.user.create({
      data: {
        name: 'Enrollment Administrator',
        email: `enrollment.admin.${Date.now()}@example.com`,
        username: `enrollment_admin_${Date.now()}`,
        userType: 'ADMINISTRATOR',
        accessScope: 'SYSTEM',
        status: SystemStatus.ACTIVE,
        password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
        institution: { connect: { id: institution.id } },
      },
    });

    console.log('Created default admin user for student enrollments');
  }

  return createEnrollments(prisma, studentProfiles, classes, adminUser);
}

async function createSampleStudentProfiles(prisma: PrismaClient, users: any[]) {
  // Find admin user to use as creator
  let adminUser = users.find(u => u.userType === 'ADMINISTRATOR');

  if (!adminUser) {
    console.warn('No admin user found. Creating a default admin user for student profiles.');

    // Find an institution
    const institution = await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    if (!institution) {
      console.warn('No institution found. Cannot create admin user.');
      return;
    }

    // Create a default admin user
    adminUser = await prisma.user.create({
      data: {
        name: 'Profile Administrator',
        email: `profile.admin.${Date.now()}@example.com`,
        username: `profile_admin_${Date.now()}`,
        userType: 'ADMINISTRATOR',
        accessScope: 'SYSTEM',
        status: SystemStatus.ACTIVE,
        password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
        institution: { connect: { id: institution.id } },
      },
    });

    console.log('Created default admin user for student profiles');
  }

  // Create sample student users
  const studentUsers = [
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      username: 'john_smith',
      userType: 'STUDENT' as UserType,
      accessScope: 'SINGLE_CAMPUS' as AccessScope,
      status: SystemStatus.ACTIVE,
      institutionId: adminUser.institutionId,
      password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
    },
    {
      name: 'William Johnson',
      email: 'william.johnson@example.com',
      username: 'william_johnson',
      userType: 'STUDENT' as UserType,
      accessScope: 'SINGLE_CAMPUS' as AccessScope,
      status: SystemStatus.ACTIVE,
      institutionId: adminUser.institutionId,
      password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
    },
    {
      name: 'Emma Smith',
      email: 'emma.smith@example.com',
      username: 'emma_smith',
      userType: 'STUDENT' as UserType,
      accessScope: 'SINGLE_CAMPUS' as AccessScope,
      status: SystemStatus.ACTIVE,
      institutionId: adminUser.institutionId,
      password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
    },
    {
      name: 'Sophia Brown',
      email: 'sophia.brown@example.com',
      username: 'sophia_brown',
      userType: 'STUDENT' as UserType,
      accessScope: 'SINGLE_CAMPUS' as AccessScope,
      status: SystemStatus.ACTIVE,
      institutionId: adminUser.institutionId,
      password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
    },
  ];

  for (const userData of studentUsers) {
    // Create user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        username: userData.username,
        userType: userData.userType,
        accessScope: userData.accessScope,
        status: userData.status,
        password: userData.password,
        institution: { connect: { id: userData.institutionId } }
      },
    });

    // Create student profile
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        enrollmentNumber: generateEnrollmentNumber('SIS'),
        currentGrade: 'Grade 3',
        academicHistory: {
          previousSchool: 'Previous Elementary School',
          previousGrade: 'Grade 2',
          joiningDate: new Date('2023-08-01').toISOString(),
        },
        interests: ['Reading', 'Sports', 'Art'],
        achievements: [
          {
            title: 'Reading Champion',
            date: new Date('2023-05-15').toISOString(),
            description: 'Read the most books in class',
          },
        ],
        guardianInfo: {
          primaryGuardian: {
            name: `${user.name?.split(' ')[0] || 'Student'}'s Parent`,
            relationship: 'Parent',
            contact: '123-456-7890',
            email: `parent.${user.username}@example.com`,
          },
        },
      },
    });
  }
}

async function createEnrollments(
  prisma: PrismaClient,
  studentProfiles: any[],
  classes: any[],
  adminUser: any
) {
  const enrollments: any[] = [];

  // Find the boys and girls classes
  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping student enrollment seeding.');
    return enrollments;
  }

  // Assign male students to boys class and female students to girls class
  for (const studentProfile of studentProfiles) {
    const studentName = studentProfile.user?.name || '';
    const isMale = !['Emma', 'Sophia', 'Olivia', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Harper', 'Evelyn', 'Abigail'].some(
      femaleName => studentName.includes(femaleName)
    );

    const classId = isMale ? boysClass3A.id : girlsClass3A.id;

    // Check if enrollment already exists
    const existingEnrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        classId,
      },
    });

    if (existingEnrollment) {
      enrollments.push(existingEnrollment);
      continue;
    }

    // Create enrollment
    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId: studentProfile.id,
        classId,
        status: SystemStatus.ACTIVE,
        startDate: new Date('2024-08-01'),
        createdById: adminUser.id,
      },
    });

    // Create enrollment history
    await prisma.enrollmentHistory.create({
      data: {
        enrollmentId: enrollment.id,
        action: 'CREATED',
        details: {
          studentName: studentProfile.user?.name || 'Student',
          className: isMale ? 'Class 3A Boys' : 'Class 3A Girls',
          startDate: new Date('2024-08-01').toISOString(),
        },
        createdById: adminUser.id,
      },
    });

    enrollments.push(enrollment);
  }

  console.log(`Seeded ${enrollments.length} student enrollments`);
  return enrollments;
}
