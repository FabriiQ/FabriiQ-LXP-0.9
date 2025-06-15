import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../state/CanvasStateProvider';
import { useAgentOrchestrator } from '../../agents/core/AgentOrchestratorProvider';
import { adapterRegistry } from '../adapters';
import { cn } from '@/lib/utils';

interface ContentComposerProps {
  agentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onMessageSent?: (message: string) => void;
  disabled?: boolean;
  showAttachments?: boolean;
  maxLength?: number;
}

export const ContentComposer: React.FC<ContentComposerProps> = ({
  agentId,
  placeholder = 'Type your message here...',
  autoFocus = true,
  className = '',
  onMessageSent,
  disabled = false,
  showAttachments = false,
  maxLength,
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { addMessage } = useCanvas();
  const { activeAgentId, sendMessage } = useAgentOrchestrator();

  const effectiveAgentId = agentId || activeAgentId;

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting || !effectiveAgentId || disabled) return;

    try {
      setIsSubmitting(true);

      // Add user message to canvas
      addMessage({
        role: 'user',
        content: message,
      });

      // Notify parent component if callback provided
      if (onMessageSent) {
        onMessageSent(message);
      }

      // Send message to agent
      const response = await sendMessage(effectiveAgentId, message);

      // Add agent response to canvas
      addMessage({
        role: 'assistant',
        content: response.message.content,
        metadata: response.message.metadata,
      });

      // Add any artifacts from the response
      if (response.artifacts && response.artifacts.length > 0) {
        // Convert artifacts using adapter registry if available
        response.artifacts.forEach(artifact => {
          try {
            // Try to convert the artifact to our internal format
            const convertedArtifact = adapterRegistry.convertArtifactToInternal(artifact);

            if (convertedArtifact) {
              // Add the converted artifact to the canvas
              addMessage({
                role: 'assistant',
                content: `Generated ${convertedArtifact.type} artifact`,
                metadata: {
                  artifactContent: convertedArtifact,
                  isArtifactReference: true,
                },
              });
            } else {
              console.warn('Could not convert artifact:', artifact);
            }
          } catch (error) {
            console.error('Error converting artifact:', error);
          }
        });
      }

      // Clear the input
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message to canvas
      addMessage({
        role: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("content-composer border border-gray-200 rounded-lg p-4 bg-white shadow-sm", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              // Handle maxLength if provided
              if (maxLength && e.target.value.length > maxLength) {
                setMessage(e.target.value.slice(0, maxLength));
              } else {
                setMessage(e.target.value);
              }
            }}
            placeholder={placeholder}
            disabled={isSubmitting || !effectiveAgentId || disabled}
            className="w-full min-h-[60px] p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            maxLength={maxLength}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* Character count if maxLength is provided */}
          {maxLength && (
            <div className="absolute bottom-2 right-12 text-xs text-gray-500">
              {message.length}/{maxLength}
            </div>
          )}

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting || !effectiveAgentId || disabled}
            className="absolute right-3 bottom-3 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>

        {/* Attachment buttons */}
        {showAttachments && (
          <div className="flex items-center gap-2 px-2">
            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Attach file"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Attach image"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Attach code"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </form>

      {!effectiveAgentId && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          No agent selected. Please select or create an agent to start a conversation.
        </div>
      )}

      {/* Mobile-specific optimizations */}
      <style jsx>{`
        @media (max-width: 640px) {
          .content-composer {
            padding: 0.75rem;
            border-radius: 0.5rem;
          }

          textarea {
            font-size: 16px; /* Prevents iOS zoom on focus */
          }
        }
      `}</style>
    </div>
  );
};
