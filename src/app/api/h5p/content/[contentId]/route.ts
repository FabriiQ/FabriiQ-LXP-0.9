import { NextRequest, NextResponse } from 'next/server';
import { h5pPlayer, h5pEditor } from '@/server/h5p/h5p-server';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';
    const contentId = params.contentId;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Check if H5P player is initialized
    if (!h5pPlayer) {
      return NextResponse.json(
        {
          error: 'H5P player is not initialized',
          needsSetup: true,
          message: 'The H5P system is not properly set up. Please check the server configuration.'
        },
        { status: 503 } // Service Unavailable
      );
    }

    const playerModel = await h5pPlayer.render(contentId, userId);
    return NextResponse.json(playerModel);
  } catch (error) {
    console.error('Error getting H5P content:', error);
    return NextResponse.json(
      { error: 'Error getting H5P content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if content exists
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

    // Delete content from H5P server
    await h5pEditor.deleteContent(contentId);

    // Delete content from database
    await prisma.h5PContent.delete({
      where: {
        id: content.id
      }
    });

    // Delete any activities using this content
    await prisma.activity.updateMany({
      where: {
        h5pContentId: content.id
      },
      data: {
        h5pContentId: null
      }
    });

    // Delete completions
    await prisma.h5PContentCompletion.deleteMany({
      where: {
        contentId: content.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting H5P content:', error);
    return NextResponse.json(
      { error: 'Error deleting H5P content' },
      { status: 500 }
    );
  }
}