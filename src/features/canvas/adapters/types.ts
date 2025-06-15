/**
 * Canvas Adapter System Types
 * 
 * This file defines the TypeScript interfaces for the Canvas Adapter system,
 * which bridges between the legacy Canvas implementation and our new system.
 */

import { CanvasArtifact, CanvasMessage } from '../state/types';

/**
 * Supported artifact types in the Canvas system
 */
export type ArtifactType = 
  | 'markdown'
  | 'code'
  | 'table'
  | 'image'
  | 'question'
  | 'worksheet'
  | 'assessment'
  | 'video'
  | 'math';

/**
 * Base interface for all artifact content
 */
export interface BaseArtifactContent {
  type: ArtifactType;
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Markdown artifact content
 */
export interface MarkdownArtifactContent extends BaseArtifactContent {
  type: 'markdown';
  content: string;
}

/**
 * Code artifact content
 */
export interface CodeArtifactContent extends BaseArtifactContent {
  type: 'code';
  content: string;
  language: string;
}

/**
 * Table artifact content
 */
export interface TableArtifactContent extends BaseArtifactContent {
  type: 'table';
  content: any[][];
  headers?: string[];
}

/**
 * Image artifact content
 */
export interface ImageArtifactContent extends BaseArtifactContent {
  type: 'image';
  content: string; // URL or base64
  alt?: string;
}

/**
 * Question artifact content
 */
export interface QuestionArtifactContent extends BaseArtifactContent {
  type: 'question';
  content: {
    question: string;
    options?: string[];
    correctAnswer?: string | number;
    explanation?: string;
  };
}

/**
 * Worksheet artifact content
 */
export interface WorksheetArtifactContent extends BaseArtifactContent {
  type: 'worksheet';
  content: {
    title: string;
    description?: string;
    sections: {
      title: string;
      content: string;
    }[];
    questions?: QuestionArtifactContent['content'][];
  };
}

/**
 * Assessment artifact content
 */
export interface AssessmentArtifactContent extends BaseArtifactContent {
  type: 'assessment';
  content: {
    title: string;
    description?: string;
    questions: QuestionArtifactContent['content'][];
    passingScore?: number;
    timeLimit?: number;
  };
}

/**
 * Video artifact content
 */
export interface VideoArtifactContent extends BaseArtifactContent {
  type: 'video';
  content: string; // URL
  caption?: string;
}

/**
 * Math artifact content
 */
export interface MathArtifactContent extends BaseArtifactContent {
  type: 'math';
  content: string; // LaTeX or MathML
}

/**
 * Union type of all artifact content types
 */
export type ArtifactContent =
  | MarkdownArtifactContent
  | CodeArtifactContent
  | TableArtifactContent
  | ImageArtifactContent
  | QuestionArtifactContent
  | WorksheetArtifactContent
  | AssessmentArtifactContent
  | VideoArtifactContent
  | MathArtifactContent;

/**
 * Legacy artifact format from Open Canvas
 */
export interface LegacyArtifact {
  id: string;
  contents: {
    index: number;
    content: string;
    title: string;
    type: 'code' | 'text';
    language: string;
  }[];
  currentContentIndex: number;
}

/**
 * Interface for artifact adapters
 */
export interface ArtifactAdapter<T = any, R = ArtifactContent> {
  /**
   * Check if this adapter can handle the given artifact
   */
  canHandle(artifact: T): boolean;
  
  /**
   * Convert from external format to our internal format
   */
  toInternal(artifact: T): R;
  
  /**
   * Convert from our internal format to external format
   */
  toExternal(artifact: R): T;
}

/**
 * Interface for message adapters
 */
export interface MessageAdapter<T = any, R = CanvasMessage> {
  /**
   * Check if this adapter can handle the given message
   */
  canHandle(message: T): boolean;
  
  /**
   * Convert from external format to our internal format
   */
  toInternal(message: T): R;
  
  /**
   * Convert from our internal format to external format
   */
  toExternal(message: R): T;
}

/**
 * Registry for artifact adapters
 */
export interface AdapterRegistry {
  /**
   * Register an artifact adapter
   */
  registerArtifactAdapter(adapter: ArtifactAdapter): void;
  
  /**
   * Register a message adapter
   */
  registerMessageAdapter(adapter: MessageAdapter): void;
  
  /**
   * Get an artifact adapter that can handle the given artifact
   */
  getArtifactAdapter<T>(artifact: T): ArtifactAdapter<T> | null;
  
  /**
   * Get a message adapter that can handle the given message
   */
  getMessageAdapter<T>(message: T): MessageAdapter<T> | null;
  
  /**
   * Convert an external artifact to our internal format
   */
  convertArtifactToInternal<T>(artifact: T): ArtifactContent | null;
  
  /**
   * Convert our internal artifact to external format
   */
  convertArtifactToExternal<R>(artifact: ArtifactContent, targetType: string): R | null;
  
  /**
   * Convert an external message to our internal format
   */
  convertMessageToInternal<T>(message: T): CanvasMessage | null;
  
  /**
   * Convert our internal message to external format
   */
  convertMessageToExternal<R>(message: CanvasMessage, targetType: string): R | null;
}
