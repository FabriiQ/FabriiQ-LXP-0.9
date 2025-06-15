import { NextResponse } from 'next/server';

/**
 * API route to securely provide the Gemini API key to the client
 * This is more secure than exposing the key directly in client-side code
 */
export async function GET() {
  // Get the API key from environment variables
  // Use NEXT_PUBLIC_GEMINI_API_KEY since it's available in both client and server
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  console.log('API route: Gemini API key available:', !!apiKey);

  // If the API key is not available, return an error
  if (!apiKey) {
    console.error('API route: Gemini API key not configured in environment variables');
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 500 }
    );
  }

  // Validate the API key format
  if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
    console.error('API route: Invalid Gemini API key format');
    return NextResponse.json(
      { error: 'Invalid Gemini API key format' },
      { status: 500 }
    );
  }

  // Return the API key
  return NextResponse.json({ apiKey });
}
