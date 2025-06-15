'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { AlertTriangle as AlertTriangleIcon } from '@/components/ui/icons/custom-icons';

interface SubmissionConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredQuestions: number;
  isSubmitting: boolean;
}

export function SubmissionConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredQuestions,
  isSubmitting,
}: SubmissionConfirmDialogProps) {
  const hasUnansweredQuestions = answeredQuestions < totalQuestions;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit Assessment</AlertDialogTitle>
          <AlertDialogDescription>
            {hasUnansweredQuestions ? (
              <div className="space-y-2">
                <div className="flex items-center text-amber-500">
                  <AlertTriangleIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Warning</span>
                </div>
                <p>
                  You have only answered {answeredQuestions} out of {totalQuestions} questions.
                  Unanswered questions will be marked as incorrect.
                </p>
                <p>Are you sure you want to submit your assessment?</p>
              </div>
            ) : (
              <p>
                You have answered all {totalQuestions} questions. Are you ready to submit your assessment?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting}
            className={hasUnansweredQuestions ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assessment"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
