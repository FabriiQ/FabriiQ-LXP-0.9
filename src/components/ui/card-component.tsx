'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

/**
 * Card component
 * 
 * A versatile card component with different variants
 * 
 * @example
 * <Card 
 *   title="Course Title" 
 *   subtitle="Course description"
 *   variant="elevated"
 * >
 *   <p>Card content goes here</p>
 * </Card>
 */
export function Card({
  title,
  subtitle,
  children,
  footer,
  variant = 'default',
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  bodyClassName = '',
  footerClassName = '',
}: CardProps) {
  // Base classes
  const baseClasses = 'overflow-hidden transition-default';
  
  // Variant-specific classes
  const variantClasses = {
    default: 'bg-card text-card-foreground rounded-md border border-border',
    bordered: 'bg-card text-card-foreground rounded-md border-2 border-primary',
    elevated: 'bg-card text-card-foreground rounded-lg shadow-lg',
    flat: 'bg-muted text-card-foreground rounded-md',
  };
  
  // Title classes
  const defaultTitleClasses = 'text-xl font-semibold leading-[28px]';
  
  // Subtitle classes
  const defaultSubtitleClasses = 'text-sm text-muted-foreground mt-1';
  
  // Body classes
  const defaultBodyClasses = 'mt-4';
  
  // Footer classes
  const defaultFooterClasses = 'mt-4 pt-4 border-t border-border';

  return (
    <div 
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <div className="p-md">
        {title && (
          <h4 className={`${defaultTitleClasses} ${titleClassName}`}>
            {title}
          </h4>
        )}
        
        {subtitle && (
          <p className={`${defaultSubtitleClasses} ${subtitleClassName}`}>
            {subtitle}
          </p>
        )}
        
        <div className={`${defaultBodyClasses} ${bodyClassName}`}>
          {children}
        </div>
        
        {footer && (
          <div className={`${defaultFooterClasses} ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
} 