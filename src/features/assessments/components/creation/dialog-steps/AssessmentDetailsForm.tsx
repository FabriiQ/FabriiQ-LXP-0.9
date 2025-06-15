'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  CalendarIcon,
  Clock,
  Award,
  BarChart,
  Settings,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AssessmentCategory, GradingType } from '@/server/api/constants';

interface AssessmentDetails {
  title: string;
  description: string;
  instructions: string;
  maxScore: number;
  passingScore: number;
  weightage: number;
  gradingType: GradingType;
  dueDate?: Date;
}

interface AssessmentDetailsFormProps {
  details: AssessmentDetails;
  onChange: (details: AssessmentDetails) => void;
  assessmentType: AssessmentCategory;
}

const GRADING_TYPES = [
  {
    type: GradingType.MANUAL,
    label: 'Manual Grading',
    description: 'Teacher grades manually with detailed feedback',
    icon: Settings,
    recommended: [AssessmentCategory.ASSIGNMENT, AssessmentCategory.PROJECT]
  },
  {
    type: GradingType.AUTOMATIC,
    label: 'Auto Grading',
    description: 'Automatic grading for objective questions',
    icon: Award,
    recommended: [AssessmentCategory.QUIZ, AssessmentCategory.EXAM]
  },
  {
    type: GradingType.HYBRID,
    label: 'Hybrid Grading',
    description: 'Combination of auto and manual grading',
    icon: BarChart,
    recommended: [AssessmentCategory.EXAM, AssessmentCategory.PRACTICAL]
  }
];

export function AssessmentDetailsForm({
  details,
  onChange,
  assessmentType
}: AssessmentDetailsFormProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleInputChange = (field: keyof AssessmentDetails, value: any) => {
    onChange({
      ...details,
      [field]: value
    });
  };

  const getRecommendedGradingType = () => {
    return GRADING_TYPES.find(type =>
      type.recommended.includes(assessmentType)
    )?.type || GradingType.MANUAL;
  };

  const recommendedGradingType = getRecommendedGradingType();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Assessment Details</h3>
        <p className="text-muted-foreground">
          Enter the basic information and settings for your assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>
              Essential details about your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                placeholder="Enter assessment title..."
                value={details.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={cn(
                  !details.title && "border-red-200 focus:border-red-300"
                )}
              />
              {!details.title && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Title is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assessment..."
                value={details.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Detailed instructions for students..."
                value={details.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !details.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {details.dueDate ? format(details.dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={details.dueDate}
                    onSelect={(date) => {
                      handleInputChange('dueDate', date);
                      setShowCalendar(false);
                    }}
                    disabled={(date) => date < new Date()}

                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scoring Configuration</CardTitle>
            <CardDescription>
              Set up scoring and grading parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score *</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  max="1000"
                  value={details.maxScore}
                  onChange={(e) => handleInputChange('maxScore', parseInt(e.target.value) || 100)}
                  className={cn(
                    (!details.maxScore || details.maxScore <= 0) && "border-red-200 focus:border-red-300"
                  )}
                />
                {(!details.maxScore || details.maxScore <= 0) && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Maximum score is required and must be greater than 0
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max={details.maxScore}
                  value={details.passingScore}
                  onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input
                id="weightage"
                type="number"
                min="0"
                max="100"
                value={details.weightage}
                onChange={(e) => handleInputChange('weightage', parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                Percentage contribution to final grade
              </p>
            </div>

            <div className="space-y-3">
              <Label>Grading Type</Label>
              <div className="space-y-2">
                {GRADING_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isRecommended = type.type === recommendedGradingType;
                  const isSelected = details.gradingType === type.type;

                  return (
                    <Card
                      key={type.type}
                      className={cn(
                        "cursor-pointer transition-all duration-200 p-3",
                        isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => handleInputChange('gradingType', type.type)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-4 w-4 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{type.label}</span>
                            {isRecommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Assessment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">{assessmentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Score</p>
              <p className="font-medium">{details.maxScore} points</p>
            </div>
            <div>
              <p className="text-muted-foreground">Passing Score</p>
              <p className="font-medium">
                {details.passingScore} points ({Math.round((details.passingScore / details.maxScore) * 100)}%)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Weightage</p>
              <p className="font-medium">{details.weightage}%</p>
            </div>
          </div>

          {details.dueDate && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium">{format(details.dueDate, "PPP 'at' p")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {(!details.title || !details.maxScore || details.maxScore <= 0) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Required fields missing</span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            {!details.title && <p>• Assessment title is required</p>}
            {(!details.maxScore || details.maxScore <= 0) && <p>• Maximum score is required and must be greater than 0</p>}
          </div>
        </div>
      )}
    </div>
  );
}
