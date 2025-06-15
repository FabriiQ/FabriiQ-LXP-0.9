'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  User,
  XCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface VerificationStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export interface HighValueActivityVerificationProps {
  activityId: string;
  activityType: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  pointsAmount: number;
  submissionDate: Date;
  verificationSteps?: VerificationStep[];
  isVerified?: boolean;
  isRejected?: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  onVerify?: (activityId: string, notes: string) => void;
  onReject?: (activityId: string, reason: string) => void;
  className?: string;
}

export function HighValueActivityVerification({
  activityId,
  activityType,
  activityTitle,
  studentId,
  studentName,
  pointsAmount,
  submissionDate,
  verificationSteps = [],
  isVerified = false,
  isRejected = false,
  verificationDate,
  verifiedBy,
  rejectionReason,
  onVerify,
  onReject,
  className
}: HighValueActivityVerificationProps) {
  const [steps, setSteps] = useState<VerificationStep[]>(verificationSteps.length > 0
    ? verificationSteps
    : [
      {
        id: 'authenticity',
        label: 'Verify Authenticity',
        description: 'Confirm this submission was created by the student',
        required: true,
        completed: false
      },
      {
        id: 'quality',
        label: 'Check Quality',
        description: 'Ensure the submission meets quality standards',
        required: true,
        completed: false
      },
      {
        id: 'time',
        label: 'Validate Time Spent',
        description: 'Confirm the time spent is reasonable for this activity',
        required: false,
        completed: false
      },
      {
        id: 'originality',
        label: 'Check Originality',
        description: 'Ensure the submission is original and not plagiarized',
        required: true,
        completed: false
      }
    ]
  );

  const [notes, setNotes] = useState<string>('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>(rejectionReason || '');

  // Toggle step completion
  const toggleStep = (stepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );
  };

  // Check if all required steps are completed
  const allRequiredStepsCompleted = steps
    .filter(step => step.required)
    .every(step => step.completed);

  // Handle verification
  const handleVerify = () => {
    if (onVerify) {
      onVerify(activityId, notes);
    }
  };

  // Handle rejection
  const handleReject = () => {
    if (onReject) {
      onReject(activityId, rejectionReasonInput);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>High-Value Activity Verification</CardTitle>
            <CardDescription>
              Verify this activity before awarding points
            </CardDescription>
          </div>

          {isVerified && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Verified
            </Badge>
          )}

          {isRejected && (
            <Badge variant="destructive">
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Rejected
            </Badge>
          )}

          {!isVerified && !isRejected && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Activity</div>
            <div className="font-medium">{activityTitle}</div>
            <div className="text-sm text-muted-foreground">Type: {activityType}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Student</div>
            <div className="font-medium">{studentName}</div>
            <div className="text-sm text-muted-foreground">ID: {studentId}</div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-muted rounded-md">
          <div>
            <div className="text-sm text-muted-foreground">Points Value</div>
            <div className="text-xl font-bold">{pointsAmount.toLocaleString()}</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Submitted</div>
            <div>{submissionDate.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">{submissionDate.toLocaleTimeString()}</div>
          </div>
        </div>

        {(isVerified || isRejected) ? (
          <div className="space-y-3">
            {isVerified && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Verification Complete</AlertTitle>
                <AlertDescription>
                  This activity was verified on {verificationDate?.toLocaleDateString()} by {verifiedBy}.
                  {notes && <div className="mt-2 text-sm italic">"{notes}"</div>}
                </AlertDescription>
              </Alert>
            )}

            {isRejected && (
              <Alert className="bg-red-50 text-red-800 border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Verification Rejected</AlertTitle>
                <AlertDescription>
                  This activity was rejected on {verificationDate?.toLocaleDateString()} by {verifiedBy}.
                  {rejectionReason && <div className="mt-2 text-sm italic">"{rejectionReason}"</div>}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Verification Checklist</h3>
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={step.id}
                      checked={step.completed}
                      onCheckedChange={() => toggleStep(step.id)}
                    />
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={step.id}
                        className={cn(
                          "font-medium",
                          step.required ? "" : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                        {step.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="verification-notes">Verification Notes</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add any notes about this verification..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (if applicable)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="If rejecting, provide a reason..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        {!isVerified && !isRejected ? (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      disabled={!rejectionReasonInput.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </TooltipTrigger>
                {!rejectionReasonInput.trim() && (
                  <TooltipContent>
                    <p>Please provide a rejection reason</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handleVerify}
                      disabled={!allRequiredStepsCompleted}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify and Award Points
                    </Button>
                  </div>
                </TooltipTrigger>
                {!allRequiredStepsCompleted && (
                  <TooltipContent>
                    <p>Complete all required verification steps first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Audit trail recorded
            </div>

            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              View Student Profile
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
