import { Metadata } from 'next';
import { AssessmentSubmission } from '~/components/assessment/submission/assessment-submission';

export const metadata: Metadata = {
  title: 'Assessment Submission | System Admin',
  description: 'View assessment submission details',
};

interface SubmissionPageProps {
  params: {
    id: string;
    submissionId: string;
  };
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  return (
    <AssessmentSubmission 
      assessmentId={params.id} 
      submissionId={params.submissionId} 
    />
  );
} 