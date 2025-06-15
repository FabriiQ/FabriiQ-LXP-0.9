import React, { useState } from 'react';
import { CanvasMessage } from '../state/types';
import { useCanvas } from '../state/CanvasStateProvider';
import { MessageItem } from './MessageItem';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MessageSquare, Plus } from 'lucide-react';

interface MessageThreadProps {
  rootMessage: CanvasMessage;
  threadId: string;
  collapsed?: boolean;
  onReply?: (parentId: string) => void;
}

/**
 * Component for displaying a thread of messages
 */
export const MessageThread: React.FC<MessageThreadProps> = ({
  rootMessage,
  threadId,
  collapsed: initialCollapsed = false,
  onReply,
}) => {
  const { state, collapseThread, selectors } = useCanvas();
  const [localCollapsed, setLocalCollapsed] = useState(initialCollapsed);
  
  // Get thread state from context
  const thread = selectors.selectThreadById(state, threadId);
  const isCollapsed = thread?.collapsed ?? localCollapsed;
  
  // Get child messages
  const childMessages = selectors.selectChildMessages(state, rootMessage.id);
  
  // Toggle collapsed state
  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setLocalCollapsed(newCollapsedState);
    
    // If thread exists in state, update it
    if (thread) {
      collapseThread(threadId, newCollapsedState);
    }
  };
  
  // Handle reply to thread
  const handleReply = () => {
    if (onReply) {
      onReply(rootMessage.id);
    }
  };
  
  return (
    <div className="message-thread">
      {/* Root message */}
      <div className="message-thread-root">
        <MessageItem message={rootMessage} />
        
        {/* Thread controls */}
        <div className="flex items-center gap-2 mt-1 ml-2">
          {childMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {childMessages.length} {childMessages.length === 1 ? 'reply' : 'replies'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs"
            onClick={handleReply}
          >
            <Plus className="h-3 w-3" />
            <MessageSquare className="h-3 w-3" />
            Reply
          </Button>
        </div>
      </div>
      
      {/* Child messages */}
      {!isCollapsed && childMessages.length > 0 && (
        <div className="message-thread-replies pl-6 border-l-2 border-gray-200 ml-4 mt-2">
          {childMessages.map(childMessage => (
            <div key={childMessage.id} className="mb-2">
              <MessageItem message={childMessage} />
              
              {/* Allow replies to replies */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs ml-2 mt-1"
                onClick={() => onReply?.(childMessage.id)}
              >
                <Plus className="h-3 w-3" />
                <MessageSquare className="h-3 w-3" />
                Reply
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageThread;
