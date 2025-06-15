import { Metadata } from "next";
import { LoginForm } from "@/components/ui/organisms/login-form-new";
import { Logo } from "@/components/ui/logo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";

export const metadata: Metadata = {
  title: "Sign In | AIVY Learning Experience Platform",
  description: "Sign in to your AIVY LXP account to access your personalized learning dashboard.",
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  // Check if user is already logged in
  const session = await getServerSession(authOptions);

  // Log the search parameters for debugging
  logger.debug("[LOGIN] Search parameters", { searchParams });

  // Special handling for direct-login callback URLs
  if (searchParams.callbackUrl && searchParams.callbackUrl.startsWith('/direct-login')) {
    try {
      // Extract the parameters from the callback URL
      const callbackUrl = decodeURIComponent(searchParams.callbackUrl);
      logger.debug("[LOGIN] Decoded callback URL", { callbackUrl });

      const urlParams = new URLSearchParams(callbackUrl.split('?')[1]);
      const username = urlParams.get('username');
      const password = urlParams.get('password');
      let targetUrl = urlParams.get('targetUrl');

      // If targetUrl is encoded again, decode it
      if (targetUrl && targetUrl.startsWith('%2F')) {
        targetUrl = decodeURIComponent(targetUrl);
      }

      logger.debug("[LOGIN] Extracted direct-login parameters", {
        username,
        hasPassword: !!password,
        targetUrl
      });

      // If we have all the necessary parameters and the user is already logged in
      if (session && username && password && targetUrl) {
        logger.debug("[LOGIN] User already logged in, redirecting to target URL", { targetUrl });
        redirect(targetUrl);
      }

      // If we have the parameters but the user is not logged in, we'll show the login form
      // with the username pre-filled (handled by the LoginForm component)
    } catch (error) {
      logger.error("[LOGIN] Error processing direct-login callback URL", { error });
    }
  } else if (session) {
    // Normal session handling for non-direct-login cases

    // If there's a regular callback URL, redirect to it
    if (searchParams.callbackUrl && !searchParams.callbackUrl.startsWith('/direct-login')) {
      logger.debug("[LOGIN] Redirecting to callback URL", { callbackUrl: searchParams.callbackUrl });
      redirect(searchParams.callbackUrl);
    }

    // Otherwise, redirect based on user role
    const userType = session.user.userType as UserType;
    logger.debug("[LOGIN] Redirecting based on user role", { userType });

    switch (userType) {
      case 'SYSTEM_ADMIN':
        redirect("/admin/system");
      case 'CAMPUS_ADMIN':
        redirect("/admin/campus");
      case 'CAMPUS_COORDINATOR':
      case 'COORDINATOR':
        redirect("/admin/coordinator");
      case 'CAMPUS_TEACHER':
        redirect("/teacher/dashboard");
      case 'CAMPUS_STUDENT':
      case 'STUDENT':
        redirect("/student/classes");
      case 'CAMPUS_PARENT':
        redirect("/parent/dashboard");
      default:
        redirect("/dashboard");
    }
  }

  // If we get here, the user is not logged in, so we'll show the login form

  return (
    <div className="w-full">
      <div className="mb-8">
        <Logo showTagline={false} className="mb-6" />
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-medium-gray">
          Sign in to your account to continue your learning journey
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-light-gray animate-in fade-in-50">
        <LoginForm callbackUrl={searchParams.callbackUrl} />
      </div>
    </div>
  );
}