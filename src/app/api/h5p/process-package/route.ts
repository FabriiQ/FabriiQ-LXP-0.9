import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/server/db';
import { SystemStatus } from '@prisma/client';
import fs from 'fs';

import { h5pEditor, initializeH5P } from '@/server/h5p/h5p-server';

/**
 * API endpoint to process a previously uploaded H5P package
 * This is used when the H5P editor was not initialized during the initial upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);

    // Check if H5P editor is initialized
    if (!h5pEditor) {
      // Try to initialize the H5P editor
      const initialized = initializeH5P();

      if (!initialized || !h5pEditor) {
        return NextResponse.json(
          { error: 'H5P editor is not initialized and could not be initialized automatically' },
          { status: 503 }
        );
      }
    }

    // Create a user object for H5P
    const h5pUser = {
      id: userId,
      name: 'User',
      email: 'user@example.com', // Required by IUser interface
      type: 'local',
      canInstallRecommended: true,
      canUpdateAndInstallLibraries: true
    };

    try {
      // Double-check that h5pEditor is initialized
      if (!h5pEditor) {
        return NextResponse.json(
          { error: 'H5P editor is not initialized' },
          { status: 503 }
        );
      }

      // Process the H5P package
      const result = await h5pEditor.uploadPackage(
        buffer,
        h5pUser
      );
      console.log('Upload result:', result);

      // Generate a unique content ID
      const contentId = `h5p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Get the library name from the metadata
      const library = result.metadata?.mainLibrary || 'H5P.Accordion 1.0';

      // Save content to database
      const content = await prisma.h5PContent.create({
        data: {
          contentId: contentId.toString(), // Convert to string if needed
          title: result.metadata?.title || 'Untitled H5P Content',
          library: library,
          params: result.parameters || {},
          metadata: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : {},
          status: SystemStatus.ACTIVE,
          createdById: userId,
        }
      });

      // Delete the temporary file
      fs.unlinkSync(filePath);

      return NextResponse.json({
        ...content,
        success: true
      });
    } catch (uploadError: unknown) {
      console.error('Error processing H5P package:', uploadError);
      const errorMessage = uploadError instanceof Error
        ? uploadError.message
        : 'Unknown error';

      return NextResponse.json(
        { error: 'Error processing H5P package: ' + errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing H5P package:', error);
    return NextResponse.json(
      { error: 'Error processing H5P package' },
      { status: 500 }
    );
  }
}
