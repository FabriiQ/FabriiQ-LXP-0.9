'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function MobileCard({
  title,
  description,
  icon,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName
}: MobileCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={cn(
        'flex flex-row items-center justify-between space-y-0 pb-2',
        headerClassName
      )}>
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn('py-2', contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn('pt-0', footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
