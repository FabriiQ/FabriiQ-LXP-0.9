/**
 * LangGraph API Route
 * Handles communication with the LangGraph server
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@langchain/langgraph-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

export async function POST(req: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { namespace, key, value } = await req.json();
    
    const lgClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL || 'http://localhost:54367',
    });

    // If value is provided, it's a PUT operation
    if (value !== undefined) {
      await lgClient.store.put(namespace, key, value);
      return NextResponse.json({ success: true });
    } 
    // Otherwise it's a GET operation
    else {
      const result = await lgClient.store.get(namespace, key);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('LangGraph API error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with LangGraph' },
      { status: 500 }
    );
  }
}
