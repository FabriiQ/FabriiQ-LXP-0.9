'use client';

import React, { useState } from 'react';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo component to showcase the AnimatedSubmitButton
 */
export const AnimatedSubmitButtonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'submitted'>('idle');
  
  const handleSubmit = () => {
    setDemoState('loading');
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setDemoState('submitted');
      
      // Reset after 3 seconds for demo purposes
      setTimeout(() => {
        setIsSubmitted(false);
        setDemoState('idle');
      }, 3000);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-4">AnimatedSubmitButton Demo</h2>
        <p className="text-gray-600 mb-6">
          This demo showcases the enhanced AnimatedSubmitButton component with improved animations,
          loading states, and micro-interactions for a better user experience.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full max-w-xs">
              <AnimatedSubmitButton
                onClick={handleSubmit}
                loading={isLoading}
                submitted={isSubmitted}
                disabled={demoState !== 'idle'}
              >
                {demoState === 'idle' ? 'Submit Activity' : demoState === 'loading' ? 'Submitting...' : 'Submitted!'}
              </AnimatedSubmitButton>
            </div>
            
            <div className="text-sm text-gray-500">
              {demoState === 'idle' && 'Click the button to see the animation'}
              {demoState === 'loading' && 'Loading state with animation...'}
              {demoState === 'submitted' && 'Success state with animation! (Will reset in 3 seconds)'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-4">
              <h3 className="font-medium mb-2">Idle State</h3>
              <AnimatedSubmitButton
                onClick={() => {}}
                disabled={false}
              />
            </Card>
            
            <Card className="p-4">
              <h3 className="font-medium mb-2">Loading State</h3>
              <AnimatedSubmitButton
                onClick={() => {}}
                loading={true}
              />
            </Card>
            
            <Card className="p-4">
              <h3 className="font-medium mb-2">Submitted State</h3>
              <AnimatedSubmitButton
                onClick={() => {}}
                submitted={true}
              />
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnimatedSubmitButtonDemo;
