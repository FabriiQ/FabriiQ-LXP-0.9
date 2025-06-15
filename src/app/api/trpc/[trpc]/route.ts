import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/server/api/utils/logger";

const handler = async (req: Request) => {
  try {
    // Get the session using getServerSession with authOptions
    const session = await getServerSession(authOptions);

    if (!session) {
      logger.warn("No session found in tRPC handler", {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries([...req.headers.entries()].filter(([key]) =>
          !['cookie', 'authorization'].includes(key.toLowerCase())
        ))
      });
    } else {
      logger.debug("Session found in tRPC handler", {
        userId: session.user?.id,
        userType: session.user?.userType
      });
    }

    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => createTRPCContext({
        session,
        req: req as any,
        res: new Response() as any,
      }),
      onError: ({ path, error, type, input }) => {
        // Log the error with detailed information
        logger.error(`tRPC ${type} error on ${path ?? "<no-path>"}`, {
          path,
          type,
          message: error.message,
          code: error.code,
          input: JSON.stringify(input).substring(0, 1000), // Limit input size for logging
          stack: error.stack,
          hasSession: !!session,
          userId: session?.user?.id
        });

        // Also log to console in development
        if (process.env.NODE_ENV === "development") {
          console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
          console.error(`Input: ${JSON.stringify(input).substring(0, 200)}...`);
          if (error.stack) {
            console.error(error.stack);
          }
        }
      },
    });
  } catch (error) {
    logger.error("Error in tRPC handler", { error });
    throw error;
  }
};

export { handler as GET, handler as POST };


