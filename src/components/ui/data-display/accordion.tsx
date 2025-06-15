'use client';

import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultExpandedIds?: string[];
  allowMultiple?: boolean;
  collapsible?: boolean;
  variant?: 'default' | 'separated' | 'bordered';
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

// Accordion Component
export function Accordion({
  items,
  defaultExpandedIds = [],
  allowMultiple = false,
  collapsible = true,
  variant = 'default',
  className,
  itemClassName,
  headerClassName,
  contentClassName,
}: AccordionProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpandedIds);
  const accordionId = useId();

  // Toggle item expansion
  const toggleItem = (id: string) => {
    if (expandedIds.includes(id)) {
      // If collapsible is false and this is the only expanded item, don't collapse
      if (!collapsible && expandedIds.length === 1) {
        return;
      }
      setExpandedIds(expandedIds.filter(itemId => itemId !== id));
    } else {
      if (allowMultiple) {
        setExpandedIds([...expandedIds, id]);
      } else {
        setExpandedIds([id]);
      }
    }
  };

  // Get variant class
  const getVariantClass = () => {
    switch (variant) {
      case 'separated':
        return 'space-y-2';
      case 'bordered':
        return 'border border-border rounded-md';
      default:
        return 'border-b border-border';
    }
  };

  return (
    <div 
      className={cn(
        'w-full',
        getVariantClass(),
        className
      )}
    >
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id);
        const isDisabled = !!item.disabled;
        const isLast = index === items.length - 1;
        
        return (
          <div
            key={item.id}
            className={cn(
              variant === 'default' && !isLast && 'border-b border-border',
              variant === 'separated' && 'border border-border rounded-md overflow-hidden',
              variant === 'bordered' && !isLast && 'border-b border-border',
              itemClassName
            )}
          >
            <button
              id={`${accordionId}-header-${item.id}`}
              aria-expanded={isExpanded}
              aria-controls={`${accordionId}-panel-${item.id}`}
              aria-disabled={isDisabled}
              onClick={() => !isDisabled && toggleItem(item.id)}
              className={cn(
                'flex items-center justify-between w-full py-4 px-4 text-left font-medium text-sm transition-colors',
                isDisabled ? 'text-muted-foreground cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
                isExpanded && 'bg-muted/30',
                headerClassName
              )}
            >
              <span>{item.title}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 ml-2"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
            
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id={`${accordionId}-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`${accordionId}-header-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transition: { 
                      height: { duration: 0.3 },
                      opacity: { duration: 0.2, delay: 0.1 }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: { 
                      height: { duration: 0.3 },
                      opacity: { duration: 0.2 }
                    }
                  }}
                  className="overflow-hidden"
                >
                  <div className={cn('p-4 pt-0', contentClassName)}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
} 