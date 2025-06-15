'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface H5PDiagnosticsProps {
  onClose?: () => void;
}

export function H5PDiagnostics({ onClose }: H5PDiagnosticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/h5p/check');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error checking H5P status: ${data.message || response.statusText}`);
      }

      setDiagnosticData(data);
    } catch (error) {
      console.error('Error running H5P diagnostics:', error);
      setError((error as Error).message);
      // Set minimal diagnostic data even when there's an error
      setDiagnosticData({
        status: 'error',
        directoryStatus: {
          h5pRootExists: false,
          contentStorageExists: false,
          libraryStorageExists: false,
          temporaryStorageExists: false
        },
        contentCount: 0,
        h5pInitialized: false,
        libraries: 'No libraries found',
        librariesError: (error as Error).message,
        serverTime: new Date().toISOString(),
        setupInstructions: [
          'Make sure the H5P directories exist and are writable',
          'Install H5P libraries by uploading .h5p files',
          'Create H5P content using the editor',
          'Restart the server after making changes to the H5P directories'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>H5P System Diagnostics</CardTitle>
        <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Running diagnostics...</span>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {diagnosticData && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">H5P Setup Instructions</h3>
                <ul className="space-y-2 text-sm list-disc pl-5">
                  {diagnosticData.setupInstructions?.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : diagnosticData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Directory Status</h3>
                <ul className="space-y-2">
                  {Object.entries(diagnosticData.directoryStatus).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      {value ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Content Status</h3>
                <p className="text-sm">
                  {diagnosticData.contentCount > 0 ? (
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {diagnosticData.contentCount} H5P content items found
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      No H5P content found
                    </span>
                  )}
                </p>
                <h3 className="text-sm font-medium mt-4 mb-2">Libraries Status</h3>
                <p className="text-sm">
                  {diagnosticData.librariesError ? (
                    <span className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      Error: {diagnosticData.librariesError}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {diagnosticData.libraries}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Recommendations</h3>
              <ul className="space-y-2 text-sm">
                {!diagnosticData.directoryStatus.h5pRootExists && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span>H5P root directory doesn't exist. Create the directory at the project root.</span>
                  </li>
                )}
                {!diagnosticData.directoryStatus.contentStorageExists && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span>H5P content directory doesn't exist. Create the 'content' directory inside the H5P root.</span>
                  </li>
                )}
                {!diagnosticData.directoryStatus.libraryStorageExists && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span>H5P libraries directory doesn't exist. Create the 'libraries' directory inside the H5P root.</span>
                  </li>
                )}
                {diagnosticData.contentCount === 0 && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                    <span>No H5P content found. Create some H5P content before trying to use it in activities.</span>
                  </li>
                )}
                {diagnosticData.librariesError && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span>Error accessing H5P libraries: {diagnosticData.librariesError}</span>
                  </li>
                )}
                {!diagnosticData.h5pInitialized && (
                  <li className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span>H5P server not initialized. Check server logs for errors.</span>
                  </li>
                )}
                {Object.values(diagnosticData.directoryStatus).every(Boolean) &&
                 !diagnosticData.librariesError &&
                 diagnosticData.h5pInitialized &&
                 diagnosticData.contentCount > 0 && (
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>H5P system appears to be properly configured.</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Setup Instructions</h3>
              <ul className="space-y-2 text-sm list-disc pl-5">
                {diagnosticData.setupInstructions?.map((instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Diagnostic run at: {new Date(diagnosticData.serverTime).toLocaleString()}
            </div>
          </div>
        ) : null}

        {onClose && (
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
