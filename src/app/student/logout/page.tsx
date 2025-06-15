'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performLogout() {
      try {
        await signOut({ redirect: false });
        router.push('/login');
      } catch (err) {
        console.error('Logout error:', err);
        setError('An error occurred during logout. Please try again.');
      }
    }

    performLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        {error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <h1 className="text-xl font-semibold text-red-700 mb-2">Logout Error</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Signing out...</p>
          </div>
        )}
      </div>
    </div>
  );
}
