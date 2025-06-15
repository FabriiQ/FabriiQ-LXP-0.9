// Script to create a teacher user with username "kashif"
const { PrismaClient, UserType, SystemStatus, AccessScope } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const prisma = new PrismaClient();

async function createTeacherUser() {
  try {
    console.log('Checking if user "kashif" already exists...');
    
    const existingUser = await prisma.user.findUnique({
      where: { username: 'kashif' }
    });

    if (existingUser) {
      console.log('User "kashif" already exists. Updating status to ACTIVE...');
      
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          username: true,
          userType: true,
          status: true
        }
      });
      
      console.log('User updated:', updatedUser);
      
      // Check if teacher profile exists
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: existingUser.id }
      });
      
      if (!teacherProfile) {
        console.log('Creating teacher profile for existing user...');
        await prisma.teacherProfile.create({
          data: {
            userId: existingUser.id,
            specialization: 'Mathematics',
            qualifications: [],
            certifications: [],
            experience: [],
            expertise: ['Mathematics', 'Science'],
            publications: [],
            achievements: []
          }
        });
        console.log('Teacher profile created successfully');
      }
      
      return updatedUser;
    }

    console.log('User "kashif" does not exist. Creating new teacher user...');
    
    // Get the first institution
    const institution = await prisma.institution.findFirst();
    if (!institution) {
      throw new Error('No institution found in the database');
    }
    
    // Get the first campus
    const campus = await prisma.campus.findFirst({
      where: { institutionId: institution.id }
    });
    if (!campus) {
      throw new Error('No campus found in the database');
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('password123', salt);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: 'Kashif Ahmed',
        email: 'kashif@example.com',
        username: 'kashif',
        password: hashedPassword,
        userType: UserType.CAMPUS_TEACHER,
        status: SystemStatus.ACTIVE,
        accessScope: AccessScope.SINGLE_CAMPUS,
        primaryCampusId: campus.id,
        institutionId: institution.id,
        teacherProfile: {
          create: {
            specialization: 'Mathematics',
            qualifications: [],
            certifications: [],
            experience: [],
            expertise: ['Mathematics', 'Science'],
            publications: [],
            achievements: []
          }
        },
        activeCampuses: {
          create: {
            campusId: campus.id,
            roleType: UserType.CAMPUS_TEACHER,
            status: SystemStatus.ACTIVE,
            startDate: new Date()
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        status: true,
        primaryCampusId: true
      }
    });

    console.log('Teacher user created successfully:', user);
    return user;
  } catch (error) {
    console.error('Error creating teacher user:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createTeacherUser();
