'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/layout/page-header';
import { Card } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Loader2 } from 'lucide-react';
import { ArrowLeft } from '@/components/ui/icons/lucide-icons';
import { Button } from '@/components/ui/core/button';
import { LearningOutcomeList } from '@/components/admin/learning-outcomes/LearningOutcomeList';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsDistribution, BloomsTaxonomyLevel } from '@/features/bloom/types';
import { calculateLearningOutcomeDistribution } from '@/features/bloom/utils/bloom-helpers';
import { BulkLearningOutcomeGenerator } from '@/features/bloom/components/learning-outcomes/BulkLearningOutcomeGenerator';

export default function SubjectLearningOutcomesPage() {
  const params = useParams<{ institution: string; subjectId: string }>();
  const router = useRouter();

  // Use non-null assertion operator to handle 'possibly null' errors
  const subjectId = params!.subjectId;
  const institution = params!.institution;
  const utils = api.useUtils();

  // Handle back button click
  const handleBack = () => {
    router.push(`/${institution}/admin/subjects/${subjectId}`);
  };

  // Fetch subject details
  const { data: subject, isLoading: isLoadingSubject } = api.subject.getById.useQuery({
    id: subjectId,
  });

  // Fetch topics for the subject
  const { data: topics, isLoading: isLoadingTopics } = api.subjectTopic.getBySubject.useQuery({
    subjectId,
  });

  // Fetch all learning outcomes for this subject
  const { data: learningOutcomes, isLoading: isLoadingOutcomes } = api.learningOutcome.getBySubject.useQuery({
    subjectId,
  });

  // State for selected topic
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTopicId(value === 'all' ? null : value);
  };

  // Calculate actual distribution based on learning outcomes
  const actualDistribution = useMemo(() => {
    if (!learningOutcomes || learningOutcomes.length === 0) {
      return {};
    }
    // Cast the learning outcomes to the expected type
    const typedOutcomes = learningOutcomes.map(outcome => ({
      bloomsLevel: outcome.bloomsLevel as unknown as BloomsTaxonomyLevel
    }));
    return calculateLearningOutcomeDistribution(typedOutcomes);
  }, [learningOutcomes]);

  // Loading state
  if (isLoadingSubject || isLoadingTopics || isLoadingOutcomes) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
      </div>
    );
  }

  // Error state
  if (!subject) {
    return (
      <div className="flex justify-center items-center h-96">
        <Card className="p-6 text-center text-red-500">
          <p>Subject not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subject
        </Button>

        <PageHeader
          title={`Learning Outcomes: ${subject.name}`}
          description="Manage learning outcomes aligned with Bloom's Taxonomy"
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
                compareDistribution={subject.bloomsDistribution as BloomsDistribution || {}}
                editable={false}
                showLabels={true}
                showPercentages={true}
                variant="pie"
                height={250}
              />
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
              <p>This chart shows the actual distribution of cognitive levels based on your learning outcomes.</p>
              <p className="mt-1">The recommended distribution is shown in lighter colors for comparison.</p>
            </div>
          </Card>

          {/* Bulk Learning Outcome Generator */}
          <BulkLearningOutcomeGenerator
            subjectId={subjectId}
            onSuccess={() => {
              // Refetch learning outcomes when bulk generation is complete
              if (learningOutcomes) {
                utils.learningOutcome.getBySubject.invalidate({ subjectId });
              }
            }}
          />
        </div>

        {/* Learning Outcomes */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Outcomes</TabsTrigger>
              {topics?.map((topic) => (
                <TabsTrigger key={topic.id} value={topic.id}>
                  {topic.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <LearningOutcomeList subjectId={subjectId} />
            </TabsContent>

            {topics?.map((topic) => (
              <TabsContent key={topic.id} value={topic.id} className="mt-0">
                <LearningOutcomeList subjectId={subjectId} topicId={topic.id} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
