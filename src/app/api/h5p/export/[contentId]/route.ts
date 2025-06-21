import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor } from '@/server/h5p/h5p-server';
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

    // Export content as H5P package
    const h5pPackage = await h5pEditor.exportContent(contentId);

    // Create a safe filename
    const filename = content.title
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase() + '.h5p';

    // Return the H5P package as a downloadable file
    return new NextResponse(h5pPackage, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting H5P content:', error);
    return NextResponse.json(
      { error: 'Error exporting H5P content' },
      { status: 500 }
    );
  }
}
