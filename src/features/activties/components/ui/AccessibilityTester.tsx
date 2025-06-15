'use client';

import React, { useState, useRef, useEffect } from 'react';
import { runAccessibilityTests, AccessibilityIssue } from '../../utils/accessibility-tester';
import { cn } from '@/lib/utils';

interface AccessibilityTesterProps {
  children: React.ReactNode;
  className?: string;
  onIssuesFound?: (issues: AccessibilityIssue[]) => void;
  autoRun?: boolean;
}

/**
 * Accessibility Tester Component
 * 
 * This component wraps content and tests it for accessibility issues.
 * It can be used in development mode to identify and fix accessibility problems.
 */
export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  children,
  className,
  onIssuesFound,
  autoRun = false
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [showIssues, setShowIssues] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Run tests when requested
  const runTests = () => {
    if (containerRef.current) {
      const foundIssues = runAccessibilityTests(containerRef.current);
      setIssues(foundIssues);
      setShowIssues(foundIssues.length > 0);
      
      if (onIssuesFound) {
        onIssuesFound(foundIssues);
      }
    }
  };
  
  // Auto-run tests if enabled
  useEffect(() => {
    if (autoRun) {
      // Wait for content to render
      const timer = setTimeout(() => {
        runTests();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoRun, children]);
  
  // Highlight an issue
  const highlightIssue = (issue: AccessibilityIssue) => {
    // Remove any existing highlights
    document.querySelectorAll('.a11y-highlight').forEach(el => {
      el.classList.remove('a11y-highlight');
    });
    
    // Add highlight to the issue element
    issue.element.classList.add('a11y-highlight');
    
    // Scroll to the element
    issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Content container */}
      <div ref={containerRef}>
        {children}
      </div>
      
      {/* Accessibility controls */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={runTests}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full shadow-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Test Accessibility
        </button>
      </div>
      
      {/* Issues panel */}
      {showIssues && (
        <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-lg z-40 max-h-64 overflow-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Accessibility Issues ({issues.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowIssues(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {issues.length === 0 ? (
              <p className="text-green-600 dark:text-green-400">No accessibility issues found!</p>
            ) : (
              <ul className="space-y-2">
                {issues.map((issue, index) => (
                  <li 
                    key={index}
                    className={cn(
                      "p-3 rounded border",
                      issue.type === 'error' 
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    )}
                  >
                    <div className="flex justify-between">
                      <div>
                        <span 
                          className={cn(
                            "inline-block px-2 py-1 text-xs font-medium rounded-full mr-2",
                            issue.type === 'error'
                              ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200"
                              : "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                          )}
                        >
                          {issue.type.toUpperCase()}
                        </span>
                        <span 
                          className={cn(
                            "inline-block px-2 py-1 text-xs font-medium rounded-full",
                            issue.impact === 'critical' ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200" :
                            issue.impact === 'serious' ? "bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200" :
                            issue.impact === 'moderate' ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" :
                            "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          )}
                        >
                          {issue.impact.toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => highlightIssue(issue)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        Highlight
                      </button>
                    </div>
                    <p className="mt-2 text-gray-800 dark:text-gray-200">{issue.message}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Rule: {issue.rule}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Add styles for highlighting */}
      <style jsx global>{`
        .a11y-highlight {
          outline: 4px solid #f59e0b !important;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.5) !important;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default AccessibilityTester;
