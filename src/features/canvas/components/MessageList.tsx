import React, { useState } from 'react';
import { useCanvas } from '../state/CanvasStateProvider';
import { CanvasMessage } from '../state/types';
import { MessageItem } from './MessageItem';
import { MessageThread } from './MessageThread';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface MessageListProps {
  className?: string;
}

/**
 * Component for displaying a list of messages with threading support
 */
export const MessageList: React.FC<MessageListProps> = ({ className }) => {
  const { state, addMessage, addThreadedMessage, createThread, selectors } = useCanvas();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<CanvasMessage | null>(null);
  
  // Get root messages (messages without a parent)
  const rootMessages = selectors.selectRootMessages(state);
  
  // Handle starting a reply to a message
  const handleStartReply = (parentId: string) => {
    setReplyToId(parentId);
    setNewMessage('');
  };
  
  // Handle canceling a reply
  const handleCancelReply = () => {
    setReplyToId(null);
    setNewMessage('');
  };
  
  // Handle submitting a reply
  const handleSubmitReply = () => {
    if (!replyToId || !newMessage.trim()) return;
    
    const parentMessage = state.messages.find(msg => msg.id === replyToId);
    
    if (!parentMessage) return;
    
    // If parent is already part of a thread, add to that thread
    if (parentMessage.threadId) {
      addThreadedMessage(replyToId, {
        role: 'user',
        content: newMessage,
      });
    } 
    // If parent is not part of a thread, create a new thread
    else {
      // First, create a thread with the parent message as root
      createThread({
        role: parentMessage.role,
        content: parentMessage.content,
        metadata: parentMessage.metadata,
      });
      
      // Then add the reply to the newly created thread
      // Note: In a real implementation, you'd need to handle this more robustly
      // by waiting for the thread creation to complete
      setTimeout(() => {
        const newThreadId = Object.keys(state.threads).sort().pop();
        if (newThreadId) {
          const threadRootMessage = selectors.selectThreadRootMessage(state, newThreadId);
          if (threadRootMessage) {
            addThreadedMessage(threadRootMessage.id, {
              role: 'user',
              content: newMessage,
            });
          }
        }
      }, 100);
    }
    
    // Reset state
    setReplyToId(null);
    setNewMessage('');
  };
  
  // Handle editing a message
  const handleEditMessage = (message: CanvasMessage) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };
  
  // Handle regenerating a message (for assistant messages)
  const handleRegenerateMessage = (message: CanvasMessage) => {
    // In a real implementation, this would call the AI to regenerate the message
    console.log('Regenerating message:', message);
  };
  
  return (
    <div className={className}>
      {/* Message list */}
      <div className="space-y-4">
        {rootMessages.map(message => {
          // Check if this message is a thread root
          const isThreadRoot = message.isThreadRoot || 
            (message.threadId && selectors.selectThreadRootMessage(state, message.threadId)?.id === message.id);
          
          if (isThreadRoot && message.threadId) {
            // Render as a thread
            return (
              <MessageThread
                key={message.id}
                rootMessage={message}
                threadId={message.threadId}
                onReply={handleStartReply}
              />
            );
          } else {
            // Render as a standalone message
            return (
              <div key={message.id}>
                <MessageItem
                  message={message}
                  onEdit={handleEditMessage}
                  onRegenerate={handleRegenerateMessage}
                />
                
                {/* Reply button for standalone messages */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-xs ml-2 mt-1"
                  onClick={() => handleStartReply(message.id)}
                >
                  <Plus className="h-3 w-3" />
                  <MessageSquare className="h-3 w-3" />
                  Reply
                </Button>
              </div>
            );
          }
        })}
      </div>
      
      {/* Reply input */}
      {replyToId && (
        <div className="mt-4 p-3 border rounded-lg bg-gray-50">
          <div className="text-sm font-medium mb-2">
            Replying to message
          </div>
          
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            className="min-h-[100px]"
          />
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleCancelReply}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitReply} disabled={!newMessage.trim()}>
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
