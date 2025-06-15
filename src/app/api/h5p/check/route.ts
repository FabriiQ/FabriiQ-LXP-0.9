import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/server/db';
import fs from 'fs';
import path from 'path';

// Import h5pEditor conditionally to avoid errors if H5P is not set up
let h5pEditor: any = null;
try {
  const h5pServer = require('@/server/h5p/h5p-server');
  h5pEditor = h5pServer.h5pEditor;
} catch (error) {
  console.warn('H5P server initialization failed:', error);
}

/**
 * API endpoint to check H5P system status
 * This helps diagnose issues with H5P integration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check H5P directories
    const h5pRootPath = path.resolve(process.cwd(), 'h5p');
    const contentStoragePath = path.join(h5pRootPath, 'content');
    const libraryStoragePath = path.join(h5pRootPath, 'libraries');
    const temporaryStoragePath = path.join(h5pRootPath, 'temporary-storage');

    const directoryStatus = {
      h5pRootExists: fs.existsSync(h5pRootPath),
      contentStorageExists: fs.existsSync(contentStoragePath),
      libraryStorageExists: fs.existsSync(libraryStoragePath),
      temporaryStorageExists: fs.existsSync(temporaryStoragePath),
    };

    // Check database for H5P content
    const contentCount = await prisma.h5PContent.count();

    // Try to get libraries from H5P editor
    let libraries = [];
    let librariesError = null;
    let h5pInitialized = false;

    try {
      if (h5pEditor) {
        h5pInitialized = true;
        libraries = await h5pEditor.getLibraries();
      } else {
        librariesError = 'H5P editor not initialized';
      }
    } catch (error) {
      librariesError = (error as Error).message;
    }

    // Create directories if they don't exist (for convenience)
    if (!directoryStatus.h5pRootExists) {
      try {
        fs.mkdirSync(h5pRootPath, { recursive: true });
        directoryStatus.h5pRootExists = true;
      } catch (error) {
        console.error('Failed to create H5P root directory:', error);
      }
    }

    if (directoryStatus.h5pRootExists) {
      if (!directoryStatus.contentStorageExists) {
        try {
          fs.mkdirSync(contentStoragePath, { recursive: true });
          directoryStatus.contentStorageExists = true;
        } catch (error) {
          console.error('Failed to create content storage directory:', error);
        }
      }

      if (!directoryStatus.libraryStorageExists) {
        try {
          fs.mkdirSync(libraryStoragePath, { recursive: true });
          directoryStatus.libraryStorageExists = true;
        } catch (error) {
          console.error('Failed to create library storage directory:', error);
        }
      }

      if (!directoryStatus.temporaryStorageExists) {
        try {
          fs.mkdirSync(temporaryStoragePath, { recursive: true });
          directoryStatus.temporaryStorageExists = true;
        } catch (error) {
          console.error('Failed to create temporary storage directory:', error);
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      directoryStatus,
      contentCount,
      h5pInitialized,
      libraries: libraries.length > 0 ? `${libraries.length} libraries found` : 'No libraries found',
      librariesError,
      serverTime: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: session.user.name,
      },
      setupInstructions: [
        'Make sure the H5P directories exist and are writable',
        'Install H5P libraries by uploading .h5p files',
        'Create H5P content using the editor',
        'Restart the server after making changes to the H5P directories'
      ]
    });
  } catch (error) {
    console.error('Error checking H5P status:', error);
    return NextResponse.json(
      {
        error: 'Error checking H5P status',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}
