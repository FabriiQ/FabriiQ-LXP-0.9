import { CanvasArtifact, CanvasMessage } from '../state/types';
import { 
  AdapterRegistry as IAdapterRegistry,
  ArtifactAdapter, 
  ArtifactContent, 
  MessageAdapter 
} from './types';

/**
 * Implementation of the adapter registry
 */
export class AdapterRegistry implements IAdapterRegistry {
  private static instance: AdapterRegistry;
  private artifactAdapters: ArtifactAdapter[] = [];
  private messageAdapters: MessageAdapter[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  /**
   * Register an artifact adapter
   */
  public registerArtifactAdapter(adapter: ArtifactAdapter): void {
    this.artifactAdapters.push(adapter);
  }

  /**
   * Register a message adapter
   */
  public registerMessageAdapter(adapter: MessageAdapter): void {
    this.messageAdapters.push(adapter);
  }

  /**
   * Get an artifact adapter that can handle the given artifact
   */
  public getArtifactAdapter<T>(artifact: T): ArtifactAdapter<T> | null {
    for (const adapter of this.artifactAdapters) {
      if (adapter.canHandle(artifact)) {
        return adapter as ArtifactAdapter<T>;
      }
    }
    return null;
  }

  /**
   * Get a message adapter that can handle the given message
   */
  public getMessageAdapter<T>(message: T): MessageAdapter<T> | null {
    for (const adapter of this.messageAdapters) {
      if (adapter.canHandle(message)) {
        return adapter as MessageAdapter<T>;
      }
    }
    return null;
  }

  /**
   * Convert an external artifact to our internal format
   */
  public convertArtifactToInternal<T>(artifact: T): ArtifactContent | null {
    const adapter = this.getArtifactAdapter(artifact);
    if (adapter) {
      return adapter.toInternal(artifact) as ArtifactContent;
    }
    return null;
  }

  /**
   * Convert our internal artifact to external format
   */
  public convertArtifactToExternal<R>(artifact: ArtifactContent, targetType: string): R | null {
    // Find an adapter that can convert to the target type
    for (const adapter of this.artifactAdapters) {
      try {
        // This is a simplistic approach - in a real implementation, we would have
        // more sophisticated logic to determine if an adapter can convert to a specific target type
        const result = adapter.toExternal(artifact);
        if (result && typeof result === 'object' && 'type' in result && result.type === targetType) {
          return result as R;
        }
      } catch (error) {
        console.error('Error converting artifact to external format:', error);
      }
    }
    return null;
  }

  /**
   * Convert an external message to our internal format
   */
  public convertMessageToInternal<T>(message: T): CanvasMessage | null {
    const adapter = this.getMessageAdapter(message);
    if (adapter) {
      return adapter.toInternal(message);
    }
    return null;
  }

  /**
   * Convert our internal message to external format
   */
  public convertMessageToExternal<R>(message: CanvasMessage, targetType: string): R | null {
    // Find an adapter that can convert to the target type
    for (const adapter of this.messageAdapters) {
      try {
        // This is a simplistic approach - in a real implementation, we would have
        // more sophisticated logic to determine if an adapter can convert to a specific target type
        const result = adapter.toExternal(message);
        if (result && typeof result === 'object' && 'type' in result && result.type === targetType) {
          return result as R;
        }
      } catch (error) {
        console.error('Error converting message to external format:', error);
      }
    }
    return null;
  }
}
