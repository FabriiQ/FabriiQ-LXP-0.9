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

    // Get all completions for this content
    const completions = await prisma.h5PContentCompletion.findMany({
      where: {
        contentId: content.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(completions);
  } catch (error) {
    console.error('Error fetching H5P analytics:', error);
    return NextResponse.json(
      { error: 'Error fetching H5P analytics' },
      { status: 500 }
    );
  }
}
