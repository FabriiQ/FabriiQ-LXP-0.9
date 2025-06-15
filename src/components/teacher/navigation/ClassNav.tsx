'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { InstitutionNavigationLink } from '@/components/ui/navigation/institution-navigation-link';

interface ClassNavTab {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
}

interface ClassNavProps {
  tabs: ClassNavTab[];
  className?: string;
}

/**
 * ClassNav component for class-specific navigation
 *
 * Features:
 * - Mobile-first responsive design
 * - Horizontal scrollable tabs on mobile
 * - Sidebar navigation on desktop
 * - Sheet/drawer navigation on mobile when expanded
 */
export function ClassNav({ tabs, className }: ClassNavProps) {
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('class-nav-collapsed');
      if (savedState !== null) {
        setIsCollapsed(savedState === 'true');
      }
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('class-nav-collapsed', String(newState));
    }
  };

  // Render mobile navigation
  const renderMobileNav = () => {
    if (!isMobile) return null;

    return (
      <div className="fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full shadow-md">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open class menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[280px] p-0 overflow-y-auto left-0 right-auto">
            <SheetHeader className="px-4 py-4 border-b sticky top-0 bg-background z-10">
              <SheetTitle>Class Navigation</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <div className="py-4">
                <nav className="mt-2">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                      <InstitutionNavigationLink
                        key={tab.id}
                        href={tab.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-4 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        activeClassName="bg-primary/10 text-primary font-medium"
                        showLoadingIndicator={false}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="line-clamp-1">{tab.name}</span>
                      </InstitutionNavigationLink>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    );
  };

  return (
    <>
      {/* Mobile navigation */}
      {renderMobileNav()}

      {/* Desktop navigation */}
      {!isMobile && (
        <>
          {/* Toggle button for desktop */}
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 hidden md:flex shadow-md bg-background"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>

          {/* Desktop sidebar */}
          <div className={cn(
            "hidden md:block border-r h-full overflow-y-auto transition-all duration-300",
            isCollapsed ? "w-0 opacity-0" : "w-[240px] opacity-100",
            className
          )}>
            <div className="py-4">
              <div className="px-4 pb-4 border-b">
                <h2 className="text-lg font-semibold">Class Navigation</h2>
              </div>
              <nav className="mt-2">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  const Icon = tab.icon;

                  return (
                    <InstitutionNavigationLink
                      key={tab.id}
                      href={tab.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      activeClassName="bg-primary/10 text-primary font-medium"
                      showLoadingIndicator={false}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.name}
                    </InstitutionNavigationLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
