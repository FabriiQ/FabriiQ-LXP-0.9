'use client';

import { useState, useRef, useEffect } from 'react';
import { useTeacherAssistant } from '../hooks/use-teacher-assistant';
import { Button } from '@/components/ui/core/button';
import { Textarea } from '@/components/ui/core/textarea';
import { SendHorizontal, Paperclip, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceService } from '../utils/voice';

interface MessageInputProps {
  className?: string;
}

/**
 * Component for sending messages to the teacher assistant
 *
 * Features:
 * - Auto-expanding textarea
 * - Send button
 * - Attachment button (placeholder)
 * - Voice input button (placeholder)
 */
export function MessageInput({ className }: MessageInputProps) {
  const { sendMessage, isTyping } = useTeacherAssistant();
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceServiceRef = useRef<VoiceService | null>(null);

  // Initialize voice service
  useEffect(() => {
    voiceServiceRef.current = new VoiceService();
    setIsVoiceSupported(voiceServiceRef.current.isSpeechRecognitionSupported());

    return () => {
      // Clean up voice service
      if (voiceServiceRef.current) {
        if (voiceServiceRef.current.isCurrentlyListening()) {
          voiceServiceRef.current.stopListening();
        }
        voiceServiceRef.current.stopSpeaking();
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message, interimTranscript]);

  const handleSend = () => {
    if (message.trim() && !isTyping) {
      sendMessage(message);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = async () => {
    if (!voiceServiceRef.current) return;

    if (isListening) {
      // Stop listening
      voiceServiceRef.current.stopListening();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      // Start listening
      setIsListening(true);

      try {
        const transcript = await voiceServiceRef.current.startListening(
          { language: 'en-US', interimResults: true },
          (text, isFinal) => {
            if (isFinal) {
              setMessage(prev => prev + ' ' + text);
              setInterimTranscript('');
            } else {
              setInterimTranscript(text);
            }
          }
        );

        // Add final transcript to message
        if (transcript && !message.includes(transcript)) {
          setMessage(prev => prev.trim() + ' ' + transcript.trim());
        }
      } catch (error) {
        console.error('Voice input error:', error);
      } finally {
        setIsListening(false);
        setInterimTranscript('');
      }
    }
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-end space-x-2">
        {/* Attachment button (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          aria-label="Add attachment"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          disabled={isTyping || isListening}
        />

        {/* Voice input button */}
        {isVoiceSupported && (
          <Button
            variant={isListening ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-9 w-9 flex-shrink-0 transition-colors",
              isListening && "bg-red-500 hover:bg-red-600 text-white"
            )}
            onClick={toggleVoiceInput}
            disabled={isTyping}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Send button */}
        <Button
          variant="default"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleSend}
          disabled={(!message.trim() && !interimTranscript) || isTyping}
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Voice input status */}
      {isListening && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          <span>
            {interimTranscript ?
              `"${interimTranscript}"` :
              "Listening... Speak now"
            }
          </span>
        </div>
      )}
    </div>
  );
}
