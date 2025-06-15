import React, { useMemo, useState } from 'react';
import { CanvasArtifact } from '../state/types';
import { ArtifactContent } from '../adapters/types';
import { cn } from '@/lib/utils';

// Import real renderer components
import { MarkdownRenderer } from './renderers/MarkdownRenderer';
import { CodeRenderer } from './renderers/CodeRenderer';
import { TableRenderer } from './renderers/TableRenderer';
import { QuestionRenderer } from './renderers/QuestionRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { VideoRenderer } from './renderers/VideoRenderer';
import { MathRenderer } from './renderers/MathRenderer';
import { WorksheetRenderer } from './renderers/WorksheetRenderer';
import { AssessmentRenderer } from './renderers/AssessmentRenderer';

// Define the renderer plugin interface
export interface RendererPlugin {
  type: string;
  mimeTypes?: string[];
  fileExtensions?: string[];
  canRender: (artifact: CanvasArtifact | ArtifactContent) => boolean;
  render: (artifact: CanvasArtifact | ArtifactContent, isPrintMode: boolean) => React.ReactNode;
  priority?: number; // Higher priority renderers are checked first
}

// Create a registry for renderer plugins
export class RendererRegistry {
  private static instance: RendererRegistry;
  private renderers: RendererPlugin[] = [];

  private constructor() {
    // Initialize with built-in renderers
    this.registerBuiltInRenderers();
  }

  public static getInstance(): RendererRegistry {
    if (!RendererRegistry.instance) {
      RendererRegistry.instance = new RendererRegistry();
    }
    return RendererRegistry.instance;
  }

  public register(renderer: RendererPlugin): void {
    this.renderers.push(renderer);
  }

  public unregister(type: string): void {
    this.renderers = this.renderers.filter(r => r.type !== type);
  }

  public getRenderer(artifact: CanvasArtifact | ArtifactContent): RendererPlugin | undefined {
    // First try to find a renderer by exact type match
    let renderer = this.renderers.find(r => r.type === (artifact as any).type);

    // If not found, try to find a renderer that can handle this artifact
    if (!renderer) {
      // Sort renderers by priority (higher first) before finding one that can render
      const sortedRenderers = [...this.renderers].sort((a, b) =>
        (b.priority || 0) - (a.priority || 0)
      );

      renderer = sortedRenderers.find(r => r.canRender(artifact));
    }

    return renderer;
  }

  public getAllRenderers(): RendererPlugin[] {
    return [...this.renderers];
  }

  private registerBuiltInRenderers(): void {
    // Markdown renderer
    this.register({
      type: 'markdown',
      mimeTypes: ['text/markdown', 'text/x-markdown'],
      fileExtensions: ['.md', '.markdown'],
      canRender: (artifact) => artifact.type === 'markdown',
      render: (artifact, isPrintMode) => (
        <MarkdownRenderer content={artifact.content} isPrintMode={isPrintMode} />
      ),
    });

    // Code renderer
    this.register({
      type: 'code',
      mimeTypes: ['text/plain', 'application/javascript', 'text/css', 'text/html'],
      fileExtensions: ['.js', '.ts', '.css', '.html', '.py', '.java', '.cpp'],
      canRender: (artifact) => artifact.type === 'code',
      render: (artifact, isPrintMode) => (
        <CodeRenderer
          content={artifact.content}
          language={artifact.metadata?.language}
          isPrintMode={isPrintMode}
        />
      ),
    });

    // Table renderer
    this.register({
      type: 'table',
      mimeTypes: ['application/json'],
      fileExtensions: ['.json', '.csv'],
      canRender: (artifact) => artifact.type === 'table',
      render: (artifact, isPrintMode) => (
        <TableRenderer data={artifact.content} isPrintMode={isPrintMode} />
      ),
    });

    // Image renderer
    this.register({
      type: 'image',
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
      fileExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
      canRender: (artifact) =>
        artifact.type === 'image' ||
        (artifact.metadata?.mimeType && artifact.metadata.mimeType.startsWith('image/')),
      render: (artifact, isPrintMode) => (
        <ImageRenderer
          src={artifact.content}
          alt={artifact.metadata?.alt}
          isPrintMode={isPrintMode}
        />
      ),
    });

    // Video renderer
    this.register({
      type: 'video',
      mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
      fileExtensions: ['.mp4', '.webm', '.ogg'],
      canRender: (artifact) =>
        artifact.type === 'video' ||
        (artifact.metadata?.mimeType && typeof artifact.metadata.mimeType === 'string' && artifact.metadata.mimeType.startsWith('video/')),
      render: (artifact, isPrintMode) => (
        <VideoRenderer
          src={artifact.content}
          title={artifact.metadata?.title}
          poster={artifact.metadata?.poster}
          isPrintMode={isPrintMode}
        />
      ),
    });

    // Math renderer
    this.register({
      type: 'math',
      mimeTypes: ['application/x-tex', 'application/x-latex'],
      fileExtensions: ['.tex', '.latex'],
      canRender: (artifact) =>
        artifact.type === 'math' ||
        (typeof artifact.content === 'string' && artifact.content.includes('$$')),
      render: (artifact, isPrintMode) => (
        <MathRenderer
          content={artifact.content}
          isInline={artifact.metadata?.isInline}
          isPrintMode={isPrintMode}
        />
      ),
    });

    // Question renderer
    this.register({
      type: 'question',
      canRender: (artifact) => artifact.type === 'question',
      render: (artifact, isPrintMode) => (
        <QuestionRenderer
          question={artifact.content}
          isPrintMode={isPrintMode}
          showAnswer={artifact.metadata?.showAnswer}
        />
      ),
    });

    // Worksheet renderer
    this.register({
      type: 'worksheet',
      canRender: (artifact) => artifact.type === 'worksheet',
      render: (artifact, isPrintMode) => (
        <WorksheetRenderer
          worksheet={artifact.content}
          isPrintMode={isPrintMode}
          showAnswers={artifact.metadata?.showAnswers}
        />
      ),
    });

    // Assessment renderer
    this.register({
      type: 'assessment',
      canRender: (artifact) => artifact.type === 'assessment',
      render: (artifact, isPrintMode) => (
        <AssessmentRenderer
          assessment={artifact.content}
          isPrintMode={isPrintMode}
          showAnswers={artifact.metadata?.showAnswers}
        />
      ),
    });
  }
}

