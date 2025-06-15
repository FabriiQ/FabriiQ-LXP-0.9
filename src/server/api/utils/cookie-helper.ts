/**
 * Cookie Helper Utility
 * Provides functions for handling cookies in Next.js
 */

import { cookies } from 'next/headers';
import { logger } from './logger';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
}

/**
 * Sets a cookie using Next.js cookies API
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      logger.warn('setCookie should only be called server-side');
      return;
    }

    // Build cookie string for compatibility with both API routes and App Router
    const cookieOptions = {
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? (process.env.NODE_ENV === 'production'),
      path: options.path ?? '/',
      maxAge: options.maxAge,
      sameSite: options.sameSite ?? 'lax',
      domain: options.domain
    };

    try {
      // Try App Router cookies() first
      const cookieStore = await cookies();
      cookieStore.set(name, value, cookieOptions);
    } catch (error) {
      // If that fails, we might be in an API route
      // Return the cookie string for API routes to use
      const cookieString = `${name}=${value}; ${Object.entries(cookieOptions)
        .map(([key, value]) => {
          if (value === undefined) return '';
          if (typeof value === 'boolean') return value ? key : '';
          return `${key}=${value}`;
        })
        .filter(Boolean)
        .join('; ')}`;
      
      // If we have a response object in the current context, set the cookie
      const currentContext = global as any;
      if (currentContext.res?.setHeader) {
        currentContext.res.setHeader('Set-Cookie', cookieString);
      }
      
      return;
    }
    
    logger.debug('Cookie set successfully', { name });
  } catch (error) {
    logger.error('Error setting cookie', { error, name });
    throw error;
  }
}

/**
 * Gets a cookie value
 * @param name - Cookie name
 * @returns Cookie value if found, undefined otherwise
 */
export async function getCookie(name: string): Promise<string | undefined> {
  try {
    if (typeof window !== 'undefined') {
      logger.warn('getCookie should only be called server-side');
      return undefined;
    }

    try {
      // Try App Router cookies() first
      const cookieStore = await cookies();
      const cookie = cookieStore.get(name);
      return cookie?.value;
    } catch (error) {
      // If that fails, we might be in an API route
      const currentContext = global as any;
      if (currentContext.req?.cookies) {
        return currentContext.req.cookies[name];
      }
      return undefined;
    }
  } catch (error) {
    logger.error('Error getting cookie', { error, name });
    return undefined;
  }
}

/**
 * Deletes a cookie
 * @param name - Cookie name
 */
export async function deleteCookie(name: string): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      logger.warn('deleteCookie should only be called server-side');
      return;
    }

    try {
      // Try App Router cookies() first
      const cookieStore = await cookies();
      cookieStore.delete(name);
    } catch (error) {
      // If that fails, we might be in an API route
      // Set an expired cookie
      await setCookie(name, '', {
        maxAge: 0,
        path: '/'
      });
    }
    
    logger.debug('Cookie deleted successfully', { name });
  } catch (error) {
    logger.error('Error deleting cookie', { error, name });
    throw error;
  }
} 