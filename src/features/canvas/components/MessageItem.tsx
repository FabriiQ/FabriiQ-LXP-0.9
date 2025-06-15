import React from 'react';
import { CanvasMessage } from '../state/types';
import { useCanvas } from '../state/CanvasStateProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageItemProps {
  message: CanvasMessage;
  onEdit?: (message: CanvasMessage) => void;
  onRegenerate?: (message: CanvasMessage) => void;
}

/**
 * Component for displaying a single message
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEdit,
  onRegenerate,
}) => {
  const { deleteMessage } = useCanvas();

  // Get avatar and name based on role
  const getAvatarInfo = (role: CanvasMessage['role']) => {
    switch (role) {
      case 'system':
        return { name: 'System', avatar: '/avatars/system.png', bgColor: 'bg-gray-500' };
      case 'user':
        return { name: 'You', avatar: '/avatars/user.png', bgColor: 'bg-blue-500' };
      case 'assistant':
        return { name: 'AI', avatar: '/avatars/assistant.png', bgColor: 'bg-green-500' };
      case 'error':
        return { name: 'Error', avatar: '/avatars/error.png', bgColor: 'bg-red-500' };
      default:
        return { name: 'Unknown', avatar: '', bgColor: 'bg-gray-300' };
    }
  };

  const { name, avatar, bgColor } = getAvatarInfo(message.role);

  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle message deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message.id);
    }
  };

  return (
    <div className={cn(
      'message-item p-4 rounded-lg',
      message.role === 'user' ? 'bg-blue-50' :
      message.role === 'assistant' ? 'bg-green-50' :
      message.role === 'system' ? 'bg-gray-50' :
      message.role === 'error' ? 'bg-red-50' : 'bg-white'
    )}>
      <div className="flex items-start gap-3">
        <Avatar className={cn('h-8 w-8', bgColor)}>
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{formattedTime}</div>
          </div>

          <div className="message-content prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !className?.includes('language-');

                  return isInline ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={(match && match[1]) || 'text'}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Message actions */}
      <div className="message-actions flex gap-1 justify-end mt-2">
        {message.role === 'user' && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onEdit(message)}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
        )}

        {message.role === 'assistant' && onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onRegenerate(message)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only">Regenerate</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageItem;
