import { CanvasArtifact } from '../state/types';
import { 
  ArtifactAdapter, 
  ArtifactContent, 
  CodeArtifactContent, 
  LegacyArtifact, 
  MarkdownArtifactContent 
} from './types';

/**
 * Adapter for legacy artifacts from Open Canvas
 */
export class LegacyArtifactAdapter implements ArtifactAdapter<LegacyArtifact, ArtifactContent> {
  /**
   * Check if this adapter can handle the given artifact
   */
  canHandle(artifact: any): artifact is LegacyArtifact {
    return (
      artifact &&
      typeof artifact === 'object' &&
      'id' in artifact &&
      'contents' in artifact &&
      Array.isArray(artifact.contents) &&
      'currentContentIndex' in artifact
    );
  }

  /**
   * Convert from legacy format to our internal format
   */
  toInternal(artifact: LegacyArtifact): ArtifactContent {
    // Get the current content based on the index
    const currentContent = artifact.contents[artifact.currentContentIndex];
    
    if (!currentContent) {
      throw new Error('Invalid legacy artifact: no current content found');
    }
    
    // Convert based on the content type
    if (currentContent.type === 'code') {
      return {
        type: 'code',
        title: currentContent.title,
        content: currentContent.content,
        language: currentContent.language,
        metadata: {
          legacyId: artifact.id,
          contentIndex: currentContent.index,
        },
      } as CodeArtifactContent;
    } else if (currentContent.type === 'text') {
      return {
        type: 'markdown',
        title: currentContent.title,
        content: currentContent.content,
        metadata: {
          legacyId: artifact.id,
          contentIndex: currentContent.index,
        },
      } as MarkdownArtifactContent;
    } else {
      throw new Error(`Unsupported legacy content type: ${currentContent.type}`);
    }
  }

  /**
   * Convert from our internal format to legacy format
   */
  toExternal(artifact: ArtifactContent): LegacyArtifact {
    // Create a new legacy artifact
    const legacyArtifact: LegacyArtifact = {
      id: artifact.metadata?.legacyId || `legacy-${Date.now()}`,
      contents: [],
      currentContentIndex: 0,
    };
    
    // Convert based on the artifact type
    if (artifact.type === 'code') {
      const codeArtifact = artifact as CodeArtifactContent;
      legacyArtifact.contents.push({
        index: 0,
        content: codeArtifact.content,
        title: codeArtifact.title || 'Code',
        type: 'code',
        language: codeArtifact.language,
      });
    } else if (artifact.type === 'markdown') {
      const markdownArtifact = artifact as MarkdownArtifactContent;
      legacyArtifact.contents.push({
        index: 0,
        content: markdownArtifact.content,
        title: markdownArtifact.title || 'Text',
        type: 'text',
        language: 'markdown',
      });
    } else {
      // For other types, convert to markdown as a fallback
      legacyArtifact.contents.push({
        index: 0,
        content: JSON.stringify(artifact.content, null, 2),
        title: artifact.title || 'Converted Content',
        type: 'text',
        language: 'markdown',
      });
    }
    
    return legacyArtifact;
  }
}
