import { Metadata } from 'next';
import { AssessmentForm } from '~/components/assessment/assessment-form';
import { PageHeader } from '~/components/ui/layout/page-header';

export const metadata: Metadata = {
  title: 'Create Assessment | System Admin',
  description: 'Create a new assessment',
};

export default function CreateAssessmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Assessment"
        description="Create a new assessment for students"
      />
      <AssessmentForm />
    </div>
  );
} 