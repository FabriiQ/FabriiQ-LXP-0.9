import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LearningActivityType, ActivityPurpose } from '@/server/api/constants';

/**
 * API route to get activity type mappings
 * This is used by the content generator to map activity types to their components
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Define the mapping between LearningActivityType and activity type IDs
    const activityTypeMapping: Record<string, string> = {
      [LearningActivityType.SELF_STUDY]: 'multiple-choice',
      [LearningActivityType.INTERACTIVE]: 'multiple-choice',
      [LearningActivityType.QUIZ]: 'multiple-choice',
      [LearningActivityType.ASSESSMENT]: 'multiple-choice',
      [LearningActivityType.READING]: 'reading',
      [LearningActivityType.VIDEO]: 'video',
      [LearningActivityType.DISCUSSION]: 'reading',
      [LearningActivityType.ASSIGNMENT]: 'reading',
      [LearningActivityType.PROJECT]: 'reading',
      [LearningActivityType.GAME]: 'multiple-choice',
      [LearningActivityType.SIMULATION]: 'multiple-choice',
      [LearningActivityType.PRESENTATION]: 'reading',
      [LearningActivityType.WORKSHEET]: 'reading',
      [LearningActivityType.EXPERIMENT]: 'reading',
      [LearningActivityType.FIELD_TRIP]: 'reading',
      [LearningActivityType.OTHER]: 'reading'
    };

    // Define the mapping between ActivityPurpose and activity categories
    const purposeMapping: Record<string, string> = {
      [ActivityPurpose.LEARNING]: 'learning',
      [ActivityPurpose.PRACTICE]: 'practice',
      [ActivityPurpose.ASSESSMENT]: 'assessment'
    };

    return NextResponse.json({
      activityTypeMapping,
      purposeMapping
    });
  } catch (error) {
    console.error('Error fetching activity type mappings:', error);
    return NextResponse.json(
      { error: 'Error fetching activity type mappings' },
      { status: 500 }
    );
  }
}
