'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface DataCardProps<T> {
  data: T[];
  keyField: keyof T;
  titleField: keyof T;
  subtitleField?: keyof T;
  fields: {
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }[];
  onCardClick?: (item: T) => void;
  className?: string;
  expandable?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

// Loading Skeleton Component
const CardSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="h-6 bg-muted rounded-md w-3/4 mb-3"></div>
          <div className="h-4 bg-muted rounded-md w-1/2 mb-6"></div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded-md w-1/4"></div>
              <div className="h-4 bg-muted rounded-md w-1/3"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded-md w-1/3"></div>
              <div className="h-4 bg-muted rounded-md w-1/4"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded-md w-1/4"></div>
              <div className="h-4 bg-muted rounded-md w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border border-border rounded-lg bg-card">
      <div className="rounded-full bg-muted p-3 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium">No data available</h3>
      <p className="text-muted-foreground text-sm mt-1 text-center">{message}</p>
    </div>
  );
};

// Data Card Component
export function DataCard<T>({
  data,
  keyField,
  titleField,
  subtitleField,
  fields,
  onCardClick,
  className,
  expandable = false,
  isLoading = false,
  emptyMessage = 'No items to display.',
}: DataCardProps<T>) {
  const [expandedItems, setExpandedItems] = useState<(string | number)[]>([]);

  // Toggle card expansion
  const toggleExpand = (key: string | number) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  // Check if a card is expanded
  const isExpanded = (key: string | number) => expandedItems.includes(key);

  // Animation variants
  const contentVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: 'auto', opacity: 1 },
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item) => {
        const key = String(item[keyField]);
        const title = String(item[titleField]);
        const subtitle = subtitleField ? String(item[subtitleField]) : undefined;
        
        return (
          <div
            key={key}
            className={cn(
              "bg-card border border-border rounded-lg overflow-hidden transition-all",
              onCardClick && "cursor-pointer hover:border-primary/50"
            )}
          >
            {/* Card Header */}
            <div
              className="p-4"
              onClick={onCardClick ? () => onCardClick(item) : undefined}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{title}</h3>
                  {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
                </div>
                {expandable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(key);
                    }}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    {isExpanded(key) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Always visible fields (first 2) */}
              <div className="mt-4 space-y-2">
                {fields.slice(0, 2).map((field) => (
                  <div key={String(field.key)} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium">
                      {field.render
                        ? field.render(item[field.key], item)
                        : String(item[field.key] || '-')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Expandable Content */}
            {expandable && fields.length > 2 && (
              <AnimatePresence>
                {isExpanded(key) && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={contentVariants}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-border mt-2">
                      <div className="space-y-2">
                        {fields.slice(2).map((field) => (
                          <div key={String(field.key)} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{field.label}</span>
                            <span className="text-sm font-medium">
                              {field.render
                                ? field.render(item[field.key], item)
                                : String(item[field.key] || '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DataCard; 