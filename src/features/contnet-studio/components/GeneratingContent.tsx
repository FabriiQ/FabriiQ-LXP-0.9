'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface GeneratingContentProps {
  estimatedTimeSeconds?: number;
}

export function GeneratingContent({ estimatedTimeSeconds = 20 }: GeneratingContentProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTimeSeconds);
  const [messages, setMessages] = useState<string[]>([
    'Analyzing topic and requirements...',
    'Crafting engaging questions...',
    'Designing interactive elements...',
    'Polishing content for clarity...',
    'Finalizing your activity...'
  ]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / estimatedTimeSeconds / 2);
        return newProgress > 95 ? 95 : newProgress;
      });

      setTimeRemaining(prev => {
        const newTime = prev - 0.5;
        return newTime < 0 ? 0 : newTime;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [estimatedTimeSeconds]);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold">Generating Your Activity</h3>
      
      <div className="text-center text-muted-foreground min-h-[48px]">
        <p className="animate-fade-in">{messages[currentMessageIndex]}</p>
        <p className="text-sm mt-2">
          {timeRemaining > 0 
            ? `Estimated time remaining: ${Math.ceil(timeRemaining)} seconds` 
            : 'Almost done...'}
        </p>
      </div>
      
      <div className="w-full max-w-md">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-4">
        <p>Our AI is carefully crafting content based on your specifications.</p>
        <p>This may take a moment for complex activities.</p>
      </div>
    </div>
  );
}
