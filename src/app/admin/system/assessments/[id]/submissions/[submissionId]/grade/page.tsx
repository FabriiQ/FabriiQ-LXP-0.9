import { Metadata } from 'next';
import { AssessmentSubmission } from '~/components/assessment/submission/assessment-submission';

export const metadata: Metadata = {
  title: 'Grade Submission | System Admin',
  description: 'Grade an assessment submission',
};

interface GradeSubmissionPageProps {
  params: {
    id: string;
    submissionId: string;
  };
}

export default function GradeSubmissionPage({ params }: GradeSubmissionPageProps) {
  return (
    <AssessmentSubmission 
      assessmentId={params.id} 
      submissionId={params.submissionId} 
      isGrading={true}
    />
  );
} 