'use client';

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useNavigation } from '@/providers/navigation-provider';

// Mobile navigation variants
const mobileNavVariants = cva(
  "fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg",
  {
    variants: {
      variant: {
        default: "",
        floating: "bottom-4 mx-4 rounded-full shadow-xl",
        minimal: "border-t-0 shadow-none",
      },
      role: {
        systemAdmin: "border-[#1F504B]",
        campusAdmin: "border-[#004EB2]",
        teacher: "border-[#5A8A84]",
        student: "border-[#2F96F4]",
        parent: "border-[#6126AE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Mobile navigation item variants
const navItemVariants = cva(
  "flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors",
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground hover:text-foreground",
      },
      role: {
        systemAdmin: "data-[active=true]:text-[#1F504B]",
        campusAdmin: "data-[active=true]:text-[#004EB2]",
        teacher: "data-[active=true]:text-[#5A8A84]",
        student: "data-[active=true]:text-[#2F96F4]",
        parent: "data-[active=true]:text-[#6126AE]",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  badge?: number | string;
  children?: MobileNavItem[];
  useNavigation?: boolean;
  includeInstitution?: boolean;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  activeItemId?: string;
  onItemClick?: (item: MobileNavItem) => void;
  className?: string;
  showLabels?: boolean;
  expandable?: boolean;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  variant?: 'default' | 'floating' | 'minimal';
}

/**
 * MobileNav component for bottom navigation on mobile devices
 *
 * Features:
 * - Multiple variants (default, floating, minimal)
 * - Role-specific styling
 * - Badges for notifications
 * - Expandable submenu
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <MobileNav
 *   items={[
 *     { id: 'home', label: 'Home', icon: <HomeIcon /> },
 *     { id: 'search', label: 'Search', icon: <SearchIcon /> },
 *     { id: 'profile', label: 'Profile', icon: <UserIcon /> }
 *   ]}
 *   activeItemId="home"
 *   role="teacher"
 *   variant="floating"
 * />
 * ```
 */
export function MobileNav({
  items,
  activeItemId,
  onItemClick,
  className,
  variant,
  role,
  showLabels = true,
  expandable = false,
}: MobileNavProps) {
  const { isMobile } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const { navigate } = useNavigation();

  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }

  // Handle item click
  const handleItemClick = (item: MobileNavItem) => {
    if (item.children && expandable) {
      if (expandedItemId === item.id) {
        setExpandedItemId(null);
      } else {
        setExpandedItemId(item.id);
      }
    } else {
      // Use the navigation system if specified
      if (item.href && item.useNavigation) {
        navigate(item.href, {
          hapticFeedback: true,
          includeInstitution: item.includeInstitution !== false, // Default to true
        });
      } else if (item.onClick) {
        item.onClick();
      }

      if (onItemClick) {
        onItemClick(item);
      }
    }
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setExpandedItemId(null);
    }
  };

  return (
    <nav
      className={cn(
        mobileNavVariants({ variant, role }),
        className
      )}
    >
      {/* Expandable handle */}
      {expandable && (
        <div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={toggleExpanded}
        >
          <ChevronUp
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      )}

      {/* Main navigation items */}
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative flex-1"
          >
            <button
              className={cn(
                navItemVariants({
                  active: activeItemId === item.id,
                  role
                }),
                "w-full"
              )}
              onClick={() => handleItemClick(item)}
              data-active={activeItemId === item.id}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              {showLabels && <span className="mt-1">{item.label}</span>}
            </button>

            {/* Submenu for expandable items */}
            {expandable && item.children && expandedItemId === item.id && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      className="flex items-center w-full p-3 text-sm hover:bg-accent"
                      onClick={() => {
                        if (child.onClick) {
                          child.onClick();
                        }
                        if (onItemClick) {
                          onItemClick(child);
                        }
                        setExpandedItemId(null);
                      }}
                    >
                      <div className="mr-2">{child.icon}</div>
                      <span>{child.label}</span>
                      {child.badge && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {child.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* Expanded content */}
      {expandable && isExpanded && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border py-4 px-2"
          >
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg",
                    activeItemId === item.id ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    }
                    if (onItemClick) {
                      onItemClick(item);
                    }
                    setIsExpanded(false);
                  }}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </nav>
  );
}
