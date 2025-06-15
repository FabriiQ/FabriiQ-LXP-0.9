import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor, h5pPlayer } from '@/server/h5p/h5p-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';
    const language = 'en'; // Default language

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Handle different H5P Ajax actions
    if (action === 'libraries') {
      const libraries = await h5pEditor.getLibraries();
      return NextResponse.json(libraries);
    }

    if (action === 'libraryData') {
      const machineName = searchParams.get('machineName');
      const majorVersion = searchParams.get('majorVersion');
      const minorVersion = searchParams.get('minorVersion');

      if (!machineName || !majorVersion || !minorVersion) {
        return NextResponse.json(
          { error: 'Library information is incomplete' },
          { status: 400 }
        );
      }

      const libraryData = await h5pEditor.getLibraryData(
        machineName,
        parseInt(majorVersion),
        parseInt(minorVersion),
        language
      );

      return NextResponse.json(libraryData);
    }

    // Add more actions as needed

    return NextResponse.json(
      { error: 'Unsupported action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling H5P Ajax request:', error);
    return NextResponse.json(
      { error: 'Error handling H5P Ajax request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Handle file uploads
    if (action === 'upload') {
      const file = formData.get('file') as File;
      const contentId = formData.get('contentId') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await h5pEditor.uploadFile(
        buffer,
        file.name,
        contentId,
        userId
      );

      return NextResponse.json(result);
    }

    // Add more actions as needed

    return NextResponse.json(
      { error: 'Unsupported action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling H5P Ajax request:', error);
    return NextResponse.json(
      { error: 'Error handling H5P Ajax request' },
      { status: 500 }
    );
  }
}
