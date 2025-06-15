/**
 * tRPC Configuration
 * Sets up the base tRPC router with context and middleware
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { ZodError } from "zod";
import { prisma } from "@/server/db";
import { errorHandlingMiddleware } from "./middleware/error-handling.middleware";
import { performanceMiddleware } from "./middleware/performance.middleware";
import { logger } from "./utils/logger";
import { trpcConfig } from "@/utils/trpc-config";
import { createContext } from './context';
import { AcademicCycleService } from "./services/academic-cycle.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";
import { UserType } from "@prisma/client";
import superjson from "superjson";

/**
 * Context configuration
 */
type CreateContextOptions = {
  req?: Request;
  res?: Response;
  session: Session | null;
};

/**
 * Creates the inner context without session validation
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    academicCycleService: new AcademicCycleService({ prisma }),
    res: opts.res,
  };
};

/**
 * Gets the user session from the request
 * This is now replaced by the session-cache utility for server components
 */
export const getUserSession = async (req?: Request): Promise<Session | null> => {
  try {
    // Use Auth.js getServerSession to get the session
    // No need to check for req parameter as getServerSession can work without it
    const session = await getServerSession(authOptions);

    // IMPORTANT: Access user properties via session.user.id, not session.userId
    // The Session type is defined in src/types/next-auth.d.ts
    return session;
  } catch (error) {
    logger.error('Error getting user session', { error });
    return null;
  }
};

/**
 * Creates the tRPC context for API routes
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  const { req, res, session } = opts;

  // Log session information for debugging
  if (!session) {
    logger.warn("No session provided to createTRPCContext", {
      hasReq: !!req,
      hasRes: !!res,
      url: req?.url
    });
  } else {
    logger.debug("Session provided to createTRPCContext", {
      userId: session.user?.id,
      userType: session.user?.userType
    });
  }

  // Create the context with the session
  return createInnerTRPCContext({
    session,
    res,
  });
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Log the error with detailed information
    logger.error('tRPC error', {
      code: error.code,
      message: error.message,
      path: shape.data?.path,
      input: shape.data?.inputValidation ? 'Invalid input' : shape.data?.httpStatus ? 'HTTP error' : 'Unknown error',
      stack: error.stack,
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        // Add additional error information for debugging
        errorCode: error.code,
        errorMessage: error.message,
        errorPath: shape.data?.path,
      },
    };
  },
});

/**
 * Create a router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure
  .use(errorHandlingMiddleware)
  .use(performanceMiddleware);

/**
 * Protected procedure - authentication required
 */
export const protectedProcedure = t.procedure
  .use(errorHandlingMiddleware)
  .use(performanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    return next({
      ctx: {
        ...ctx,
        // Infers the session as non-null
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Role-based protected procedure - authentication and role check required
 */
export const roleProtectedProcedure = (allowedRoles: UserType[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    const userType = ctx.session.user.userType;

    if (!allowedRoles.includes(userType)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `User with role ${userType} is not allowed to access this resource`,
      });
    }

    return next({
      ctx,
    });
  });

/**
 * Export the context type
 */
export type Context = ReturnType<typeof createInnerTRPCContext>;