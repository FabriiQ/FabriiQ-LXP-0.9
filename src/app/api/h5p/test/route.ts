import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { h5pEditor, h5pPlayer, ensureDirectories, ensureSchemaFiles } from '@/server/h5p/h5p-server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to test H5P functionality
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

    // Only allow system admins to test H5P
    const userType = session.user.userType;
    if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'].includes(userType as string)) {
      return NextResponse.json(
        { error: 'Only administrators can test the H5P system' },
        { status: 403 }
      );
    }

    // Define storage paths
    const h5pRootPath = path.resolve(process.cwd(), 'h5p');
    const schemasPath = path.join(h5pRootPath, 'schemas');

    // Ensure directories and schema files exist
    ensureDirectories();
    ensureSchemaFiles();

    // Check if schema files exist
    const schemaFiles = fs.existsSync(schemasPath)
      ? fs.readdirSync(schemasPath).filter(file => file.endsWith('.json'))
      : [];

    // Check if H5P is initialized
    const h5pInitialized = !!h5pEditor && !!h5pPlayer;

    // Test schema loading
    let schemaLoadingTest: {
      success: boolean;
      error: string | null;
      schema?: {
        title: string;
        type: string;
        requiredProperties: string[];
      } | null;
    } = { success: false, error: null };

    if (h5pInitialized && h5pEditor) {
      try {
        // Try to load the save-metadata schema
        const schema = await (h5pEditor as any).loadSchema('save-metadata');
        schemaLoadingTest = {
          success: true,
          error: null,
          schema: schema ? {
            title: schema.title,
            type: schema.type,
            requiredProperties: schema.required || []
          } : null
        };
      } catch (error) {
        schemaLoadingTest = {
          success: false,
          error: (error as Error).message
        };
      }
    }

    // Check if detailed status is requested
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    if (detailed) {
      // Detailed status check
      const status = {
        editor: h5pEditor !== null,
        player: h5pPlayer !== null,
        schemas: {} as Record<string, boolean>,
        directories: {} as Record<string, boolean>
      };

      // Check for critical schema files
      const criticalSchemas = [
        'save-metadata.json',
        'content-type-cache.json',
        'content.json',
        'library-schema.json',
        'h5p-schema.json',
        'library-name-schema.json'
      ];

      for (const schema of criticalSchemas) {
        const schemaPath = path.join(schemasPath, schema);
        status.schemas[schema] = fs.existsSync(schemaPath);
      }

      // Check if directories exist
      const directories = [
        'content',
        'libraries',
        'temporary-storage',
        'schemas'
      ];

      for (const dir of directories) {
        const dirPath = path.join(h5pRootPath, dir);
        status.directories[dir] = fs.existsSync(dirPath);
      }

      // Return the detailed status
      return NextResponse.json({
        success: true,
        status,
        message: 'H5P status check completed'
      });
    } else {
      // Basic status check
      return NextResponse.json({
        status: 'success',
        h5pInitialized,
        schemaFiles,
        schemaLoadingTest,
        serverTime: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error testing H5P:', error);
    return NextResponse.json(
      { error: 'Failed to test H5P system', details: (error as Error).message },
      { status: 500 }
    );
  }
}
