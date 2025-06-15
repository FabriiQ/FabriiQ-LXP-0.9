'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Label } from '@/components/ui/core/label';
import { Input } from '@/components/ui/core/input';
import { Slider } from '@/components/ui/core/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/core/select';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';

interface ActivityParametersFormProps {
  numQuestions: number;
  difficultyLevel: string;
  onChange: (numQuestions: number, difficultyLevel: string) => void;
  activityType: string;
  activityPurpose: ActivityPurpose;
}

export function ActivityParametersForm({
  numQuestions,
  difficultyLevel,
  onChange,
  activityType,
  activityPurpose
}: ActivityParametersFormProps) {
  const [localNumQuestions, setLocalNumQuestions] = useState<number>(numQuestions);
  const [localDifficultyLevel, setLocalDifficultyLevel] = useState<string>(difficultyLevel);

  // Handle number of questions change
  const handleNumQuestionsChange = (value: number) => {
    setLocalNumQuestions(value);
    onChange(value, localDifficultyLevel);
  };

  // Handle difficulty level change
  const handleDifficultyLevelChange = (value: string) => {
    setLocalDifficultyLevel(value);
    onChange(localNumQuestions, value);
  };

  // Get activity type display name
  const getActivityTypeDisplay = () => {
    switch (activityType) {
      case LearningActivityType.SELF_STUDY:
        return 'Self Study';
      case LearningActivityType.LECTURE:
        return 'Lecture';
      case LearningActivityType.TUTORIAL:
        return 'Tutorial';
      case LearningActivityType.WORKSHOP:
        return 'Workshop';
      case LearningActivityType.DISCUSSION:
        return 'Discussion';
      case LearningActivityType.DEMONSTRATION:
        return 'Demonstration';
      case LearningActivityType.GROUP_WORK:
        return 'Group Work';
      default:
        return 'Activity';
    }
  };

  // Determine if the activity is an assessment
  const isAssessment = activityPurpose === ActivityPurpose.ASSESSMENT;

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Configure Activity Parameters</h2>
        <p className="text-muted-foreground mt-1">
          Set the parameters for your {getActivityTypeDisplay().toLowerCase()} activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Number of Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="num-questions">Questions: {localNumQuestions}</Label>
            <Input
              id="num-questions"
              type="number"
              min={1}
              max={20}
              value={localNumQuestions}
              onChange={(e) => handleNumQuestionsChange(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <Slider
            value={[localNumQuestions]}
            min={1}
            max={20}
            step={1}
            onValueChange={(value) => handleNumQuestionsChange(value[0])}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground">
            {isAssessment
              ? 'The number of questions to include in this assessment.'
              : 'The number of interactive elements or checkpoints to include in this activity.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={localDifficultyLevel} onValueChange={handleDifficultyLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The difficulty level determines the complexity of the content and questions.
          </p>
        </CardContent>
      </Card>

      {isAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  min={1}
                  defaultValue={30}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={70}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
