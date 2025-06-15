'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const ToolbarButton = ({
  format,
  icon,
  onClick,
  active,
  disabled,
  tooltip,
}: {
  format?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
}) => {
  return (
    <button
      className={cn(
        'p-2 rounded hover:bg-gray-100 transition-colors',
        active && 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

export const ToolbarGroup = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center gap-1">{children}</div>;
};

export const ToolbarSeparator = () => {
  return <div className="w-px h-6 bg-gray-200 mx-2" />;
};

export const Toolbar = ({
  children,
  className
}: {
  children: React.ReactNode,
  className?: string
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2 p-2", className)}>
      {children}
    </div>
  );
};

export const FixedToolbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <Toolbar className="sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm">
      {children}
    </Toolbar>
  );
};

export const FloatingToolbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <Toolbar className="absolute z-50 flex-wrap rounded-md border border-border bg-background shadow-md">
      {children}
    </Toolbar>
  );
};