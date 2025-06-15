import { Metadata } from 'next';
import { AssessmentList } from '~/components/assessment/assessment-list';
import { PageHeader } from '~/components/ui/layout/page-header';

export const metadata: Metadata = {
  title: 'Assessments | System Admin',
  description: 'Manage assessments across the system',
};

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Manage assessments across the system"
      />
      <AssessmentList />
    </div>
  );
} 