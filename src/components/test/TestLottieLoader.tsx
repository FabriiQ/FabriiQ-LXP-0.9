'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { showGlobalLoading } from '@/components/ui/loading-indicator';

export default function TestLottieLoader() {
  const handleShowLoading = () => {
    showGlobalLoading(true, 'Testing Lottie Animation...');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      showGlobalLoading(false);
    }, 5000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Lottie Animation</h1>
      <Button onClick={handleShowLoading}>
        Show Lottie Loading Animation
      </Button>
    </div>
  );
}
