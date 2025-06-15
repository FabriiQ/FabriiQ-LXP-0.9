'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card as BaseCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  footer?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  variant = 'default',
  footer,
  children,
  className,
  ...props
}: CustomCardProps) {
  const getCardClassName = () => {
    switch (variant) {
      case 'bordered':
        return 'border-2 border-primary';
      case 'elevated':
        return 'shadow-lg';
      case 'flat':
        return 'bg-muted border-0';
      default:
        return '';
    }
  };

  return (
    <BaseCard className={cn(getCardClassName(), className)} {...props}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </BaseCard>
  );
} 