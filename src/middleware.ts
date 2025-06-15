import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

// Create a separate middleware for H5P files
function h5pMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle H5P static files
  if (pathname.startsWith('/h5p/')) {
    // Extract the file path from the URL
    const filePath = pathname.replace('/h5p/', '');
    const fullPath = path.join(process.cwd(), 'h5p', filePath);

    // Check if the file exists
    if (fs.existsSync(fullPath)) {
      // Determine the content type based on file extension
      const ext = path.extname(fullPath).toLowerCase();
      let contentType = 'application/octet-stream';

      switch (ext) {
        case '.js':
          contentType = 'application/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.mp4':
          contentType = 'video/mp4';
          break;
        case '.webm':
          contentType = 'video/webm';
          break;
        case '.mp3':
          contentType = 'audio/mpeg';
          break;
        case '.wav':
          contentType = 'audio/wav';
          break;
        case '.ogg':
          contentType = 'audio/ogg';
          break;
        case '.woff':
          contentType = 'font/woff';
          break;
        case '.woff2':
          contentType = 'font/woff2';
          break;
        case '.ttf':
          contentType = 'font/ttf';
          break;
        case '.html':
          contentType = 'text/html';
          break;
      }

      // Read the file and return it with the appropriate content type
      const fileContent = fs.readFileSync(fullPath);
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  }

  return null;
}

/**
 * Handle institution-based URLs
 *
 * This function:
 * 1. Extracts the institution ID from the URL path
 * 2. Redirects to the default institution if no institution ID is provided
 * 3. Adds the institution ID to the request headers for use in API routes
 */
function institutionMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip for API routes, public assets, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/h5p') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/unauthorized')
  ) {
    return null;
  }

  // Skip for system admin routes
  if (pathname.startsWith('/admin/system')) {
    return null;
  }

  // Extract the institution ID from the URL path
  const pathParts = pathname.split('/');
  const potentialInstitutionId = pathParts.length > 1 ? pathParts[1] : '';

  // If no institution ID or it's a root path, redirect to default institution
  if (!potentialInstitutionId || pathname === '/') {
    const defaultInstitution = process.env.DEFAULT_INSTITUTION || 'default';
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultInstitution}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // Add the institution ID to the request headers for use in API routes
  const response = NextResponse.next();
  response.headers.set('x-institution-id', potentialInstitutionId);

  return response;
}

// Combined middleware
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // First try the H5P middleware
    const h5pResponse = h5pMiddleware(req);
    if (h5pResponse) {
      return h5pResponse;
    }

    // Then try the institution middleware
    const institutionResponse = institutionMiddleware(req);
    if (institutionResponse) {
      return institutionResponse;
    }

    // Allow public paths
    if (['/login', '/api/auth', '/unauthorized', '/h5p-test'].some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check user type and redirect accordingly
    if (token.userType === 'CAMPUS_TEACHER' || token.userType === 'TEACHER') {
      // Allow access to teacher routes and worksheets routes
      if (pathname.startsWith('/teacher') || pathname.startsWith('/worksheets')) {
        return NextResponse.next();
      }
      // Redirect to teacher dashboard if trying to access other routes
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
    }

    // Handle student user types
    if (token.userType === 'CAMPUS_STUDENT' || token.userType === 'STUDENT') {
      // Allow access to student routes
      if (pathname.startsWith('/student')) {
        return NextResponse.next();
      }
      // Redirect to student classes page if trying to access other routes
      return NextResponse.redirect(new URL('/student/classes', req.url));
    }

    // If not a teacher trying to access teacher routes or worksheets routes, redirect to unauthorized
    if (pathname.startsWith('/teacher') || pathname.startsWith('/worksheets')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // If not a student trying to access student routes, redirect to unauthorized
    if (pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
      error: '/unauthorized'
    }
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/h5p/:path*',
  ]
};
