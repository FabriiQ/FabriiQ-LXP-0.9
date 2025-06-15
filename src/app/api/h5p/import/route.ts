import { NextRequest, NextResponse } from 'next/server';
import { h5pEditor, initializeH5P } from '@/server/h5p/h5p-server';
import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SystemStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

    // Parse form data
    const formData = await request.formData();
    const h5pFile = formData.get('h5p') as File;

    if (!h5pFile) {
      return NextResponse.json(
        { error: 'No H5P file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await h5pFile.arrayBuffer());

    // Upload and install H5P package
    console.log('Uploading H5P package, buffer size:', buffer.length);
    try {
      // Check if H5P editor is initialized
      if (!h5pEditor) {
        console.log('H5P editor not initialized, attempting to initialize');

        // Try to initialize the H5P editor
        const initialized = initializeH5P();

        if (!initialized) {
          console.log('H5P editor initialization failed, saving file for later processing');

          // Create a temporary file path
          const h5pRootPath = path.resolve(process.cwd(), 'h5p');
          const tempFilePath = path.join(h5pRootPath, 'temporary-storage', `upload-${Date.now()}.h5p`);

          // Ensure the directory exists
          if (!fs.existsSync(path.dirname(tempFilePath))) {
            fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
          }

          // Write the file
          fs.writeFileSync(tempFilePath, buffer);

          return NextResponse.json({
            error: 'H5P editor is not initialized. The file has been saved for later processing.',
            tempFilePath,
            success: false,
            needsSetup: true
          }, { status: 503 }); // Service Unavailable
        }

        console.log('H5P editor initialized successfully, proceeding with upload');
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

      return NextResponse.json({
        ...content,
        success: true
      });
    } catch (uploadError: unknown) {
      console.error('Error in uploadPackage:', uploadError);
      const errorMessage = uploadError instanceof Error
        ? uploadError.message
        : 'Unknown error';

      return NextResponse.json(
        { error: 'Error uploading H5P package: ' + errorMessage },
        { status: 500 }
      );
    }

    // This code is unreachable because we return in both try and catch blocks above
  } catch (error) {
    console.error('Error importing H5P content:', error);
    return NextResponse.json(
      { error: 'Error importing H5P content' },
      { status: 500 }
    );
  }
}
