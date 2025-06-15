import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor } from '@/server/h5p/h5p-server';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SystemStatus } from '@prisma/client';

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
    const { title = 'Untitled H5P Content' } = body;

    // Create a user object for H5P
    const h5pUser = {
      id: userId,
      name: 'User',
      email: 'user@example.com',
      type: 'local',
      canInstallRecommended: true,
      canUpdateAndInstallLibraries: true
    };

    // Generate a unique content ID
    const contentId = `h5p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Save content to database
    const content = await prisma.h5PContent.create({
      data: {
        contentId,
        title,
        library: 'H5P.Accordion 1.0',
        params: {
          panels: [
            {
              title: 'Getting Started',
              content: [
                {
                  content: '<p>This is a new H5P content. Edit it to add your own content.</p>'
                }
              ]
            }
          ]
        },
        metadata: {
          title,
          license: 'U'
        },
        status: SystemStatus.ACTIVE,
        createdById: userId,
      }
    });

    return NextResponse.json({
      contentId,
      id: content.id,
      title
    });
  } catch (error) {
    console.error('Error creating H5P content:', error);
    return NextResponse.json(
      { error: 'Error creating H5P content' },
      { status: 500 }
    );
  }
}
