import { Metadata } from 'next';
import { PageHeader } from '~/components/ui/layout/page-header';
import { SubmissionsList } from '~/components/assessment/submission/submissions-list';

export const metadata: Metadata = {
  title: 'Assessment Submissions | System Admin',
  description: 'View and manage assessment submissions',
};

interface SubmissionsPageProps {
  params: {
    id: string;
  };
}

export default function SubmissionsPage({ params }: SubmissionsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Submissions"
        description="View and manage submissions for this assessment"
      />
      <SubmissionsList assessmentId={params.id} />
    </div>
  );
} 