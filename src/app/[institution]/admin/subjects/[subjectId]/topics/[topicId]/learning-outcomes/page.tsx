'use client';

import { useParams, useRouter } from 'next/navigation';
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

export default function TopicLearningOutcomesPage() {
  const params = useParams<{ institution: string; subjectId: string; topicId: string }>();
  const router = useRouter();

  // Use non-null assertion operator to handle 'possibly null' errors
  const subjectId = params!.subjectId;
  const topicId = params!.topicId;
  const institution = params!.institution;
  const utils = api.useUtils();

  // Handle back button click
  const handleBack = () => {
    router.push(`/${institution}/admin/subjects/${subjectId}/topics/${topicId}`);
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
        <div className="lg:col-span-1 space-y-6">
          {/* Bloom's Distribution Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-primary-green dark:text-primary-green">
              Bloom's Taxonomy Distribution
            </h2>

            <div className="h-80">
              <BloomsDistributionChart
                distribution={actualDistribution}
                compareDistribution={topic.bloomsDistribution as BloomsDistribution || {}}
                editable={false}
                showLabels={true}
                showPercentages={true}
                variant="pie"
                height={250}
              />
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
