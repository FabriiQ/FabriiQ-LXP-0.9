'use client';

/**
 * ContentCreationLayout
 * 
 * A reusable layout component for content creation pages in the Content Studio.
 * Provides a consistent page structure with header, content area, and optional sidebar.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContentCreationLayoutProps {
  title: string;
  description?: string;
  backHref?: string;
  onBack?: () => void;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function ContentCreationLayout({
  title,
  description,
  backHref,
  onBack,
  children,
  sidebar,
  actions,
  className,
  contentClassName,
  headerClassName,
}: ContentCreationLayoutProps) {
  const router = useRouter();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };
  
  return (
    <div className={cn("container mx-auto px-4 py-8", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={cn("flex items-center justify-between mb-6", headerClassName)}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={handleBack}
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Content area */}
          <div className={cn("flex-1", contentClassName)}>
            {children}
          </div>
          
          {/* Sidebar */}
          {sidebar && (
            <div className="w-full lg:w-80 shrink-0">
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
