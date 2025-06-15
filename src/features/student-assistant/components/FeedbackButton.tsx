'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core/button';
import { MessageSquare } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';
import { cn } from '@/lib/utils';
import { AnalyticsService } from '../utils/analytics';

interface FeedbackButtonProps {
  messageId?: string;
  analyticsService?: AnalyticsService;
  className?: string;
}

/**
 * FeedbackButton component
 * 
 * Button that opens the feedback dialog
 * 
 * @param props Component props
 * @returns JSX element
 */
export function FeedbackButton({ 
  messageId, 
  analyticsService,
  className 
}: FeedbackButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("text-xs text-muted-foreground", className)}
        onClick={handleOpenDialog}
      >
        <MessageSquare className="h-3 w-3 mr-1" />
        Feedback
      </Button>
      
      <FeedbackDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        messageId={messageId}
        analyticsService={analyticsService}
      />
    </>
  );
}
