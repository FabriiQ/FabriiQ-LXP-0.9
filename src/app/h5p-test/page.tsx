'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
// Import H5P types from the new location
import { H5PActivityConfig } from '@/features/activties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientOnly from '@/components/client-only';
import { Spinner } from '@/components/ui';

// Dynamically import H5P components with SSR disabled
const H5PEditor = dynamic(
  () => import('@/features/activties').then((mod) => mod.H5PEditor),
  { ssr: false }
);

const H5PViewer = dynamic(
  () => import('@/features/activties').then((mod) => mod.H5PViewer),
  { ssr: false }
);

export default function H5PTestPage() {
  const [config, setConfig] = useState<H5PActivityConfig>({
    title: 'Test H5P Activity',
    description: 'This is a test H5P activity',
    instructions: 'Follow the instructions in the H5P content',
    completionType: 'view',
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">H5P Test Page</h1>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="viewer">Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>H5P Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientOnly fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
                <H5PEditor config={config} onChange={setConfig} />
              </ClientOnly>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer">
          <Card>
            <CardHeader>
              <CardTitle>H5P Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientOnly fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
                <H5PViewer
                  config={config}
                  mode="student"
                  onInteraction={(data) => console.log('Interaction:', data)}
                />
              </ClientOnly>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
