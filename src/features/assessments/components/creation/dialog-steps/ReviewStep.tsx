'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Award,
  FileText,
  Calendar,
  BarChart,
  Settings,
  Eye,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { api } from '@/trpc/react';
import { AssessmentCategory, GradingType } from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { useState } from 'react';

interface ReviewStepProps {
  classId: string;
  subjectId: string;
  topicId: string;
  selectedLearningOutcomes: string[];
  assessmentType: AssessmentCategory;
  selectedRubricId: string;
  bloomsDistribution: Record<string, number>;
  assessmentDetails: {
    title: string;
    description: string;
    instructions: string;
    maxScore: number;
    passingScore: number;
    dueDate?: Date;
    timeLimit?: number;
  };
  missingFields?: string[];
}

const BLOOMS_COLORS = {
  [BloomsTaxonomyLevel.REMEMBER]: 'bg-red-100 text-red-800 border-red-200',
  [BloomsTaxonomyLevel.UNDERSTAND]: 'bg-orange-100 text-orange-800 border-orange-200',
  [BloomsTaxonomyLevel.APPLY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [BloomsTaxonomyLevel.ANALYZE]: 'bg-green-100 text-green-800 border-green-200',
  [BloomsTaxonomyLevel.EVALUATE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BloomsTaxonomyLevel.CREATE]: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function ReviewStep({
  subjectId,
  topicId,
  selectedLearningOutcomes,
  assessmentType,
  selectedRubricId,
  bloomsDistribution,
  assessmentDetails,
  missingFields = []
}: ReviewStepProps) {
  const [showRubricPreview, setShowRubricPreview] = useState(false);

  // Fetch real-time data
  const { data: subject } = api.subject.getById.useQuery(
    { id: subjectId },
    { enabled: !!subjectId }
  );

  const { data: topic } = api.subjectTopic.getById.useQuery(
    { id: topicId },
    { enabled: !!topicId }
  );

  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId },
    { enabled: !!topicId }
  );

  const { data: rubric } = api.rubric.getById.useQuery(
    { id: selectedRubricId },
    { enabled: !!selectedRubricId }
  );

  const selectedOutcomes = learningOutcomes?.filter(lo => selectedLearningOutcomes.includes(lo.id)) || [];

  const totalDistribution = Object.values(bloomsDistribution).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Review & Create Assessment</h3>
        <p className="text-muted-foreground">
          Review your assessment configuration before creating it.
        </p>
      </div>

      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assessment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Title</p>
              <p className="font-semibold">{assessmentDetails.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {assessmentType}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subject</p>
              <p className="font-medium">{subject?.name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Topic</p>
              <p className="font-medium">{topic?.title || 'Loading...'}</p>
              {topic?.code && (
                <p className="text-xs text-muted-foreground">Code: {topic.code}</p>
              )}
            </div>
          </div>

          {assessmentDetails.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1">{assessmentDetails.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring & Grading */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Scoring & Grading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Maximum Score</p>
              <p className="font-semibold text-lg">{assessmentDetails.maxScore}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Passing Score</p>
              <p className="font-semibold text-lg">
                {assessmentDetails.passingScore}
                <span className="text-sm text-muted-foreground ml-1">
                  ({Math.round((assessmentDetails.passingScore / assessmentDetails.maxScore) * 100)}%)
                </span>
              </p>
            </div>
            {assessmentDetails.timeLimit && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Limit</p>
                <p className="font-semibold text-lg">{assessmentDetails.timeLimit} min</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grading Method</p>
              <Badge variant="secondary" className="mt-1">
                {selectedRubricId ? 'Rubric-based' : 'Score-based'}
              </Badge>
            </div>
          </div>

          {assessmentDetails.dueDate && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                <span className="font-medium">{format(assessmentDetails.dueDate, "PPP 'at' p")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Learning Outcomes ({selectedOutcomes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedOutcomes.map((outcome, index) => (
              <div key={outcome.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="text-xs mt-1">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{outcome.statement}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", BLOOMS_COLORS[outcome.bloomsLevel])}
                    >
                      {outcome.bloomsLevel}
                    </Badge>
                    {outcome.actionVerbs && outcome.actionVerbs.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {outcome.actionVerbs.map((verb, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {verb}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rubric Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Grading Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rubric ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Rubric-based grading</span>
                </div>
                {rubric && (
                  <button
                    onClick={() => setShowRubricPreview(!showRubricPreview)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    {showRubricPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                )}
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{rubric.title || (rubric as any).name}</p>
                {rubric.description && (
                  <p className="text-sm text-muted-foreground mt-1">{rubric.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{rubric.criteria?.length || 0} criteria</span>
                  <span>Rubric-based grading</span>
                </div>
              </div>

              {/* Rubric Preview */}
              {showRubricPreview && rubric && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b">
                    <h4 className="font-medium">Preview</h4>
                    <p className="text-sm text-muted-foreground">Rubric Criteria</p>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium bg-muted/30">Criterion</th>
                            {rubric.performanceLevels?.map((level: any) => (
                              <th key={level.id} className="text-center p-3 font-medium bg-muted/30 border-l">
                                {level.name}
                                <div className="text-xs font-normal text-muted-foreground mt-1">
                                  ({Math.round(((level.maxScore || level.minScore || 0) / (rubric.maxScore || 100)) * 100)}%)
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rubric.criteria?.map((criterion: any, index: number) => (
                            <tr key={criterion.id} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                              <td className="p-3 border-b">
                                <div className="font-medium">{criterion.name}</div>
                                {criterion.bloomsLevel && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs mt-1", BLOOMS_COLORS[criterion.bloomsLevel])}
                                  >
                                    {criterion.bloomsLevel}
                                  </Badge>
                                )}
                                <div className="text-sm text-muted-foreground mt-1">
                                  {criterion.description}
                                </div>
                              </td>
                              {rubric.performanceLevels?.map((level: any) => {
                                const criteriaLevel = criterion.criteriaLevels?.find(
                                  (cl: any) => cl.performanceLevel?.id === level.id || cl.performanceLevelId === level.id
                                );
                                return (
                                  <td key={level.id} className="p-3 border-b border-l text-sm">
                                    {criteriaLevel?.description || criteriaLevel?.performanceLevel?.description || 'Demonstrates understanding of the concept.'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Simple score-based grading</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloom's Distribution */}
      {totalDistribution > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Bloom's Taxonomy Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(bloomsDistribution)
                .filter(([_, value]) => value > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([level, percentage]) => (
                  <div key={level} className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", BLOOMS_COLORS[level as BloomsTaxonomyLevel])}
                    >
                      {level}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{percentage}%</span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                Total Distribution: {totalDistribution}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {assessmentDetails.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{assessmentDetails.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Fields Warning */}
      {missingFields.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Missing Required Fields</h4>
                <p className="text-sm text-red-700 mt-1">
                  Please complete the following required fields before creating the assessment:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-red-700">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Create */}
      {missingFields.length === 0 ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold text-primary">Ready to Create Assessment</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your assessment is configured and ready to be created. Click "Create Assessment" to proceed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50 border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <div>
                <h4 className="font-semibold text-muted-foreground">Assessment Not Ready</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete all required fields above to enable assessment creation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
