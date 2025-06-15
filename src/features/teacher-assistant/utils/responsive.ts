import { useState, useEffect } from 'react';
import { UI } from '../constants';

/**
 * Hook to detect if the current viewport is mobile
 * 
 * @returns Object with isMobile flag
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < UI.MOBILE_BREAKPOINT);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  return { isMobile };
}
