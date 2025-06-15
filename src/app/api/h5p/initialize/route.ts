import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initializeH5P, ensureDirectories, ensureSchemaFiles } from '@/server/h5p/h5p-server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to initialize the H5P system
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow system admins to initialize H5P
    const userType = session.user.userType;
    if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'].includes(userType as string)) {
      return NextResponse.json(
        { error: 'Only administrators can initialize the H5P system' },
        { status: 403 }
      );
    }

    try {
      // Ensure directories and schema files exist
      ensureDirectories();
      ensureSchemaFiles();

      // Initialize H5P using our centralized function
      const initialized = initializeH5P();

      if (!initialized) {
        return NextResponse.json(
          { error: 'Failed to initialize H5P system' },
          { status: 500 }
        );
      }

      // Get the path to temporary storage for pending files
      const h5pRootPath = path.resolve(process.cwd(), 'h5p');
      const temporaryStoragePath = path.join(h5pRootPath, 'temporary-storage');

      // Process any pending temporary files
      const tempFiles = fs.readdirSync(temporaryStoragePath);
      const h5pFiles = tempFiles.filter(file => file.endsWith('.h5p'));

      return NextResponse.json({
        success: true,
        message: 'H5P system initialized successfully',
        pendingFiles: h5pFiles.length
      });
    } catch (error) {
      console.error('Error initializing H5P:', error);
      return NextResponse.json(
        { error: 'Failed to initialize H5P system', details: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in H5P initialization endpoint:', error);
    return NextResponse.json(
      { error: 'Error initializing H5P system', details: (error as Error).message },
      { status: 500 }
    );
  }
}
