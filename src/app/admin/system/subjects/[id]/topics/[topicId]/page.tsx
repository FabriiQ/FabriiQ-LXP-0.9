'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
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
import { ThemeWrapper } from '@/features/activties/components/ui/ThemeWrapper';
import { constructSubjectUrl, constructTopicUrl, constructLearningOutcomesUrl } from '@/utils/admin-navigation';

// Create a wrapper component to handle the params
function TopicDetailPageContent({ subjectId, topicId }: { subjectId: string; topicId: string }) {
  const router = useRouter();
  const { toast } = useToast();

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

  // Handle navigation
  const handleNavigateToLearningOutcomes = () => {
    const url = constructLearningOutcomesUrl(subjectId, topicId, window.location.pathname);
    router.push(url);
  };

  const handleEditTopic = () => {
    router.push(`/admin/system/subjects/${subjectId}/topics/${topicId}/edit`);
  };

  const handleBackToSubject = () => {
    const url = constructSubjectUrl(subjectId, window.location.pathname);
    router.push(url);
  };

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

  // Calculate Bloom's distribution from learning outcomes
  const bloomsDistribution: BloomsDistribution = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  if (learningOutcomes && learningOutcomes.length > 0) {
    learningOutcomes.forEach(outcome => {
      if (outcome.bloomsLevel && bloomsDistribution.hasOwnProperty(outcome.bloomsLevel.toUpperCase())) {
        bloomsDistribution[outcome.bloomsLevel.toUpperCase() as keyof BloomsDistribution]++;
      }
    });
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title={topic.title}
          description={`${topic.nodeType} in ${subject.name}`}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleEditTopic}
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
            onClick={handleBackToSubject}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subject
          </Button>
        </div>
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
                      <Badge variant="outline">{topic.competencyLevel}</Badge>
                    </div>
                  )}
                </div>
                {topic.keywords && topic.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-green">
                    {learningOutcomes?.length || 0}
                  </div>
                  <p className="text-sm text-gray-500">
                    {learningOutcomes?.length === 1 ? 'outcome' : 'outcomes'} defined
                  </p>
                </div>
                
                {learningOutcomes && learningOutcomes.length > 0 && (
                  <div className="h-48">
                    <ThemeWrapper>
                      <BloomsDistributionChart
                        distribution={bloomsDistribution}
                        editable={false}
                        showLabels={true}
                        showPercentages={true}
                        variant="pie"
                      />
                    </ThemeWrapper>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {topic.description && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: topic.description }} />
              </Card>
            )}

            {topic.context && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Context</h3>
                <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: topic.context }} />
              </Card>
            )}

            {topic.learningOutcomesText && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Preliminary Learning Outcomes</h3>
                <p className="whitespace-pre-wrap">{topic.learningOutcomesText}</p>
              </Card>
            )}
          </div>
      </div>
    </div>
  );
}

// Main page component that unwraps params
export default function TopicDetailPage({ params }: { params: { id: string; topicId: string } | Promise<{ id: string; topicId: string }> }) {
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const subjectId = unwrappedParams.id;
  const topicId = unwrappedParams.topicId;

  return <TopicDetailPageContent subjectId={subjectId} topicId={topicId} />;
}
