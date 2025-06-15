'use client';

import React, { useState } from 'react';
import ActivityButton from './ActivityButton';

/**
 * Demo component to showcase the enhanced ActivityButton features
 */
export const ActivityButtonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-4">ActivityButton Demo</h2>
        <p className="text-gray-600 mb-6">
          This demo showcases the enhanced ActivityButton component with improved touch feedback, 
          loading state animations, proper mobile sizing, and consistent hover/focus states.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-medium mb-3">Button Variants</h3>
          <div className="flex flex-wrap gap-4">
            <ActivityButton 
              onClick={() => {}} 
              variant="primary"
              ariaLabel="Primary button"
            >
              Primary
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              variant="secondary"
              ariaLabel="Secondary button"
            >
              Secondary
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              variant="success"
              ariaLabel="Success button"
            >
              Success
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              variant="danger"
              ariaLabel="Danger button"
            >
              Danger
            </ActivityButton>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <ActivityButton 
              onClick={() => {}} 
              size="sm"
              ariaLabel="Small button"
            >
              Small
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              size="md"
              ariaLabel="Medium button"
            >
              Medium (Default)
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              size="lg"
              ariaLabel="Large button"
            >
              Large
            </ActivityButton>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">With Icons</h3>
          <div className="flex flex-wrap gap-4">
            <ActivityButton 
              onClick={() => {}} 
              icon="check"
              ariaLabel="Check button"
            >
              Check
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              icon="save"
              variant="secondary"
              ariaLabel="Save button"
            >
              Save
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              icon="trash"
              variant="danger"
              ariaLabel="Delete button"
            >
              Delete
            </ActivityButton>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">States</h3>
          <div className="flex flex-wrap gap-4">
            <ActivityButton 
              onClick={() => {}} 
              disabled
              ariaLabel="Disabled button"
            >
              Disabled
            </ActivityButton>
            
            <ActivityButton 
              onClick={handleClick} 
              loading={isLoading}
              ariaLabel="Loading button"
            >
              {isLoading ? 'Loading...' : 'Click to Load'}
            </ActivityButton>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">Touch Feedback Demo</h3>
          <p className="text-sm text-gray-500 mb-3">
            Click or touch these buttons to see the enhanced ripple effect
          </p>
          <div className="flex flex-wrap gap-4">
            <ActivityButton 
              onClick={() => {}} 
              variant="primary"
              size="lg"
              ariaLabel="Touch demo primary"
            >
              Touch Me
            </ActivityButton>
            
            <ActivityButton 
              onClick={() => {}} 
              variant="secondary"
              size="lg"
              ariaLabel="Touch demo secondary"
            >
              Touch Me Too
            </ActivityButton>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Accessibility Features</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Minimum 44x44px touch targets for mobile</li>
          <li>Proper focus indicators with keyboard navigation</li>
          <li>ARIA labels for screen readers</li>
          <li>Proper disabled state handling</li>
          <li>Visual feedback for all interaction states</li>
        </ul>
      </div>
    </div>
  );
};

export default ActivityButtonDemo;
