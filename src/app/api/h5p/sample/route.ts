import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor } from '@/server/h5p/h5p-server';
import { prisma } from '@/server/db';
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

    const userId = session.user.id;

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
        title: 'Sample H5P Content',
        library: 'H5P.Accordion 1.0',
        params: {
          panels: [
            {
              title: 'Sample Content',
              content: [
                {
                  content: '<p>This is a sample H5P content created for testing.</p>'
                }
              ]
            }
          ]
        },
        metadata: {
          title: 'Sample H5P Content',
          license: 'U'
        },
        status: SystemStatus.ACTIVE,
        createdById: userId,
      }
    });

    return NextResponse.json({
      contentId,
      id: content.id,
      title: 'Sample H5P Content',
      message: 'Sample H5P content created successfully'
    });
  } catch (error) {
    console.error('Error creating sample H5P content:', error);
    return NextResponse.json(
      { error: 'Error creating sample H5P content' },
      { status: 500 }
    );
  }
}
