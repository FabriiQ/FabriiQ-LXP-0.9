'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useNavigationHandler, NavigationOptions } from '@/utils/navigation-handler';

// Create context for navigation
interface NavigationContextType {
  navigate: (href: string, options?: NavigationOptions) => Promise<boolean>;
  isNavigating: boolean;
  hasError: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Provider component for navigation
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const { navigate, isNavigating, hasError } = useNavigationHandler();
  
  return (
    <NavigationContext.Provider value={{ navigate, isNavigating, hasError }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to use navigation context
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
}
