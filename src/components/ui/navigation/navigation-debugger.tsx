'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

/**
 * NavigationDebugger - A component to help debug navigation issues
 * 
 * This component shows information about the current navigation state,
 * including the current path, navigation history, and any errors.
 * 
 * It also provides buttons to test different navigation methods.
 */
export function NavigationDebugger() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [navigationErrors, setNavigationErrors] = useState<string[]>([]);
  
  // Add current path to history when it changes
  useEffect(() => {
    if (pathname) {
      setNavigationHistory(prev => {
        // Only add if different from the last entry
        if (prev[prev.length - 1] !== pathname) {
          return [...prev, pathname].slice(-10); // Keep last 10 entries
        }
        return prev;
      });
    }
  }, [pathname]);
  
  // Listen for navigation errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('navigation')) {
        setNavigationErrors(prev => 
          [...prev, `${new Date().toLocaleTimeString()}: ${event.error.message}`].slice(-5)
        );
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Test different navigation methods
  const testNavigation = (method: string) => {
    try {
      const testPath = `/test-navigation-${Date.now()}`;
      
      switch (method) {
        case 'router.push':
          router.push(testPath);
          break;
        case 'window.location':
          window.location.href = testPath;
          break;
        case 'history.pushState':
          window.history.pushState({}, '', testPath);
          break;
        default:
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        setNavigationErrors(prev => 
          [...prev, `${new Date().toLocaleTimeString()}: ${error.message}`].slice(-5)
        );
      }
    }
  };
  
  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        onClick={() => setIsVisible(true)}
      >
        Show Nav Debug
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Navigation Debugger</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <p className="font-semibold">Current Path:</p>
          <code className="bg-muted p-1 rounded">{pathname}</code>
        </div>
        
        <div>
          <p className="font-semibold">Navigation History:</p>
          <div className="max-h-20 overflow-y-auto">
            {navigationHistory.map((path, i) => (
              <div key={i} className="py-1 border-b border-border last:border-0">
                <code className="bg-muted p-1 rounded text-[10px]">{path}</code>
              </div>
            ))}
          </div>
        </div>
        
        {navigationErrors.length > 0 && (
          <div>
            <p className="font-semibold">Navigation Errors:</p>
            <div className="max-h-20 overflow-y-auto">
              {navigationErrors.map((error, i) => (
                <div key={i} className="py-1 border-b border-border last:border-0">
                  <Badge variant="destructive" className="text-[10px]">{error}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <p className="font-semibold">Test Navigation:</p>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-6"
              onClick={() => testNavigation('router.push')}
            >
              router.push
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-6"
              onClick={() => testNavigation('window.location')}
            >
              window.location
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
