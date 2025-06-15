'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/core/button';
import {
  mapActivityTypeToId,
  getActivityTypeDisplayName,
  SimpleActivityPreview
} from '@/features/activties';
import { ContentPreviewSkeleton } from './SkeletonUI';
import { cn } from '@/lib/utils';
import { Eye, FileText as CodeIcon, Save, Download, Edit } from 'lucide-react';
import { PlayCircle as PlayIcon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/feedback/skeleton';

interface ActivityPreviewProps {
  activityData: any;
  activityType: string;
  isLoading?: boolean;
  onSave?: () => void;
  onExport?: () => void;
  onContentChange?: (newContent: any) => void;
}

/**
 * Dynamic Activity Preview Component
 *
 * This component renders a preview of an activity using the appropriate viewer component
 * from the activity registry. It supports different view modes (Preview, JSON) and
 * provides options to save or export the activity.
 */
export function ActivityPreview({
  activityData,
  activityType,
  isLoading = false,
  onSave,
  onExport,
  onContentChange
}: ActivityPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'json' | 'editor'>('preview');
  const [previewMode, setPreviewMode] = useState<'student' | 'teacher'>('student');
  const [localContent, setLocalContent] = useState<any>(activityData);

  // Extract the actual activity type from the data if available
  const extractActivityType = (data: any, providedType: string): string => {
    // First check if the data has an activityType property
    if (data && data.activityType) {
      console.log('Using activityType from data:', data.activityType);
      return data.activityType;
    }

    // Check if it's in the config
    if (data && data.config && data.config.activityType) {
      console.log('Using activityType from config:', data.config.activityType);
      return data.config.activityType;
    }

    // Check if the type property contains a valid activity type
    if (data && data.type && typeof data.type === 'string') {
      // Use the bridge utility to map the activity type
      const purpose = data.purpose || 'LEARNING';
      const mappedType = mapActivityTypeToId(data.type, purpose);

      if (mappedType) {
        console.log(`Mapped activity type ${data.type} to ${mappedType}`);
        return mappedType;
      }
    }

    // If not, use the provided type
    return providedType;
  };

  // Get the actual activity type
  const actualActivityType = extractActivityType(activityData, activityType);

  // For multiple-choice activities, ensure we're using the correct type
  const finalActivityType = actualActivityType === 'SELF_STUDY' ? 'multiple-choice' : actualActivityType;

  // We don't need to load components dynamically anymore
  // We'll use the SimpleActivityPreview component from the new activities architecture
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

  // Always show editor tab
  const hasEditor = true;

  // Log for debugging
  console.log(`ActivityPreview: Using activity type: "${finalActivityType}" (original: "${actualActivityType}", provided: "${activityType}")`);

  // Log the activity data structure
  console.log('ActivityPreview: Activity data structure:', {
    hasConfig: !!activityData?.config,
    activityType: activityData?.activityType,
    type: activityData?.type,
    purpose: activityData?.purpose,
    configKeys: activityData?.config ? Object.keys(activityData.config) : [],
    topLevelKeys: Object.keys(activityData || {}),
  });

  // Update local content when activityData changes
  useEffect(() => {
    setLocalContent(activityData);
  }, [activityData]);

  // Handle content changes
  const handleContentChange = (newContent: any) => {
    setLocalContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  if (isLoading || isLoadingComponents) {
    return <ContentPreviewSkeleton />;
  }

  if (!activityData) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Activity Preview</CardTitle>
          <CardDescription>No activity data available for preview</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Generate an activity to see a preview</p>
        </CardContent>
      </Card>
    );
  }

  // We're using SimpleActivityPreview which handles all activity types
  // No need to check for specific viewer components

  // Now we can render the activity preview with the components we found
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{activityData.title || 'Activity Preview'}</CardTitle>
            <CardDescription>{activityData.description || 'Preview of the generated activity'}</CardDescription>
          </div>
          <div className="flex space-x-2">
            {onSave && (
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'json' | 'editor')}>
          <TabsList className="mb-4">
            {hasEditor && (
              <TabsTrigger value="editor">
                <Edit className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
            )}
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="json">
              <CodeIcon className="h-4 w-4 mr-2" />
              JSON
            </TabsTrigger>
          </TabsList>

          {viewMode === 'preview' && (
            <div className="flex justify-end mb-4">
              <div className="flex space-x-2">
                <Button
                  variant={previewMode === 'student' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('student')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Student View
                </Button>
                <Button
                  variant={previewMode === 'teacher' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('teacher')}
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Teacher View
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="preview" className={cn(
            "rounded-md border p-4",
            "max-h-[60vh] overflow-y-auto"
          )}>
            <div className="preview-container">
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Activity Type:</strong> {finalActivityType}
                  ({getActivityTypeDisplayName(finalActivityType)})
                </p>
              </div>
              <SimpleActivityPreview
                activityData={{
                  ...localContent,
                  id: localContent.id || 'preview',
                  title: localContent.title || 'Preview',
                  activityType: finalActivityType,
                  purpose: localContent.purpose || 'LEARNING',
                  content: localContent.config || localContent,
                  isGradable: localContent.isGradable || false,
                  status: localContent.status || 'ACTIVE',
                  subjectId: localContent.subjectId || '',
                  classId: localContent.classId || '',
                  createdAt: localContent.createdAt || new Date(),
                  updatedAt: localContent.updatedAt || new Date(),
                  createdById: localContent.createdById || ''
                }}
                activityType={finalActivityType}
                previewMode={previewMode === 'teacher' ? 'teacher' : 'student'}
              />
            </div>
          </TabsContent>

          <TabsContent value="editor" className={cn(
            "rounded-md border p-4",
            "max-h-[60vh] overflow-y-auto"
          )}>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Activity Type:</strong> {finalActivityType}
                  ({getActivityTypeDisplayName(finalActivityType)})
                </p>
              </div>
              <SimpleActivityPreview
                activityData={{
                  ...localContent,
                  id: localContent.id || 'preview',
                  title: localContent.title || 'Preview',
                  activityType: finalActivityType,
                  purpose: localContent.purpose || 'LEARNING',
                  content: localContent.config || localContent,
                  isGradable: localContent.isGradable || false,
                  status: localContent.status || 'ACTIVE',
                  subjectId: localContent.subjectId || '',
                  classId: localContent.classId || '',
                  createdAt: localContent.createdAt || new Date(),
                  updatedAt: localContent.updatedAt || new Date(),
                  createdById: localContent.createdById || ''
                }}
                activityType={finalActivityType}
                previewMode="teacher"
                onContentChange={(updatedActivity: any) => {
                  // If the original content had a config property, update it
                  if (localContent.config) {
                    handleContentChange({
                      ...localContent,
                      config: updatedActivity.content
                    });
                  } else {
                    // Otherwise, update the content directly
                    handleContentChange(updatedActivity.content);
                  }
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="json" className={cn(
            "rounded-md border p-4 bg-muted",
            "max-h-[60vh] overflow-y-auto"
          )}>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(localContent, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
