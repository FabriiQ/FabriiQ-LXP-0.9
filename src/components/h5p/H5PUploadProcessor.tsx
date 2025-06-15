'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface H5PUploadProcessorProps {
  uploadedFile: {
    path: string;
  };
  onSuccess?: (content: any) => void;
  onClose?: () => void;
}

export function H5PUploadProcessor({ uploadedFile, onSuccess, onClose }: H5PUploadProcessorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [content, setContent] = useState<any>(null);
  const { toast } = useToast();

  const processPackage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/h5p/process-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: uploadedFile.path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process H5P package');
      }

      setContent(data);
      setSuccess(true);

      toast({
        title: 'Success',
        description: 'H5P package processed successfully',
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error processing H5P package:', error);
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
        <CardTitle>Process H5P Package</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">H5P Package Needs Processing</AlertTitle>
            <AlertDescription>
              Your H5P package was uploaded but needs to be processed. Click the button below to process it.
            </AlertDescription>
          </Alert>

          <div className="text-sm">
            <p><strong>File Path:</strong> {uploadedFile.path}</p>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription>
                H5P package processed successfully. Content ID: {content?.contentId}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button onClick={processPackage} disabled={loading || success}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Processed
                </>
              ) : (
                'Process Package'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
