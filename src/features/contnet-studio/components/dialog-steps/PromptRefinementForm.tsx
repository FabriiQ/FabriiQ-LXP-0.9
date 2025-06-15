'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { api } from '@/utils/api';

interface PromptRefinementFormProps {
  prompt: string;
  onChange: (prompt: string) => void;
  subjectId: string;
  topicId: string; // Primary topic ID
  activityType: string;
  activityPurpose: ActivityPurpose;
  numQuestions: number;
  difficultyLevel: string;
}

export function PromptRefinementForm({
  prompt,
  onChange,
  subjectId,
  topicId,
  activityType,
  activityPurpose,
  numQuestions,
  difficultyLevel
}: PromptRefinementFormProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fetch subject and topic details
  const { data: subject } = api.subject.getById.useQuery(
    { id: subjectId },
    { enabled: !!subjectId }
  );

  const { data: topic } = api.subjectTopic.get.useQuery(
    { id: topicId },
    { enabled: !!topicId }
  );

  // Generate a default prompt based on the selected parameters
  useEffect(() => {
    if (!isGenerating && !prompt) {
      generateDefaultPrompt();
    }
  }, [subject, topic, activityType, activityPurpose, numQuestions, difficultyLevel]);

  const generateDefaultPrompt = () => {
    setIsGenerating(true);

    try {
      // Build a default prompt based on the selected parameters
      const subjectName = subject?.name || 'the selected subject';
      const topicName = topic?.title || 'the selected topics';
      const activityTypeDisplay = getActivityTypeDisplay();
      const purposeDisplay = activityPurpose === ActivityPurpose.LEARNING ? 'learning' : 'assessment';

      const defaultPrompt = `Create a ${difficultyLevel} level ${activityTypeDisplay} ${purposeDisplay} activity about ${topicName} in ${subjectName}. Include ${numQuestions} questions that test understanding of key concepts.`;

      setGeneratedPrompt(defaultPrompt);
      onChange(defaultPrompt);
    } catch (error) {
      console.error('Error generating default prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getActivityTypeDisplay = () => {
    // Use the activity type string directly
    return activityType.toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Refine Your Prompt</h2>
        <p className="text-muted-foreground mt-1">
          Customize the prompt to generate exactly what you need
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={isGenerating ? 'Generating prompt...' : 'Enter your prompt here...'}
            value={prompt || generatedPrompt}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[200px] resize-y"
            disabled={isGenerating}
          />
          <p className="text-sm text-muted-foreground mt-2">
            You can customize this prompt to add specific requirements or focus areas for your activity.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Be specific about the concepts you want to cover</li>
            <li>Mention any specific question types you prefer (e.g., multiple choice, true/false)</li>
            <li>Include any special instructions or requirements</li>
            <li>Specify the target audience or grade level</li>
            <li>Request examples or real-world applications if needed</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
