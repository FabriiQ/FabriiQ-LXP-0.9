# H5P Implementation for LXP Activities

## Overview

This document outlines the implementation plan for integrating H5P activities into our Learning Experience Platform (LXP). H5P (HTML5 Package) is an open-source content collaboration framework that makes it easy to create, share, and reuse interactive HTML5 content.

## What is H5P?

H5P enables the creation of interactive content such as:
- Interactive videos
- Quizzes and questionnaires
- Interactive presentations
- Memory games
- Timelines
- Drag and drop exercises
- Flashcards
- And many more

H5P content is responsive and works on all devices, making it ideal for educational purposes.

## Implementation Architecture

Our implementation will consist of two main components:

1. **Server-side component**: Using `@lumieducation/h5p-server` to handle H5P content storage, retrieval, and processing
2. **Client-side component**: Using `@lumieducation/h5p-react` to render H5P content in our React-based frontend

### Dependencies

We will need to install the following packages:

```bash
# Server-side dependencies
npm install @lumieducation/h5p-server @lumieducation/h5p-express

# Client-side dependencies
npm install @lumieducation/h5p-react
```

## Server-Side Implementation

### Setting up the H5P Server

We'll need to create a dedicated module to handle H5P content. This will include:

1. Setting up the H5P library storage
2. Setting up the H5P content storage
3. Creating REST endpoints for H5P content management

```typescript
// src/server/h5p/h5p-server.ts
import { H5PEditor, H5PPlayer, IH5PConfig } from '@lumieducation/h5p-server';
import { FileLibraryStorage, FileContentStorage } from '@lumieducation/h5p-server';
import path from 'path';

// Define storage paths
const h5pRootPath = path.resolve(process.cwd(), 'h5p');
const contentStoragePath = path.join(h5pRootPath, 'content');
const libraryStoragePath = path.join(h5pRootPath, 'libraries');
const temporaryStoragePath = path.join(h5pRootPath, 'temporary-storage');

// Create storage objects
const libraryStorage = new FileLibraryStorage(libraryStoragePath);
const contentStorage = new FileContentStorage(contentStoragePath);

// H5P configuration
const config: IH5PConfig = {
  baseUrl: '/h5p',
  ajaxUrl: '/h5p/ajax',
  contentUserDataUrl: '/h5p/content-user-data',
  contentTypeCacheRefreshInterval: 86400000, // 1 day
  contentUserDataCacheRefreshInterval: 300000, // 5 minutes
  contentWhitelist: 'json svg png jpg jpeg gif bmp tif tiff wav mp3 mp4 webm m4a ogg oga ogv weba webp',
  coreApiVersion: { major: 1, minor: 24 },
  coreUrl: '/h5p/core',
  enableLrsContentTypes: true,
  fetchingDisabled: 0,
  h5pVersion: '1.24.0',
  hubRegistrationEndpoint: 'https://api.h5p.org/v1/sites',
  librariesUrl: '/h5p/libraries',
  libraryWhitelist: 'js css',
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  maxTotalSize: 500 * 1024 * 1024, // 500 MB
  sendUsageStatistics: false,
  temporaryFileLifetime: 86400, // 1 day (in seconds)
  uuid: 'unique-identifier-for-your-site'
};

// Create H5P objects
export const h5pEditor = new H5PEditor(
  config,
  libraryStorage,
  contentStorage,
  {
    temporaryStorage: temporaryStoragePath
  }
);

export const h5pPlayer = new H5PPlayer(
  config,
  libraryStorage,
  contentStorage
);

// Set renderers to return models directly
h5pEditor.setRenderer((model) => model);
h5pPlayer.setRenderer((model) => model);
```

### Creating REST Endpoints

We'll need to create REST endpoints to handle H5P content:

