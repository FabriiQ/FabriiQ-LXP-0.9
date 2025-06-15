'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/core/button';
import { ArrowRight, Mic } from 'lucide-react';
import { useStudentAssistant } from '../hooks/use-student-assistant';
import { cn } from '@/lib/utils';
import 'regenerator-runtime/runtime';

interface MessageInputProps {
  className?: string;
  placeholder?: string;
}

/**
 * MessageInput component
 *
 * Input field for sending messages to the assistant
 *
 * @param props Component props
 * @returns JSX element
 */
export function MessageInput({ className, placeholder = "Ask a question..." }: MessageInputProps) {
  const { sendMessage, isTyping } = useStudentAssistant();
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setSpeechRecognition(recognition);
      }
    }

    return () => {
      if (speechRecognition) {
        speechRecognition.abort();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle voice input
  const toggleVoiceInput = () => {
    if (speechRecognition) {
      if (isListening) {
        speechRecognition.abort();
        setIsListening(false);
      } else {
        speechRecognition.start();
        setIsListening(true);
      }
    }
  };

  // Text-to-speech function removed (moved to ChatMessage)

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isListening ? "Listening..." : placeholder}
          className="resize-none min-h-[60px]"
          disabled={isTyping || isListening}
        />
        <div className="flex flex-col space-y-2">
          {/* Speech-to-text button */}
          <Button
            onClick={toggleVoiceInput}
            disabled={isTyping}
            size="icon"
            variant={isListening ? "default" : "outline"}
            className="h-10 w-10 shrink-0"
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            <Mic className={cn("h-4 w-4", isListening && "text-primary-foreground animate-pulse")} />
            <span className="sr-only">{isListening ? "Stop listening" : "Start voice input"}</span>
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="h-10 w-10 shrink-0"
            title="Send message"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
