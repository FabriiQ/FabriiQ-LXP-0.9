import { CanvasMessage } from '../state/types';
import { MessageAdapter } from './types';

/**
 * Interface for legacy messages from Open Canvas
 */
export interface LegacyMessage {
  id: string;
  text?: string;
  sender: string;
  rawResponse?: Record<string, any>;
  toolCalls?: {
    id: string;
    name: string;
    args: string;
    result?: any;
  }[];
}

/**
 * Adapter for legacy messages from Open Canvas
 */
export class LegacyMessageAdapter implements MessageAdapter<LegacyMessage, CanvasMessage> {
  /**
   * Check if this adapter can handle the given message
   */
  canHandle(message: any): message is LegacyMessage {
    return (
      message &&
      typeof message === 'object' &&
      'id' in message &&
      'sender' in message
    );
  }

  /**
   * Convert from legacy format to our internal format
   */
  toInternal(message: LegacyMessage): CanvasMessage {
    // Map the sender to our role format
    let role: CanvasMessage['role'];
    switch (message.sender) {
      case 'user':
        role = 'user';
        break;
      case 'assistant':
      case 'ai':
        role = 'assistant';
        break;
      case 'system':
        role = 'system';
        break;
      default:
        role = 'error';
    }
    
    // Create our internal message format
    return {
      id: message.id,
      role,
      content: message.text || '',
      timestamp: Date.now(),
      metadata: {
        legacyId: message.id,
        rawResponse: message.rawResponse,
        toolCalls: message.toolCalls,
      },
    };
  }

  /**
   * Convert from our internal format to legacy format
   */
  toExternal(message: CanvasMessage): LegacyMessage {
    // Map our role to the legacy sender format
    let sender: string;
    switch (message.role) {
      case 'user':
        sender = 'user';
        break;
      case 'assistant':
        sender = 'assistant';
        break;
      case 'system':
        sender = 'system';
        break;
      case 'error':
        sender = 'error';
        break;
      default:
        sender = 'unknown';
    }
    
    // Create the legacy message format
    return {
      id: message.id,
      text: message.content,
      sender,
      rawResponse: message.metadata?.rawResponse,
      toolCalls: message.metadata?.toolCalls,
    };
  }
}
