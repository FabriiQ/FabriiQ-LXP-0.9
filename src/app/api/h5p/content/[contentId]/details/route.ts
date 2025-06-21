import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentId = params.contentId;

    // Get content details
    const content = await prisma.h5PContent.findFirst({
      where: {
        contentId
      }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching H5P content details:', error);
    return NextResponse.json(
      { error: 'Error fetching H5P content details' },
      { status: 500 }
    );
  }
}