```typescript
// src/server/api/h5p-routes.ts
import express from 'express';
import { h5pEditor, h5pPlayer } from '../h5p/h5p-server';
import { H5PAjaxEndpoint, H5PAjaxRouter } from '@lumieducation/h5p-express';

const router = express.Router();

// Set up H5P Ajax endpoints
const h5pAjaxRouter = new H5PAjaxRouter(
  h5pEditor,
  h5pPlayer,
  'user-id', // Replace with actual user ID from session
  'en'
);

router.use('/ajax', h5pAjaxRouter.router);

// Endpoint to get content for the player
router.get('/content/:contentId', async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = 'user-id'; // Replace with actual user ID from session
    
    const playerModel = await h5pPlayer.render(contentId, userId);
    res.json(playerModel);
  } catch (error) {
    console.error('Error getting H5P content:', error);
    res.status(500).json({ error: 'Error getting H5P content' });
  }
});

// Endpoint to get content for the editor
router.get('/editor/:contentId', async (req, res) => {
  try {
    const contentId = req.params.contentId === 'new' ? undefined : req.params.contentId;
    const userId = 'user-id'; // Replace with actual user ID from session
    
    const editorModel = await h5pEditor.render(contentId, userId);
    
    if (contentId) {
      const content = await h5pEditor.getContent(contentId);
      res.json({
        ...editorModel,
        library: content.library,
        metadata: content.metadata,
        params: content.params
      });
    } else {
      res.json(editorModel);
    }
  } catch (error) {
    console.error('Error getting H5P editor content:', error);
    res.status(500).json({ error: 'Error getting H5P editor content' });
  }
});

// Endpoint to save content from the editor
router.post('/editor/:contentId?', async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = 'user-id'; // Replace with actual user ID from session
    
    const { library, params } = req.body;
    
    const savedContent = await h5pEditor.saveOrUpdateContentReturnMetaData(
      contentId,
      library,
      params,
      userId
    );
    
    res.json(savedContent);
  } catch (error) {
    console.error('Error saving H5P content:', error);
    res.status(500).json({ error: 'Error saving H5P content' });
  }
});

export default router;
```

## Client-Side Implementation

### Creating H5P Activity Components

We'll create React components to handle H5P activities in our system:

```tsx
// src/features/activities/types/h5p/H5PActivity.tsx
'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { H5PPlayerUI } from '@lumieducation/h5p-react';
import { activityRegistry } from '../../registry/ActivityTypeRegistry';
import { ActivityPurpose } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';

// Define the schema for H5P activity configuration
const h5pConfigSchema = z.object({
  contentId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  completionType: z.enum(['view', 'score', 'completion']),
  minimumScore: z.number().min(0).max(100).optional(),
  timeLimit: z.number().min(0).optional(),
});

// Define the type for H5P activity configuration
export type H5PActivityConfig = z.infer<typeof h5pConfigSchema>;

// Default configuration for new H5P activities
const defaultH5PConfig: H5PActivityConfig = {
  title: '',
  description: '',
  instructions: '',
  completionType: 'view',
};

// H5P Activity Editor Component
export const H5PEditor = ({ 
  config, 
  onChange 
}: { 
  config: H5PActivityConfig, 
  onChange: (newConfig: H5PActivityConfig) => void 
}) => {
  const h5pEditorRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load H5P content for editing
  const loadH5PContent = async (contentId?: string) => {
    try {
      const response = await fetch(`/api/h5p/editor/${contentId || 'new'}`);
      if (!response.ok) {
        throw new Error('Failed to load H5P content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading H5P content:', error);
      throw error;
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
      throw error;
    }
  };

  // Handle saving H5P content
  const handleSaveH5P = async () => {
    if (!h5pEditorRef.current) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await h5pEditorRef.current.save();
      onChange({
        ...config,
        contentId: result.contentId,
      });
    } catch (error) {
      console.error('Error saving H5P content:', error);
      setError('Failed to save H5P content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">H5P Content</h3>
        <p className="text-sm text-muted-foreground">
          Create or edit interactive H5P content for this activity.
        </p>
        
        <div className="h-[600px] border rounded-md">
          <H5PEditorUI
            ref={h5pEditorRef}
            contentId={config.contentId}
            loadContentCallback={loadH5PContent}
            saveContentCallback={saveH5PContent}
            onSaved={(data) => {
              onChange({
                ...config,
                contentId: data.contentId,
              });
            }}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveH5P} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save H5P Content'}
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

// H5P Activity Viewer Component
export const H5PViewer = ({ 
  config, 
  mode = 'student', 
  onInteraction 
}: { 
  config: H5PActivityConfig, 
  mode?: 'preview' | 'student' | 'teacher', 
  onInteraction?: (data: any) => void 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      throw error;
    }
  };

  // Handle xAPI statements from H5P content
  const handleXAPI = (statement: any) => {
    if (onInteraction) {
      onInteraction({
        type: 'xapi',
        statement
      });
    }
  };

  return (
    <div className="space-y-4">
      {config.instructions && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">Instructions</h3>
            <p>{config.instructions}</p>
          </CardContent>
        </Card>
      )}
      
      {config.contentId ? (
        <div className="h-[600px] border rounded-md">
          <H5PPlayerUI
            contentId={config.contentId}
            loadContentCallback={loadH5PContent}
            onxAPIStatement={handleXAPI}
            onInitialized={() => setLoading(false)}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">No H5P content has been created for this activity yet.</p>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// Register the H5P activity type
activityRegistry.register({
  id: 'h5p',
  name: 'H5P Activity',
  description: 'Create interactive H5P content for learners',
  category: ActivityPurpose.LEARNING,
  configSchema: h5pConfigSchema,
  defaultConfig: defaultH5PConfig,
  capabilities: {
    isGradable: true,
    hasSubmission: true,
    hasInteraction: true,
    hasRealTimeComponents: false,
  },
  components: {
    editor: H5PEditor,
    viewer: H5PViewer,
  },
});
```

