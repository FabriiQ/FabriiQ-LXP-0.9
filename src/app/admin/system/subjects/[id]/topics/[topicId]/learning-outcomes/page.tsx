'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/layout/page-header';
import { Card } from '@/components/ui/data-display/card';
import { Loader2 } from 'lucide-react';
import { ArrowLeft } from '@/components/ui/icons/lucide-icons';
import { Button } from '@/components/ui/core/button';
import { LearningOutcomeList } from '@/components/admin/learning-outcomes/LearningOutcomeList';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsDistribution, BloomsTaxonomyLevel } from '@/features/bloom/types';
import { calculateLearningOutcomeDistribution } from '@/features/bloom/utils/bloom-helpers';
import { BulkLearningOutcomeGenerator } from '@/features/bloom/components/learning-outcomes/BulkLearningOutcomeGenerator';
import { ThemeWrapper } from '@/features/activties/components/ui/ThemeWrapper';
import { constructTopicUrl } from '@/utils/admin-navigation';

// Create a wrapper component to handle the params
function TopicLearningOutcomesPageContent({ subjectId, topicId }: { subjectId: string; topicId: string }) {
  const router = useRouter();
  const utils = api.useUtils();

  // Handle back button click
  const handleBack = () => {
    const url = constructTopicUrl(subjectId, topicId, window.location.pathname);
    router.push(url);
  };

  // Fetch subject details
  const { data: subject, isLoading: isLoadingSubject } = api.subject.getById.useQuery({
    id: subjectId,
  });

  // Fetch topic details
  const { data: topic, isLoading: isLoadingTopic } = api.subjectTopic.getById.useQuery({
    id: topicId,
  });

  // Fetch learning outcomes for this topic
  const { data: learningOutcomes, isLoading: isLoadingOutcomes } = api.learningOutcome.getByTopic.useQuery({
    topicId,
  });

  // Loading state
  if (isLoadingSubject || isLoadingTopic || isLoadingOutcomes) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
      </div>
    );
  }

  // Error state
  if (!subject || !topic) {
    return (
      <div className="flex justify-center items-center h-96">
        <Card className="p-6 text-center text-red-500">
          <p>{!subject ? 'Subject' : 'Topic'} not found</p>
        </Card>
      </div>
    );
  }

  // Calculate actual distribution based on learning outcomes
  const actualDistribution = learningOutcomes && learningOutcomes.length > 0
    ? calculateLearningOutcomeDistribution(
        // Cast the learning outcomes to the expected type
        learningOutcomes.map(outcome => ({
          bloomsLevel: outcome.bloomsLevel as unknown as BloomsTaxonomyLevel
        }))
      )
    : {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topic
        </Button>

        <PageHeader
          title={`Learning Outcomes: ${topic.title}`}
          description={`Manage learning outcomes for this topic aligned with Bloom's Taxonomy`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloom's Distribution and Bulk Generator */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bloom's Taxonomy Distribution</h3>

            {learningOutcomes && learningOutcomes.length > 0 ? (
              <div className="h-64">
                <ThemeWrapper>
                  <BloomsDistributionChart
                    distribution={actualDistribution as BloomsDistribution}
                    editable={false}
                    showLabels={true}
                    showPercentages={true}
                    variant="pie"
                  />
                </ThemeWrapper>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No learning outcomes yet</p>
                  <p className="text-sm">Create learning outcomes to see distribution</p>
                </div>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
              <p>This chart shows the actual distribution of cognitive levels based on your learning outcomes.</p>
              <p className="mt-1">The recommended distribution is shown in lighter colors for comparison.</p>
            </div>
          </Card>

          {/* Bulk Learning Outcome Generator */}
          <BulkLearningOutcomeGenerator
            subjectId={subjectId}
            topicId={topicId}
            onSuccess={() => {
              // Refetch learning outcomes when bulk generation is complete
              if (learningOutcomes) {
                utils.learningOutcome.getByTopic.invalidate({ topicId });
              }
            }}
          />
        </div>

        {/* Learning Outcomes */}
        <div className="lg:col-span-2">
          <LearningOutcomeList subjectId={subjectId} topicId={topicId} />
        </div>
      </div>
    </div>
  );
}

// Main page component that unwraps params
export default function TopicLearningOutcomesPage({ params }: { params: { id: string; topicId: string } | Promise<{ id: string; topicId: string }> }) {
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const subjectId = unwrappedParams.id;
  const topicId = unwrappedParams.topicId;

  return <TopicLearningOutcomesPageContent subjectId={subjectId} topicId={topicId} />;
}
