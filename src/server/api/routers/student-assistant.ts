import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { NAVIGATION_KEYWORDS, SUBJECT_KEYWORDS } from '@/features/student-assistant/constants';

/**
 * Student Assistant API Router
 *
 * Provides procedures for interacting with the student assistant
 */
export const studentAssistantRouter = createTRPCRouter({
  /**
   * Get a response from the student assistant
   */
  getAssistantResponse: protectedProcedure
    .input(z.object({
      message: z.string(),
      classId: z.string().optional(),
      activityId: z.string().optional(),
      context: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a student
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get student context
        const student = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            user: true,
            enrollments: {
              include: {
                class: {
                  include: {
                    courseCampus: {
                      include: {
                        course: {
                          include: {
                            subjects: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Get class context if classId is provided
        let classContext: any = null;
        if (input.classId) {
          classContext = await ctx.prisma.class.findUnique({
            where: { id: input.classId },
            include: {
              courseCampus: {
                include: {
                  course: {
                    include: {
                      subjects: true
                    }
                  }
                }
              }
            }
          });
        }

        // Get activity context if activityId is provided
        let activityContext: any = null;
        if (input.activityId) {
          activityContext = await ctx.prisma.activity.findUnique({
            where: { id: input.activityId },
            include: {
              subject: true,
              topic: true
            }
          });
        }

        // Determine the type of question (navigation, subject-specific, or general)
        const questionType = determineQuestionType(
          input.message,
          classContext?.courseCampus?.course?.subjects[0]?.name
        );

        // Parse context if provided
        let studentContext: any = {};
        if (input.context) {
          try {
            studentContext = JSON.parse(input.context);
          } catch (error) {
            console.error('Error parsing context:', error);
          }
        }

        // Generate the appropriate prompt based on question type
        const prompt = generatePrompt(
          input.message,
          questionType,
          {
            student: {
              name: student.user?.name || 'Student',
              gradeLevel: (student as any).gradeLevel || 'K-12',
              learningPreferences: studentContext.student?.learningPreferences || [],
            },
            class: classContext ? {
              name: classContext.name,
              subject: classContext.courseCampus?.course?.subjects[0] ? {
                name: classContext.courseCampus.course.subjects[0].name,
              } : undefined,
            } : undefined,
            activity: activityContext ? {
              title: activityContext.title,
              type: activityContext.type,
              subject: activityContext.subject ? {
                name: activityContext.subject.name,
              } : undefined,
            } : undefined,
            discussedConcepts: studentContext.discussedConcepts || [],
            confusionAreas: studentContext.confusionAreas || [],
            learningGoals: studentContext.learningGoals || [],
          }
        );

        // Call AI service with context
        const response = await callAIService(prompt);

        return { response };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get assistant response: ${(error as Error).message}`,
        });
      }
    }),
});

/**
 * Determine the type of question
 */
function determineQuestionType(
  message: string,
  currentSubject?: string
): 'navigation' | 'subject' | 'general' {
  const lowerMessage = message.toLowerCase();

  // Check if it's a navigation question
  if (NAVIGATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'navigation';
  }

  // Check if it's related to the current subject
  if (currentSubject) {
    const lowerSubject = currentSubject.toLowerCase();

    // If the message mentions the current subject
    if (lowerMessage.includes(lowerSubject)) {
      return 'subject';
    }

    // Check if the message contains keywords related to the current subject
    for (const [subjectType, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword)) &&
          lowerSubject.includes(subjectType)) {
        return 'subject';
      }
    }
  }

  // Default to general
  return 'general';
}

/**
 * Generate a prompt based on question type and context
 */
function generatePrompt(
  message: string,
  questionType: 'navigation' | 'subject' | 'general',
  context: {
    student: {
      name: string;
      gradeLevel: string;
      learningPreferences?: string[];
    };
    class?: {
      name: string;
      subject?: {
        name: string;
      };
    };
    activity?: {
      title: string;
      type: string;
      subject?: {
        name: string;
      };
    };
    discussedConcepts?: Array<{
      name: string;
      lastDiscussed: Date;
      mastery?: 'low' | 'medium' | 'high';
    }>;
    confusionAreas?: Array<{
      topic: string;
      level: 'low' | 'medium' | 'high';
      resolved?: boolean;
    }>;
    learningGoals?: Array<{
      description: string;
      progress?: number;
    }>;
  }
): string {
  const { student, class: classContext, activity, discussedConcepts, confusionAreas, learningGoals } = context;

  // Base prompt for all question types
  let basePrompt = `
    You are an educational assistant helping ${student.name}, who is at grade level ${student.gradeLevel}.

    Your goal is to help the student learn effectively. For direct questions, provide clear and accurate answers,
    but also ask about their prior knowledge and offer additional learning points they might be interested in.

    Student question: ${message}

    Remember:
    1. For direct questions, provide a clear and accurate answer first
    2. After answering, ask about the student's prior knowledge on the topic
    3. Offer additional learning points or deeper insights they might want to explore
    4. Break complex topics into smaller, manageable concepts
    5. Provide age-appropriate explanations for grade ${student.gradeLevel}
    6. Use encouraging and supportive language
    7. Foster a growth mindset by emphasizing effort and strategy over innate ability
    8. Balance providing information with encouraging critical thinking
  `;

  // Add learning preferences if available
  if (student.learningPreferences && student.learningPreferences.length > 0) {
    basePrompt += `

    The student has shown a preference for ${student.learningPreferences.join(', ')} learning styles.
    Adapt your explanation accordingly.
    `;
  }

  // Add information about discussed concepts
  if (discussedConcepts && discussedConcepts.length > 0) {
    const recentConcepts = discussedConcepts
      .slice(0, 3)
      .map(c => c.name)
      .join(', ');

    basePrompt += `

    Recently discussed concepts: ${recentConcepts}. You can reference these if relevant.
    `;
  }

  // Add information about confusion areas
  if (confusionAreas && confusionAreas.length > 0) {
    const unresolvedConfusion = confusionAreas.find(area => !area.resolved);

    if (unresolvedConfusion) {
      basePrompt += `

      The student has previously shown confusion about "${unresolvedConfusion.topic}".
      Be especially clear when discussing related concepts.
      `;
    }
  }

  // Add information about learning goals
  if (learningGoals && learningGoals.length > 0) {
    const currentGoal = learningGoals[0];

    basePrompt += `

    The student is working toward this learning goal: "${currentGoal.description}".
    Try to relate your guidance to this goal when appropriate.
    `;
  }

  // Add context-specific information to the prompt
  if (questionType === 'navigation') {
    return `
      ${basePrompt}

      The student is asking about navigating the learning platform.

      Provide clear, direct instructions to help the student navigate the platform or find the feature they're looking for.
      Be specific and straightforward with step-by-step guidance when possible.

      Common platform sections include:
      - Dashboard: Overview of courses, upcoming assignments, and progress
      - Courses: List of enrolled courses
      - Classes: Specific class sections with activities and resources
      - Activities: Assignments, quizzes, and learning materials
      - Grades: View assessment results and feedback
      - Calendar: Schedule of classes and assignment due dates
      - Profile: Personal information and settings
    `;
  } else if (questionType === 'subject' && (classContext?.subject || activity?.subject)) {
    const subjectName = classContext?.subject?.name || activity?.subject?.name || 'the subject';

    return `
      ${basePrompt}

      The student is currently studying ${subjectName} in ${classContext?.name || 'their class'}.
      ${activity ? `They are working on an activity titled "${activity.title}" of type "${activity.type}".` : ''}

      Provide subject-specific information about ${subjectName} with clear, accurate answers.
      Use appropriate terminology and examples for this subject area.

      After providing the answer, ask about their prior knowledge of ${subjectName} concepts,
      and offer additional learning points they might find interesting to explore further.
    `;
  } else {
    // General educational guidance
    return basePrompt;
  }
}

/**
 * Call the AI service with the prompt using Langchain and Google Generative AI
 */
async function callAIService(prompt: string): Promise<string> {
  try {
    // Try to get the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('API key missing: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables');
      throw new Error('Google Generative AI API key not found in environment variables');
    }

    console.log('Attempting to call Google Generative AI with prompt length:', prompt.length);

    // Create a Langchain model with Google Generative AI
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: "gemini-2.0-flash", // Using the latest model
      temperature: 0.7,
      maxOutputTokens: 1000,
      // Note: timeout is handled at the HTTP request level instead
    });

    // Create a prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
      {prompt}

      Respond in a helpful, educational manner that guides the student to discover the answer.
    `);

    // Create a chain
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    // Run the chain with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      try {
        console.log(`AI service attempt ${attempts + 1} of ${maxAttempts}`);
        const response = await chain.invoke({
          prompt: prompt,
        });
        console.log('AI service response received successfully');
        return response;
      } catch (retryError) {
        lastError = retryError as Error;
        console.error(`AI service attempt ${attempts + 1} failed:`, retryError);
        attempts++;

        // If we have more attempts, wait before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
        }
      }
    }

    // If we've exhausted all attempts, use a fallback response
    if (lastError) {
      console.error('All AI service attempts failed:', lastError);
      throw new Error(`Failed to generate AI response after ${maxAttempts} attempts: ${lastError.message}`);
    }

    // Fallback response if all attempts fail but no error is thrown
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or ask a different question.";
  } catch (error) {
    console.error('Error calling AI service:', error);

    // Provide a more detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      apiKeyExists: !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
      apiKeyLength: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').length,
    });

    throw new Error(`Failed to generate AI response: ${errorMessage}`);
  }
}
