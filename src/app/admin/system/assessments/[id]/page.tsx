import { Metadata } from 'next';
import { AssessmentDetail } from '~/components/assessment/assessment-detail';

export const metadata: Metadata = {
  title: 'Assessment Details | System Admin',
  description: 'View and manage assessment details',
};

interface AssessmentDetailPageProps {
  params: {
    id: string;
  };
}

export default function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  return <AssessmentDetail assessmentId={params.id} />;
} 