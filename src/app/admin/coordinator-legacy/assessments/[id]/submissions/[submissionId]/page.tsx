'use client';

import { SubmissionReview } from '@/components/coordinator/SubmissionReview';

export default function SubmissionReviewPage({
  params,
}: {
  params: { id: string; submissionId: string };
}) {
  // In Next.js 15+, params is a Promise that needs to be unwrapped with use()
  // We need to cast it to avoid TypeScript errors
  const { id: assessmentId, submissionId } = params;
  return (
    <div className="container mx-auto py-6">
      <SubmissionReview
        assessmentId={assessmentId}
        submissionId={submissionId}
      />
    </div>
  );
}
