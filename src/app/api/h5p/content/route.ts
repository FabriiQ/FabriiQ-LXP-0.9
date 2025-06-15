import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SystemStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all H5P content
    const contents = await prisma.h5PContent.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error fetching H5P content:', error);
    return NextResponse.json(
      { error: 'Error fetching H5P content' },
      { status: 500 }
    );
  }
}