## Database Schema Updates

We'll need to update our database schema to store H5P activity configurations:

```prisma
// prisma/schema.prisma (additions)

model Activity {
  // ... existing fields
  
  // For H5P activities
  h5pContentId String?
}

// New model for tracking H5P content completion
model H5PContentCompletion {
  id        String   @id @default(cuid())
  userId    String
  contentId String
  score     Int?
  maxScore  Int?
  completed Boolean  @default(false)
  progress  Float?   @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, contentId])
}
```

## Integration with Activity System

To fully integrate H5P activities into our existing activity system, we'll need to:

1. Add H5P activity type to the activity registry
2. Implement completion tracking for H5P activities
3. Add H5P content management to the admin interface

### Completion Tracking

We'll need to track user progress and completion for H5P activities:

```typescript
// src/server/api/h5p-completion-routes.ts
import express from 'express';
import { prisma } from '../db/client';

const router = express.Router();

// Endpoint to track H5P content completion
router.post('/completion', async (req, res) => {
  try {
    const { userId, contentId, score, maxScore, completed, progress } = req.body;
    
    const completion = await prisma.h5PContentCompletion.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        score,
        maxScore,
        completed,
        progress,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentId,
        score,
        maxScore,
        completed,
        progress
      }
    });
    
    res.json(completion);
  } catch (error) {
    console.error('Error tracking H5P completion:', error);
    res.status(500).json({ error: 'Error tracking H5P completion' });
  }
});

// Endpoint to get H5P content completion for a user
router.get('/completion/:userId/:contentId', async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    
    const completion = await prisma.h5PContentCompletion.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      }
    });
    
    res.json(completion || { completed: false, progress: 0 });
  } catch (error) {
    console.error('Error getting H5P completion:', error);
    res.status(500).json({ error: 'Error getting H5P completion' });
  }
});

export default router;
```

## Deployment Considerations

When deploying the H5P integration, consider the following:

1. **Storage**: H5P content can include large media files. Ensure your server has sufficient storage capacity.

2. **File Permissions**: The H5P server needs write access to the content, library, and temporary storage directories.

3. **Content Security Policy (CSP)**: H5P content may require adjustments to your CSP to allow scripts and media from various sources.

4. **Backup Strategy**: Implement regular backups of H5P content and libraries.

5. **Updates**: Keep the H5P libraries up to date to ensure compatibility and security.

## Future Enhancements

Potential future enhancements for the H5P integration:

1. **Content Library**: Create a shared library of H5P content that can be reused across courses.

2. **Analytics Dashboard**: Develop a dashboard to track learner engagement with H5P activities.

3. **Custom H5P Content Types**: Develop custom H5P content types specific to our platform's needs.

4. **Batch Import/Export**: Add functionality to import and export H5P content in bulk.

5. **Integration with LMS Standards**: Enhance the integration with LTI, SCORM, or xAPI standards.

## Conclusion

Implementing H5P activities in our LXP will significantly enhance the interactive learning experience for our users. The implementation outlined in this document provides a solid foundation for integrating H5P content creation, management, and delivery into our existing activity system.

By leveraging the `@lumieducation/h5p-react` and `@lumieducation/h5p-server` packages, we can provide a seamless experience for both content creators and learners, while maintaining the flexibility and extensibility of our platform.
