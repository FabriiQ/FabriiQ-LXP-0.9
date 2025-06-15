'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui';
import { AlertCircle, ArrowLeft, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import ClientOnly from '@/components/client-only';

// Dynamically import H5P components with SSR disabled
const H5PPlayerUI = dynamic(
  () => import('@lumieducation/h5p-react').then((mod) => mod.H5PPlayerUI),
  { ssr: false }
);

interface H5PContentDetails {
  id: string;
  contentId: string;
  title: string;
  library: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export default function H5PPlayerPage({ params }: { params: Promise<{ contentId: string }> }) {
  // Unwrap params using React.use
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [content, setContent] = useState<H5PContentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content details
  useEffect(() => {
    const fetchContentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/h5p/content/${unwrappedParams.contentId}/details`);
        if (!response.ok) {
          throw new Error('Failed to fetch content details');
        }

        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error fetching content details:', error);
        setError('Failed to fetch content details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContentDetails();
  }, [unwrappedParams.contentId]);

  // Function to load H5P content for viewing
  const loadH5PContent = async (contentId: string) => {
    try {
      const response = await fetch(`/api/h5p/content/${contentId}`);
      if (!response.ok) {
        throw new Error('Failed to load H5P content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading H5P content:', error);
      setError('Failed to load H5P content. Please try again.');
      throw error;
    }
  };

  // Handle xAPI statements from H5P content
  const handleXAPI = (statement: any) => {
    console.log('xAPI statement:', statement);

    // Track completion
    if (statement.statement.result?.completion) {
      console.log('Content completed!');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/h5p-manager')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {content ? content.title : 'H5P Content'}
            </h1>
            {content && (
              <p className="text-muted-foreground">
                {content.library.split(' ')[0].replace('.', ' ')}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/h5p-editor/${unwrappedParams.contentId}`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>H5P Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border rounded-md">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">Loading content...</span>
              </div>
            ) : (
              <ClientOnly fallback={<div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>}>
                <H5PPlayerUI
                  contentId={unwrappedParams.contentId}
                  loadContentCallback={loadH5PContent}
                  onxAPIStatement={handleXAPI}
                />
              </ClientOnly>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
