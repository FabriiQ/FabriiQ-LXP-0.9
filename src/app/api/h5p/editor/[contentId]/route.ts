import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor } from '@/server/h5p/h5p-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';
    const contentId = params.contentId === 'new' ? undefined : params.contentId;

    // Check if H5P editor is initialized
    if (!h5pEditor) {
      return NextResponse.json(
        {
          error: 'H5P editor is not initialized',
          needsSetup: true,
          message: 'The H5P system is not properly set up. Please check the server configuration.'
        },
        { status: 503 } // Service Unavailable
      );
    }

    const editorModel = await h5pEditor.render(contentId, userId);

    if (contentId) {
      const content = await h5pEditor.getContent(contentId);
      return NextResponse.json({
        ...editorModel,
        library: content.library,
        metadata: content.metadata,
        params: content.params
      });
    } else {
      return NextResponse.json(editorModel);
    }
  } catch (error) {
    console.error('Error getting H5P editor content:', error);
    return NextResponse.json(
      { error: 'Error getting H5P editor content' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';
    const contentId = params.contentId === 'new' ? undefined : params.contentId;

    const body = await request.json();
    const { library, params: contentParams } = body;

    // Check if H5P editor is initialized
    if (!h5pEditor) {
      return NextResponse.json(
        {
          error: 'H5P editor is not initialized',
          needsSetup: true,
          message: 'The H5P system is not properly set up. Please check the server configuration.'
        },
        { status: 503 } // Service Unavailable
      );
    }

    const savedContent = await h5pEditor.saveOrUpdateContentReturnMetaData(
      contentId,
      library,
      contentParams,
      userId
    );

    return NextResponse.json(savedContent);
  } catch (error) {
    console.error('Error saving H5P content:', error);
    return NextResponse.json(
      { error: 'Error saving H5P content' },
      { status: 500 }
    );
  }
}
