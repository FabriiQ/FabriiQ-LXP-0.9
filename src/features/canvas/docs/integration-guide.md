# Canvas Integration Guide

This document provides guidance on integrating the Canvas components with the AI Studio application.

## Overview

The Canvas system provides a set of components for creating, editing, and rendering educational content. It includes:

1. **Content Composer**: A component for creating and editing content
2. **Artifact Renderer**: A component for rendering different types of content
3. **Canvas State Provider**: A state management system for Canvas
4. **Adapter System**: A system for converting between different content formats

## Integration Points

### 1. Canvas State Provider

The `CanvasStateProvider` is the main entry point for integrating Canvas with your application. It provides a context that can be used by all Canvas components.

```tsx
import { CanvasProvider } from '@/features/canvas/state/CanvasStateProvider';

function MyApp() {
  return (
    <CanvasProvider canvasId="my-canvas">
      {/* Your application content */}
    </CanvasProvider>
  );
}
```

### 2. Content Composer

The `ContentComposer` component can be used to create and edit content. It requires an agent ID to send messages to.

```tsx
import { ContentComposer } from '@/features/canvas/composers/ContentComposer';

function MyComponent() {
  return (
    <ContentComposer 
      agentId="my-agent" 
      placeholder="Ask a question..." 
    />
  );
}
```

### 3. Artifact Renderer

The `ArtifactRenderer` component can be used to render different types of content. It requires an artifact object.

```tsx
import { ArtifactRenderer } from '@/features/canvas/artifacts/ArtifactRenderer';

function MyComponent({ artifact }) {
  return (
    <ArtifactRenderer 
      artifact={artifact} 
      isPrintMode={false} 
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

### 4. Adapter System

The adapter system can be used to convert between different content formats. It provides a registry for registering adapters and methods for converting content.

```tsx
import { adapterRegistry } from '@/features/canvas/adapters';

// Convert a legacy artifact to our internal format
const internalArtifact = adapterRegistry.convertArtifactToInternal(legacyArtifact);

// Convert our internal artifact to a legacy format
const legacyArtifact = adapterRegistry.convertArtifactToExternal(internalArtifact, 'legacy');
```

## Dependencies

The Canvas system has the following dependencies:

1. **React**: The Canvas components are built with React
2. **Next.js**: The Canvas components are designed to work with Next.js
3. **Agent System**: The Canvas components require an agent system to function properly
4. **Storage System**: The Canvas state is persisted using a storage system

## Migration from Legacy Canvas

If you are migrating from the legacy Canvas system, you can use the adapter system to convert between the legacy and new formats.

1. Use the `LegacyArtifactAdapter` to convert legacy artifacts to our internal format
2. Use the `LegacyMessageAdapter` to convert legacy messages to our internal format
3. Update your components to use the new Canvas components

## Best Practices

1. **Use the Canvas State Provider**: Always wrap your application with the Canvas State Provider
2. **Use the Adapter System**: Use the adapter system to convert between different content formats
3. **Use the Renderer Registry**: Use the renderer registry to render different types of content
4. **Use the Content Composer**: Use the Content Composer to create and edit content
5. **Use the Artifact Renderer**: Use the Artifact Renderer to render content

## Troubleshooting

If you encounter issues with the Canvas integration, check the following:

1. **Canvas State Provider**: Make sure the Canvas State Provider is properly configured
2. **Agent System**: Make sure the agent system is properly configured
3. **Storage System**: Make sure the storage system is properly configured
4. **Adapters**: Make sure the adapters are properly registered
5. **Renderers**: Make sure the renderers are properly registered
