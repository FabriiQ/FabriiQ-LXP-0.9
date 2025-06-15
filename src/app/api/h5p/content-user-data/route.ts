import { NextRequest, NextResponse } from 'next/server';
import { h5pPlayer } from '@/server/h5p/h5p-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const dataType = searchParams.get('dataType');
    const subContentId = searchParams.get('subContentId');

    if (!contentId || !dataType) {
      return NextResponse.json(
        { error: 'Content ID and data type are required' },
        { status: 400 }
      );
    }

    const data = await h5pPlayer.getContentUserData(
      contentId,
      dataType,
      userId,
      subContentId || undefined
    );

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error getting H5P content user data:', error);
    return NextResponse.json(
      { error: 'Error getting H5P content user data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const dataType = searchParams.get('dataType');
    const subContentId = searchParams.get('subContentId');

    if (!contentId || !dataType) {
      return NextResponse.json(
        { error: 'Content ID and data type are required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    await h5pPlayer.setContentUserData(
      contentId,
      dataType,
      userId,
      body,
      subContentId || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting H5P content user data:', error);
    return NextResponse.json(
      { error: 'Error setting H5P content user data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const dataType = searchParams.get('dataType');
    const subContentId = searchParams.get('subContentId');

    if (!contentId || !dataType) {
      return NextResponse.json(
        { error: 'Content ID and data type are required' },
        { status: 400 }
      );
    }

    await h5pPlayer.deleteContentUserData(
      contentId,
      dataType,
      userId,
      subContentId || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting H5P content user data:', error);
    return NextResponse.json(
      { error: 'Error deleting H5P content user data' },
      { status: 500 }
    );
  }
}
