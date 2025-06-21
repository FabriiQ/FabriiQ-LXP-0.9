import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/server/db';
import { SystemStatus } from '@prisma/client';

/**
 * GET /api/student/learning-goals
 * 
 * Fetches learning goals for a student in a specific class
 * 
 * Query parameters:
 * - studentId: The ID of the student profile
 * - classId: The ID of the class
 */
export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    
    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Find student profile - first try by ID
    let student = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });
    
    // If not found by ID, try by userId
    if (!student) {
      student = await prisma.studentProfile.findUnique({
        where: { userId: studentId }
      });
      
      // If still not found, return error
      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }
    }
    
    // Get learning goals
    const learningGoals = await prisma.learningGoal.findMany({
      where: {
        studentId: student.id,
        classId,
        status: SystemStatus.ACTIVE
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(learningGoals);
  } catch (error) {
    console.error('Error fetching learning goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