interface ArtifactRendererProps {
  artifact: CanvasArtifact | ArtifactContent;
  className?: string;
  isPrintMode?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onExport?: (id: string, format: string) => void;
  rendererRegistry?: RendererRegistry;
  showToolbar?: boolean;
  title?: string;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
  className = '',
  isPrintMode = false,
  onEdit,
  onDelete,
  onExport,
  rendererRegistry,
  showToolbar = true,
  title,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Use the provided registry or get the singleton instance
  const registry = useMemo(() => rendererRegistry || RendererRegistry.getInstance(), [rendererRegistry]);

  // Convert artifact if needed using adapter registry
  const processedArtifact = useMemo(() => {
    // If it's already a CanvasArtifact, use it directly
    if ('id' in artifact) {
      return artifact as CanvasArtifact;
    }

    // If it's an ArtifactContent, try to convert it to a CanvasArtifact
    try {
      // Create a temporary CanvasArtifact
      return {
        id: `temp-${Date.now()}`,
        type: (artifact as ArtifactContent).type,
        content: (artifact as ArtifactContent).content,
        timestamp: Date.now(),
        metadata: (artifact as ArtifactContent).metadata || {},
      } as CanvasArtifact;
    } catch (error) {
      console.error('Error converting artifact:', error);
      return artifact;
    }
  }, [artifact]);

  // Get the artifact ID safely
  const artifactId = 'id' in processedArtifact ? processedArtifact.id : `temp-${Date.now()}`;

  // Get the artifact type safely
  const artifactType = 'type' in processedArtifact ? processedArtifact.type : 'unknown';

  // Render artifact content using the registry
  const renderArtifactContent = () => {
    const renderer = registry.getRenderer(processedArtifact);

    if (renderer) {
      return renderer.render(processedArtifact, isPrintMode);
    }

    // Fallback for unknown artifact types
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h3 className="text-lg font-medium mb-2">Unknown Content Type</h3>
        <p className="mb-2">Cannot render content of type: {artifactType}</p>
        <details className="text-sm">
          <summary className="cursor-pointer hover:text-red-800">View raw content</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-[300px] text-xs">
            {JSON.stringify(processedArtifact.content, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle export
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(artifactId, format);
    }
    setShowExportOptions(false);
  };

  return (
    <div
      className={cn(
        "artifact-container border border-gray-200 rounded-lg overflow-hidden bg-white mb-4 shadow-sm transition-all",
        isFullscreen && "fixed inset-0 z-50 m-0 rounded-none shadow-2xl",
        className
      )}
      data-artifact-id={artifactId}
      data-artifact-type={artifactType}
    >
      {/* Artifact header with title and actions */}
      {(title || showToolbar) && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          {title && <h3 className="font-medium text-gray-700">{title}</h3>}

          {showToolbar && (
            <div className="flex items-center space-x-1">
              {/* Fullscreen toggle */}
              <button
                className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h4a1 1 0 000-2v-1a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Export dropdown */}
              {onExport && (
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    aria-label="Export options"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {showExportOptions && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <ul className="py-1">
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleExport('pdf')}
                          >
                            PDF
                          </button>
                        </li>
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleExport('docx')}
                          >
                            Word (DOCX)
                          </button>
                        </li>
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleExport('html')}
                          >
                            HTML
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Edit button */}
              {onEdit && (
                <button
                  className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => onEdit(artifactId)}
                  aria-label="Edit artifact"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}

              {/* Delete button */}
              {onDelete && (
                <button
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  onClick={() => onDelete(artifactId)}
                  aria-label="Delete artifact"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Artifact content */}
      <div className="p-4">{renderArtifactContent()}</div>

      {/* Mobile-specific optimizations */}
      <style jsx>{`
        @media (max-width: 640px) {
          .artifact-container {
            margin-bottom: 1rem;
          }
        }

        @media print {
          .artifact-container {
            border: none;
            box-shadow: none;
            margin-bottom: 1rem;
            break-inside: avoid;
          }

          .artifact-header {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
