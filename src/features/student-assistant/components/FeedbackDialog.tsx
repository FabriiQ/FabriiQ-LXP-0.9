'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/core/button';
import { Textarea } from '@/components/ui/textarea';
// Use a custom star icon instead of lucide-react
const StarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "lucide lucide-star"}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
import { cn } from '@/lib/utils';
import { AnalyticsService, AnalyticsEventType } from '../utils/analytics';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
  analyticsService?: AnalyticsService;
}

/**
 * FeedbackDialog component
 *
 * Dialog for collecting user feedback about the assistant
 *
 * @param props Component props
 * @returns JSX element
 */
export function FeedbackDialog({
  isOpen,
  onClose,
  messageId,
  analyticsService
}: FeedbackDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Track feedback in analytics
      if (analyticsService) {
        analyticsService.trackFeedbackProvided(rating, comment);
      }

      // In a real implementation, this would send the feedback to a server
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mark as submitted
      setIsSubmitted(true);

      // Reset form after a delay
      setTimeout(() => {
        setRating(0);
        setComment('');
        setIsSubmitted(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSubmitted ? 'Thank You for Your Feedback!' : 'How was your experience?'}
          </DialogTitle>
        </DialogHeader>

        {!isSubmitted ? (
          <>
            <div className="flex justify-center py-4">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setRating(value)}
                  >
                    <StarIcon
                      className={cn(
                        "h-8 w-8 transition-all",
                        rating >= value
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Tell us more about your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-lg">Your feedback helps us improve the assistant.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
