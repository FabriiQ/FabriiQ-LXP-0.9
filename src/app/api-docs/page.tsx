/**
 * API Documentation Endpoint
 * Provides a JSON representation of the API documentation
 */

import { NextRequest } from 'next/server';
import { getAllRouterMetadata } from '@/server/api/utils/api-docs';
import { logger } from '@/server/api/utils/logger';

/**
 * API documentation handler
 */
export async function GET(request: NextRequest) {
  try {
    // Get all router metadata
    const metadata = getAllRouterMetadata();

    // Return the metadata
    return Response.json({
      apiVersion: '1.0.0',
      title: 'Aivy LXP API Documentation',
      description: 'API documentation for the Aivy Learning Experience Platform',
      routers: metadata,
    });
  } catch (error) {
    logger.error('Error generating API documentation', { error });
    
    return Response.json({
      error: 'Internal server error',
      message: 'An error occurred while generating API documentation',
    }, { status: 500 });
  }
} 