import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { contentId, score, maxScore, completed, progress } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const completion = await prisma.h5PContentCompletion.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        score,
        maxScore,
        completed,
        progress,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentId,
        score,
        maxScore,
        completed,
        progress
      }
    });

    return NextResponse.json(completion);
  } catch (error) {
    console.error('Error tracking H5P completion:', error);
    return NextResponse.json(
      { error: 'Error tracking H5P completion' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const completion = await prisma.h5PContentCompletion.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      }
    });

    return NextResponse.json(completion || { completed: false, progress: 0 });
  } catch (error) {
    console.error('Error getting H5P completion:', error);
    return NextResponse.json(
      { error: 'Error getting H5P completion' },
      { status: 500 }
    );
  }
}
