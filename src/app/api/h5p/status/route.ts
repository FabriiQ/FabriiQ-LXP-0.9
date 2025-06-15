import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor, h5pPlayer, initializeH5P } from '@/server/h5p/h5p-server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to check H5P system status
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if H5P editor and player are initialized
    const status = {
      editor: h5pEditor !== null,
      player: h5pPlayer !== null,
      schemas: {} as Record<string, boolean>,
      directories: {} as Record<string, boolean>
    };

    // Check if schemas directory exists
    const h5pRootPath = path.resolve(process.cwd(), 'h5p');
    const schemasPath = path.join(h5pRootPath, 'schemas');
    
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

    // Test schema loading if editor exists
    let schemaLoadingTest: {
      attempted: boolean;
      success: boolean;
      error: string | null;
    } | null = null;

    if (h5pEditor) {
      try {
        // Try to initialize if not already initialized
        if (!status.editor && !status.player) {
          initializeH5P();
        }
        
        schemaLoadingTest = {
          attempted: true,
          success: false,
          error: null
        };
        
        // Attempt to manually load the save-metadata schema
        if (h5pEditor) {
          await (h5pEditor as any).loadSchema('save-metadata');
          schemaLoadingTest.success = true;
        }
      } catch (error) {
        if (schemaLoadingTest) {
          schemaLoadingTest.error = (error as Error).message;
        }
      }
    }
    
    // Return the status
    return NextResponse.json({
      success: true,
      status,
      schemaLoadingTest,
      message: 'H5P status check completed'
    });
  } catch (error) {
    console.error('Error in H5P status endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error checking H5P status', 
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
