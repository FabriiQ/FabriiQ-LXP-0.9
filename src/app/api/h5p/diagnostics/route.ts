import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { h5pEditor, h5pPlayer } from '@/server/h5p/h5p-server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to get H5P system diagnostics
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow system admins to view diagnostics
    const userType = session.user.userType;
    if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'].includes(userType as string)) {
      return NextResponse.json(
        { error: 'Only administrators can view H5P diagnostics' },
        { status: 403 }
      );
    }

    // Define storage paths
    const h5pRootPath = path.resolve(process.cwd(), 'h5p');
    const contentStoragePath = path.join(h5pRootPath, 'content');
    const libraryStoragePath = path.join(h5pRootPath, 'libraries');
    const temporaryStoragePath = path.join(h5pRootPath, 'temporary-storage');
    const schemasPath = path.join(h5pRootPath, 'schemas');

    // Check directory existence
    const directoryStatus = {
      h5pRootExists: fs.existsSync(h5pRootPath),
      contentStorageExists: fs.existsSync(contentStoragePath),
      libraryStorageExists: fs.existsSync(libraryStoragePath),
      temporaryStorageExists: fs.existsSync(temporaryStoragePath),
      schemasExists: fs.existsSync(schemasPath)
    };

    // Check schema files
    let schemaFiles = [];
    if (directoryStatus.schemasExists) {
      schemaFiles = fs.readdirSync(schemasPath)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(schemasPath, file),
          size: fs.statSync(path.join(schemasPath, file)).size,
          content: fs.readFileSync(path.join(schemasPath, file), 'utf8').substring(0, 100) + '...' // Show first 100 chars
        }));
    }

    // Count content files
    let contentCount = 0;
    if (directoryStatus.contentStorageExists) {
      try {
        const contentFiles = fs.readdirSync(contentStoragePath);
        contentCount = contentFiles.length;
      } catch (error) {
        console.error('Error counting content files:', error);
      }
    }

    // Check if H5P is initialized
    const h5pInitialized = !!h5pEditor && !!h5pPlayer;

    // Get library information
    let libraries = [];
    let librariesError = null;
    if (directoryStatus.libraryStorageExists) {
      try {
        const libraryDirs = fs.readdirSync(libraryStoragePath);
        libraries = libraryDirs.map(dir => {
          try {
            const libraryJsonPath = path.join(libraryStoragePath, dir, 'library.json');
            if (fs.existsSync(libraryJsonPath)) {
              const libraryJson = JSON.parse(fs.readFileSync(libraryJsonPath, 'utf8'));
              return {
                name: dir,
                version: `${libraryJson.majorVersion}.${libraryJson.minorVersion}.${libraryJson.patchVersion}`,
                title: libraryJson.title
              };
            }
            return { name: dir, version: 'unknown', title: 'Unknown' };
          } catch (error) {
            return { name: dir, version: 'error', title: 'Error loading library' };
          }
        });
      } catch (error) {
        console.error('Error getting library information:', error);
        librariesError = (error as Error).message;
      }
    }

    return NextResponse.json({
      status: 'success',
      directoryStatus,
      contentCount,
      h5pInitialized,
      libraries,
      librariesError,
      schemaFiles,
      serverTime: new Date().toISOString(),
      setupInstructions: [
        'Make sure the H5P directories exist and are writable',
        'Install H5P libraries by uploading .h5p files',
        'Create H5P content using the editor',
        'Restart the server after making changes to the H5P directories'
      ]
    });
  } catch (error) {
    console.error('Error getting H5P diagnostics:', error);
    return NextResponse.json(
      { error: 'Failed to get H5P diagnostics', details: (error as Error).message },
      { status: 500 }
    );
  }
}
