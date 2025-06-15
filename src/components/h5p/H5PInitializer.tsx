'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface H5PInitializerProps {
  onInitialized?: () => void;
}

export function H5PInitializer({ onInitialized }: H5PInitializerProps = {}) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'initialized' | 'not_initialized'>('checking');
  const { toast } = useToast();

  // Check H5P initialization status
  useEffect(() => {
    checkH5PStatus();
  }, []);

  const checkH5PStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/h5p/status');
      const data = await response.json();

      if (response.ok) {
        setStatus(data.initialized ? 'initialized' : 'not_initialized');
      } else {
        setError(data.error || 'Failed to check H5P status');
        setStatus('not_initialized');
      }
    } catch (error) {
      console.error('Error checking H5P status:', error);
      setError((error as Error).message);
      setStatus('not_initialized');
    } finally {
      setLoading(false);
    }
  };

  const initializeH5P = async () => {
    try {
      setInitializing(true);
      setError(null);

      const response = await fetch('/api/h5p/initialize', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setStatus('initialized');
        toast({
          title: 'Success',
          description: 'H5P system initialized successfully',
          variant: 'success',
        });

        // Call the callback if provided
        if (onInitialized) {
          onInitialized();
        }
      } else {
        setError(data.error || 'Failed to initialize H5P');
        toast({
          title: 'Error',
          description: data.error || 'Failed to initialize H5P',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error initializing H5P:', error);
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'error',
      });
    } finally {
      setInitializing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>H5P System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === 'checking' || loading ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Checking H5P status...</span>
            </div>
          ) : status === 'initialized' ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">H5P System Initialized</AlertTitle>
              <AlertDescription>
                The H5P system is properly initialized and ready to use.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-600">H5P System Not Initialized</AlertTitle>
                <AlertDescription>
                  The H5P system needs to be initialized before you can create or upload H5P content.
                  Click the button below to initialize the system.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={initializeH5P}
                  disabled={initializing}
                  className="flex items-center space-x-2"
                >
                  {initializing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Initialize H5P System
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
