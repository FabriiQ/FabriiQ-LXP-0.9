import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/db";
import { compare } from "bcryptjs";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { ensureUserPrimaryCampus } from "@/server/api/utils/user-helpers";

/**
 * NextAuth configuration
 *
 * This configuration handles authentication and session management for the application.
 * It includes custom callbacks for JWT, session, and redirect handling.
 *
 * IMPORTANT: The redirect callback is critical for ensuring users are directed to the
 * appropriate dashboard based on their role without any intermediate redirects.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          logger.warn("[AUTH] Missing credentials", {});
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            password: true,
            userType: true,
            status: true
          }
        });

        if (!user || user.status !== "ACTIVE") {
          logger.warn("[AUTH] User not found or inactive", { username: credentials.username });
          return null;
        }

        // In development, skip password check for mock users
        const isValidPassword = process.env.NODE_ENV === "development"
          ? true
          : await compare(credentials.password, user.password || "");

        if (!isValidPassword) {
          logger.warn("[AUTH] Invalid password for user", { username: credentials.username });
          return null;
        }

        logger.debug("[AUTH] User authenticated successfully", {
          userId: user.id,
          username: user.username,
          userType: user.userType
        });

        // Update last login time in background
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(err => logger.error("Failed to update last login time:", { error: String(err) }));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          userType: user.userType
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      // Add user type to JWT token
      if (user) {
        token.userType = user.userType;
        token.username = user.username;
        token.primaryCampusId = user.primaryCampusId;
        logger.debug("[AUTH] JWT token created", { userId: user.id, userType: user.userType });

        // If this is a new sign-in, ensure the user has a primary campus ID
        try {
          // For CAMPUS_ADMIN and COORDINATOR users, ensure they have a primary campus
          if (user.userType === "CAMPUS_ADMIN" || user.userType === "COORDINATOR" || user.userType === "CAMPUS_COORDINATOR") {
            const primaryCampusId = await ensureUserPrimaryCampus(user.id);

            if (primaryCampusId) {
              token.primaryCampusId = primaryCampusId;
              logger.debug("[AUTH] Set primary campus ID in JWT", {
                userId: user.id,
                primaryCampusId
              });
            }
          }
        } catch (error) {
          logger.error("[AUTH] Error ensuring primary campus ID for JWT", { error, userId: user.id });
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Add user type to session
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.userType = token.userType as UserType;
        session.user.username = token.username as string;

        // Add primaryCampusId from token if available
        if (token.primaryCampusId) {
          (session.user as any).primaryCampusId = token.primaryCampusId;
        }

        logger.debug("[AUTH] Session created", {
          userId: session.user.id,
          userType: session.user.userType,
          hasPrimaryCampus: !!token.primaryCampusId
        });

        // Add additional session data if needed
        try {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
              primaryCampusId: true,
              status: true
            }
          });

          if (user) {
            // Add primaryCampusId to session user if not already set from token
            if (!token.primaryCampusId && user.primaryCampusId) {
              (session.user as any).primaryCampusId = user.primaryCampusId;
            }

            // If user is inactive, log warning but don't invalidate session here
            // Session invalidation should be handled in middleware or API routes
            if (user.status !== "ACTIVE") {
              logger.warn("[AUTH] Inactive user accessed session", {
                userId: session.user.id,
                userType: session.user.userType,
                status: user.status
              });
            }
          }
        } catch (error) {
          logger.error("[AUTH] Error fetching additional session data", { error });
        }
      }
      return session;
    },
    /**
     * Custom redirect callback for NextAuth
     *
     * This function handles redirects after authentication. It's designed to:
     * 1. Directly use role-specific URLs without intermediate redirects
     * 2. Handle the /dashboard URL by redirecting to the appropriate role-specific dashboard
     * 3. Support a special bypassDashboard flag to avoid intermediate redirects
     *
     * @param params The redirect parameters from NextAuth
     * @returns The URL to redirect to
     */
    async redirect(params: { url: string; baseUrl: string }) {
      const { url, baseUrl } = params;

      // If the URL is already absolute, return it as is
      if (url.startsWith("http")) return url;

      // Log the redirect attempt for debugging
      logger.debug("[AUTH] Redirect callback called", { url, baseUrl });

      // If the URL is a relative path, process it
      if (url.startsWith("/")) {
        // DIRECT ROLE URL CHECK: Check if this is already a role-specific URL
        const isRoleSpecificUrl =
          url.startsWith("/teacher/") ||
          url.startsWith("/student/") ||
          url.startsWith("/admin/") ||
          url.startsWith("/parent/");

        // BYPASS FLAG CHECK: Check if the URL has the bypass flag
        const hasBypassFlag = url.includes("bypassDashboard=true");

        logger.debug("[AUTH] URL analysis", { url, isRoleSpecificUrl, hasBypassFlag });

        // CASE 1: If it's a role-specific URL or has the bypass flag, use it directly
        if (isRoleSpecificUrl || hasBypassFlag) {
          // Clean up the URL by removing the bypass flag if present
          let cleanUrl = url;
          if (hasBypassFlag) {
            // Remove the bypass flag
            cleanUrl = url.replace(/[?&]bypassDashboard=true/, '');

            // Fix the URL if we removed a query parameter
            if (cleanUrl.includes('?') && cleanUrl.includes('&') && !cleanUrl.includes('?&')) {
              cleanUrl = cleanUrl.replace('&', '?');
            }

            // If we removed the only query parameter, remove the trailing question mark
            if (cleanUrl.endsWith('?')) {
              cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
            }

            logger.debug("[AUTH] Cleaned URL by removing bypass flag", {
              originalUrl: url,
              cleanUrl
            });
          }

          // If the URL is /dashboard with bypass flag, we need to get the user role
          if (cleanUrl === "/dashboard") {
            // We'll handle this in the next case
            logger.debug("[AUTH] Dashboard with bypass flag, will determine role-specific URL");
          } else {
            // For all other role-specific URLs, use them directly
            logger.debug("[AUTH] Using role-specific URL directly", { cleanUrl });
            return `${baseUrl}${cleanUrl}`;
          }
        }

        // CASE 2: Handle /dashboard or / URLs by redirecting to role-specific dashboard
        if (url === "/dashboard" || url === "/" || (url.includes("/dashboard") && hasBypassFlag)) {
          try {
            // IMPORTANT: For login redirects, we need to use a different approach
            // The session might not be available yet, so we need to check the credentials

            // If this is a login redirect with bypassDashboard flag, we need to extract the username
            // from the request and determine the role-specific URL based on that
            if (hasBypassFlag) {
              // Get the username from the request cookies or headers
              // This is a workaround since we can't access the credentials directly

              // For now, let's use a hardcoded mapping for demo accounts
              // In a production environment, you would need to implement a more robust solution

              // Extract username from cookies if available
              const cookies = await import('next/headers').then(mod => mod.cookies());
              const sessionToken = cookies.get('next-auth.session-token')?.value;

              if (sessionToken) {
                logger.debug("[AUTH] Found session token in cookies", { hasToken: !!sessionToken });

                try {
                  // Try to get the user from the database using the session token
                  // This is a workaround since we can't directly access the user from the session token
                  const { PrismaClient } = await import("@prisma/client");
                  const prisma = new PrismaClient();

                  try {
                    // First, find the session by token
                    // In our schema, the session token is stored in the 'id' field
                    const dbSession = await prisma.session.findUnique({
                      where: {
                        id: sessionToken
                      }
                    });

                    if (dbSession?.userId) {
                      // Now get the user with the userId from the session
                      const user = await prisma.user.findUnique({
                        where: { id: dbSession.userId }
                      });

                      if (user?.userType) {
                        const userType = user.userType;
                        logger.debug("[AUTH] Got user type from database user", { userType });

                      // Determine the correct dashboard URL based on user role
                      let redirectUrl: string;
                      switch (userType) {
                        case 'SYSTEM_ADMIN':
                          redirectUrl = "/admin/system";
                          break;
                        case 'CAMPUS_ADMIN':
                          redirectUrl = "/admin/campus";
                          break;
                        case 'CAMPUS_COORDINATOR':
                        case 'COORDINATOR':
                          redirectUrl = "/admin/coordinator";
                          break;
                        case 'CAMPUS_TEACHER':
                        case 'TEACHER':
                          redirectUrl = "/teacher/dashboard";
                          break;
                        case 'CAMPUS_STUDENT':
                        case 'STUDENT':
                          redirectUrl = "/student/classes";
                          break;
                        case 'CAMPUS_PARENT':
                          redirectUrl = "/parent/dashboard";
                          break;
                        default:
                          // For unknown user types, use the dashboard page
                          // The dashboard page will handle the redirect based on the user role
                          redirectUrl = "/dashboard";
                      }

                      logger.debug("[AUTH] Redirecting to role-specific dashboard from database user", {
                        userType,
                        redirectUrl: `${baseUrl}${redirectUrl}`
                      });

                      // Close the Prisma client before returning
                      await prisma.$disconnect();
                      return `${baseUrl}${redirectUrl}`;
                    }
                  }
                  } finally {
                    // Make sure to disconnect the Prisma client even if there's an error
                    await prisma.$disconnect();
                  }
                } catch (dbError) {
                  logger.error("[AUTH] Error getting user from database", { dbError });
                }
              }

              // If we couldn't get the user type from the database, redirect to the dashboard page
              // The dashboard page will handle the redirect based on the user role
              logger.debug("[AUTH] Redirecting to dashboard page for role-based redirect");
              return `${baseUrl}/dashboard`;
            }

            // If this is not a login redirect with bypassDashboard flag, try to get the session from the API
            const session = await fetch(`${baseUrl}/api/auth/session`).then(res => res.json());

            if (session?.user?.userType) {
              const userType = session.user.userType;
              logger.debug("[AUTH] Got user type from session API", { userType });

              // Determine the correct dashboard URL based on user role
              let redirectUrl: string;
              switch (userType) {
                case 'SYSTEM_ADMIN':
                  redirectUrl = "/admin/system";
                  break;
                case 'CAMPUS_ADMIN':
                  redirectUrl = "/admin/campus";
                  break;
                case 'CAMPUS_COORDINATOR':
                case 'COORDINATOR':
                  redirectUrl = "/admin/coordinator";
                  break;
                case 'CAMPUS_TEACHER':
                case 'TEACHER':
                  redirectUrl = "/teacher/dashboard";
                  break;
                case 'CAMPUS_STUDENT':
                case 'STUDENT':
                  redirectUrl = "/student/classes";
                  break;
                case 'CAMPUS_PARENT':
                  redirectUrl = "/parent/dashboard";
                  break;
                default:
                  // For unknown user types, use the dashboard page
                  // The dashboard page will handle the redirect based on the user role
                  redirectUrl = "/dashboard";
              }

              logger.debug("[AUTH] Redirecting to role-specific dashboard from session API", {
                userType,
                redirectUrl: `${baseUrl}${redirectUrl}`
              });

              return `${baseUrl}${redirectUrl}`;
            } else {
              // If we don't have a user type, redirect to the dashboard page
              // The dashboard page will handle the redirect based on the user role
              logger.debug("[AUTH] No user type in session API, redirecting to dashboard page");
              return `${baseUrl}/dashboard`;
            }
          } catch (error) {
            logger.error("[AUTH] Error in redirect callback", { error });
            // If there's an error, redirect to the dashboard page
            // The dashboard page will handle the redirect based on the user role
            return `${baseUrl}/dashboard`;
          }
        }

        // CASE 3: For all other URLs, just append to the base URL
        logger.debug("[AUTH] Using default URL", { url });
        return `${baseUrl}${url}`;
      }

      // Default to the base URL
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  events: {
    async signIn({ user }) {
      logger.debug("[AUTH] User signed in", { userId: user.id, userType: user.userType });
    },
    async signOut({ token }) {
      logger.debug("[AUTH] User signed out", { userId: token.sub });
    },
    async session({ token }) {
      logger.debug("[AUTH] Session accessed", { userId: token.sub });
    }
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code: string, metadata: any) {
      logger.error(`[AUTH] Error: ${code}`, metadata);
    },
    warn(code: string) {
      logger.warn(`[AUTH] Warning: ${code}`);
    },
    debug(code: string, metadata: any) {
      logger.debug(`[AUTH] Debug: ${code}`, metadata);
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
