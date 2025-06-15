'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { H5PDiagnostics } from './H5PDiagnostics';
import { H5PInitializer } from './H5PInitializer';

interface H5PSetupGuideProps {
  onConfigChange: (config: Record<string, any>) => void;
}

export function H5PSetupGuide({ onConfigChange }: H5PSetupGuideProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Set a placeholder config to allow form submission for testing
  const setPlaceholderConfig = () => {
    onConfigChange({
      contentId: 'placeholder',
      contentType: 'placeholder',
      title: 'Placeholder H5P Content',
      description: 'This is a placeholder for H5P content. Please set up H5P properly to use real content.',
      isPlaceholder: true
    });
  };

  return (
    <div className="space-y-6">
      <H5PInitializer onInitialized={() => {
        // Set a placeholder config until real content is created
        setPlaceholderConfig();
      }} />

      <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-4">H5P Setup Instructions</h3>

        <ol className="list-decimal pl-5 space-y-2 mb-6">
          <li>Initialize the H5P system using the button above</li>
          <li>Upload H5P content packages to install libraries</li>
          <li>Create H5P content using the editor</li>
          <li>Select the content for your activity</li>
        </ol>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setShowDiagnostics(true)}
            className="flex items-center gap-1"
          >
            <HelpCircle className="h-4 w-4" />
            Run H5P Diagnostics
          </Button>

          <Button
            variant="secondary"
            onClick={setPlaceholderConfig}
          >
            Use Placeholder (For Testing)
          </Button>
        </div>
      </div>

      {showDiagnostics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">H5P System Diagnostics</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDiagnostics(false)}>
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Check the status of your H5P integration to troubleshoot issues.</p>
            <H5PDiagnostics onClose={() => setShowDiagnostics(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
