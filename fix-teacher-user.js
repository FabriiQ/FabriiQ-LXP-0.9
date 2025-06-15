// Script to fix the teacher user
const { PrismaClient, UserType, SystemStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTeacherUser() {
  try {
    console.log('Looking for teacher user with username "kashif@school.com"...');
    
    const user = await prisma.user.findUnique({
      where: { username: 'kashif@school.com' },
      include: {
        teacherProfile: true
      }
    });

    if (!user) {
      console.log('User "kashif@school.com" not found.');
      return;
    }

    console.log('Found user:', {
      id: user.id,
      name: user.name,
      username: user.username,
      userType: user.userType,
      status: user.status,
      hasTeacherProfile: !!user.teacherProfile
    });

    // Update the user to have the correct userType and status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        userType: UserType.CAMPUS_TEACHER, // Change from TEACHER to CAMPUS_TEACHER
        status: SystemStatus.ACTIVE // Change from INACTIVE to ACTIVE
      }
    });

    console.log('User updated successfully:', {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      userType: updatedUser.userType,
      status: updatedUser.status
    });

    // Check if the user has a teacher profile
    if (!user.teacherProfile) {
      console.log('Creating teacher profile...');
      
      const teacherProfile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          specialization: 'General',
          qualifications: [],
          certifications: [],
          experience: [],
          expertise: ['Teaching'],
          publications: [],
          achievements: []
        }
      });
      
      console.log('Teacher profile created:', {
        id: teacherProfile.id,
        userId: teacherProfile.userId
      });
    }

    // Check if the user has campus access
    const campusAccess = await prisma.userCampusAccess.findFirst({
      where: {
        userId: user.id,
        status: SystemStatus.ACTIVE
      }
    });

    if (!campusAccess) {
      console.log('Creating campus access...');
      
      // Get the primary campus ID
      const primaryCampusId = user.primaryCampusId;
      
      if (!primaryCampusId) {
        console.log('User has no primary campus. Cannot create campus access.');
        return;
      }
      
      const newCampusAccess = await prisma.userCampusAccess.create({
        data: {
          userId: user.id,
          campusId: primaryCampusId,
          roleType: UserType.CAMPUS_TEACHER,
          status: SystemStatus.ACTIVE,
          startDate: new Date()
        }
      });
      
      console.log('Campus access created:', {
        id: newCampusAccess.id,
        userId: newCampusAccess.userId,
        campusId: newCampusAccess.campusId
      });
    }

    console.log('Teacher user fixed successfully. You should now be able to log in with username "kashif@school.com".');
  } catch (error) {
    console.error('Error fixing teacher user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTeacherUser();
