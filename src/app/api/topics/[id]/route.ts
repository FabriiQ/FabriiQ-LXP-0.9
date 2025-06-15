import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/server/db';
import { SystemStatus } from '@prisma/client';

/**
 * API route to get topic details by ID
 * This is used by the content generator to get detailed topic information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const topicId = params.id;

    // Get topic details
    const topic = await prisma.subjectTopic.findUnique({
      where: {
        id: topicId,
        status: SystemStatus.ACTIVE
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        parentTopic: {
          select: {
            id: true,
            title: true,
            code: true,
          }
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: topic.id,
      code: topic.code,
      title: topic.title,
      description: topic.description || '',
      context: topic.context || '',
      learningOutcomes: topic.learningOutcomes || '',
      nodeType: topic.nodeType,
      competencyLevel: topic.competencyLevel,
      keywords: topic.keywords,
      subject: {
        id: topic.subject.id,
        name: topic.subject.name,
        code: topic.subject.code
      },
      parentTopic: topic.parentTopic ? {
        id: topic.parentTopic.id,
        title: topic.parentTopic.title,
        code: topic.parentTopic.code
      } : null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching topic details:', error);
    return NextResponse.json(
      { error: 'Error fetching topic details' },
      { status: 500 }
    );
  }
}
