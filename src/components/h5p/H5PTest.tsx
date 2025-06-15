'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function H5PTest() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test the H5P system
      const response = await fetch('/api/h5p/test');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test H5P system');
      }

      const data = await response.json();
      setTestResults(data);
      
      toast({
        title: 'Test completed',
        description: data.h5pInitialized 
          ? 'H5P system is initialized and working correctly' 
          : 'H5P system is not initialized',
        variant: data.h5pInitialized ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Error testing H5P:', error);
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeH5P = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize the H5P system
      const response = await fetch('/api/h5p/initialize', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize H5P system');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'H5P system initialized successfully',
        variant: 'success',
      });

      // Run the test again to verify
      await runTest();
    } catch (error) {
      console.error('Error initializing H5P:', error);
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>H5P System Test</CardTitle>
        <CardDescription>
          Test the H5P system to ensure it is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResults && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">H5P Initialized:</span>
              {testResults.h5pInitialized ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Schema Files:</h3>
              {testResults.schemaFiles.length > 0 ? (
                <ul className="list-disc pl-5">
                  {testResults.schemaFiles.map((file: string) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No schema files found</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Schema Loading Test:</h3>
              {testResults.schemaLoadingTest.success ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Schema loaded successfully</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>{testResults.schemaLoadingTest.error || 'Failed to load schema'}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium">Server Time:</h3>
              <p>{new Date(testResults.serverTime).toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={runTest} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Run Test'
          )}
        </Button>
        <Button onClick={initializeH5P} disabled={loading} variant="outline">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize H5P'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
