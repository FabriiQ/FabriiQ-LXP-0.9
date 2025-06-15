'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * DirectLoginPage - A special login page that handles authentication and redirection in a single step
 *
 * This page accepts username, password, and targetUrl as query parameters and performs
 * a direct login without the intermediate redirect to /dashboard.
 *
 * Example usage:
 * /direct-login?username=teacher1&password=Password123!&targetUrl=/teacher/dashboard
 */
export default function DirectLoginPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Ensure searchParams is not null before proceeding
    if (!searchParams) {
      setStatus('error');
      setErrorMessage('Search parameters not available');
      return;
    }

    const performLogin = async () => {
      try {
        // Get parameters from URL
        const username = searchParams.get('username');
        const password = searchParams.get('password');
        let targetUrl = searchParams.get('targetUrl');

        // If targetUrl is encoded again, decode it
        if (targetUrl && targetUrl.startsWith('%2F')) {
          targetUrl = decodeURIComponent(targetUrl);
        }

        // Validate parameters
        if (!username || !password) {
          setStatus('error');
          setErrorMessage('Missing username or password');
          return;
        }

        // If no target URL is provided, determine based on username
        if (!targetUrl) {
          // Map usernames to their role-specific dashboards
          // IMPORTANT: Always use role-specific URLs to avoid the /dashboard redirect
          if (username === "sys_admin") {
            targetUrl = "/admin/system";
          } else if (username === "michael_smith" || username === "sarah_williams") {
            targetUrl = "/admin/campus";
          } else if (username === "alex_johnson") {
            targetUrl = "/admin/coordinator";
          } else if (username.includes("teacher") || username === "robert_brown" ||
                    username === "jennifer_davis" || username === "james_anderson") {
            targetUrl = "/teacher/dashboard";
          } else if (username.includes("student") || username === "john_smith" ||
                    username === "emily_johnson") {
            targetUrl = "/student/classes";
          } else {
            // Even for unknown users, try to use a more specific URL than /dashboard
            // to avoid the redirect flicker
            targetUrl = "/user/profile"; // This will be handled by the redirect callback
          }
        }

        // Check if this is a system admin route (no institution needed)
        const isSystemAdminRoute = targetUrl?.startsWith('/admin/system');

        // Get institution ID from URL if present
        const institutionId = searchParams.get('institutionId');

        // Add institution context to the target URL if available and needed
        if (institutionId && targetUrl && !targetUrl.includes(`/${institutionId}`) && !isSystemAdminRoute) {
          // If targetUrl starts with /, add institution after the first /
          if (targetUrl.startsWith('/')) {
            targetUrl = `/${institutionId}${targetUrl}`;
          } else {
            // Otherwise, add institution at the beginning
            targetUrl = `/${institutionId}/${targetUrl}`;
          }
        }

        console.log(`[DIRECT-LOGIN] Attempting login for ${username}, will redirect to ${targetUrl}`);

        // Add more detailed logging to help with debugging
        console.log(`[DIRECT-LOGIN] Login details: username=${username}, targetUrl=${targetUrl}, institutionId=${institutionId || 'none'}, isSystemAdminRoute=${isSystemAdminRoute}`);

        // Log the raw parameters for debugging
        console.log(`[DIRECT-LOGIN] Raw parameters: username=${searchParams.get('username')}, password=${searchParams.get('password') ? '******' : 'null'}, targetUrl=${searchParams.get('targetUrl')}`);
        console.log(`[DIRECT-LOGIN] URL search params:`, Object.fromEntries(searchParams.entries()));

        // Set a timeout to handle cases where the redirect doesn't happen
        const redirectTimeout = setTimeout(() => {
          // If we're still on this page after 5 seconds, something went wrong
          console.warn('[DIRECT-LOGIN] Redirect timeout - manually redirecting to', targetUrl);
          if (targetUrl) {
            window.location.href = targetUrl;
          }
        }, 5000);

        // IMPORTANT: For a frictionless login experience, we need to handle the redirect differently
        // We'll use the /dashboard URL with the bypassDashboard flag
        // The NextAuth redirect callback and dashboard page will handle the redirect based on the user role

        // We've tried using role-specific URLs directly, but it doesn't work reliably
        // because the session might not be available yet when the redirect happens

        // Instead, we'll use the /dashboard URL with the bypassDashboard flag
        // This approach is more reliable because it doesn't depend on the session being available

        // The dashboard page will handle the redirect based on the user role
        targetUrl = "/dashboard";

        console.log('[DIRECT-LOGIN] Using role-specific URL', { targetUrl });

        // Add a special flag to the URL to indicate that we want to bypass the dashboard redirect
        const finalTargetUrl = targetUrl.includes('?')
          ? `${targetUrl}&bypassDashboard=true`
          : `${targetUrl}?bypassDashboard=true`;

        console.log('[DIRECT-LOGIN] Final target URL with bypass flag', { finalTargetUrl });

        // Perform login with redirect
        // Use direct redirect to avoid the /dashboard intermediate step
        const result = await signIn("credentials", {
          username,
          password,
          redirect: true,
          callbackUrl: finalTargetUrl
        });

        // Clear the timeout if we get here (shouldn't happen with redirect: true)
        clearTimeout(redirectTimeout);

        // This code will only run if redirect is set to false (which shouldn't happen)
        // But we'll handle it just in case
        if (result?.error) {
          console.error('[DIRECT-LOGIN] Login error:', result.error);
          setStatus('error');
          setErrorMessage(result.error || 'Authentication failed');
        } else {
          setStatus('success');
        }
      } catch (error) {
        console.error("[DIRECT-LOGIN] Unexpected error during login:", error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    // Only call performLogin if searchParams is available
    if (searchParams) {
      performLogin();
    }
  }, [searchParams]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Logging you in...</p>
      </div>
    );
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Login Failed</h1>
          <p className="text-red-600">{errorMessage}</p>
          <a href="/login" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
            Go to Login Page
          </a>
        </div>
      </div>
    );
  }

  // Success state (should never be seen due to redirect)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md">
        <h1 className="text-xl font-semibold text-green-700 mb-2">Login Successful</h1>
        <p className="text-green-600">You are being redirected...</p>
      </div>
    </div>
  );
}
