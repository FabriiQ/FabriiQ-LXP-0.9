'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface InstitutionContextType {
  institutionId: string;
  isLoading: boolean;
  setInstitutionId: (id: string) => void;
}

const InstitutionContext = createContext<InstitutionContextType | null>(null);

/**
 * Hook to use institution context
 */
export function useInstitution() {
  const context = useContext(InstitutionContext);

  if (!context) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }

  return context;
}

interface InstitutionProviderProps {
  children: ReactNode;
  defaultInstitutionId?: string;
}

/**
 * Provider component for institution context
 *
 * This component extracts the institution ID from the URL path or user session
 * and provides it to all child components.
 */
export function InstitutionProvider({
  children,
  defaultInstitutionId = 'default',
}: InstitutionProviderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [institutionId, setInstitutionId] = useState<string>(defaultInstitutionId);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Extract institution ID from URL path or session
  useEffect(() => {
    setIsLoading(true);

    // First try to get institution ID from URL path
    if (pathname) {
      const pathParts = pathname.split('/');
      if (pathParts.length > 1 && pathParts[1]) {
        // Check if the first path segment is a valid institution ID
        // This is a simplified check - in a real app, you'd validate against a list of valid institutions
        const potentialInstitutionId = pathParts[1];
        if (potentialInstitutionId && potentialInstitutionId !== 'api' && potentialInstitutionId !== '_next') {
          setInstitutionId(potentialInstitutionId);
          setIsLoading(false);
          return;
        }
      }
    }

    // If not in URL, try to get from session
    if (status === 'authenticated' && session?.user) {
      // Try to get institutionId from session
      // Note: We're using type assertion here because institutionId might be added
      // by our custom session handling but isn't in the base type
      const userInstitutionId = (session.user as any).institutionId;

      if (userInstitutionId) {
        setInstitutionId(userInstitutionId);
        setIsLoading(false);
        return;
      }

      // If no institutionId, try to use primaryCampusId as a fallback
      if (session.user.primaryCampusId) {
        setInstitutionId(session.user.primaryCampusId);
        setIsLoading(false);
        return;
      }
    }

    // If still not found, use default
    setInstitutionId(defaultInstitutionId);
    setIsLoading(false);
  }, [pathname, session, status, defaultInstitutionId]);

  return (
    <InstitutionContext.Provider value={{ institutionId, isLoading, setInstitutionId }}>
      {children}
    </InstitutionContext.Provider>
  );
}
