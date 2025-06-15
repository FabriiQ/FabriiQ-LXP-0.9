'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/atoms/spinner';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import ClientOnly from '@/components/client-only';
import { H5PUploadProcessor } from '@/components/h5p/H5PUploadProcessor';
import { H5PPackageProcessor } from '@/components/h5p/H5PPackageProcessor';
import { H5PInitializer } from '@/components/h5p/H5PInitializer';

// Dynamically import H5P components with SSR disabled
const H5PEditorUI = dynamic(
  () => import('@lumieducation/h5p-react').then((mod) => mod.H5PEditorUI),
  { ssr: false }
);

export default function H5PEditorPage({ params }: { params: Promise<{ contentId: string }> }) {
  // Unwrap params using React.use
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const h5pEditorRef = useRef<any>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ path: string } | null>(null);
  const [uploadedPackage, setUploadedPackage] = useState<{ filePath: string } | null>(null);
  const [h5pInitialized, setH5PInitialized] = useState<boolean>(true); // Assume initialized until proven otherwise
  const isNewContent = unwrappedParams.contentId === 'new';

  // Check H5P initialization status
  useEffect(() => {
    const checkH5PStatus = async () => {
      try {
        const response = await fetch('/api/h5p/status');
        if (response.ok) {
          const data = await response.json();
          setH5PInitialized(data.initialized);
        } else {
          setH5PInitialized(false);
        }
      } catch (error) {
        console.error('Error checking H5P status:', error);
        setH5PInitialized(false);
      }
    };

    checkH5PStatus();
  }, []);

  // Function to load H5P content for editing
  const loadH5PContent = async (contentId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/h5p/editor/${contentId || 'new'}`);
      if (!response.ok) {
        throw new Error('Failed to load H5P content');
      }

      const data = await response.json();

      if (contentId && contentId !== 'new') {
        // Set title for existing content
        setTitle(data.metadata?.title || '');
      }

      return data;
    } catch (error) {
      console.error('Error loading H5P content:', error);
      setError('Failed to load H5P content. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to save H5P content
  const saveH5PContent = async (contentId: string | undefined, requestBody: any) => {
    try {
      const response = await fetch(`/api/h5p/editor/${contentId || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save H5P content');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving H5P content:', error);
      setError('Failed to save H5P content. Please try again.');
      throw error;
    }
  };

  // Handle saving H5P content
  const handleSave = async () => {
    if (!h5pEditorRef.current) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const result = await h5pEditorRef.current.save();
      setSaveSuccess(true);

      // If this is a new content, redirect to the edit page for the new content
      if (isNewContent) {
        router.push(`/h5p-editor/${result.contentId}`);
      }

      // Set timeout to hide success message
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving H5P content:', error);
      setError('Failed to save H5P content. Please try again.');
    } finally {
      setSaving(false);
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
              {isNewContent ? 'Create New H5P Content' : 'Edit H5P Content'}
            </h1>
            <p className="text-muted-foreground">
              {isNewContent
                ? 'Create a new interactive H5P content item'
                : 'Edit your interactive H5P content'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            H5P content saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>H5P Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border rounded-md">
            {isNewContent ? (
              <div className="p-6">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Create New H5P Content</h3>
                  <Button variant="outline" size="sm" onClick={() => router.push('/h5p-manager')}>
                    View All Content
                  </Button>
                </div>
                <div className="grid gap-6">
                  <div className="border rounded-md p-6 bg-muted/20">
                    <h4 className="text-md font-medium mb-2">Upload H5P Package</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload an existing H5P package (.h5p file) to add it to your content library.
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".h5p"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const formData = new FormData();
                            formData.append('h5p', e.target.files[0]);

                            setLoading(true);
                            console.log('Uploading file:', e.target.files[0].name, 'size:', e.target.files[0].size);
                            fetch('/api/h5p/import', {
                              method: 'POST',
                              body: formData,
                            })
                              .then(async response => {
                                console.log('Upload response status:', response.status);
                                const responseText = await response.text();
                                console.log('Response text:', responseText);

                                if (!response.ok) {
                                  // Check if it's a 503 Service Unavailable (H5P not initialized)
                                  if (response.status === 503) {
                                    try {
                                      const data = JSON.parse(responseText);
                                      if (data.needsSetup && data.tempFilePath) {
                                        // H5P needs initialization
                                        setH5PInitialized(false);
                                        setUploadedFile({ path: data.tempFilePath });
                                        setLoading(false);
                                        return null; // Stop the promise chain
                                      }
                                    } catch (e) {
                                      console.error('Error parsing 503 response:', e);
                                    }
                                  }
                                  throw new Error(`Failed to upload H5P package: ${responseText}`);
                                }

                                try {
                                  return JSON.parse(responseText);
                                } catch (e) {
                                  console.error('Error parsing JSON:', e);
                                  throw new Error('Invalid JSON response');
                                }
                              })
                              .then(data => {
                                if (!data) return; // Skip if null (handled in previous step)

                                if (data.success) {
                                  // Redirect to the edit page for the new content
                                  router.push(`/h5p-editor/${data.contentId}`);
                                } else if (data.needsSetup && data.tempFilePath) {
                                  // Package was saved but needs processing
                                  setUploadedFile({ path: data.tempFilePath });
                                  setLoading(false);
                                } else {
                                  throw new Error(data.error || 'Failed to upload H5P package');
                                }
                              })
                              .catch(err => {
                                console.error('Upload error:', err);
                                setError(err.message || 'Unknown error occurred');
                                setLoading(false);
                              });
                          }
                        }}
                      />
                      {loading && <Spinner className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="border rounded-md p-6 bg-muted/20">
                    <h4 className="text-md font-medium mb-2">Create From Scratch</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a new H5P content from scratch using the H5P editor.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Create a new empty H5P content
                          fetch('/api/h5p/content/create', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              title: title || 'Untitled H5P Content',
                            }),
                          })
                            .then(response => {
                              if (!response.ok) throw new Error('Failed to create H5P content');
                              return response.json();
                            })
                            .then(data => {
                              // Redirect to the edit page for the new content
                              router.push(`/h5p-editor/${data.contentId}`);
                            })
                            .catch(err => {
                              setError(err.message);
                            });
                        }}
                      >
                        Create New Content
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setLoading(true);
                          // Create a sample H5P content for testing
                          fetch('/api/h5p/sample')
                            .then(response => {
                              if (!response.ok) throw new Error('Failed to create sample H5P content');
                              return response.json();
                            })
                            .then(data => {
                              // Redirect to the edit page for the new content
                              router.push(`/h5p-editor/${data.contentId}`);
                            })
                            .catch(err => {
                              console.error('Sample creation error:', err);
                              setError(err.message || 'Unknown error occurred');
                              setLoading(false);
                            });
                        }}
                      >
                        Create Sample Content
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !h5pInitialized ? (
              <div className="max-w-2xl mx-auto py-6">
                <H5PInitializer onInitialized={() => {
                  setH5PInitialized(true);
                  // If we have an uploaded file, process it now
                  if (uploadedFile) {
                    // Wait a moment for the H5P system to fully initialize
                    setTimeout(() => {
                      fetch('/api/h5p/process-package', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ filePath: uploadedFile.path }),
                      })
                      .then(response => response.json())
                      .then(data => {
                        if (data.contentId) {
                          router.push(`/h5p-editor/${data.contentId}`);
                        }
                      })
                      .catch(error => {
                        console.error('Error processing package after initialization:', error);
                      });
                    }, 1000);
                  }
                }} />
              </div>
            ) : uploadedPackage ? (
              <div className="max-w-2xl mx-auto py-6">
                <H5PPackageProcessor
                  filePath={uploadedPackage.filePath}
                  onSuccess={(content: any) => {
                    setUploadedPackage(null);
                    router.push(`/h5p-editor/${content.contentId}`);
                  }}
                  onClose={() => setUploadedPackage(null)}
                />
              </div>
            ) : uploadedFile ? (
              <div className="max-w-2xl mx-auto py-6">
                <H5PUploadProcessor
                  uploadedFile={uploadedFile}
                  onSuccess={(content: any) => {
                    setUploadedFile(null);
                    router.push(`/h5p-editor/${content.contentId}`);
                  }}
                  onClose={() => setUploadedFile(null)}
                />
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">Loading editor...</span>
              </div>
            ) : (
              <ClientOnly fallback={<div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>}>
                <H5PEditorUI
                  contentId={unwrappedParams.contentId}
                  loadContentCallback={loadH5PContent}
                  saveContentCallback={saveH5PContent}
                  onSaved={(data: any) => {
                    // Update title if it's empty
                    if (!title && data.metadata?.title) {
                      setTitle(data.metadata.title);
                    }
                    // Store the result for saving
                    if (h5pEditorRef.current) {
                      h5pEditorRef.current = data;
                    }
                  }}
                />
              </ClientOnly>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
