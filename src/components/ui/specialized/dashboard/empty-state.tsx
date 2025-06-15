'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
  variant?: 'default' | 'card' | 'inline';
}

/**
 * EmptyState component for displaying empty state messages
 * 
 * Features:
 * - Icon support
 * - Primary and secondary actions
 * - Multiple variants (default, card, inline)
 * - Compact mode
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FileIcon className="h-12 w-12" />}
 *   title="No files found"
 *   description="Upload files to get started"
 *   action={{
 *     label: "Upload",
 *     onClick: () => setIsOpen(true)
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
  variant = 'default'
}: EmptyStateProps) {
  const content = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-4 px-2 space-y-2" : "py-8 px-4 space-y-4",
        variant === 'inline' ? "bg-transparent" : "",
        className
      )}
    >
      {icon && (
        <div className={cn(
          "text-muted-foreground",
          compact ? "mb-2" : "mb-4"
        )}>
          {icon}
        </div>
      )}
      
      <h3 className={cn(
        "font-medium",
        compact ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm mx-auto",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {action && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
  
  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }
  
  return content;
}
