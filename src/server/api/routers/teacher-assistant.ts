/**
 * Teacher Assistant Router
 * Handles API routes for the Teacher Assistant feature
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define input schemas
const assistantMessageSchema = z.object({
  message: z.string(),
  classId: z.string().optional(),
  courseId: z.string().optional(),
  context: z.string().optional(),
});

const teacherPreferenceSchema = z.object({
  category: z.string(),
  key: z.string(),
  value: z.any(),
  metadata: z.record(z.any()).optional(),
});

const searchQuerySchema = z.object({
  query: z.string(),
  filters: z.object({
    contentType: z.string().optional(),
    subject: z.string().optional(),
    gradeLevel: z.string().optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    limit: z.number().optional(),
  }).optional(),
});

/**
 * Call the AI service with the prompt using Google Generative AI
 */
async function callAIService(prompt: string): Promise<string> {
  try {
    // Try to get the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('API key missing: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables');
      throw new Error('Google Generative AI API key not found in environment variables');
    }

    console.log('Calling Google Generative AI with prompt length:', prompt.length);

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      }
    });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error(`Failed to generate AI response: ${(error as Error).message}`);
  }
}

export const teacherAssistantRouter = createTRPCRouter({
  /**
   * Get a response from the teacher assistant
   */
  getAssistantResponse: protectedProcedure
    .input(assistantMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can use the Teacher Assistant",
          });
        }

        // Get teacher information for context
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            subjectQualifications: {
              include: { subject: true }
            }
          }
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get class information if classId is provided
        let classInfo = null;
        if (input.classId) {
          classInfo = await ctx.prisma.class.findUnique({
            where: { id: input.classId },
            include: {
              subject: true,
              course: true,
            }
          });
        }

        // Parse context if provided
        let contextData = {};
        if (input.context) {
          try {
            contextData = JSON.parse(input.context);
          } catch (e) {
            console.error('Error parsing context:', e);
          }
        }

        // Create enhanced prompt with teacher and class context
        const enhancedPrompt = `
          You are a Teacher Assistant AI helping a teacher named ${teacher.user?.name || 'the teacher'}.
          
          ${teacher.subjectQualifications?.length > 0 
            ? `They teach ${teacher.subjectQualifications.map(sq => sq.subject.name).join(', ')}.` 
            : ''}
          
          ${classInfo 
            ? `They are currently working with their ${classInfo.subject?.name || ''} class "${classInfo.name}".` 
            : ''}
          
          ${Object.keys(contextData).length > 0 
            ? `Additional context: ${JSON.stringify(contextData)}` 
            : ''}
          
          Teacher's message: ${input.message}
          
          Respond in a helpful, professional manner that addresses their specific needs as a teacher.
          Provide practical, actionable advice and resources when appropriate.
        `;

        // Call AI service
        const response = await callAIService(enhancedPrompt);

        // Log the interaction for analytics
        await ctx.prisma.teacherAssistantInteraction.create({
          data: {
            teacherId: teacher.id,
            message: input.message,
            response: response,
            classId: input.classId,
            courseId: input.courseId,
            metadata: {
              contextProvided: !!input.context,
              promptLength: enhancedPrompt.length,
              responseLength: response.length
            }
          }
        });

        return { response };
      } catch (error) {
        console.error('Error in getAssistantResponse:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get assistant response: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Save teacher preference
   */
  saveTeacherPreference: protectedProcedure
    .input(teacherPreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can save preferences",
          });
        }

        // Get teacher profile
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { userId: ctx.session.user.id }
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Upsert the preference
        const preference = await ctx.prisma.teacherPreference.upsert({
          where: {
            userId_category_key: {
              userId: ctx.session.user.id,
              category: input.category,
              key: input.key
            }
          },
          update: {
            value: input.value,
            metadata: input.metadata || {},
            updatedAt: new Date()
          },
          create: {
            userId: ctx.session.user.id,
            category: input.category,
            key: input.key,
            value: input.value,
            metadata: input.metadata || {}
          }
        });

        return preference;
      } catch (error) {
        console.error('Error in saveTeacherPreference:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save teacher preference: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Get teacher preferences
   */
  getTeacherPreferences: protectedProcedure
    .input(z.object({
      category: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can access preferences",
          });
        }

        // Build query
        const query: any = {
          where: {
            userId: ctx.session.user.id,
            status: SystemStatus.ACTIVE
          }
        };

        // Add category filter if provided
        if (input.category) {
          query.where.category = input.category;
        }

        // Get preferences
        const preferences = await ctx.prisma.teacherPreference.findMany(query);

        return preferences;
      } catch (error) {
        console.error('Error in getTeacherPreferences:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher preferences: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Search for educational resources
   */
  search: protectedProcedure
    .input(searchQuerySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can use the search feature",
          });
        }

        // Create search prompt
        const searchPrompt = `
          I need to find educational resources for teachers about: ${input.query}
          
          ${input.filters?.contentType ? `Content type: ${input.filters.contentType}` : ''}
          ${input.filters?.subject ? `Subject: ${input.filters.subject}` : ''}
          ${input.filters?.gradeLevel ? `Grade level: ${input.filters.gradeLevel}` : ''}
          
          Please provide a list of 5 high-quality educational resources with the following information for each:
          1. Title
          2. Brief description (1-2 sentences)
          3. Source/website
          4. URL (make this up if needed)
          5. Relevance score (0-1)
          
          Format your response as a JSON array of objects with these fields: title, snippet, url, source, relevanceScore
        `;

        // Call AI service
        const response = await callAIService(searchPrompt);
        
        // Parse the response as JSON
        let results = [];
        try {
          // Extract JSON from the response (it might be wrapped in markdown code blocks)
          const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                           response.match(/```\n([\s\S]*?)\n```/) ||
                           [null, response];
          
          const jsonString = jsonMatch[1] || response;
          results = JSON.parse(jsonString);
          
          // Ensure each result has an id
          results = results.map((result: any) => ({
            ...result,
            id: result.id || crypto.randomUUID()
          }));
        } catch (e) {
          console.error('Error parsing search results:', e);
          throw new Error('Failed to parse search results');
        }

        // Log the search for analytics
        await ctx.prisma.teacherAssistantSearch.create({
          data: {
            teacherId: ctx.session.user.id,
            query: input.query,
            filters: input.filters || {},
            resultsCount: results.length
          }
        });

        return results;
      } catch (error) {
        console.error('Error in search:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search for resources: ${(error as Error).message}`,
        });
      }
    }),
});
