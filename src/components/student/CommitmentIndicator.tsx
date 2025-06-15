'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle } from 'lucide-react';
import { Target } from '@/components/ui/icons/reward-icons';
import { AlertTriangle } from '@/components/ui/icons/lucide-icons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Custom isPast function since date-fns isPast is not available
const isPast = (date: Date): boolean => {
  return date < new Date();
};

interface CommitmentIndicatorProps {
  isCommitted: boolean;
  commitmentDeadline?: Date | null;
  commitmentMet?: boolean | null;
  className?: string;
  showLabel?: boolean;
}

/**
 * CommitmentIndicator component displays a visual indicator for activities that are part of a commitment
 *
 * Features:
 * - Color-coded badges based on commitment status
 * - Tooltips with detailed information
 * - Deadline countdown
 * - Status indicators (met, overdue, pending)
 */
export function CommitmentIndicator({
  isCommitted,
  commitmentDeadline,
  commitmentMet,
  className,
  showLabel = false
}: CommitmentIndicatorProps) {
  if (!isCommitted) return null;

  // Format the deadline for display
  const formattedDeadline = commitmentDeadline
    ? formatDistanceToNow(new Date(commitmentDeadline), { addSuffix: true })
    : null;

  // Determine if the commitment is overdue
  const isOverdue = commitmentDeadline ? isPast(new Date(commitmentDeadline)) : false;

  // Determine the badge variant and icon based on status
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' = 'default';
  let icon = <Target className="h-3 w-3 mr-1" />;
  let label = 'Committed';

  if (commitmentMet === true) {
    badgeVariant = 'success';
    icon = <CheckCircle className="h-3 w-3 mr-1" />;
    label = 'Commitment Met';
  } else if (isOverdue) {
    badgeVariant = 'destructive';
    icon = <AlertTriangle className="h-3 w-3 mr-1" />;
    label = 'Commitment Overdue';
  } else if (commitmentDeadline) {
    badgeVariant = 'secondary';
    icon = <Clock className="h-3 w-3 mr-1" />;
    label = 'Commitment Due';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={badgeVariant}
            className={cn("text-xs rounded-sm", className)}
          >
            {icon}
            {showLabel ? label : null}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{label}</p>
            {formattedDeadline && (
              <p className="text-xs text-muted-foreground">
                Due {formattedDeadline}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
