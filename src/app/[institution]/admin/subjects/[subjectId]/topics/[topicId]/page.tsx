'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/layout/page-header';
import { Card } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Loader2, Edit, GraduationCap } from 'lucide-react';
import { ArrowLeft } from '@/components/ui/icons/lucide-icons';
import { Badge } from '@/components/ui/core/badge';
import { useToast } from '@/components/ui/feedback/toast';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsDistribution, BloomsTaxonomyLevel } from '@/features/bloom/types';
import { calculateLearningOutcomeDistribution } from '@/features/bloom/utils/bloom-helpers';
import { formatDate } from '@/utils/format';
import { useMemo } from 'react';

export default function TopicDetailPage() {
  const params = useParams<{ institution: string; subjectId: string; topicId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const subjectId = params!.subjectId;
  const topicId = params!.topicId;
  const institution = params!.institution;

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

  // Handle navigation to learning outcomes page
  const handleNavigateToLearningOutcomes = () => {
    router.push(`/${institution}/admin/subjects/${subjectId}/topics/${topicId}/learning-outcomes`);
  };

  // Calculate actual distribution based on learning outcomes
  const actualDistribution = useMemo(() => {
    if (!learningOutcomes || learningOutcomes.length === 0 || !topic) {
      return topic?.bloomsDistribution as BloomsDistribution || {};
    }

    // Cast the learning outcomes to the expected type
    const typedOutcomes = learningOutcomes.map(outcome => ({
      bloomsLevel: outcome.bloomsLevel as unknown as BloomsTaxonomyLevel
    }));

    return calculateLearningOutcomeDistribution(typedOutcomes);
  }, [learningOutcomes, topic]);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title={topic.title}
          description={`${topic.code} - ${subject.name}`}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${institution}/admin/subjects/${subjectId}/topics/${topicId}/edit`)}
            className="border-medium-teal text-medium-teal hover:bg-light-mint"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Topic
          </Button>
          <Button
            variant="outline"
            onClick={handleNavigateToLearningOutcomes}
            className="bg-primary-green text-white hover:bg-medium-teal"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Manage Learning Outcomes
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/${institution}/admin/subjects/${subjectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subject
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="bg-gray-100 border border-gray-200">
          {topic.nodeType}
        </Badge>
        {topic.competencyLevel && (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
            {topic.competencyLevel}
          </Badge>
        )}
        <Badge className={topic.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
          {topic.status}
        </Badge>
      </div>

      <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Topic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Code</p>
                    <p className="font-medium">{topic.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{topic.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{topic.nodeType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order</p>
                    <p className="font-medium">{topic.orderIndex}</p>
                  </div>
                  {topic.estimatedMinutes && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Duration</p>
                      <p className="font-medium">{topic.estimatedMinutes} minutes</p>
                    </div>
                  )}
                  {topic.competencyLevel && (
                    <div>
                      <p className="text-sm text-gray-500">Competency Level</p>
                      <p className="font-medium">{topic.competencyLevel}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(topic.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bloom's Taxonomy Distribution</h3>
              <div className="h-64">
                <BloomsDistributionChart
                  distribution={actualDistribution}
                  compareDistribution={topic.bloomsDistribution as BloomsDistribution}
                  editable={false}
                  showLabels={true}
                  showPercentages={true}
                  variant="pie"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {learningOutcomes && learningOutcomes.length > 0
                  ? `Based on ${learningOutcomes.length} learning outcomes`
                  : "Target distribution (no learning outcomes yet)"}
                <p className="mt-1">Click "Manage Learning Outcomes" to view and edit detailed outcomes.</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {topic.description && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <p className="whitespace-pre-wrap">{topic.description}</p>
              </Card>
            )}

            {topic.context && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Context</h3>
                <p className="whitespace-pre-wrap">{topic.context}</p>
              </Card>
            )}

            {topic.learningOutcomesText && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Preliminary Learning Outcomes</h3>
                <p className="whitespace-pre-wrap">{topic.learningOutcomesText}</p>
              </Card>
            )}

            {topic.keywords && topic.keywords.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {topic.keywords.map((keyword, index) => (
                    <Badge key={index} className="border border-gray-200 text-gray-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>


      </div>
    </div>
  );
}
