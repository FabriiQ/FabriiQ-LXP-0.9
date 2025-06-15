'use client';

import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  actionButton?: ReactNode; // Added for backward compatibility
}

export function EmptyState({ title, description, icon, action, actionButton }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        {icon && (
          <div className="rounded-full bg-muted p-4 mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {action || actionButton}
      </CardContent>
    </Card>
  );
}
