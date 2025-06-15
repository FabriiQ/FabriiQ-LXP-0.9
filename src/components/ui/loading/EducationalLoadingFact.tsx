'use client';

import React from 'react';
import { useLoadingFacts } from '@/hooks/useLoadingFacts';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Lightbulb } from '@/components/ui/icons/lightbulb';
import { ArrowRight, ArrowLeft } from '@/components/ui/icons/arrows';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface EducationalLoadingFactProps {
  isLoading: boolean;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
  interval?: number;
}

/**
 * Component that displays educational facts during loading
 * Implements the "productive waiting" UX pattern
 */
export function EducationalLoadingFact({
  isLoading,
  className = '',
  showControls = false,
  autoRotate = true,
  interval = 5000,
}: EducationalLoadingFactProps) {
  const { currentFact, nextFact, previousFact } = useLoadingFacts({
    isLoading,
    autoRotate,
    interval,
  });

  if (!isLoading) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentFact}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="bg-muted/30 border-muted text-foreground">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{currentFact}</p>

                {showControls && (
                  <div className="flex justify-end mt-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={previousFact}
                      className="h-8 px-2 text-foreground hover:text-foreground hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextFact}
                      className="h-8 px-2 text-foreground hover:text-foreground hover:bg-muted"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
