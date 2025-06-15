'use client';

import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message: string;
  subMessage?: string;
}

export function LoadingIndicator({ message, subMessage }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] p-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2">{message}</h3>
      {subMessage && <p className="text-muted-foreground">{subMessage}</p>}
    </div>
  );
}
